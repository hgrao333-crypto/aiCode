from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from models import TutorProgress, LearnerProfile
from auth import get_current_user

router = APIRouter(prefix="/api/learner", tags=["learner"])


# ── Schemas ────────────────────────────────────────────────────────────────────

class TutorProgressIn(BaseModel):
    subtopic_idx: int
    phase: str
    completed_subtopics: list[int]


class CompleteSubtopicIn(BaseModel):
    topic_slug: str
    subtopic_slug: str
    subtopic_idx: int


# ── Helpers ────────────────────────────────────────────────────────────────────

def _get_or_create_progress(db: Session, user_id: int, topic_slug: str) -> TutorProgress:
    row = db.query(TutorProgress).filter_by(user_id=user_id, topic_slug=topic_slug).first()
    if not row:
        row = TutorProgress(user_id=user_id, topic_slug=topic_slug)
        db.add(row)
        db.flush()
    return row


def _get_or_create_profile(db: Session, user_id: int) -> LearnerProfile:
    row = db.query(LearnerProfile).filter_by(user_id=user_id).first()
    if not row:
        row = LearnerProfile(user_id=user_id, profile={"subtopics": [], "final_solved": False})
        db.add(row)
        db.flush()
    return row


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("/tutor-progress/{slug}")
def get_tutor_progress(slug: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    row = db.query(TutorProgress).filter_by(user_id=user.id, topic_slug=slug).first()
    if not row:
        return {"subtopic_idx": 0, "phase": "learning", "completed_subtopics": []}
    return {
        "subtopic_idx": row.subtopic_idx,
        "phase": row.phase,
        "completed_subtopics": row.completed_subtopics or [],
    }


@router.post("/tutor-progress/{slug}")
def save_tutor_progress(slug: str, body: TutorProgressIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    row = _get_or_create_progress(db, user.id, slug)
    row.subtopic_idx = body.subtopic_idx
    row.phase = body.phase
    row.completed_subtopics = body.completed_subtopics
    db.commit()
    return {"ok": True}


@router.post("/complete-subtopic")
def complete_subtopic(body: CompleteSubtopicIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    profile = _get_or_create_profile(db, user.id)
    data: dict = dict(profile.profile or {})
    subtopics: list = list(data.get("subtopics", []))

    already = any(s["slug"] == body.subtopic_slug for s in subtopics)
    if not already:
        subtopics.append({
            "slug": body.subtopic_slug,
            "topic_slug": body.topic_slug,
            "subtopic_idx": body.subtopic_idx,
            "completed_at": datetime.utcnow().isoformat(),
        })
        data["subtopics"] = subtopics
        profile.profile = data
        db.commit()
    return {"ok": True, "total_completed": len(subtopics)}


@router.post("/complete-final")
def complete_final(db: Session = Depends(get_db), user=Depends(get_current_user)):
    profile = _get_or_create_profile(db, user.id)
    data = dict(profile.profile or {})
    data["final_solved"] = True
    data["final_solved_at"] = datetime.utcnow().isoformat()
    profile.profile = data
    db.commit()
    return {"ok": True}


@router.get("/profile")
def get_profile(db: Session = Depends(get_db), user=Depends(get_current_user)):
    profile = _get_or_create_profile(db, user.id)
    return profile.profile or {}
