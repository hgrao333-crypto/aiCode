# Conventions & Rules

## Frontend

### Do not break these patterns

**Auth guard** — every protected page must have this exact pattern at the top:
```typescript
const { user, loading: authLoading, logout } = useAuth();
useEffect(() => {
  if (!authLoading && !user) router.replace("/auth/login");
}, [user, authLoading, router]);
```

**API calls** — all HTTP calls go through `src/lib/api.ts`. Never call `fetch` directly in a page component. If a new endpoint is needed, add a typed function to `api.ts` first.

**Course content** — all course data (subtopics, coding problems, visuals) lives in `src/courses/<slug>/`. Never hardcode course content in `page.tsx` or `explorer.tsx`. Adding a course = new folder + two-line registry change. See [courses.md](courses.md).

**Styling** — use the design system tokens, not raw Tailwind color names:
- Text/borders → `bark-*` or `zinc-*`
- Primary green → `leaf-*`
- Accent amber → `saffron-*`
- Interactive highlights → `sky-*`
- Success/pass states → `emerald-*`
- Never use `gray-*`

**Framer Motion** — import from `framer-motion` (v12). Use `motion.div` for animations and `AnimatePresence` for conditional enter/exit. Don't mix Framer Motion elements with CSS `transition` classes on the same property.

### TypeScript

- `"use client"` is required on any file using hooks, event handlers, or browser APIs.
- Page components are always `export default function PageName()` (no async for client pages).
- Shared types go in `src/courses/types.ts` (for course data) or `src/lib/api.ts` (for API shapes). Don't duplicate type definitions.
- Discriminated unions for multi-phase state: `useState<"learn" | "assess" | "done">("learn")`.

### Component conventions

- Shared small helpers (e.g., `InsightBox`, `ResetButton`) stay at the top of the file that first defines them.
- Don't create new files for components used in only one place.
- Explorer challenges are self-contained functions in `explorer.tsx` — no props, state lives locally, dispatched by the `case` switch at the bottom.

---

## Backend

### AI calls

All AI calls belong in `backend/socratic_engine.py`. Pattern:
```python
def my_feature(input: str) -> str:
    response = client.messages.create(
        model=HAIKU,
        max_tokens=500,
        system="...",
        messages=[{"role": "user", "content": input}],
    )
    return response.content[0].text
```

Use `HAIKU` constant for all Anthropic calls (currently `claude-haiku-4-5-20251001`). `SONNET` is aliased to `HAIKU` for cost reasons — don't change to a heavier model without discussing.

Use `GEMINI_FLASH` (`gemini-2.5-flash`) for Gemini text calls. Image generation uses `GEMINI_IMAGE_MODEL` with `GEMINI_IMAGE_MODEL_FALLBACK` — never call image generation models by literal string.

### Routers

Each router file owns one resource domain. Prefix is set at the router level, not on individual endpoints. All endpoints return Pydantic models (define `class XOut(BaseModel)` in the same file).

Never import one router from another — share logic through `socratic_engine.py` or `models.py`.

### Database

- Schema changes: add column to the model class. SQLite will not auto-migrate existing rows. For non-nullable columns, always provide a `default=`. Restart the server; the column appears in new rows only (SQLite limitation in this setup).
- Seed scripts are idempotent — always guard with `.count() == 0` or `.first() is not None` checks before inserting.
- Sessions: use `Depends(get_db)`, always let FastAPI manage commit/rollback. Don't manually call `db.close()` inside a router function.
- Relationships: SQLAlchemy lazy-loads. Access `topic.subtopics` inside a request handler while the session is open; don't pass ORM objects across session boundaries.

---

## Critical do-nots

| Don't | Why |
|---|---|
| Hardcode course data in `page.tsx` | Breaks the Open/Closed pattern; was refactored out |
| Add AI calls outside `socratic_engine.py` | Single place for all AI logic, rate limits, model constants |
| Use `gray-*` Tailwind classes | Design system uses `bark-*`/`zinc-*` — inconsistent look |
| Call `fetch` directly in pages | Must go through `lib/api.ts` for auth header injection |
| Export from `REGISTRY` in `courses/index.ts` | Only `getCourseConfig(slug)` is the public interface |
| Add `force-dynamic` or `revalidate = 0` to pages | All pages are already client-side rendered |
| Use `db.close()` in router handlers | FastAPI's `Depends(get_db)` handles session lifecycle |
| Store secrets in frontend `.env.local` | Only `NEXT_PUBLIC_*` vars are safe; secret keys go in `backend/.env` |
| Add non-nullable columns without defaults | SQLite won't backfill existing rows; server will crash on load |

---

## Git conventions

- Commit message: short imperative summary + body explaining *why* not *what*
- Always `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>` when Claude writes the commit
- One logical change per commit — don't bundle unrelated fixes
- Run `npx tsc --noEmit` from `frontend/` before committing to catch type errors
- Remote: `origin` = `github.com/hgrao333-crypto/aiCode`, branch `main`
