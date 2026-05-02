import re
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from auth import get_current_user
import models

router = APIRouter(prefix="/api/incidents", tags=["incidents"])


# ── Checkers (ported from TypeScript) ────────────────────────────────────────

def _check_postgres_n1(files: dict) -> dict:
    src = files.get("src/routes/posts.ts", "")
    await_in_loop = bool(re.search(r'for\s*\([^)]*\)\s*\{[\s\S]*await\s+prisma\.comment', src))
    loop_pattern = bool(re.search(r'for\s*\(\s*const\s+\w+\s+of\s+posts\s*\)', src))
    uses_include = bool(re.search(r'include\s*:\s*\{\s*comments\s*:\s*true\s*\}', src))
    uses_join = bool(re.search(r'prisma\.comment\.findMany\s*\(\s*\{\s*where\s*:\s*\{\s*postId\s*:\s*\{\s*in\s*:', src))
    checks = [
        {"label": "No await inside a posts loop", "ok": not await_in_loop and not loop_pattern},
        {"label": "Comments fetched in a single batch (include or IN)", "ok": uses_include or uses_join},
        {"label": "Response still returns posts with their comments",
         "ok": bool(re.search(r'res\.json\s*\(', src)) and "posts" in src},
    ]
    passed = all(c["ok"] for c in checks)
    score = 100 if passed else sum(33 for c in checks if c["ok"])
    return {"passed": passed, "checks": checks, "score": score}


def _check_k8s_oom(files: dict) -> dict:
    yaml = files.get("k8s/deployment.yaml", "")
    js = files.get("app/server.js", "")
    has_limits = bool(re.search(r'limits\s*:', yaml)) and bool(re.search(r"memory\s*:\s*['\"]?\d+\s*[KMG]i", yaml))
    has_requests = bool(re.search(r'requests\s*:', yaml)) and bool(re.search(r'memory\s*:', yaml))
    leak_gone = (
        not bool(re.search(r'const\s+everyRequest\s*=\s*\[\]', js)) or
        not bool(re.search(r'everyRequest\.push', js))
    )
    checks = [
        {"label": "Deployment sets resources.limits.memory", "ok": has_limits},
        {"label": "Deployment sets resources.requests (scheduling hint)", "ok": has_requests},
        {"label": "No unbounded in-memory accumulator in app/server.js", "ok": leak_gone},
    ]
    passed = all(c["ok"] for c in checks)
    count = sum(1 for c in checks if c["ok"])
    score = 100 if passed else count * 33
    return {"passed": passed, "checks": checks, "score": score}


CHECKERS = {
    "postgres-n-plus-1": _check_postgres_n1,
    "k8s-oomkilled": _check_k8s_oom,
}

DURATION_SECONDS = {
    "postgres-n-plus-1": 20 * 60,
    "k8s-oomkilled": 25 * 60,
}


# ── Stage calculation ─────────────────────────────────────────────────────────

def _compute_stage(incident, user_id: int, db: Session):
    video_ids = [v.id for v in incident.videos]
    total_videos = len(video_ids) or 1
    prog = db.query(models.UserVideoProgress).filter(
        models.UserVideoProgress.user_id == user_id,
        models.UserVideoProgress.video_id.in_(video_ids),
    ).all()
    done_count = sum(1 for p in prog if p.completed_at is not None or p.watch_percent >= 90)
    avg_pct = round(done_count / total_videos * 100)

    quiz = incident.quiz
    quiz_passed = False
    if quiz:
        attempt = db.query(models.UserQuizAttempt).filter(
            models.UserQuizAttempt.user_id == user_id,
            models.UserQuizAttempt.quiz_id == quiz.id,
            models.UserQuizAttempt.passed == True,
        ).first()
        quiz_passed = attempt is not None

    solved = db.query(models.UserIncidentAttempt).filter(
        models.UserIncidentAttempt.user_id == user_id,
        models.UserIncidentAttempt.incident_id == incident.id,
        models.UserIncidentAttempt.solved_at != None,
    ).first()

    best_score_row = db.query(models.UserIncidentAttempt).filter(
        models.UserIncidentAttempt.user_id == user_id,
        models.UserIncidentAttempt.incident_id == incident.id,
        models.UserIncidentAttempt.score > 0,
    ).order_by(models.UserIncidentAttempt.score.desc()).first()

    if solved:
        stage = "done"
    elif quiz_passed:
        stage = "play"
    elif done_count >= total_videos:
        stage = "quiz"
    else:
        stage = "learn"

    return stage, avg_pct, best_score_row.score if best_score_row else None, solved is not None


