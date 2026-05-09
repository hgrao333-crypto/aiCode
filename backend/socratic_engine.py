"""
Socratic engine — AI calls for the platform.

Anthropic (Claude): gate questions, answer evaluation, teaching (coding problem flow)
Gemini Flash (free): playcard chat, exercise grading, tutor image generation
"""
import base64
import json
import time
from pathlib import Path
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

GATE_SYSTEM = """You are a friendly Socratic coding tutor on a platform called Bodhix.
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

PLAYCARD_SYSTEM = """You are a friendly coding tutor on Bodhix, helping a student understand a concept from a learning card.

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
        config=gtypes.GenerateContentConfig(
            max_output_tokens=max_tokens,
            thinking_config=gtypes.ThinkingConfig(thinking_budget=0),
        ),
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
    1: """You are a Socratic AI tutor — subtopic 1: "The Thief's Choice."
Goal: student discovers (1) greedy fails due to item interactions, (2) 2^n possible selections.
Setup: A(3kg,$5), B(2kg,$3), C(2kg,$3), capacity 4kg. Greedy takes A → $5. Optimal B+C → $6.

Path:
- "Greedy got $5. Can you find a better selection?"
- They find B+C=$6 → "Why couldn't greedy find that? What did taking A do?"
- They explain crowding → "For each item there are two options. What are they?"
- They say take/skip → "With n items each with two choices, how many total selections?"
- They say 2^n → [ADVANCE]

Output rule: ONE sentence of acknowledgment + ONE question. No walkthroughs, no lists.""",

    2: """You are a Socratic AI tutor — subtopic 2: "Overlapping Subproblems."
Goal: student discovers memoisation turns O(2^n) into O(n×W).

Path:
- "Brute force recomputes the same sub-problem many times. What's the simplest fix?"
- They say cache/memo → "Cache what exactly — what's the key and what's the value?"
- They say (i,w)→value → "With n items and capacity W, how many unique (i,w) pairs exist?"
- They say n×W → [ADVANCE]

Output rule: ONE sentence of context + ONE question. Never trace the full recursion tree.""",

    3: """You are a Socratic AI tutor — subtopic 3: "Building the Table."
Goal: student traces bottom-up DP row by row.

Path:
- "Row 0: no items. What's dp[0][w] for every w?"
- They say 0 → "Row 1 is Diamond(7kg,$10). At w=6 can we take it?"
- They say no → "At w=8: take gives dp[0][1]+10=10. dp[1][8]?"
- They say 10 → "Row 2 Gold(5kg,$8). dp[2][8]: skip=10, take=dp[1][3]+8. What's dp[1][3]?"
- They say 0 → "So dp[2][8]=max(10,8)=10. Row 3 Battery(3kg,$5). dp[3][8]?"
- They say 13 → [ADVANCE]

Output rule: ask student to compute ONE next cell. Never write out the full table.""",

    4: """You are a Socratic AI tutor — subtopic 4: "One Row is Enough."
Goal: student understands WHY right-to-left prevents double-counting.

Path:
- "dp[i][w] only reads row i-1. Can we compress to one array updated in place?"
- They say yes → "Left-to-right: we update dp[2] before computing dp[4]. What happened to dp[2]?"
- They say already updated/item counted twice → "That's unbounded knapsack. How do we prevent it?"
- They say right-to-left → "Why does that fix it? What's the state of dp[w-wi] when we reach dp[w]?"
- They say it's still the old value → [ADVANCE]

Reference: item(2kg,$3). Left-to-right → dp[4]=6 (wrong). Right-to-left → dp[4]=3 (correct).
Output rule: ONE sentence summary + ONE question. Never write the full array trace.""",

    5: """You are a Socratic AI tutor — subtopic 5: "Variations."
Goal: student maps Subset Sum and Unbounded Knapsack onto the template.

Path:
- "integers [3,1,5,9,12], can a subset sum to 14? Does this remind you of knapsack?"
- They say yes → "Map it: what's the weight, value, and capacity?"
- They map correctly → "What does dp[n][14] equal if a valid subset exists?"
- They say 14 → "Now items can be reused. Which ONE line in 1D DP changes, and how?"
- They say loop left-to-right → [ADVANCE]

Output rule: ONE sentence of acknowledgment + ONE question.""",
}

