"""
Topics API — curriculum topics, subtopics, playcards, and progress.

GET  /api/topics/                        — all topics with user unlock status
GET  /api/topics/{slug}                  — topic detail: subtopics, videos, playcards
POST /api/topics/playcards/{id}/chat     — AI chat about a specific playcard
"""
from fastapi import APIRouter, Depends, HTTPException, Query
import anthropic as _anthropic
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
import models
from auth import get_current_user
import socratic_engine as se

router = APIRouter(prefix="/api/topics", tags=["topics"])


# ─── Response Schemas ─────────────────────────────────────────────────────────

class VideoOut(BaseModel):
    id: int
    title: str
    youtube_id: str
    order_index: int


class ExerciseOut(BaseModel):
    id: int
    exercise_type: str
    question: str
    options: list[str] | None = None
    correct_index: int | None = None
    buggy_code: str | None = None
    explanation: str | None = None
    order_index: int


class PlayCardOut(BaseModel):
    id: int
    title: str
    content: str
    order_index: int
    ai_summary: str | None = None
    audio_url: str | None = None
    image_url: str | None = None
    exercises: list[ExerciseOut] = []


class ProblemBrief(BaseModel):
    id: int
    slug: str
    title: str
    difficulty: str
    gate_passed: bool = False


class SubTopicOut(BaseModel):
    id: int
    slug: str
    title: str
    description: str
    order_index: int
    gate_passed: bool
    play_cards: list[PlayCardOut]
    problems: list[ProblemBrief]


class TopicListItem(BaseModel):
    id: int
    slug: str
    title: str
    description: str
    icon: str
    color: str
    level: int
    position_in_level: int
    prerequisites: list[str]
    subtopics_total: int
    subtopics_passed: int
    unlocked: bool


class TopicDetail(BaseModel):
    id: int
    slug: str
    title: str
    description: str
    icon: str
    color: str
    prerequisites: list[str]
    videos: list[VideoOut]
    subtopics: list[SubTopicOut]


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []


class ChatResponse(BaseModel):
    reply: str


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/", response_model=list[TopicListItem])
def list_topics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    course: str = Query("main"),
):
    topics = (
        db.query(models.Topic)
        .filter(models.Topic.course == course)
        .order_by(models.Topic.level, models.Topic.position_in_level)
        .all()
    )

    # Build maps for efficient lookup
    subtopic_to_topic_slug: dict[int, str] = {}
    topic_subtopic_counts: dict[str, int] = {}
    for t in topics:
        topic_subtopic_counts[t.slug] = len(t.subtopics)
        for st in t.subtopics:
            subtopic_to_topic_slug[st.id] = t.slug

    # User's passed subtopics
    passed_records = (
        db.query(models.UserSubTopicProgress)
        .filter(
            models.UserSubTopicProgress.user_id == current_user.id,
            models.UserSubTopicProgress.gate_passed == True,
        )
        .all()
    )

    passed_by_topic: dict[str, int] = {}
    for r in passed_records:
        slug = subtopic_to_topic_slug.get(r.subtopic_id)
        if slug:
            passed_by_topic[slug] = passed_by_topic.get(slug, 0) + 1

    def is_unlocked(topic: models.Topic) -> bool:
        """Unlocked when all prerequisite topics have every subtopic gate passed."""
        if not topic.prerequisites:
            return True
        for prereq_slug in topic.prerequisites:
            total = topic_subtopic_counts.get(prereq_slug, 0)
            passed = passed_by_topic.get(prereq_slug, 0)
            if total == 0 or passed < total:
                return False
        return True

    return [
        TopicListItem(
            id=t.id,
            slug=t.slug,
            title=t.title,
            description=t.description,
            icon=t.icon,
            color=t.color,
            level=t.level,
            position_in_level=t.position_in_level,
            prerequisites=t.prerequisites or [],
            subtopics_total=topic_subtopic_counts.get(t.slug, 0),
            subtopics_passed=passed_by_topic.get(t.slug, 0),
            unlocked=is_unlocked(t),
        )
        for t in topics
    ]


