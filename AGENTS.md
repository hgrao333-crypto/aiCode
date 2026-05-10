# Bodhix — Agent Context

**Product name:** Bodhix (repo: AiCourse)  
**Purpose:** Interactive DSA learning platform — Socratic AI tutor, animated challenges, IncidentLab (SRE simulations), fill-in-the-blank coding exercises.  
**Production URL:** https://sparktuner.online  
**Git user / remote:** hgrao333-crypto → github.com/hgrao333-crypto/aiCode

---

## Quick orientation

```
AiCourse/
├── backend/           FastAPI + SQLAlchemy + SQLite
├── frontend/          Next.js 16 (App Router) + TypeScript + Tailwind v4
├── agents/            Extended reference docs (architecture, API, conventions)
└── AGENTS.md          ← you are here
```

Read [agents/architecture.md](agents/architecture.md) for the full system map.  
Read [agents/courses.md](agents/courses.md) before touching anything in `src/courses/`.  
Read [agents/conventions.md](agents/conventions.md) before writing any code.  
Read [agents/api.md](agents/api.md) for the full API surface.

---

## Local dev

```bash
# Backend  (from backend/)
pip install -r requirements.txt
cp .env.example .env          # fill ANTHROPIC_API_KEY, GEMINI_API_KEY
uvicorn main:app --reload     # http://localhost:8000

# Frontend  (from frontend/)
npm install
npm run dev                   # http://localhost:3000
```

**Critical env var note:** Pydantic Settings loads `.env` but **system env vars override it**. If `GEMINI_API_KEY` is set in `~/.bashrc`, that value wins over `backend/.env`. Always check both when debugging wrong API keys.

**Database:** SQLite file at `backend/app.db`. Schema is auto-created on startup via `models.Base.metadata.create_all()`. No migration tool — add columns directly to models then restart (dev only; coordinate carefully on prod).

**Admin account:** `python create_admin.py` from `backend/`. Admin flag is `User.is_admin = True`.

---

## AI models used

| Model | SDK | Purpose |
|---|---|---|
| `claude-haiku-4-5-20251001` | `anthropic` | Gate questions, answer eval, exercise grading, tutor teaching |
| `gemini-2.5-flash` | `google-genai` | Playcard chat, AI tutor responses (`[ADVANCE]` signals) |
| `gemini-2.5-flash-image` (primary) | `google-genai` | Pre-generate tutor images (admin UI) |
| `gemini-3.1-flash-image-preview` (fallback) | `google-genai` | Same, backup model |

All AI calls live in `backend/socratic_engine.py`. **Never add AI calls outside this file.**

---

## Next.js version warning

This project uses **Next.js 16.2.4 with React 19**. APIs and conventions differ from your training data. Before writing any frontend code, check `frontend/node_modules/next/dist/docs/` for the authoritative API. See [frontend/AGENTS.md](frontend/AGENTS.md).