# ---------------------------------------------------------------------------
# Arrays & Hashing — topic-specific tutor systems
# ---------------------------------------------------------------------------

AH_TUTOR_SYSTEMS: dict[int, str] = {
    1: """You are a Socratic AI tutor — Arrays & Hashing, stage 1: "Array Fundamentals".
Goal: student discovers (1) why arr[i] access is O(1), (2) why insertion/deletion is O(n).

Path:
- "Here's arr=[10,20,30,40] at base address 1000, each element 4 bytes. How does Python find arr[2] instantly?"
- They mention calculation → "What's the formula? Give me the exact address of arr[2]."
- They say 1008 or base+i*4 → "Great. Now insert 99 at position 0. What has to happen to the existing elements?"
- They say shift/move them → "That shift touches every element. What's the time complexity?"
- They say O(n) → [ADVANCE]

Output rule: ONE sentence of acknowledgment + ONE question. No walkthroughs, no lists.""",

    2: """You are a Socratic AI tutor — Arrays & Hashing, stage 2: "Hash Maps & Sets".
Goal: student understands (1) hash function maps key to index, (2) O(1) average lookup.

Path:
- "A Python dict stores 'apple': 5. How does Python find the value for 'apple' in O(1) — without scanning all keys?"
- They mention hash function → "Walk me through it. What does hash('apple') actually produce?"
- They say an integer / index → "Right. So lookup = compute index, go to that slot. What happens when two keys hash to the same index?"
- They say collision → "Good. Collisions make worst case O(n). Why is the average still O(1)?"
- They explain good hash distribution → [ADVANCE]

Output rule: ONE sentence of acknowledgment + ONE question. Never explain the whole internals at once.""",

    3: """You are a Socratic AI tutor — Arrays & Hashing, stage 3: "The Two-Sum Pattern".
Goal: student discovers the complement-lookup pattern that turns O(n²) into O(n).

Path:
- "[2,7,11,15], target=9. What's the brute-force approach and its complexity?"
- They say nested loops, O(n²) → "Right. For a one-pass solution, what would you need to save as you scan?"
- They say previously seen numbers → "Exactly. For element 7, what do you look up to check if a valid partner exists?"
- They say target - 7 = 2 → "And you look that up in the hash map. What data structure are you using and what does it store?"
- They say {value: index} → [ADVANCE]

Output rule: ONE sentence of acknowledgment + ONE question. Don't give the solution.""",
}

AH_STAGE_OPENERS = [
    "Here's an array [10, 20, 30, 40] stored in memory starting at address 1000, each element taking 4 bytes. You want arr[2]. How does Python find it instantly — without scanning index 0 and 1 first?",
    "A Python dict stores 'apple': 5. When you write d['apple'], Python returns 5 in O(1) — without looping through every key. How?",
    "Array [2, 7, 11, 15], target = 9. Brute force: for every pair (i, j) check if they sum to 9 — that's O(n²). Can you do it in a single pass? What would you need to keep track of?",
]


STAGE_OPENERS = [
    "Let's start with the problem. You have items A(3kg,$5), B(2kg,$3), C(2kg,$3) and a 4kg bag. An easy approach: always take the item with the best value-per-kg. Greedy takes A (ratio 1.67), leaving 1kg — neither B nor C fits. Result: $5. Can you find a better selection?",
    "Greedy fails, so try brute force: check every take-or-skip combination. But in the recursion tree, sub-problems repeat — the call knapsack(items 1-2, capacity 3kg) might appear on dozens of branches. What's the simplest fix for recomputed answers?",
    "Memoization works top-down. Now let's go bottom-up: build a 2D table where dp[i][w] = best value using first i items at capacity w. Start with the base case — the whole first row dp[0][w] = ? (no items, any capacity.)",
    "Our 2D table uses O(n×W) space. But dp[i][w] only ever reads row i-1. Can we compress to a single 1D array dp[w] updated in place? What breaks if we update it left-to-right?",
    "You know 0/1 Knapsack. New problem: given integers [3,1,5,9,12], can any subset sum to exactly 14? Before writing code — does this feel structurally similar to anything you've seen?",
]


