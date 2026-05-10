# API Reference

Base URL: `http://localhost:8000` (dev) / `https://sparktuner.online` (prod)  
All endpoints require `Authorization: Bearer <jwt>` except `/api/auth/register` and `/api/auth/login`.  
All request/response bodies are JSON unless noted.

---

## Auth

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/api/auth/register` | `{email, password}` | `{access_token}` |
| POST | `/api/auth/login` | form-encoded `{username, password}` | `{access_token}` |
| GET | `/api/auth/me` | — | `{id, email, is_admin}` |

Token is a JWT with 7-day expiry. Store in `localStorage["bodhix_token"]`.

---

## Topics (curriculum)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/topics/?course=main` | List all topics with unlock status and progress |
| GET | `/api/topics/{slug}` | Topic detail: subtopics + playcards + videos + gate_passed per subtopic |
| GET | `/api/topics/{slug}/tutor-images/{stage}` | Pre-generated images for AI tutor at this stage |
| POST | `/api/topics/{slug}/tutor` | `{stage, message, history[]}` → `{reply, advance}` — Gemini chat; `advance=true` means move to next phase |
| POST | `/api/topics/subtopics/{id}/mark-passed` | Mark subtopic gate_passed=true for current user |
| POST | `/api/topics/exercises/{id}/answer` | `{answer?, selected_index?}` → `{correct, feedback, explanation}` |
| POST | `/api/topics/playcards/{id}/chat` | `{message, history[]}` → `{reply}` — AI chat about a playcard |

**Topic unlock logic:** A topic unlocks when every subtopic of every prerequisite topic is `gate_passed`. Prerequisites are `Topic.prerequisites` (list of topic slugs).

---

## Gate sessions (coding problems)

| Method | Path | Notes |
|---|---|---|
| POST | `/api/sessions/run` | `{problem_slug, code}` → `{session_id, code_result{passed, results[]}, question}` |
| POST | `/api/sessions/answer` | `{session_id, answer}` → `{verdict, follow_up, teaching, session_outcome, xp}` |
| GET | `/api/sessions/{id}` | Session detail |

Flow: run code → if tests pass → Socratic question → answer → verdict (PASS/FAIL/STUCK) → up to 4 turns → teaching + outcome.

---

## Progress / Tutor

| Method | Path | Notes |
|---|---|---|
| GET | `/api/progress/tutor/{slug}` | `{subtopic_idx, phase, completed_subtopics[]}` — resume tutor session |
| POST | `/api/progress/tutor/{slug}` | `{subtopic_idx, phase, completed_subtopics[]}` — save tutor session state |

---

## Learner

| Method | Path | Notes |
|---|---|---|
| POST | `/api/learner/complete-subtopic` | `{slug, subtopic_slug, subtopic_idx}` — marks coding exercise complete |
| POST | `/api/learner/complete-final` | Marks final challenge complete |
| GET | `/api/learner/profile` | LearnerProfile JSON blob |
| GET | `/api/learner/stats` | `{xp, level, xp_in_level, xp_to_next, gates_passed, streak_days}` |

---

## Problems

| Method | Path | Notes |
|---|---|---|
| GET | `/api/problems/` | List all problems (optional `?topic=`) |
| GET | `/api/problems/{slug}` | Problem detail with test_cases |

---

## Incidents (IncidentLab)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/incidents/` | List with user stage (locked/learn/quiz/play/done) |
| GET | `/api/incidents/{slug}` | Detail: videos, quiz questions, badge |
| POST | `/api/incidents/{slug}/video-progress` | `{video_id, watch_percent}` |
| POST | `/api/incidents/{slug}/quiz-attempt` | `{quiz_id, answers{q_id: idx}}` → `{score, passed, correct_count, total_count}` |
| POST | `/api/incidents/{slug}/submit-fix` | `{files{path:content}, elapsed_seconds, hints_used, hints_cost}` → `{passed, score, checks[], badge?}` |
| GET | `/api/incidents/{slug}/debrief` | `?attempt_id=` optional → `{score, solved, hints_used, badge?}` |
| POST | `/api/incidents/demo-skip` | `{slug, target:"videos"|"quiz"}` — dev/demo shortcut |

---

## Admin (requires is_admin=true)

All under `/api/admin/`.

| Area | Endpoints |
|---|---|
| Overview | GET `/overview` |
| Topics | GET/POST `/topics`, GET/PUT/DELETE `/topics/{id}`, GET `/topics/{id}/detail` |
| Subtopics | GET/POST `/subtopics`, PUT/DELETE `/subtopics/{id}` |
| Playcards | POST `/playcards`, PUT/DELETE `/playcards/{id}`, GET `/playcards/{id}/exercises` |
| Exercises | POST `/exercises`, PUT/DELETE `/exercises/{id}` |
| Problems | GET/POST `/problems`, PUT/DELETE `/problems/{id}` |
| Videos (YouTube) | GET/POST `/videos`, DELETE `/videos/{id}` |
| Videos (upload) | GET `/videos/files`, POST `/videos/upload`, DELETE `/videos/files/{name}` |
| AI Config | GET/PUT `/ai-config` |
| Tutor Images | GET `/tutor-images`, POST `/tutor-images/generate`, PUT `/tutor-images/{id}`, DELETE `/tutor-images/{id}` |
| Monitoring | GET `/monitoring` |

---

## Static files (no auth)

- `GET /audio/playcards/{filename}` — playcard MP3 audio
- `GET /static/videos/{filename}` — uploaded MP4 videos
- `GET /static/tutor-images/{filepath}` — Gemini-generated PNG images

---

## Frontend API client

All calls go through `frontend/src/lib/api.ts`. The `request<T>()` helper injects the Bearer token automatically. To add a new endpoint:

```typescript
export async function myNewCall(param: string): Promise<MyResponseType> {
  return request<MyResponseType>(`/api/my-endpoint/${param}`);
}
```

Never call `fetch` directly in page/component code.
