# Data Models

All ORM models are in `backend/models.py`. Database: SQLite (`backend/app.db`). ORM: SQLAlchemy 2.0.

---

## Curriculum

```
Topic  (1) ──< (N) SubTopic  (1) ──< (N) PlayCard  (1) ──< (N) CheckpointExercise
Topic  (1) ──< (N) YoutubeVideo
SubTopic (1) ──< (N) Problem
```

**Topic**
- `slug` — URL-safe unique key (e.g. `"arrays-hashing"`, `"knapsack"`)
- `course` — `"main"` | `"demo"` — filters on `GET /api/topics/?course=`
- `prerequisites` — JSON list of topic slugs; empty = always unlocked
- `level`, `position_in_level` — flowchart layout coordinates

**SubTopic**
- `order_index` — must align with `CourseConfig.subtopics` array index (0-based)
- `slug` — used in `completeSubtopic()` call from TutorTab

**PlayCard** — markdown flashcard with optional AI audio + image  
**CheckpointExercise** — attached to PlayCard; types: `recognition` | `debugging` | `variation` | `teach_back`

---

## User & Progress

```
User (1) ──< (N) MasteryRecord
User (1) ──< (N) GateSession ──< (N) TurnLog
User (1) ──< (N) UserSubTopicProgress
User (1) ── (1) UserStats
User (1) ── (1) TutorProgress (per topic slug)
User (1) ── (1) LearnerProfile
```

**UserSubTopicProgress** — `{user_id, subtopic_id, gate_passed: bool}`  
- Set to `true` when user completes Assessment tab questions for a subtopic  
- Drives the topic progress bar and unlock logic

**TutorProgress** — persists TutorTab state between sessions  
- `phase`: `"learning"` | `"assessment"` | `"coding"` | `"final"` | `"done"`  
- `completed_subtopics`: list of completed subtopic indices

**UserStats** — XP, level, streak  
- `XP_PER_PASS = 100`, `XP_PER_PASS_ASSISTED = 50`, `XP_PER_LEVEL = 200`
- Level = `xp // 200 + 1`

**GateSession** — one coding problem attempt  
- `outcome`: `"PASS"` | `"FAIL"` | `"STUCK"` | `null` (in progress)
- Max 4 turns (controlled by `MAX_TURNS = 4` in socratic_engine.py)

---

## AI Config

**AiConfig** — key-value store for AI prompt strings, editable in admin UI  
Keys are seeded by `socratic_engine.seed_ai_config()` on startup if absent.

**TutorImage** — pre-generated PNG images for the AI tutor  
- `topic_slug` + `stage` + `image_key` = unique triple  
- `file_path` is relative to `backend/static/tutor-images/`  
- `image_key` matches `TeachingCard.dbImageKey` in the course config

---

## IncidentLab

```
Incident (1) ──< (N) IncidentVideo
Incident (1) ── (1) IncidentQuiz ──< (N) IncidentQuizQuestion
Incident (1) ── (1) IncidentBadge
User ──< UserVideoProgress, UserQuizAttempt, UserIncidentAttempt, UserIncidentBadge
```

**Incident stage logic** (computed in router, not stored):
1. `locked` — prerequisites not met (not currently enforced)
2. `learn` — no videos completed at ≥80%
3. `quiz` — videos done, quiz not passed
4. `play` — quiz passed, no attempt
5. `done` — has a passing attempt

---

## Key queries to know

```python
# Is a subtopic passed for a user?
db.query(UserSubTopicProgress).filter_by(user_id=uid, subtopic_id=sid, gate_passed=True).first()

# All subtopics passed for a topic
passed_ids = {r.subtopic_id for r in db.query(UserSubTopicProgress).filter(
    UserSubTopicProgress.user_id == uid,
    UserSubTopicProgress.gate_passed == True,
)}

# Topic unlock check
topic.prerequisites → list of slugs → count subtopics → count passed → all must match

# Latest gate session for a user+problem
db.query(GateSession).filter_by(user_id=uid, problem_id=pid).order_by(GateSession.id.desc()).first()
```