# Registry: add new topics here as they're built
TOPIC_TUTOR_SYSTEMS: dict[str, dict[int, str]] = {
    "knapsack":            TUTOR_STAGE_SYSTEMS,
    "dynamic-programming": TUTOR_STAGE_SYSTEMS,
    "arrays-hashing":      AH_TUTOR_SYSTEMS,
}

TOPIC_STAGE_OPENERS: dict[str, list[str]] = {
    "knapsack":            STAGE_OPENERS,
    "dynamic-programming": STAGE_OPENERS,
    "arrays-hashing":      AH_STAGE_OPENERS,
}


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
    """Populate ai_config with hardcoded defaults. Uses slug-scoped keys for all topics."""
    from models import AiConfig as _AiConfig
    defaults: dict[str, str] = {"gemini_model": GEMINI_FLASH}

    # Seed every registered topic with slug-scoped keys
    seeded_slugs: set[str] = set()
    for slug, stage_systems in TOPIC_TUTOR_SYSTEMS.items():
        if slug in seeded_slugs:
            continue
        seeded_slugs.add(slug)
        openers = TOPIC_STAGE_OPENERS.get(slug, STAGE_OPENERS)
        for stage, system in stage_systems.items():
            opener = openers[stage - 1] if stage - 1 < len(openers) else openers[-1]
            defaults[f"{slug}_system_{stage}"] = system
            defaults[f"{slug}_opener_{stage}"] = opener

    for key, value in defaults.items():
        if not db.query(_AiConfig).filter_by(key=key).first():
            db.add(_AiConfig(key=key, value=value))
    db.commit()


_TUTOR_BREVITY_RULE = """
OUTPUT FORMAT (non-negotiable):
- Hard limit: 150 words total (not counting [ADVANCE]).
- After a CORRECT answer: 1 sentence confirming it's right, then 1-2 sentences explaining WHY that insight matters, then ONE follow-up question.
- After a PARTIAL or WRONG answer: 1-2 sentences clarifying the concept clearly (teach the gap), then ONE guiding question.
- You MAY use up to 3 short bullet points to clarify a concept or show a comparison — keep each bullet under 15 words.
- You MAY include ONE short inline code snippet (single line) if it makes the idea clearer.
- NEVER write a full step-by-step array trace (e.g. w=1, w=2, w=3... for every index). Summarise in one sentence instead.
- Always end with exactly ONE question. Nothing after the question mark except [ADVANCE] if earned.
- Do NOT re-explain what the student just said back to them — move the learning forward.
"""


def tutor_respond(
    stage: int,
    message: str,
    history: list[dict] | None = None,
    topic_slug: str = "knapsack",
) -> str:
    """Socratic tutor using Gemini. Returns reply with optional [ADVANCE] token at end."""
    if history is None:
        history = []

    stage_systems = TOPIC_TUTOR_SYSTEMS.get(topic_slug, TUTOR_STAGE_SYSTEMS)
    stage_openers = TOPIC_STAGE_OPENERS.get(topic_slug, STAGE_OPENERS)
    default_system = stage_systems.get(stage, stage_systems.get(1, TUTOR_STAGE_SYSTEMS[1]))
    default_opener = stage_openers[stage - 1] if stage - 1 < len(stage_openers) else stage_openers[-1]

    # All topics use slug-scoped DB keys; falls back to hardcoded default if not seeded yet
    system = _get_ai_config(f"{topic_slug}_system_{stage}", default_system)
    opener = _get_ai_config(f"{topic_slug}_opener_{stage}", default_opener)
    system += f'\n\nYour opening question to the student was:\n"{opener}"'
    system += _TUTOR_BREVITY_RULE

    contents: list[gtypes.Content] = []
    for msg in history:
        role = "user" if msg["role"] == "user" else "model"
        contents.append(gtypes.Content(role=role, parts=[gtypes.Part(text=msg["content"])]))
    contents.append(gtypes.Content(role="user", parts=[gtypes.Part(text=message)]))

    response = _gemini_generate(
        contents=contents,
        config=gtypes.GenerateContentConfig(
            system_instruction=system,
            max_output_tokens=1024,
            thinking_config=gtypes.ThinkingConfig(thinking_budget=0),
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
            max_output_tokens=1024,
            thinking_config=gtypes.ThinkingConfig(thinking_budget=0),
        ),
    )
    return response.text.strip()


