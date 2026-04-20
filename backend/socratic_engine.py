"""
Socratic engine — AI calls for the platform.

Anthropic (Claude): gate questions, answer evaluation, teaching (coding problem flow)
Gemini Flash (free): playcard chat, exercise grading
"""
import json
from anthropic import Anthropic
from google import genai
from google.genai import types as gtypes  # noqa: F401 — used in generate_content calls
from config import settings

client = Anthropic(api_key=settings.anthropic_api_key)
gemini = genai.Client(api_key=settings.gemini_api_key)

# Anthropic models
HAIKU = "claude-haiku-4-5-20251001"
SONNET = HAIKU

# Gemini free model
GEMINI_FLASH = "gemini-2.0-flash-lite"

MAX_TURNS = 4  # follow-up questions before teaching triggers


# ---------------------------------------------------------------------------
# System prompts
# ---------------------------------------------------------------------------

GATE_SYSTEM = """You are a friendly Socratic coding tutor on a platform called Logos.
Your goal is to check whether the student genuinely understands the KEY CONCEPT behind their solution — not to trip them up or catch syntax mistakes.

Good questions test conceptual understanding:
- "What does `left` represent in your solution, and why do you update it the way you do?"
- "Walk me through what happens to `mid` on the first iteration if nums = [1,3,5,7] and target = 5."
- "Why does your while loop use `<=` instead of `<`?"

Bad questions to AVOID:
- Syntax or naming issues ("why did you name this variable X?")
- Obvious things already visible in the code ("what does line 3 do?")
- Trick questions or edge cases that are unnecessarily hard
- Multi-part compound questions

Rules:
- Ask exactly ONE clear, friendly question.
- Focus on the most important concept the student needs to understand for this problem.
- Use the student's own variable names to ground the question in their code.
- Do NOT ask yes/no questions.
- Keep the question concise — one or two sentences max.
- Output ONLY the question text. No greeting, no preamble.
"""

EVAL_SYSTEM = """You are evaluating a student's answer to a Socratic question about their code.

Be fair and encouraging. A student who shows partial understanding or explains things in their own words
(even imprecisely) should generally PASS — the goal is concept comprehension, not perfect phrasing.

Respond with a raw JSON object (no markdown fences):
{
  "verdict": "PASS" | "FAIL" | "STUCK",
  "follow_up": "<a simpler, friendlier follow-up question if FAIL — empty string otherwise>",
  "reason": "<one sentence internal note>"
}

Verdict rules:
- PASS: The student shows they understand the core idea, even if their wording is imperfect.
        Give benefit of the doubt for reasonable explanations.
- FAIL: The student tried but has a real gap. The follow_up MUST be a simpler, friendlier version
        of the same concept — easier than the original, not harder.
- STUCK: ONLY when the student says "I don't know" / "idk" / leaves it blank,
         OR shows a fundamental misconception that a follow-up can't fix.

Important:
- Never give FAIL for terse but correct answers.
- follow_up must always be non-empty when verdict is FAIL.
- follow_up must be friendlier and simpler than the original question.
Output raw JSON only."""

PLAYCARD_SYSTEM = """You are a friendly coding tutor on Logos, helping a student understand a concept from a learning card.

Keep answers concise (under 200 words). Use the playcard content as the primary reference.
When relevant, give short Python code examples. Be warm and encouraging.
Focus on the student's specific question — don't re-explain the entire card.
"""

TEACH_SYSTEM = """You are a warm, encouraging coding tutor. The student got stuck and needs your help.
Explain things clearly using their own code as the example. Be supportive — getting stuck is normal.

Structure your response in three sections:

## Concept
In 2-3 sentences, explain the key idea the student is missing. Ground it in their specific code —
use their variable names. Avoid jargon. Write as if talking to a friend.

## Walkthrough
Trace through their code step by step with a simple concrete example (e.g., nums = [1, 3, 5, 7], target = 5).
Show exactly what each key variable holds at each step. Keep it short — 4 to 6 steps max.

## Check
Ask ONE easy, confidence-building question to confirm they absorbed the explanation.
It should be simpler than the original gate question. Make it feel achievable.

Keep the total response under 350 words. Be warm and encouraging throughout."""


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def generate_gate_question(
    problem_title: str,
    problem_description: str,
    student_code: str,
    learner_context: str = "",
) -> str:
    """Generate the first Socratic question when the student clicks Run."""
    user_msg = f"""Problem: {problem_title}

Description:
{problem_description}

Student's code:
```python
{student_code}
```

{f"Learner context: {learner_context}" if learner_context else ""}

Ask ONE friendly question that checks whether the student understands the KEY CONCEPT of their solution.
Focus on how their algorithm works (e.g. why the search space shrinks, what the loop invariant is,
what happens when mid doesn't match) — not syntax, naming, or line-by-line details."""

    response = client.messages.create(
        model=SONNET,
        max_tokens=256,
        system=GATE_SYSTEM,
        messages=[{"role": "user", "content": user_msg}],
    )
    return response.content[0].text.strip()


