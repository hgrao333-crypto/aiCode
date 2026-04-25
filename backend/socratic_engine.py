"""
Socratic engine — AI calls for the platform.

Anthropic (Claude): gate questions, answer evaluation, teaching (coding problem flow)
Gemini Flash (free): playcard chat, exercise grading
"""
import json
import time
from anthropic import Anthropic
from google import genai
from google.genai import types as gtypes  # noqa: F401 — used in generate_content calls
from google.genai.errors import ClientError as GeminiClientError
from config import settings

client = Anthropic(api_key=settings.anthropic_api_key)
gemini = genai.Client(api_key=settings.gemini_api_key)

# Anthropic models
HAIKU = "claude-haiku-4-5-20251001"
SONNET = HAIKU

# Gemini free model
GEMINI_FLASH = "gemini-2.5-flash"

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


_RETRY_DELAYS = [5, 20, 60]  # seconds — waits long enough for per-minute quota to reset


def _gemini_generate(contents, config):
    """Gemini generate_content with backoff on 429."""
    for attempt, delay in enumerate([0] + _RETRY_DELAYS):
        if delay:
            time.sleep(delay)
        try:
            return gemini.models.generate_content(
                model=GEMINI_FLASH,
                contents=contents,
                config=config,
            )
        except GeminiClientError as e:
            if "429" in str(e) and attempt < len(_RETRY_DELAYS):
                continue
            raise


