"""
Admin API — full CRUD for all course content.
Every endpoint requires is_admin=True on the current user.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Any

from database import get_db
import models
from auth import get_current_user

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ── Admin guard ────────────────────────────────────────────────────────────────

def require_admin(current_user: models.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# ── Schemas ───────────────────────────────────────────────────────────────────

class TopicIn(BaseModel):
    slug: str
    title: str
    description: str
    icon: str = ""
    color: str = "indigo"
    level: int = 0
    position_in_level: int = 0
    prerequisites: list[str] = []

class SubTopicIn(BaseModel):
    topic_id: int
    slug: str
    title: str
    description: str = ""
    order_index: int = 0

class PlayCardIn(BaseModel):
    subtopic_id: int
    title: str
    content: str
    order_index: int = 0
    ai_summary: str | None = None

class VideoIn(BaseModel):
    topic_id: int
    title: str
    youtube_id: str
    order_index: int = 0

class ExerciseIn(BaseModel):
    playcard_id: int
    exercise_type: str  # recognition | debugging | variation | teach_back
    question: str
    options: list[str] | None = None
    correct_index: int | None = None
    buggy_code: str | None = None
    grading_hints: str | None = None
    explanation: str | None = None
    order_index: int = 0


class ProblemIn(BaseModel):
    slug: str
    title: str
    description: str
    topic: str
    subtopic_id: int | None = None
    difficulty: str = "medium"
    starter_code: str
    solution_code: str
    test_cases: list[Any]
    concepts: list[str] = []
    order_index: int = 0

class AdminOverview(BaseModel):
    topics: int
    subtopics: int
    playcards: int
    problems: int
    users: int


# ── Overview ──────────────────────────────────────────────────────────────────

@router.get("/overview", response_model=AdminOverview)
def overview(db: Session = Depends(get_db), _=Depends(require_admin)):
    return AdminOverview(
        topics=db.query(models.Topic).count(),
        subtopics=db.query(models.SubTopic).count(),
        playcards=db.query(models.PlayCard).count(),
        problems=db.query(models.Problem).count(),
        users=db.query(models.User).count(),
    )


# ── Topics ────────────────────────────────────────────────────────────────────

@router.get("/topics")
def list_topics(db: Session = Depends(get_db), _=Depends(require_admin)):
    topics = db.query(models.Topic).order_by(models.Topic.level, models.Topic.position_in_level).all()
    return [
        {
            "id": t.id,
            "slug": t.slug,
            "title": t.title,
            "description": t.description,
            "icon": t.icon,
            "color": t.color,
            "level": t.level,
            "position_in_level": t.position_in_level,
            "prerequisites": t.prerequisites or [],
            "subtopics_count": len(t.subtopics),
        }
        for t in topics
    ]


@router.post("/topics", status_code=201)
def create_topic(data: TopicIn, db: Session = Depends(get_db), _=Depends(require_admin)):
    if db.query(models.Topic).filter_by(slug=data.slug).first():
        raise HTTPException(400, detail="Slug already exists")
    topic = models.Topic(**data.model_dump())
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return {"id": topic.id, "slug": topic.slug}


@router.put("/topics/{topic_id}")
def update_topic(topic_id: int, data: TopicIn, db: Session = Depends(get_db), _=Depends(require_admin)):
    topic = db.query(models.Topic).filter_by(id=topic_id).first()
    if not topic:
        raise HTTPException(404, detail="Topic not found")
    for k, v in data.model_dump().items():
        setattr(topic, k, v)
    db.commit()
    return {"ok": True}


@router.delete("/topics/{topic_id}")
def delete_topic(topic_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    topic = db.query(models.Topic).filter_by(id=topic_id).first()
    if not topic:
        raise HTTPException(404, detail="Topic not found")
    db.delete(topic)
    db.commit()
    return {"ok": True}


# ── Topic detail (subtopics + playcards + videos) ─────────────────────────────

@router.get("/topics/{topic_id}/detail")
def topic_detail(topic_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    topic = db.query(models.Topic).filter_by(id=topic_id).first()
    if not topic:
        raise HTTPException(404, detail="Topic not found")
    return {
        "id": topic.id,
        "slug": topic.slug,
        "title": topic.title,
        "description": topic.description,
        "icon": topic.icon,
        "color": topic.color,
        "level": topic.level,
        "position_in_level": topic.position_in_level,
        "prerequisites": topic.prerequisites or [],
        "subtopics": [
            {
                "id": st.id,
                "slug": st.slug,
                "title": st.title,
                "description": st.description,
                "order_index": st.order_index,
                "play_cards": [
                    {
                        "id": pc.id,
                        "title": pc.title,
                        "content": pc.content,
                        "order_index": pc.order_index,
                        "ai_summary": pc.ai_summary,
                        "audio_file": pc.audio_file,
                    }
                    for pc in st.play_cards
                ],
                "problems": [
                    {
                        "id": p.id,
                        "slug": p.slug,
                        "title": p.title,
                        "difficulty": p.difficulty,
                        "order_index": p.order_index,
                    }
                    for p in st.problems
                ],
            }
            for st in topic.subtopics
        ],
        "videos": [
            {"id": v.id, "title": v.title, "youtube_id": v.youtube_id, "order_index": v.order_index}
            for v in topic.videos
        ],
    }


# ── SubTopics ─────────────────────────────────────────────────────────────────

@router.get("/subtopics")
def list_subtopics(db: Session = Depends(get_db), _=Depends(require_admin)):
    """Flat list of all subtopics with their parent topic — used for the problem subtopic selector."""
    rows = (
        db.query(models.SubTopic, models.Topic.title, models.Topic.slug)
        .join(models.Topic, models.SubTopic.topic_id == models.Topic.id)
        .order_by(models.Topic.level, models.Topic.position_in_level, models.SubTopic.order_index)
        .all()
    )
    return [
        {
            "id": st.id,
            "slug": st.slug,
            "title": st.title,
            "order_index": st.order_index,
            "topic_title": topic_title,
            "topic_slug": topic_slug,
        }
        for st, topic_title, topic_slug in rows
    ]


@router.post("/subtopics", status_code=201)
def create_subtopic(data: SubTopicIn, db: Session = Depends(get_db), _=Depends(require_admin)):
    st = models.SubTopic(**data.model_dump())
    db.add(st)
    db.commit()
    db.refresh(st)
    return {"id": st.id}


@router.put("/subtopics/{subtopic_id}")
def update_subtopic(subtopic_id: int, data: SubTopicIn, db: Session = Depends(get_db), _=Depends(require_admin)):
    st = db.query(models.SubTopic).filter_by(id=subtopic_id).first()
    if not st:
        raise HTTPException(404, detail="SubTopic not found")
    for k, v in data.model_dump().items():
        setattr(st, k, v)
    db.commit()
    return {"ok": True}


@router.delete("/subtopics/{subtopic_id}")
def delete_subtopic(subtopic_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    st = db.query(models.SubTopic).filter_by(id=subtopic_id).first()
    if not st:
        raise HTTPException(404, detail="SubTopic not found")
    db.delete(st)
    db.commit()
    return {"ok": True}


# ── PlayCards ─────────────────────────────────────────────────────────────────

@router.post("/playcards", status_code=201)
def create_playcard(data: PlayCardIn, db: Session = Depends(get_db), _=Depends(require_admin)):
    pc = models.PlayCard(**data.model_dump())
    db.add(pc)
    db.commit()
    db.refresh(pc)
    return {"id": pc.id}


@router.put("/playcards/{playcard_id}")
def update_playcard(playcard_id: int, data: PlayCardIn, db: Session = Depends(get_db), _=Depends(require_admin)):
    pc = db.query(models.PlayCard).filter_by(id=playcard_id).first()
    if not pc:
        raise HTTPException(404, detail="PlayCard not found")
    for k, v in data.model_dump().items():
        setattr(pc, k, v)
    db.commit()
    return {"ok": True}


@router.delete("/playcards/{playcard_id}")
def delete_playcard(playcard_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    pc = db.query(models.PlayCard).filter_by(id=playcard_id).first()
    if not pc:
        raise HTTPException(404, detail="PlayCard not found")
    db.delete(pc)
    db.commit()
    return {"ok": True}


# ── Videos ────────────────────────────────────────────────────────────────────

@router.post("/videos", status_code=201)
def create_video(data: VideoIn, db: Session = Depends(get_db), _=Depends(require_admin)):
    v = models.YoutubeVideo(**data.model_dump())
    db.add(v)
    db.commit()
    db.refresh(v)
    return {"id": v.id}


@router.delete("/videos/{video_id}")
def delete_video(video_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    v = db.query(models.YoutubeVideo).filter_by(id=video_id).first()
    if not v:
        raise HTTPException(404, detail="Video not found")
    db.delete(v)
    db.commit()
    return {"ok": True}


# ── Checkpoint Exercises ──────────────────────────────────────────────────────

@router.get("/playcards/{playcard_id}/exercises")
def list_exercises(playcard_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(models.CheckpointExercise).filter_by(playcard_id=playcard_id).order_by(models.CheckpointExercise.order_index).all()


@router.post("/exercises", status_code=201)
def create_exercise(data: ExerciseIn, db: Session = Depends(get_db), _=Depends(require_admin)):
    ex = models.CheckpointExercise(**data.model_dump())
    db.add(ex)
    db.commit()
    db.refresh(ex)
    return {"id": ex.id}


@router.put("/exercises/{exercise_id}")
def update_exercise(exercise_id: int, data: ExerciseIn, db: Session = Depends(get_db), _=Depends(require_admin)):
    ex = db.query(models.CheckpointExercise).filter_by(id=exercise_id).first()
    if not ex:
        raise HTTPException(404, detail="Exercise not found")
    for k, v in data.model_dump().items():
        setattr(ex, k, v)
    db.commit()
    return {"ok": True}


@router.delete("/exercises/{exercise_id}")
def delete_exercise(exercise_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    ex = db.query(models.CheckpointExercise).filter_by(id=exercise_id).first()
    if not ex:
        raise HTTPException(404, detail="Exercise not found")
    db.delete(ex)
    db.commit()
    return {"ok": True}


# ── Problems ──────────────────────────────────────────────────────────────────

@router.get("/problems")
def list_problems(db: Session = Depends(get_db), _=Depends(require_admin)):
    problems = db.query(models.Problem).order_by(models.Problem.topic, models.Problem.order_index).all()
    return [
        {
            "id": p.id,
            "slug": p.slug,
            "title": p.title,
            "topic": p.topic,
            "subtopic_id": p.subtopic_id,
            "difficulty": p.difficulty,
            "order_index": p.order_index,
            "concepts": p.concepts,
            "description": p.description,
            "starter_code": p.starter_code,
            "solution_code": p.solution_code,
            "test_cases": p.test_cases,
        }
        for p in problems
    ]


@router.post("/problems", status_code=201)
def create_problem(data: ProblemIn, db: Session = Depends(get_db), _=Depends(require_admin)):
    if db.query(models.Problem).filter_by(slug=data.slug).first():
        raise HTTPException(400, detail="Slug already exists")
    p = models.Problem(**data.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return {"id": p.id, "slug": p.slug}


@router.put("/problems/{problem_id}")
def update_problem(problem_id: int, data: ProblemIn, db: Session = Depends(get_db), _=Depends(require_admin)):
    p = db.query(models.Problem).filter_by(id=problem_id).first()
    if not p:
        raise HTTPException(404, detail="Problem not found")
    for k, v in data.model_dump().items():
        setattr(p, k, v)
    db.commit()
    return {"ok": True}


@router.delete("/problems/{problem_id}")
def delete_problem(problem_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    p = db.query(models.Problem).filter_by(id=problem_id).first()
    if not p:
        raise HTTPException(404, detail="Problem not found")
    db.delete(p)
    db.commit()
    return {"ok": True}