def evaluate_answer(
    problem_title: str,
    student_code: str,
    question: str,
    student_answer: str,
    turn_number: int,
) -> dict:
    """
    Evaluate the student's answer.
    Returns {"verdict": ..., "follow_up": ..., "reason": ...}
    Forces STUCK if this is the last allowed turn.
    """
    force_stuck = turn_number >= MAX_TURNS

    user_msg = f"""Problem: {problem_title}

Student's code:
```python
{student_code}
```

Question asked: {question}
Student's answer: {student_answer}

{"IMPORTANT: This is turn {turn_number}/{MAX_TURNS}. If the student's answer shows any gap or confusion, verdict MUST be STUCK — do not ask another follow-up." if force_stuck else f"This is turn {turn_number}/{MAX_TURNS}."}

Evaluate the answer."""

    response = client.messages.create(
        model=HAIKU,
        max_tokens=512,
        system=EVAL_SYSTEM,
        messages=[{"role": "user", "content": user_msg}],
    )
    raw = response.content[0].text.strip()

    # Strip markdown fences if the model wraps in ```json
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        result = {"verdict": "STUCK", "follow_up": "", "reason": "Parse error"}

    # FAIL must always include a follow_up — if missing, escalate to STUCK
    if result.get("verdict") == "FAIL" and not result.get("follow_up", "").strip():
        result["verdict"] = "STUCK"

    # Enforce max turns
    if force_stuck and result.get("verdict") == "FAIL":
        result["verdict"] = "STUCK"
        result["follow_up"] = ""

    return result


def generate_teaching(
    problem_title: str,
    problem_description: str,
    student_code: str,
    gate_question: str,
    failed_answers: list[str],
) -> str:
    """
    Generate a teaching response (concept + walkthrough + verification question)
    when the student is stuck.
    """
    answers_block = "\n".join(
        f"  - Attempt {i+1}: {a}" for i, a in enumerate(failed_answers)
    )

    user_msg = f"""Problem: {problem_title}

Description:
{problem_description}

Student's code:
```python
{student_code}
```

Gate question: {gate_question}
Student's failed attempts:
{answers_block}

Generate a teaching response targeting the gap revealed by these attempts."""

    response = client.messages.create(
        model=SONNET,
        max_tokens=1024,
        system=TEACH_SYSTEM,
        messages=[{"role": "user", "content": user_msg}],
    )
    return response.content[0].text.strip()


EXERCISE_GRADE_SYSTEM = """You are grading a student's answer to an exercise about algorithms and data structures.
Be fair and encouraging. Give credit for partial understanding.

Respond with raw JSON only — no markdown fences:
{"correct": true/false, "feedback": "1-2 encouraging sentences"}

Guidelines by type:
- debugging: correct=true if student identified the actual bug and explained why it causes wrong output.
- variation: correct=true if student shows sound conceptual reasoning — there is no single right answer, reward good thinking.
- teach_back: correct=true if the explanation is accurate AND clear enough for a beginner to follow.

Never give correct=false for a technically sound answer just because it uses different wording.
Output raw JSON only."""


def _gemini_text(prompt: str, max_tokens: int = 256) -> str:
    """Single-turn Gemini call. Returns the text response."""
    response = gemini.models.generate_content(
        model=GEMINI_FLASH,
        contents=prompt,
        config=gtypes.GenerateContentConfig(max_output_tokens=max_tokens),
    )
    return response.text.strip()


def grade_exercise(
    exercise_type: str,
    question: str,
    buggy_code: str | None,
    grading_hints: str,
    student_answer: str,
) -> tuple[str, bool]:
    """Grade a free-text exercise answer using Gemini. Returns (feedback, correct)."""
    code_block = f"\nBuggy code:\n```python\n{buggy_code}\n```\n" if buggy_code else ""
    prompt = (
        f"{EXERCISE_GRADE_SYSTEM}\n\n"
        f"Exercise type: {exercise_type}\n"
        f"Question: {question}{code_block}\n"
        f"What to look for: {grading_hints}\n"
        f"Student answer: {student_answer}\n\nGrade this answer."
    )
    raw = _gemini_text(prompt, max_tokens=256)
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()
    try:
        result = json.loads(raw)
        return result.get("feedback", ""), bool(result.get("correct", False))
    except json.JSONDecodeError:
        return "Couldn't evaluate answer — please try again.", False


def grade_recognition_wrong(
    question: str,
    options: list[str],
    correct_index: int,
    selected_index: int,
) -> str:
    """Explain a wrong MCQ answer in 1-2 sentences using Gemini."""
    prompt = (
        "You are a concise coding tutor. Explain MCQ answers kindly in 1-2 sentences.\n\n"
        f"Question: {question}\n"
        f"Options: {', '.join(f'{i}. {o}' for i, o in enumerate(options))}\n"
        f"Correct: Option {correct_index} — {options[correct_index]}\n"
        f"Student chose: Option {selected_index} — {options[selected_index]}\n\n"
        "In 1-2 sentences explain why the correct answer is right."
    )
    return _gemini_text(prompt, max_tokens=128)


def chat_about_playcard(
    playcard_title: str,
    playcard_content: str,
    user_message: str,
    history: list[dict] | None = None,
) -> str:
    """Answer a student's question about a playcard using Gemini multi-turn."""
    if history is None:
        history = []

    system = PLAYCARD_SYSTEM + f"\n\n## Card: {playcard_title}\n\n{playcard_content}"

    # Build Gemini content list from history (user/assistant → user/model)
    contents: list[gtypes.Content] = []
    for msg in history:
        role = "user" if msg["role"] == "user" else "model"
        contents.append(gtypes.Content(role=role, parts=[gtypes.Part(text=msg["content"])]))
    contents.append(gtypes.Content(role="user", parts=[gtypes.Part(text=user_message)]))

    response = gemini.models.generate_content(
        model=GEMINI_FLASH,
        contents=contents,
        config=gtypes.GenerateContentConfig(
            system_instruction=system,
            max_output_tokens=512,
        ),
    )
    return response.text.strip()