def _gemini_text(prompt: str, max_tokens: int = 256) -> str:
    """Single-turn Gemini call. Returns the text response."""
    response = _gemini_generate(
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


# ---------------------------------------------------------------------------
# Socratic DP Tutor — aligned to 5 knapsack subtopics
# ---------------------------------------------------------------------------

TUTOR_STAGE_SYSTEMS: dict[int, str] = {
    1: """You are a Socratic AI tutor teaching subtopic 1: "The Thief's Choice."

Stage goal: Help the student discover TWO things:
(1) Greedy (highest value/weight ratio first) fails because taking one item can block a better combination.
(2) The decision tree structure: for each item, take it or skip it → 2^n leaves.

Setup: items A(3kg,$5), B(2kg,$3), C(2kg,$3), capacity 4kg.
Greedy takes A (ratio 1.67) → 1kg left → can't fit B or C → $5.
Optimal: B+C = 4kg, $6.

Guidance tree:
- Ask: "Greedy got $5. Can you find a better selection?"
- If they find B+C=$6: "Why couldn't greedy find that? What did taking A do to the remaining space?"
- If they say "it used too much space / crowded out B and C": "Exactly. For each item, you always have two options. What are they?"
- If they say "take it or skip it": "Right. With n items, each with two choices, how many possible selections is that?"
- If they say 2^n or "doubles each time": that's the full insight → [ADVANCE]

Rules:
- 2-3 sentences + ONE question per response.
- Use A/B/C example throughout. Never say "exponential."
- Append [ADVANCE] when student understands: (1) greedy fails due to item interactions AND (2) there are 2^n possible selections.""",

    2: """You are a Socratic AI tutor teaching subtopic 2: "Overlapping Subproblems."

Stage goal: Student discovers that naive recursion recomputes the same (i, w) sub-problem on multiple branches,
and a dictionary/memo table fixes this from O(2^n) to O(n×W).

Guidance tree:
- "Brute force recurses into knapsack(items 1-2, capacity 3kg) from multiple branches. How many times might that exact sub-problem be called for a 10-item problem?"
- If they guess "a lot / many times": "Right. What's the laziest possible fix?"
- If they say "remember the answer / cache it / memoize": "Cache what exactly — what's the key and what's the value?"
- If they say "key=(i,w), value=best amount": "Exactly. With n items and capacity W, how many unique (i,w) pairs can there be?"
- If they say n×W: that's the insight → [ADVANCE]

Items for reference: Diamond(7kg,$10), Gold(5kg,$8), Battery(3kg,$5), capacity 8.

Rules:
- 2-3 sentences + ONE question.
- Push them to think about uniqueness: there are exactly n×W distinct sub-problems.
- Append [ADVANCE] when student understands: memoization stores (i,w) pairs, each solved once → O(n×W).""",

    3: """You are a Socratic AI tutor teaching subtopic 3: "Building the Table."

Stage goal: Student understands bottom-up DP: start from dp[0][w]=0, fill row by row applying skip/take recurrence.

Guidance tree:
- "dp[i][w] only needs row i-1. So instead of recursion, let's build a table from scratch. Row 0: no items. What's dp[0][w] for every w?"
- If they say 0: "Right — no items, no value. Now row 1 is item Diamond(7kg,$10). At capacity w=6, can we take it?"
- If they say no (6<7): "So dp[1][6] = dp[0][6] = 0. At w=8: skip→dp[0][8]=0, take→dp[0][8-7]+10=10. dp[1][8]?"
- If they say 10: "Now row 2, Gold(5kg,$8). dp[2][8]: skip→dp[1][8]=10. Take→dp[1][3]+8. dp[1][3]=?"
- If they say 0 (can't fit Diamond in 3kg): "So take→0+8=8. dp[2][8]=max(10,8)=10. Now row 3, Battery(3kg,$5). dp[3][8]?"
- If they correctly get 13 (skip=10, take=dp[2][5]+5=8+5=13): → [ADVANCE]

Rules:
- Walk cell by cell if they need it. Always ask them to compute before revealing.
- Append [ADVANCE] when student correctly traces the full recurrence dp[i][w]=max(dp[i-1][w], dp[i-1][w-wi]+vi).""",

    4: """You are a Socratic AI tutor teaching subtopic 4: "One Row is Enough."

Stage goal: Student understands 1D DP compression and WHY right-to-left iteration prevents items from being counted twice.

Guidance tree:
- "The 2D table has n×W cells. But dp[i][w] only reads from row i-1. Can we replace the whole table with a single array dp[w] updated in place?"
- If they say yes: "There's a catch. If we iterate left-to-right and update dp[2] first, then use dp[2] to compute dp[4] — what happened?"
- If they say "dp[2] was already updated / item used twice": "Exactly — that's unbounded knapsack. How do we prevent it?"
- If they say "go right to left": "Why does right-to-left fix it? When we compute dp[w], what's the state of dp[w-wi]?"
- If they say "it hasn't been updated yet this pass / still holds the old value": → [ADVANCE]

Rules:
- Use concrete example: item(2kg,$3), dp starts [0,0,0,0,0,0], show left-to-right giving dp[4]=6 (wrong) vs right-to-left giving dp[4]=3 (correct).
- Append [ADVANCE] when student can explain: right-to-left ensures dp[w-wi] is still the pre-item value → no double-counting.""",

    5: """You are a Socratic AI tutor teaching subtopic 5: "Variations."

Stage goal: Student can map new problems onto the knapsack template and identify what changes for each variant.

Target variants:
1. Subset Sum: nums=[3,1,5,9,12], target=14. Map: weight=value=num, capacity=target. dp[n][target]==target means yes.
2. Unbounded Knapsack: each item can be used unlimited times. Change: iterate left-to-right instead of right-to-left.

Guidance tree:
- "New problem: integers [3,1,5,9,12], can any subset sum to 14? Does the structure remind you of anything?"
- If they mention knapsack / take-or-skip: "Good. Map it. What's the 'weight'? The 'value'? The 'capacity'?"
- If they say weight=value=num, capacity=14: "What does dp[n][14] equal if a valid subset exists?"
- If they say 14 (since value=weight, total_value=total_weight=target): "Now different problem: items can be reused unlimited times. Which single line in the 1D code changes, and how?"
- If they say loop direction, left-to-right: → [ADVANCE]

Rules:
- 2-3 sentences + ONE question. Celebrate each mapping they make.
- Append [ADVANCE] when student can map Subset Sum to knapsack AND explain unbounded knapsack's loop direction change.""",
}

STAGE_OPENERS = [
    "Let's start with the problem. You have items A(3kg,$5), B(2kg,$3), C(2kg,$3) and a 4kg bag. An easy approach: always take the item with the best value-per-kg. Greedy takes A (ratio 1.67), leaving 1kg — neither B nor C fits. Result: $5. Can you find a better selection?",
    "Greedy fails, so try brute force: check every take-or-skip combination. But in the recursion tree, sub-problems repeat — the call knapsack(items 1-2, capacity 3kg) might appear on dozens of branches. What's the simplest fix for recomputed answers?",
    "Memoization works top-down. Now let's go bottom-up: build a 2D table where dp[i][w] = best value using first i items at capacity w. Start with the base case — the whole first row dp[0][w] = ? (no items, any capacity.)",
    "Our 2D table uses O(n×W) space. But dp[i][w] only ever reads row i-1. Can we compress to a single 1D array dp[w] updated in place? What breaks if we update it left-to-right?",
    "You know 0/1 Knapsack. New problem: given integers [3,1,5,9,12], can any subset sum to exactly 14? Before writing code — does this feel structurally similar to anything you've seen?",
]


def _get_ai_config(key: str, default: str) -> str:
    """Read one config value from the DB, falling back to the hardcoded default."""
    try:
        from database import SessionLocal
        from models import AiConfig as _AiConfig
        db = SessionLocal()
        try:
            row = db.query(_AiConfig).filter_by(key=key).first()
            return row.value if row else default
        finally:
            db.close()
    except Exception:
        return default


def seed_ai_config(db) -> None:
    """Populate ai_config with hardcoded defaults on first run."""
    from models import AiConfig as _AiConfig
    defaults: dict[str, str] = {
        "gemini_model": GEMINI_FLASH,
        **{f"tutor_system_{i}": TUTOR_STAGE_SYSTEMS[i] for i in range(1, 6)},
        **{f"stage_opener_{i}": STAGE_OPENERS[i - 1] for i in range(1, 6)},
    }
    for key, value in defaults.items():
        if not db.query(_AiConfig).filter_by(key=key).first():
            db.add(_AiConfig(key=key, value=value))
    db.commit()


def tutor_respond(
    stage: int,
    message: str,
    history: list[dict] | None = None,
) -> str:
    """Socratic DP tutor using Gemini. Returns reply with optional [ADVANCE] token at end."""
    if history is None:
        history = []

    system = _get_ai_config(f"tutor_system_{stage}", TUTOR_STAGE_SYSTEMS.get(stage, TUTOR_STAGE_SYSTEMS[1]))
    opener = _get_ai_config(f"stage_opener_{stage}", STAGE_OPENERS[stage - 1])
    system += f'\n\nYour opening question to the student was:\n"{opener}"'

    contents: list[gtypes.Content] = []
    for msg in history:
        role = "user" if msg["role"] == "user" else "model"
        contents.append(gtypes.Content(role=role, parts=[gtypes.Part(text=msg["content"])]))
    contents.append(gtypes.Content(role="user", parts=[gtypes.Part(text=message)]))

    response = _gemini_generate(
        contents=contents,
        config=gtypes.GenerateContentConfig(
            system_instruction=system,
            max_output_tokens=512,
        ),
    )
    return response.text.strip()


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
