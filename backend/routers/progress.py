from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
import models
from auth import get_current_user

router = APIRouter(prefix="/api/progress", tags=["progress"])


def _compute_badges(stats: models.UserStats, passed_subtopic_ids: set) -> list[dict]:
    badges = []
    xp = stats.xp if stats else 0
    gates = stats.gates_passed if stats else 0
    streak = stats.streak_days if stats else 0

    if gates >= 1:
        badges.append({"id": "first_gate", "icon": "🎯", "label": "First Gate", "desc": "Passed your first Socratic gate"})
    if streak >= 3:
        badges.append({"id": "on_fire", "icon": "🔥", "label": "On Fire", "desc": "3-day learning streak"})
    if streak >= 7:
        badges.append({"id": "dedicated", "icon": "💪", "label": "Dedicated", "desc": "7-day learning streak"})
    if gates >= 5:
        badges.append({"id": "five_gates", "icon": "⭐", "label": "Rising Star", "desc": "Passed 5 gates"})
    if xp >= 500:
        badges.append({"id": "scholar", "icon": "📚", "label": "Scholar", "desc": "Earned 500 XP"})
    if xp >= 1000:
        badges.append({"id": "expert", "icon": "💎", "label": "Expert", "desc": "Earned 1000 XP"})
    return badges


@router.get("/mastery")
def get_mastery(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    records = db.query(models.MasteryRecord).filter(
        models.MasteryRecord.user_id == current_user.id
    ).all()
    return [
        {
            "concept": r.concept,
            "score": r.score,
            "assist_level": r.assist_level,
        }
        for r in records
    ]


@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    stats = models.get_or_create_stats(db, current_user.id)
    db.commit()  # persist if newly created

    passed_ids = {
        r.subtopic_id for r in db.query(models.UserSubTopicProgress).filter(
            models.UserSubTopicProgress.user_id == current_user.id,
            models.UserSubTopicProgress.gate_passed == True,
        )
    }

    level = stats.xp // models.XP_PER_LEVEL + 1
    xp_in_level = stats.xp % models.XP_PER_LEVEL
    xp_to_next = models.XP_PER_LEVEL

    return {
        "xp": stats.xp,
        "level": level,
        "xp_in_level": xp_in_level,
        "xp_to_next": xp_to_next,
        "gates_passed": stats.gates_passed,
        "streak_days": stats.streak_days,
        "badges": _compute_badges(stats, passed_ids),
    }


@router.get("/sessions")
def get_sessions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    sessions = db.query(models.GateSession).filter(
        models.GateSession.user_id == current_user.id
    ).order_by(models.GateSession.updated_at.desc()).limit(20).all()
    return [
        {
            "id": s.id,
            "problem_id": s.problem_id,
            "outcome": s.outcome,
            "turns": s.turns,
            "created_at": s.created_at.isoformat(),
        }
        for s in sessions
    ]