# ── Schemas ───────────────────────────────────────────────────────────────────

class VideoProgressBody(BaseModel):
    video_id: int
    watch_percent: int


class QuizAttemptBody(BaseModel):
    quiz_id: int
    answers: dict  # {str(question_id): selected_index}


class SubmitFixBody(BaseModel):
    files: dict
    elapsed_seconds: int = 0
    hints_used: int = 0
    hints_cost: int = 0


class DemoSkipBody(BaseModel):
    slug: str
    target: str  # "videos" | "quiz"


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/")
def list_incidents(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    incidents = db.query(models.Incident).order_by(models.Incident.order_index).all()
    result = []
    for i, inc in enumerate(incidents):
        if i == 0:
            stage, vp, best, badge_earned = _compute_stage(inc, current_user.id, db)
        else:
            prev_stage = result[i - 1]["stage"]
            if prev_stage != "done":
                result.append({
                    "id": inc.id, "slug": inc.slug, "title": inc.title,
                    "description": inc.description, "difficulty": inc.difficulty,
                    "domain": inc.domain, "stage": "locked",
                    "video_progress": 0, "best_score": None, "badge_earned": False,
                })
                continue
            stage, vp, best, badge_earned = _compute_stage(inc, current_user.id, db)
        result.append({
            "id": inc.id, "slug": inc.slug, "title": inc.title,
            "description": inc.description, "difficulty": inc.difficulty,
            "domain": inc.domain, "stage": stage,
            "video_progress": vp, "best_score": best, "badge_earned": badge_earned,
        })
    return result


@router.get("/{slug}")
def get_incident(
    slug: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    inc = db.query(models.Incident).filter(models.Incident.slug == slug).first()
    if not inc:
        raise HTTPException(404, "Incident not found")

    stage, vp, best, badge_earned = _compute_stage(inc, current_user.id, db)

    # Fetch per-video progress
    video_ids = [v.id for v in inc.videos]
    prog_map = {}
    if video_ids:
        for p in db.query(models.UserVideoProgress).filter(
            models.UserVideoProgress.user_id == current_user.id,
            models.UserVideoProgress.video_id.in_(video_ids),
        ).all():
            prog_map[p.video_id] = p

    videos = []
    for v in inc.videos:
        p = prog_map.get(v.id)
        videos.append({
            "id": v.id, "title": v.title,
            "mux_playback_id": v.mux_playback_id,
            "duration_seconds": v.duration_seconds,
            "watch_percent": p.watch_percent if p else 0,
            "completed": bool(p and (p.completed_at or p.watch_percent >= 90)),
        })

    quiz_data = None
    if inc.quiz:
        quiz_data = {
            "id": inc.quiz.id,
            "questions": [
                {
                    "id": q.id,
                    "question": q.question,
                    "options": q.options,
                    "explanation": q.explanation,
                }
                for q in inc.quiz.questions
            ],
        }

    badge_data = None
    if inc.badge:
        badge_data = {
            "id": inc.badge.id,
            "label": inc.badge.label,
            "tagline": inc.badge.tagline,
            "icon_url": inc.badge.icon_url,
        }

    return {
        "id": inc.id, "slug": inc.slug, "title": inc.title,
        "description": inc.description, "difficulty": inc.difficulty,
        "domain": inc.domain, "stage": stage, "video_progress": vp,
        "best_score": best, "badge_earned": badge_earned,
        "videos": videos, "quiz": quiz_data, "badge": badge_data,
    }


@router.post("/{slug}/video-progress")
def update_video_progress(
    slug: str,
    body: VideoProgressBody,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    p = db.query(models.UserVideoProgress).filter(
        models.UserVideoProgress.user_id == current_user.id,
        models.UserVideoProgress.video_id == body.video_id,
    ).first()
    if not p:
        p = models.UserVideoProgress(user_id=current_user.id, video_id=body.video_id)
        db.add(p)
    p.watch_percent = max(p.watch_percent, body.watch_percent)
    if body.watch_percent >= 90 and not p.completed_at:
        p.completed_at = datetime.utcnow()
    db.commit()
    return {"ok": True}


@router.post("/{slug}/quiz-attempt")
def submit_quiz(
    slug: str,
    body: QuizAttemptBody,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    quiz = db.query(models.IncidentQuiz).filter(
        models.IncidentQuiz.id == body.quiz_id
    ).first()
    if not quiz:
        raise HTTPException(404, "Quiz not found")

    correct = sum(
        1 for q in quiz.questions
        if body.answers.get(str(q.id)) == q.correct_index
    )
    total = len(quiz.questions)
    score = round(correct / total * 100) if total else 0
    passed = score >= 80

    attempt = models.UserQuizAttempt(
        user_id=current_user.id,
        quiz_id=quiz.id,
        score=score,
        passed=passed,
        answers=body.answers,
    )
    db.add(attempt)
    db.commit()
    return {"score": score, "passed": passed, "correct_count": correct, "total_count": total}


@router.post("/{slug}/submit-fix")
def submit_fix(
    slug: str,
    body: SubmitFixBody,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    inc = db.query(models.Incident).filter(models.Incident.slug == slug).first()
    if not inc:
        raise HTTPException(404, "Incident not found")

    checker = CHECKERS.get(slug)
    if not checker:
        raise HTTPException(404, "No checker for this incident")

    result = checker(body.files)

    score = 0
    if result["passed"]:
        score = 100 - body.hints_cost
        par = DURATION_SECONDS.get(slug, 1200) / 2
        over = max(0, body.elapsed_seconds - par)
        score -= min(20, int(over / 60))
        score = max(0, score)

    attempt = models.UserIncidentAttempt(
        user_id=current_user.id,
        incident_id=inc.id,
        score=score,
        solved_at=datetime.utcnow() if result["passed"] else None,
        hints_used=body.hints_used,
        hints_cost=body.hints_cost,
        submission=body.files,
        started_at=datetime.utcnow(),
    )
    db.add(attempt)
    db.flush()

    badge_data = None
    if result["passed"] and inc.badge:
        existing = db.query(models.UserIncidentBadge).filter(
            models.UserIncidentBadge.user_id == current_user.id,
            models.UserIncidentBadge.badge_id == inc.badge.id,
        ).first()
        if not existing:
            db.add(models.UserIncidentBadge(
                user_id=current_user.id, badge_id=inc.badge.id
            ))
        badge_data = {"label": inc.badge.label, "icon_url": inc.badge.icon_url}

    db.commit()
    return {
        "passed": result["passed"],
        "score": score,
        "checks": result["checks"],
        "attempt_id": attempt.id,
        "badge": badge_data,
    }


@router.get("/{slug}/debrief")
def get_debrief(
    slug: str,
    attempt_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    inc = db.query(models.Incident).filter(models.Incident.slug == slug).first()
    if not inc:
        raise HTTPException(404, "Incident not found")

    q = db.query(models.UserIncidentAttempt).filter(
        models.UserIncidentAttempt.user_id == current_user.id,
        models.UserIncidentAttempt.incident_id == inc.id,
    )
    if attempt_id:
        attempt = q.filter(models.UserIncidentAttempt.id == attempt_id).first()
    else:
        attempt = q.order_by(models.UserIncidentAttempt.started_at.desc()).first()

    if not attempt:
        raise HTTPException(404, "No attempt found")

    elapsed = 0
    if attempt.solved_at:
        elapsed = max(0, int((attempt.solved_at - attempt.started_at).total_seconds()))

    badge_data = None
    if inc.badge:
        ub = db.query(models.UserIncidentBadge).filter(
            models.UserIncidentBadge.user_id == current_user.id,
            models.UserIncidentBadge.badge_id == inc.badge.id,
        ).first()
        if ub:
            badge_data = {
                "label": inc.badge.label,
                "tagline": inc.badge.tagline,
                "icon_url": inc.badge.icon_url,
                "earned_at": ub.earned_at.isoformat(),
            }

    return {
        "id": attempt.id,
        "score": attempt.score,
        "solved": attempt.solved_at is not None,
        "hints_used": attempt.hints_used,
        "elapsed_seconds": elapsed,
        "submission": attempt.submission or {},
        "badge": badge_data,
    }


@router.post("/demo-skip")
def demo_skip(
    body: DemoSkipBody,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    inc = db.query(models.Incident).filter(models.Incident.slug == body.slug).first()
    if not inc:
        raise HTTPException(404, "Incident not found")

    if body.target == "videos":
        for v in inc.videos:
            p = db.query(models.UserVideoProgress).filter(
                models.UserVideoProgress.user_id == current_user.id,
                models.UserVideoProgress.video_id == v.id,
            ).first()
            if not p:
                p = models.UserVideoProgress(user_id=current_user.id, video_id=v.id)
                db.add(p)
            p.watch_percent = 100
            p.completed_at = datetime.utcnow()

    elif body.target == "quiz" and inc.quiz:
        attempt = models.UserQuizAttempt(
            user_id=current_user.id,
            quiz_id=inc.quiz.id,
            score=100,
            passed=True,
            answers={},
        )
        db.add(attempt)

    db.commit()
    return {"ok": True}
