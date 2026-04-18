import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Text, DateTime,
    ForeignKey, Enum, Boolean, JSON,
)
from sqlalchemy.orm import relationship
from database import Base


class MasteryLevel(str, enum.Enum):
    untested = "untested"
    assisted = "assisted"
    unassisted = "unassisted"


class Verdict(str, enum.Enum):
    pass_ = "PASS"
    fail = "FAIL"
    stuck = "STUCK"


# ─── Users ────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    mastery_records = relationship("MasteryRecord", back_populates="user")
    gate_sessions = relationship("GateSession", back_populates="user")
    subtopic_progress = relationship("UserSubTopicProgress", back_populates="user")


# ─── Curriculum ───────────────────────────────────────────────────────────────

class Topic(Base):
    """An algorithm topic node in the course flowchart (e.g. Binary Search)."""
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    icon = Column(String, default="")            # emoji
    color = Column(String, default="indigo")     # tailwind color name
    level = Column(Integer, default=0)           # column in flowchart
    position_in_level = Column(Integer, default=0)  # row within column
    prerequisites = Column(JSON, default=list)   # list of topic slugs

    subtopics = relationship("SubTopic", back_populates="topic",
                             order_by="SubTopic.order_index")
    videos = relationship("YoutubeVideo", back_populates="topic",
                          order_by="YoutubeVideo.order_index")


class SubTopic(Base):
    """A chapter within a topic (e.g. 'Loop Invariants' inside Binary Search)."""
    __tablename__ = "subtopics"

    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    slug = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, default="")
    order_index = Column(Integer, default=0)

    topic = relationship("Topic", back_populates="subtopics")
    play_cards = relationship("PlayCard", back_populates="subtopic",
                              order_by="PlayCard.order_index")
    problems = relationship("Problem", back_populates="subtopic")
    progress_records = relationship("UserSubTopicProgress", back_populates="subtopic")


class PlayCard(Base):
    """A pre-generated flashcard that teaches one concept."""
    __tablename__ = "play_cards"

    id = Column(Integer, primary_key=True, index=True)
    subtopic_id = Column(Integer, ForeignKey("subtopics.id"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)   # markdown
    order_index = Column(Integer, default=0)

    subtopic = relationship("SubTopic", back_populates="play_cards")


class YoutubeVideo(Base):
    """Admin-curated YouTube video for a topic."""
    __tablename__ = "youtube_videos"

    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    title = Column(String, nullable=False)
    youtube_id = Column(String, nullable=False)   # e.g. "W9F8fDQj7So"
    order_index = Column(Integer, default=0)

    topic = relationship("Topic", back_populates="videos")


class UserSubTopicProgress(Base):
    """Tracks whether a user has cleared the gate for a subtopic."""
    __tablename__ = "user_subtopic_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subtopic_id = Column(Integer, ForeignKey("subtopics.id"), nullable=False)
    gate_passed = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="subtopic_progress")
    subtopic = relationship("SubTopic", back_populates="progress_records")


# ─── Problems ─────────────────────────────────────────────────────────────────

class Problem(Base):
    __tablename__ = "problems"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    topic = Column(String, nullable=False)
    subtopic_id = Column(Integer, ForeignKey("subtopics.id"), nullable=True)
    difficulty = Column(String, default="medium")
    starter_code = Column(Text, nullable=False)
    solution_code = Column(Text, nullable=False)
    test_cases = Column(JSON, nullable=False)
    concepts = Column(JSON, default=list)
    order_index = Column(Integer, default=0)

    subtopic = relationship("SubTopic", back_populates="problems")
    gate_sessions = relationship("GateSession", back_populates="problem")


# ─── Learning records ─────────────────────────────────────────────────────────

class MasteryRecord(Base):
    __tablename__ = "mastery_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    concept = Column(String, nullable=False)
    score = Column(Float, default=0.0)
    assist_level = Column(String, default=MasteryLevel.untested)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="mastery_records")


class GateSession(Base):
    __tablename__ = "gate_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    problem_id = Column(Integer, ForeignKey("problems.id"), nullable=False)
    student_code = Column(Text, nullable=False)
    turns = Column(Integer, default=0)
    outcome = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="gate_sessions")
    problem = relationship("Problem", back_populates="gate_sessions")
    turns_log = relationship("TurnLog", back_populates="session", order_by="TurnLog.id")


class TurnLog(Base):
    __tablename__ = "turn_logs"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("gate_sessions.id"), nullable=False)
    turn_number = Column(Integer, nullable=False)
    question = Column(Text, nullable=False)
    student_answer = Column(Text, nullable=False)
    verdict = Column(String, nullable=False)
    ai_response = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("GateSession", back_populates="turns_log")
