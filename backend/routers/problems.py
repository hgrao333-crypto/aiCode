from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from database import get_db
import models
from auth import get_current_user

router = APIRouter(prefix="/api/problems", tags=["problems"])


class ProblemOut(BaseModel):
    id: int
    slug: str
    title: str
    description: str
    topic: str
    difficulty: str
    starter_code: str
    concepts: list
    order_index: int

    class Config:
        from_attributes = True


class ProblemDetail(ProblemOut):
    test_cases: list


@router.get("/", response_model=list[ProblemOut])
def list_problems(
    topic: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(models.Problem)
    if topic:
        q = q.filter(models.Problem.topic == topic)
    return q.order_by(models.Problem.order_index).all()


@router.get("/{slug}", response_model=ProblemDetail)
def get_problem(
    slug: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    problem = db.query(models.Problem).filter(models.Problem.slug == slug).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    return problem
