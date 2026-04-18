from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
import models
from auth import get_current_user

router = APIRouter(prefix="/api/progress", tags=["progress"])


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