# ---------------------------------------------------------------------------
# Tutor image generation (Gemini imagen / flash image gen)
# ---------------------------------------------------------------------------

GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image"
GEMINI_IMAGE_MODEL_FALLBACK = "gemini-3.1-flash-image-preview"

# Storage root: backend/static/tutor-images/{slug}/{stage}/{key}.png
TUTOR_IMAGES_DIR = Path(__file__).parent / "static" / "tutor-images"


def _default_image_prompt(topic_slug: str, stage: int, image_key: str) -> str:
    """Build a sensible prompt when none is supplied."""
    return (
        f"Create a large, bold educational diagram for a computer science course. "
        f"Topic: {topic_slug.replace('-', ' ')}, stage {stage}, concept: {image_key.replace('-', ' ')}. "
        f"IMPORTANT: Fill the ENTIRE canvas with the diagram — extend elements edge-to-edge with only 20px margins. "
        f"Use very large text (minimum 18pt), thick lines, and oversized boxes so every label is easily readable. "
        f"White background, soft colors (greens, blues, grays). No decorative elements, no title header, no empty space."
    )


def generate_tutor_image(
    topic_slug: str,
    stage: int,
    image_key: str,
    prompt: str | None = None,
) -> tuple[Path, str]:
    """
    Generate an educational image via Gemini image-generation model and save it to disk.
    Returns (file_path, base64_data_url).
    Raises ValueError if no image is returned.
    """
    final_prompt = prompt or _default_image_prompt(topic_slug, stage, image_key)

    # Must use the dedicated image-generation model — _gemini_generate uses GEMINI_FLASH which
    # only does text and will error with "response_modalities IMAGE not supported".
    last_error: Exception | None = None
    response = None
    for model in [GEMINI_IMAGE_MODEL, GEMINI_IMAGE_MODEL_FALLBACK]:
        try:
            response = gemini.models.generate_content(
                model=model,
                contents=final_prompt,
                config=gtypes.GenerateContentConfig(
                    response_modalities=["TEXT", "IMAGE"],
                ),
            )
            break
        except Exception as e:
            last_error = e
            continue

    if response is None:
        raise ValueError(f"Image generation failed on all models: {last_error}") from last_error

    image_bytes: bytes | None = None
    for candidate in (response.candidates or []):
        for part in (candidate.content.parts if candidate.content else []):
            inline = getattr(part, "inline_data", None)
            if inline and getattr(inline, "data", None):
                raw = inline.data
                # SDK returns bytes directly; guard against base64 strings just in case
                image_bytes = raw if isinstance(raw, bytes) else base64.b64decode(raw)
                break
        if image_bytes:
            break

    if not image_bytes:
        # Surface any text in the response to help debug content-policy blocks
        text_parts = []
        for cand in (response.candidates or []):
            for p in (cand.content.parts if cand.content else []):
                if hasattr(p, "text") and p.text:
                    text_parts.append(p.text)
        detail = " | ".join(text_parts) if text_parts else "no candidates returned"
        raise ValueError(f"Gemini returned no image for {topic_slug}/{stage}/{image_key}: {detail}")

    out_dir = TUTOR_IMAGES_DIR / topic_slug / str(stage)
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{image_key}.png"
    out_path.write_bytes(image_bytes)

    data_url = "data:image/png;base64," + base64.b64encode(image_bytes).decode()
    return out_path, data_url
