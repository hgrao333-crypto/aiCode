<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Frontend-specific agent context

**Full repo context:** See [`../AGENTS.md`](../AGENTS.md) and the [`../agents/`](../agents/) directory.

## Stack (exact versions)
- Next.js **16.2.4** + React **19.2.4** — App Router, all pages are client components
- TypeScript 5, Tailwind v4 (PostCSS plugin), Framer Motion 12
- No server components with data fetching; all data comes via `useEffect` + `src/lib/api.ts`

## Before writing any frontend code
1. Read `node_modules/next/dist/docs/` for current API (training data is stale)
2. Read [`../agents/conventions.md`](../agents/conventions.md) for styling and component rules
3. Read [`../agents/courses.md`](../agents/courses.md) before touching `src/courses/`
4. Run `npx tsc --noEmit` after changes to catch type errors before commit

## Key files at a glance
| File | Purpose |
|---|---|
| `src/lib/api.ts` | All backend calls — add new endpoints here, never call fetch directly |
| `src/courses/types.ts` | CourseConfig interface — the extension contract |
| `src/courses/index.ts` | Course registry — only place to register a new course |
| `src/app/topics/[slug]/page.tsx` | Topic page: Explore / Learn with AI / Assessment / Videos |
| `src/app/topics/[slug]/explorer.tsx` | Interactive animated challenges per topic |
| `src/context/AuthContext.tsx` | useAuth() — user, loading, logout |
