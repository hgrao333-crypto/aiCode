# Course System

The course system follows the **Open/Closed Principle**: adding a new course requires zero changes to any existing file except the registry. Modifying `page.tsx` or `explorer.tsx` to add per-course logic is wrong.

---

## The contract

```typescript
// frontend/src/courses/types.ts
export interface CourseConfig {
  subtopics: SubtopicCfg[];        // one per learning stage, in order
  codingProblems: CodingProblem[];  // one per subtopic, same index alignment
  finalProblem: CodingProblem;      // harder capstone problem
  Visual: ComponentType<{ stage: number }>; // inline reference diagram component
}
```

---

## Adding a new course — 3 steps

### Step 1: Create `frontend/src/courses/<slug>/`

```
src/courses/my-topic/
├── index.ts       export const MyTopicCourse: CourseConfig = { ... }
├── subtopics.ts   export const SUBTOPICS: SubtopicCfg[] = [ ... ]
├── coding.ts      export const CODING_PROBLEMS + FINAL_PROBLEM
└── visual.tsx     export function MyTopicVisual({ stage }) { ... }
```

### Step 2: Register it

```typescript
// frontend/src/courses/index.ts — add two lines only
import { MyTopicCourse } from "./my-topic";

const REGISTRY: Record<string, CourseConfig> = {
  "knapsack":        KnapsackCourse,
  "arrays-hashing":  ArraysHashingCourse,
  "my-topic":        MyTopicCourse,   // ← add this
};
```

### Step 3: Add an interactive explorer

In `frontend/src/app/topics/[slug]/explorer.tsx`, add:
```typescript
function MyTopicExplorer() { /* ... */ }

// At the bottom switch statement:
case "my-topic": return <MyTopicExplorer />;
```

**No other file needs touching.**

---

## SubtopicCfg shape

```typescript
{
  stage: 1,                        // 1-indexed, matches Visual's stage prop
  title: "Stage Title",
  icon: "🔢",
  concepts: ["Concept A", "B"],    // shown in tutor context sidebar
  teachingCards: [                 // shown before AI tutor conversation starts
    {
      text: "**Markdown content**...",
      dbImageKey: "image-key",     // matches TutorImage.image_key in DB
      imageUrl: "/images/fallback.svg",  // used if DB image not found
      imageCaption: "Caption text",
    }
  ],
  opener: "The Socratic opening question sent as first AI tutor message",
  assessment: [                    // 2 questions per stage is the convention
    { type: "mcq", q: "...", options: [...], correct: 1, explanation: "..." },
    { type: "debug", q: "...", code: `...`, explanation: "..." },
    // or: { type: "trace", q: "...", hint: "...", answer: "9", explanation: "..." }
  ],
}
```

**Assessment question types:**
- `mcq`: 4 options, `correct` is 0-indexed. Make distractors plausible — avoid obviously wrong answers.
- `debug`: Show buggy code, student describes bug, then reveal answer. No automated grading.
- `trace`: Student types exact answer (number, keyword). `answer` must match `.trim()` exactly.

---

## CodingProblem shape

```typescript
{
  title: "Problem Title",
  description: "What the student must implement",
  code: `def solution(nums):
    seen = [1]    # [1] and [2] are blanks
    for x in nums:
        if x in seen: [2]
    return False`,
  blanks: [
    { label: "[1]", answer: "set()" },
    { label: "[2]", answer: "return True" },
  ],
  hint: "Hint shown to student if they get stuck",
}
```

Blanks are rendered highlighted in the UI. The student types into a separate answer form — the code display is read-only.

---

## Visual component

```tsx
// "use client" is required at the top of visual.tsx
"use client";

export function MyTopicVisual({ stage }: { stage: number }) {
  if (stage === 1) return <div>...reference diagram for stage 1...</div>;
  if (stage === 2) return <div>...reference diagram for stage 2...</div>;
  return null;
}
```

Keep visuals static (no state, no animations). They are reference diagrams shown alongside the AI tutor conversation, not interactive challenges. Interactive challenges belong in `explorer.tsx`.

---

## Explorer component pattern

Each topic gets one interactive challenge in `explorer.tsx`. Conventions:
- Use Framer Motion for animations (`motion.div`, `AnimatePresence`)
- Use the shared `<InsightBox text="..." />` and `<ResetButton onClick={reset} />` helpers
- Multi-phase state machine: `const [phase, setPhase] = useState<"a" | "b" | "done">("a")`
- User must *do something* — clicking through or watching is not enough
- End with a comparison that makes the algorithm's advantage concrete (e.g., "4 hash lookups vs 15 brute-force pairs")

---

## Backend: seeding a new topic

The DB needs subtopic rows for `markSubtopicPassed` to work. Seed them in a `backend/seed_<topic>.py`:

```python
from database import SessionLocal
import models

def seed():
    db = SessionLocal()
    topic = db.query(models.Topic).filter_by(slug="my-topic").first()
    if not topic:
        topic = models.Topic(slug="my-topic", title="My Topic", ...)
        db.add(topic)
        db.flush()
    if db.query(models.SubTopic).filter_by(topic_id=topic.id).count() == 0:
        for i, title in enumerate(["Stage 1 Title", "Stage 2 Title"]):
            db.add(models.SubTopic(topic_id=topic.id, slug=f"stage-{i+1}", title=title, order_index=i))
    db.commit()
    db.close()
```

Then call `seed()` at the bottom of `backend/main.py` (after the other seeds).

**Subtopic ordering matters:** `SubTopic.order_index` must align with `CourseConfig.subtopics` index (0-based) because `AssessmentTab` matches them by position — `subtopics[idx]` from the DB and `cfg.subtopics[idx]` from the config are paired by index.
