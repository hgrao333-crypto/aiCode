"""
Socratic engine — all interactions with the Anthropic API.

Three responsibilities:
1. generate_gate_question  — first question when student clicks Run
2. evaluate_answer         — judge student answer → PASS / FAIL / STUCK + follow-up
3. generate_teaching       — explanation + walkthrough + verification question
"""
import json
from anthropic import Anthropic
from config import settings

client = Anthropic(api_key=settings.anthropic_api_key)

# Haiku for everything — fastest latency, lowest cost
HAIKU = "claude-haiku-4-5-20251001"
SONNET = HAIKU  # teaching also uses Haiku; swap to claude-sonnet-4-6 if quality suffers

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


def chat_about_playcard(
    playcard_title: str,
    playcard_content: str,
    user_message: str,
    history: list[dict] | None = None,
) -> str:
    """Answer a student's question about a specific playcard concept."""
    if history is None:
        history = []

    system = PLAYCARD_SYSTEM + f"\n\n## Card: {playcard_title}\n\n{playcard_content}"
    messages = [*history, {"role": "user", "content": user_message}]

    response = client.messages.create(
        model=HAIKU,
        max_tokens=512,
        system=system,
        messages=messages,
    )
    return response.content[0].text.strip()
