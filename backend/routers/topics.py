"""
Topics API — curriculum topics, subtopics, playcards, and progress.

GET  /api/topics/                        — all topics with user unlock status
GET  /api/topics/{slug}                  — topic detail: subtopics, videos, playcards
POST /api/topics/playcards/{id}/chat     — AI chat about a specific playcard
"""
from fastapi import APIRouter, Depends, HTTPException
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


class PlayCardOut(BaseModel):
    id: int
    title: str
    content: str
    order_index: int
    ai_summary: str | None = None
    audio_url: str | None = None  # e.g. "/audio/playcards/playcard_1.mp3"


class ProblemBrief(BaseModel):
    id: int
    slug: str
    title: str
    difficulty: str


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
):
    topics = (
        db.query(models.Topic)
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
                )
                for pc in st.play_cards
            ],
            problems=[
                ProblemBrief(
                    id=p.id,
                    slug=p.slug,
                    title=p.title,
                    difficulty=p.difficulty,
                )
                for p in st.problems
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
