# Architecture

## Backend

```
backend/
├── main.py               App factory: registers routers, mounts static dirs, seeds DB on startup
├── config.py             Pydantic Settings — reads backend/.env (system env vars override)
├── database.py           SQLAlchemy engine + SessionLocal + get_db dependency
├── models.py             All ORM models (single file — see data-models.md)
├── auth.py               JWT helpers: create_token, get_current_user dependency
├── socratic_engine.py    ALL AI calls live here (Anthropic + Gemini)
├── routers/
│   ├── auth.py           POST /api/auth/register, /login, GET /me
│   ├── topics.py         GET/POST /api/topics/* — curriculum, tutor, mark-passed
│   ├── sessions.py       POST /api/sessions/run, /answer — gate session flow
│   ├── progress.py       GET/POST /api/progress/* — tutor progress persistence
│   ├── problems.py       GET /api/problems/*
│   ├── admin.py          /api/admin/* — CRUD for content, tutor images, monitoring
│   ├── learner.py        /api/learner/* — complete-subtopic, complete-final, profile
│   └── incidents.py      /api/incidents/* — IncidentLab flow
├── seed_dsa.py           Seeds arrays-hashing topic + subtopics into DB (idempotent)
├── seed_incidents.py     Seeds incident data (idempotent)
└── seed_knapsack.py      Seeds knapsack topic (idempotent — called at startup)
```

**Router pattern:**
```python
router = APIRouter(prefix="/api/topics", tags=["topics"])

@router.get("/{slug}", response_model=TopicDetail)
def get_topic(slug: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    ...
```
Every protected endpoint uses `Depends(get_current_user)`. Admin-only routes additionally check `current_user.is_admin`.

**Auth flow:** Client sends `Authorization: Bearer <jwt>`. Token payload is `{"sub": user_email}`. Token lives in `localStorage["bodhix_token"]` on the frontend.

---

## Frontend

```
frontend/src/
├── app/                  Next.js App Router pages (all "use client" where needed)
│   ├── page.tsx          Landing page
│   ├── demo/page.tsx     Topic catalog (flowchart view)
│   ├── topics/
│   │   ├── page.tsx      Topic list
│   │   └── [slug]/
│   │       ├── page.tsx      Main topic page — Explore / Learn with AI / Assessment / Videos tabs
│   │       └── explorer.tsx  All interactive animated challenges (one component per topic)
│   ├── problems/[slug]/page.tsx   Gate session (run code → Socratic Q&A)
│   ├── incidents/[slug]/          IncidentLab flow: learn → quiz → playground → debrief
│   ├── admin/                     Admin pages (topics, problems, tutor images, monitoring)
│   └── auth/                      Login / register
├── courses/              Course content module — the primary extension point
│   ├── types.ts          CourseConfig interface + all data types
│   ├── index.ts          Registry: slug → CourseConfig
│   ├── knapsack/         Knapsack course (subtopics, coding, visual)
│   └── arrays-hashing/   Arrays & Hashing course
├── components/
│   ├── ui/               Primitive UI (button, badge, card, tabs...)
│   ├── incident/         IncidentLab-specific components
│   └── playground/       Code editor, terminal, metrics, hint drawer
├── context/AuthContext.tsx   useAuth() hook — user, loading, logout
└── lib/
    ├── api.ts            All HTTP calls to backend (single file)
    └── playground/       Zustand store + incident scenario definitions
```

**Page-level pattern:**
- Pages are `"use client"` components.
- Auth guard: `useEffect(() => { if (!user) router.replace("/auth/login") }, [user])`.
- Data fetching: `useEffect` + API functions from `lib/api.ts`. No server components with data fetching.

**Styling:** Tailwind v4 with a custom design system. Key color tokens:
- `bark-*` — warm gray (text, borders)
- `leaf-*` — green (primary actions)
- `saffron-*` — amber (highlights)
- Do not use raw `gray-*` — always use `bark-*` or `zinc-*` for neutral tones.

**Animations:** Framer Motion (`framer-motion` v12). Use `motion.div` + `AnimatePresence` for enter/exit. Do not add CSS `transition` classes where Framer Motion already handles it.

---

## Topic page tabs

`frontend/src/app/topics/[slug]/page.tsx` renders 4 tabs:

| Tab | Component | Purpose |
|---|---|---|
| Explore | `<TopicExplorer>` → `explorer.tsx` | Animated interactive challenge per topic |
| Learn with AI | `<TutorTab>` | Socratic AI tutor — teaching cards → AI chat → fill-in-blank coding |
| Assessment | `<AssessmentTab>` | Per-subtopic MCQ/debug/trace questions; completing marks subtopic passed |
| Videos | inline | YouTube embeds curated by admin |

`gate_passed` on a subtopic = user completed the Assessment tab questions for that subtopic. The progress bar in the header tracks `subtopics_passed / subtopics_total`.

---

## IncidentLab flow

```
/incidents/                  list of incidents
/incidents/[slug]/learn      watch videos → progress tracked
/incidents/[slug]/quiz       MCQ quiz → must pass to unlock playground
/incidents/[slug]/playground code editor + terminal + AI hints
/incidents/[slug]/debrief    score, badge, solution review
```

Incident definitions are seeded from `backend/seed_incidents.py`. Playground scenarios (simulated environments) are defined in `frontend/src/lib/playground/incidents/`.

---

## Static file serving

Three directories are mounted as static file servers:
- `/audio/playcards/<filename>` — pre-generated playcard audio (MP3)
- `/static/videos/<filename>` — admin-uploaded video files (MP4)
- `/static/tutor-images/<filepath>` — Gemini-generated PNG images for AI tutor

Gemini images are stored in `backend/static/tutor-images/` and referenced by `TutorImage` DB rows.
