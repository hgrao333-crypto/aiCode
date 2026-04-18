"""
Gate session endpoints — handles the full Socratic dialogue loop.

POST /api/sessions/run        — student clicks Run, starts/resumes session
POST /api/sessions/answer     — student submits an answer
GET  /api/sessions/{id}       — get session state
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
import models
from auth import get_current_user
from sandbox import run_code
import socratic_engine as se

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

MAX_TURNS = se.MAX_TURNS


class RunRequest(BaseModel):
    problem_slug: str
    code: str


class RunResponse(BaseModel):
    session_id: int
    code_result: dict          # {passed, results, error}
    question: str              # first Socratic question


class AnswerRequest(BaseModel):
    session_id: int
    answer: str


class AnswerResponse(BaseModel):
    verdict: str               # PASS | FAIL | STUCK
    follow_up: str             # next question (if FAIL)
    teaching: str              # teaching block (if STUCK)
    session_outcome: str       # "" | "PASS" | "PASS_ASSISTED"


class SessionState(BaseModel):
    id: int
    problem_id: int
    turns: int
    outcome: str | None
    turns_log: list


@router.post("/run", response_model=RunResponse)
def run(
    req: RunRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    problem = db.query(models.Problem).filter(models.Problem.slug == req.problem_slug).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    # Run code in sandbox
    code_result = run_code(req.code, problem.test_cases)

    # Generate first Socratic question
    question = se.generate_gate_question(
        problem_title=problem.title,
        problem_description=problem.description,
        student_code=req.code,
    )

    # Create new gate session
    session = models.GateSession(
        user_id=current_user.id,
        problem_id=problem.id,
        student_code=req.code,
        turns=0,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Store turn 0 (initial question, no answer yet)
    turn = models.TurnLog(
        session_id=session.id,
        turn_number=0,
        question=question,
        student_answer="",
        verdict="",
        ai_response="",
    )
    db.add(turn)
    db.commit()

    return RunResponse(
        session_id=session.id,
        code_result=code_result,
        question=question,
    )


@router.post("/answer", response_model=AnswerResponse)
def answer(
    req: AnswerRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    session = db.query(models.GateSession).filter(
        models.GateSession.id == req.session_id,
        models.GateSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.outcome:
        raise HTTPException(status_code=400, detail="Session already completed")

    problem = session.problem

    # Get the current unanswered turn (verdict == "")
    current_turn = db.query(models.TurnLog).filter(
        models.TurnLog.session_id == session.id,
        models.TurnLog.verdict == "",
    ).order_by(models.TurnLog.id.desc()).first()

    if not current_turn:
        raise HTTPException(status_code=400, detail="No active question for this session")

    # Evaluate
    session.turns += 1
    eval_result = se.evaluate_answer(
        problem_title=problem.title,
        student_code=session.student_code,
        question=current_turn.question,
        student_answer=req.answer,
        turn_number=session.turns,
    )
    verdict = eval_result["verdict"]
    follow_up = eval_result.get("follow_up", "")
    teaching = ""
    session_outcome = ""

    # Update current turn
    current_turn.student_answer = req.answer
    current_turn.verdict = verdict

    if verdict == "PASS":
        session_outcome = "PASS"
        session.outcome = session_outcome
        _update_mastery(db, current_user.id, problem.concepts, assisted=False)
        _mark_subtopic_passed(db, current_user.id, problem.subtopic_id)

    elif verdict == "STUCK":
        # Collect all failed answers for teaching context
        failed_answers = [
            t.student_answer for t in session.turns_log
            if t.student_answer and t.verdict in ("FAIL", "STUCK", "")
        ]
        failed_answers.append(req.answer)

        teaching = se.generate_teaching(
            problem_title=problem.title,
            problem_description=problem.description,
            student_code=session.student_code,
            gate_question=session.turns_log[0].question,
            failed_answers=failed_answers,
        )
        current_turn.ai_response = teaching

        # Add a verification question turn (parsed from teaching)
        # The teaching block ends with "## Check\n<question>"
        verification_q = _extract_check_question(teaching)
        if verification_q:
            verification_turn = models.TurnLog(
                session_id=session.id,
                turn_number=session.turns + 1,
                question=verification_q,
                student_answer="",
                verdict="",
                ai_response="",
            )
            db.add(verification_turn)
            # Mark session as teaching-triggered (will become PASS_ASSISTED on verify pass)
            session.outcome = "TEACHING"

    elif verdict == "FAIL" and follow_up:
        # Add next turn
        next_turn = models.TurnLog(
            session_id=session.id,
            turn_number=session.turns,
            question=follow_up,
            student_answer="",
            verdict="",
            ai_response="",
        )
        db.add(next_turn)

    # Handle verification answer (session is in TEACHING state)
    if session.outcome == "TEACHING" and verdict == "PASS":
        session.outcome = "PASS_ASSISTED"
        session_outcome = "PASS_ASSISTED"
        _update_mastery(db, current_user.id, problem.concepts, assisted=True)
        _mark_subtopic_passed(db, current_user.id, problem.subtopic_id)

    db.commit()

    return AnswerResponse(
        verdict=verdict,
        follow_up=follow_up,
        teaching=teaching,
        session_outcome=session_outcome,
    )


@router.get("/{session_id}", response_model=SessionState)
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    session = db.query(models.GateSession).filter(
        models.GateSession.id == session_id,
        models.GateSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    turns = [
        {
            "turn_number": t.turn_number,
            "question": t.question,
            "student_answer": t.student_answer,
            "verdict": t.verdict,
            "ai_response": t.ai_response,
        }
        for t in session.turns_log
    ]
    return SessionState(
        id=session.id,
        problem_id=session.problem_id,
        turns=session.turns,
        outcome=session.outcome,
        turns_log=turns,
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _extract_check_question(teaching_text: str) -> str:
    """Pull the verification question from the ## Check section."""
    marker = "## Check"
    idx = teaching_text.find(marker)
    if idx == -1:
        return ""
    after = teaching_text[idx + len(marker):].strip()
    # Take just the first non-empty line
    for line in after.splitlines():
        line = line.strip()
        if line:
            return line
    return after[:300]


def _mark_subtopic_passed(db, user_id: int, subtopic_id: int | None):
    if not subtopic_id:
        return
    record = db.query(models.UserSubTopicProgress).filter(
        models.UserSubTopicProgress.user_id == user_id,
        models.UserSubTopicProgress.subtopic_id == subtopic_id,
    ).first()
    if record:
        record.gate_passed = True
    else:
        db.add(models.UserSubTopicProgress(
            user_id=user_id,
            subtopic_id=subtopic_id,
            gate_passed=True,
        ))


def _update_mastery(db, user_id: int, concepts: list, assisted: bool):
    score = 0.5 if assisted else 1.0
    level = models.MasteryLevel.assisted if assisted else models.MasteryLevel.unassisted
    for concept in concepts:
        record = db.query(models.MasteryRecord).filter(
            models.MasteryRecord.user_id == user_id,
            models.MasteryRecord.concept == concept,
        ).first()
        if record:
            # Weighted average — don't decrease
            record.score = max(record.score, score)
            record.assist_level = level
        else:
            record = models.MasteryRecord(
                user_id=user_id,
                concept=concept,
                score=score,
                assist_level=level,
            )
            db.add(record)