@router.get("/{slug}", response_model=TopicDetail)
def get_topic(
    slug: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    topic = db.query(models.Topic).filter(models.Topic.slug == slug).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    passed_subtopic_ids = {
        r.subtopic_id
        for r in db.query(models.UserSubTopicProgress).filter(
            models.UserSubTopicProgress.user_id == current_user.id,
            models.UserSubTopicProgress.gate_passed == True,
        )
    }

    all_problem_ids = [p.id for st in topic.subtopics for p in st.problems]
    passed_problem_ids: set[int] = set()
    if all_problem_ids:
        passed_problem_ids = {
            r.problem_id
            for r in db.query(models.GateSession.problem_id).filter(
                models.GateSession.user_id == current_user.id,
                models.GateSession.problem_id.in_(all_problem_ids),
                models.GateSession.outcome == "PASS",
            ).all()
        }

    subtopics_out = [
        SubTopicOut(
            id=st.id,
            slug=st.slug,
            title=st.title,
            description=st.description,
            order_index=st.order_index,
            gate_passed=st.id in passed_subtopic_ids,
            play_cards=[
                PlayCardOut(
                    id=pc.id,
                    title=pc.title,
                    content=pc.content,
                    order_index=pc.order_index,
                    ai_summary=pc.ai_summary,
                    audio_url=f"/audio/playcards/{pc.audio_file}" if pc.audio_file else None,
                    image_url=pc.image_url,
                    exercises=[
                        ExerciseOut(
                            id=ex.id,
                            exercise_type=ex.exercise_type,
                            question=ex.question,
                            options=ex.options,
                            correct_index=ex.correct_index,
                            buggy_code=ex.buggy_code,
                            explanation=ex.explanation,
                            order_index=ex.order_index,
                        )
                        for ex in pc.exercises
                    ],
                )
                for pc in st.play_cards
            ],
            problems=[
                ProblemBrief(
                    id=p.id,
                    slug=p.slug,
                    title=p.title,
                    difficulty=p.difficulty,
                    gate_passed=p.id in passed_problem_ids,
                )
                for p in sorted(st.problems, key=lambda p: {"easy": 0, "medium": 1, "hard": 2}.get(p.difficulty, 3))
            ],
        )
        for st in topic.subtopics
    ]

    return TopicDetail(
        id=topic.id,
        slug=topic.slug,
        title=topic.title,
        description=topic.description,
        icon=topic.icon,
        color=topic.color,
        prerequisites=topic.prerequisites or [],
        videos=[
            VideoOut(
                id=v.id,
                title=v.title,
                youtube_id=v.youtube_id,
                order_index=v.order_index,
            )
            for v in topic.videos
        ],
        subtopics=subtopics_out,
    )


class ExerciseAnswerRequest(BaseModel):
    answer: str = ""
    selected_index: int | None = None


class ExerciseAnswerResponse(BaseModel):
    correct: bool
    feedback: str
    explanation: str | None = None


@router.post("/exercises/{exercise_id}/answer", response_model=ExerciseAnswerResponse)
def answer_exercise(
    exercise_id: int,
    req: ExerciseAnswerRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    ex = db.query(models.CheckpointExercise).filter_by(id=exercise_id).first()
    if not ex:
        raise HTTPException(status_code=404, detail="Exercise not found")

    if ex.exercise_type == "recognition":
        if req.selected_index is None:
            return ExerciseAnswerResponse(correct=False, feedback="No option selected.", explanation=ex.explanation)
        correct = req.selected_index == ex.correct_index
        if correct:
            feedback = "Correct! Great pattern recognition."
        else:
            try:
                feedback = se.grade_recognition_wrong(
                    ex.question, ex.options or [], ex.correct_index or 0, req.selected_index
                )
            except (_anthropic.AuthenticationError, Exception):
                feedback = f"Incorrect. The right answer was option {chr(65 + (ex.correct_index or 0))}."
    else:
        if not req.answer.strip():
            return ExerciseAnswerResponse(correct=False, feedback="Please write a response before submitting.", explanation=ex.explanation)
        try:
            feedback, correct = se.grade_exercise(
                exercise_type=ex.exercise_type,
                question=ex.question,
                buggy_code=ex.buggy_code,
                grading_hints=ex.grading_hints or "",
                student_answer=req.answer,
            )
        except _anthropic.AuthenticationError:
            raise HTTPException(status_code=503, detail="AI grading unavailable — invalid API key in backend/.env")
        except Exception:
            raise HTTPException(status_code=503, detail="AI grading temporarily unavailable")

    return ExerciseAnswerResponse(correct=correct, feedback=feedback, explanation=ex.explanation)


class TutorRequest(BaseModel):
    stage: int
    message: str
    history: list[dict] = []


class TutorResponse(BaseModel):
    reply: str
    advance: bool


@router.post("/{slug}/tutor", response_model=TutorResponse)
def tutor_chat(
    slug: str,
    req: TutorRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    topic = db.query(models.Topic).filter(models.Topic.slug == slug).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    raw = se.tutor_respond(stage=req.stage, message=req.message, history=req.history, topic_slug=slug)
    advance = "[ADVANCE]" in raw
    clean = raw.replace("[ADVANCE]", "").strip()
    return TutorResponse(reply=clean, advance=advance)


@router.post("/subtopics/{subtopic_id}/mark-passed")
def mark_subtopic_passed(
    subtopic_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    st = db.query(models.SubTopic).filter_by(id=subtopic_id).first()
    if not st:
        raise HTTPException(status_code=404, detail="Subtopic not found")
    progress = db.query(models.UserSubTopicProgress).filter_by(
        user_id=current_user.id, subtopic_id=subtopic_id
    ).first()
    if progress:
        progress.gate_passed = True
    else:
        progress = models.UserSubTopicProgress(
            user_id=current_user.id, subtopic_id=subtopic_id, gate_passed=True
        )
        db.add(progress)
    db.commit()
    return {"ok": True}


@router.post("/playcards/{playcard_id}/chat", response_model=ChatResponse)
def chat_with_playcard(
    playcard_id: int,
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    playcard = db.query(models.PlayCard).filter(models.PlayCard.id == playcard_id).first()
    if not playcard:
        raise HTTPException(status_code=404, detail="PlayCard not found")

    reply = se.chat_about_playcard(
        playcard_title=playcard.title,
        playcard_content=playcard.content,
        user_message=req.message,
        history=req.history,
    )
    return ChatResponse(reply=reply)
