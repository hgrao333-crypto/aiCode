const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("logos_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  return res.json();
}

// Auth
export async function register(email: string, password: string) {
  return request<{ access_token: string }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function login(email: string, password: string) {
  const form = new URLSearchParams({ username: email, password });
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Login failed");
  }
  return res.json() as Promise<{ access_token: string }>;
}

export async function getMe() {
  return request<{ id: number; email: string; is_admin: boolean }>("/api/auth/me");
}

// Problems
export interface Problem {
  id: number;
  slug: string;
  title: string;
  description: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  starter_code: string;
  concepts: string[];
  order_index: number;
}

export async function listProblems(topic?: string): Promise<Problem[]> {
  const qs = topic ? `?topic=${topic}` : "";
  return request(`/api/problems/${qs}`);
}

export async function getProblem(slug: string): Promise<Problem & { test_cases: unknown[] }> {
  return request(`/api/problems/${slug}`);
}

// Sessions
export interface RunResponse {
  session_id: number;
  code_result: {
    passed: boolean;
    results: Array<{
      input: unknown;
      expected: unknown;
      actual: unknown;
      passed: boolean;
      error?: string;
    }>;
    error: string | null;
  };
  question: string;
}

export async function runCode(problem_slug: string, code: string): Promise<RunResponse> {
  return request("/api/sessions/run", {
    method: "POST",
    body: JSON.stringify({ problem_slug, code }),
  });
}

export interface XPResult {
  xp_gained: number;
  new_xp: number;
  old_level: number;
  new_level: number;
  streak_days: number;
}

export interface AnswerResponse {
  verdict: "PASS" | "FAIL" | "STUCK";
  follow_up: string;
  teaching: string;
  session_outcome: string;
  xp: XPResult | null;
}

export interface UserStats {
  xp: number;
  level: number;
  xp_in_level: number;
  xp_to_next: number;
  gates_passed: number;
  streak_days: number;
  badges: Array<{ id: string; icon: string; label: string; desc: string }>;
}

export async function getUserStats(): Promise<UserStats> {
  return request("/api/progress/stats");
}

export async function submitAnswer(
  session_id: number,
  answer: string
): Promise<AnswerResponse> {
  return request("/api/sessions/answer", {
    method: "POST",
    body: JSON.stringify({ session_id, answer }),
  });
}

// Progress
export async function getMastery() {
  return request<Array<{ concept: string; score: number; assist_level: string }>>(
    "/api/progress/mastery"
  );
}

// Topics
export interface TopicListItem {
  id: number;
  slug: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  level: number;
  position_in_level: number;
  prerequisites: string[];
  subtopics_total: number;
  subtopics_passed: number;
  unlocked: boolean;
}

export interface CheckpointExercise {
  id: number;
  exercise_type: "recognition" | "debugging" | "variation" | "teach_back";
  question: string;
  options?: string[] | null;
  correct_index?: number | null;
  buggy_code?: string | null;
  explanation?: string | null;
  order_index: number;
}

export interface ExerciseAnswerResult {
  correct: boolean;
  feedback: string;
  explanation?: string | null;
}

export interface PlayCard {
  id: number;
  title: string;
  content: string;
  order_index: number;
  ai_summary?: string | null;
  audio_url?: string | null;
  image_url?: string | null;
  exercises: CheckpointExercise[];
}

export interface SubTopicDetail {
  id: number;
  slug: string;
  title: string;
  description: string;
  order_index: number;
  gate_passed: boolean;
  play_cards: PlayCard[];
  problems: Array<{ id: number; slug: string; title: string; difficulty: string; gate_passed: boolean }>;
}

export interface TopicDetail {
  id: number;
  slug: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  prerequisites: string[];
  videos: Array<{ id: number; title: string; youtube_id: string; order_index: number }>;
  subtopics: SubTopicDetail[];
}

export async function listTopics(course = "main"): Promise<TopicListItem[]> {
  return request(`/api/topics/?course=${course}`);
}

export async function getTopic(slug: string): Promise<TopicDetail> {
  return request(`/api/topics/${slug}`);
}

export async function answerExercise(
  exerciseId: number,
  answer: string,
  selectedIndex?: number | null
): Promise<ExerciseAnswerResult> {
  return request(`/api/topics/exercises/${exerciseId}/answer`, {
    method: "POST",
    body: JSON.stringify({ answer, selected_index: selectedIndex ?? null }),
  });
}

export async function tutorChat(
  slug: string,
  stage: number,
  message: string,
  history: Array<{ role: string; content: string }> = []
): Promise<{ reply: string; advance: boolean }> {
  return request(`/api/topics/${slug}/tutor`, {
    method: "POST",
    body: JSON.stringify({ stage, message, history }),
  });
}

export async function markSubtopicPassed(subtopicId: number): Promise<void> {
  return request(`/api/topics/subtopics/${subtopicId}/mark-passed`, { method: "POST" });
}

export async function chatWithPlaycard(
  playcardId: number,
  message: string,
  history: Array<{ role: string; content: string }> = []
): Promise<{ reply: string }> {
  return request(`/api/topics/playcards/${playcardId}/chat`, {
    method: "POST",
    body: JSON.stringify({ message, history }),
  });
}

// ── Learner progress ──────────────────────────────────────────────────────────

export interface TutorProgressState {
  subtopic_idx: number;
  phase: string;
  completed_subtopics: number[];
}

export async function getTutorProgress(slug: string): Promise<TutorProgressState> {
  return request(`/api/learner/tutor-progress/${slug}`);
}

export async function saveTutorProgress(slug: string, state: TutorProgressState): Promise<void> {
  return request(`/api/learner/tutor-progress/${slug}`, {
    method: "POST",
    body: JSON.stringify(state),
  });
}

export interface LearnerSubtopicEntry {
  slug: string;
  topic_slug: string;
  subtopic_idx: number;
  completed_at: string;
}

export interface LearnerProfileData {
  subtopics: LearnerSubtopicEntry[];
  final_solved: boolean;
  final_solved_at?: string;
}

export async function getLearnerProfile(): Promise<LearnerProfileData> {
  return request("/api/learner/profile");
}

export async function completeSubtopic(topic_slug: string, subtopic_slug: string, subtopic_idx: number): Promise<void> {
  return request("/api/learner/complete-subtopic", {
    method: "POST",
    body: JSON.stringify({ topic_slug, subtopic_slug, subtopic_idx }),
  });
}

export async function completeFinal(): Promise<void> {
  return request("/api/learner/complete-final", { method: "POST" });
}

// ── Incidents (IncidentLab) ───────────────────────────────────────────────────

export interface IncidentWithStage {
  id: number;
  slug: string;
  title: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  domain: string;
  stage: "locked" | "learn" | "quiz" | "play" | "done";
  video_progress: number;
  best_score: number | null;
  badge_earned: boolean;
}

export interface IncidentVideo {
  id: number;
  title: string;
  mux_playback_id: string;
  duration_seconds: number;
  watch_percent: number;
  completed: boolean;
}

export interface IncidentQuestion {
  id: number;
  question: string;
  options: string[];
  explanation?: string | null;
}

export interface IncidentDetail extends IncidentWithStage {
  videos: IncidentVideo[];
  quiz: { id: number; questions: IncidentQuestion[] } | null;
  badge: { id: number; label: string; tagline: string | null; icon_url: string } | null;
}

export interface QuizResult {
  score: number;
  passed: boolean;
  correct_count: number;
  total_count: number;
}

export interface SubmitFixResult {
  passed: boolean;
  score: number;
  checks: Array<{ label: string; ok: boolean; detail?: string }>;
  attempt_id: number;
  badge?: { label: string; icon_url: string } | null;
}

export interface DebriefAttempt {
  id: number;
  score: number;
  solved: boolean;
  hints_used: number;
  elapsed_seconds: number;
  submission: Record<string, string>;
  badge?: { label: string; tagline: string | null; icon_url: string; earned_at: string } | null;
}

export async function listIncidents(): Promise<IncidentWithStage[]> {
  return request("/api/incidents/");
}

export async function getIncidentDetail(slug: string): Promise<IncidentDetail> {
  return request(`/api/incidents/${slug}`);
}

export async function updateVideoProgress(slug: string, videoId: number, watchPercent: number): Promise<void> {
  return request(`/api/incidents/${slug}/video-progress`, {
    method: "POST",
    body: JSON.stringify({ video_id: videoId, watch_percent: watchPercent }),
  });
}

export async function submitQuiz(slug: string, quizId: number, answers: Record<number, number>): Promise<QuizResult> {
  return request(`/api/incidents/${slug}/quiz-attempt`, {
    method: "POST",
    body: JSON.stringify({ quiz_id: quizId, answers }),
  });
}

export async function submitFix(
  slug: string,
  files: Record<string, string>,
  elapsedSeconds: number,
  hintsUsed: number,
  hintsCost: number,
): Promise<SubmitFixResult> {
  return request(`/api/incidents/${slug}/submit-fix`, {
    method: "POST",
    body: JSON.stringify({ files, elapsed_seconds: elapsedSeconds, hints_used: hintsUsed, hints_cost: hintsCost }),
  });
}

export async function getDebrief(slug: string, attemptId?: number): Promise<DebriefAttempt> {
  const qs = attemptId ? `?attempt_id=${attemptId}` : "";
  return request(`/api/incidents/${slug}/debrief${qs}`);
}

export async function demoSkip(slug: string, target: "videos" | "quiz"): Promise<void> {
  return request("/api/incidents/demo-skip", {
    method: "POST",
    body: JSON.stringify({ slug, target }),
  });
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export interface VideoFile { filename: string; size: number }
export interface AdminOverview { topics: number; subtopics: number; playcards: number; problems: number; users: number }
export interface AdminTopic { id: number; slug: string; title: string; description: string; icon: string; color: string; level: number; position_in_level: number; prerequisites: string[]; subtopics_count: number }
export interface AdminPlayCard { id: number; title: string; content: string; order_index: number; ai_summary?: string | null; audio_file?: string | null }
export interface AdminExercise { id: number; playcard_id: number; exercise_type: string; question: string; options?: string[] | null; correct_index?: number | null; buggy_code?: string | null; grading_hints?: string | null; explanation?: string | null; order_index: number }
export interface AdminSubTopic { id: number; slug: string; title: string; description: string; order_index: number; play_cards: AdminPlayCard[]; problems: Array<{ id: number; slug: string; title: string; difficulty: string; order_index: number }> }
export interface AdminTopicDetail extends Omit<AdminTopic, "subtopics_count"> { subtopics: AdminSubTopic[]; videos: Array<{ id: number; title: string; youtube_id: string; order_index: number }> }
export interface AdminProblem { id: number; slug: string; title: string; topic: string; subtopic_id: number | null; difficulty: string; order_index: number; concepts: string[]; description: string; starter_code: string; solution_code: string; test_cases: unknown[] }

export const adminApi = {
  overview: () => request<AdminOverview>("/api/admin/overview"),
  listTopics: () => request<AdminTopic[]>("/api/admin/topics"),
  topicDetail: (id: number) => request<AdminTopicDetail>(`/api/admin/topics/${id}/detail`),
  createTopic: (data: object) => request<{ id: number; slug: string }>("/api/admin/topics", { method: "POST", body: JSON.stringify(data) }),
  updateTopic: (id: number, data: object) => request("/api/admin/topics/" + id, { method: "PUT", body: JSON.stringify(data) }),
  deleteTopic: (id: number) => request("/api/admin/topics/" + id, { method: "DELETE" }),

  listSubtopics: () => request<Array<{ id: number; slug: string; title: string; order_index: number; topic_title: string; topic_slug: string }>>("/api/admin/subtopics"),
  createSubtopic: (data: object) => request<{ id: number }>("/api/admin/subtopics", { method: "POST", body: JSON.stringify(data) }),
  updateSubtopic: (id: number, data: object) => request("/api/admin/subtopics/" + id, { method: "PUT", body: JSON.stringify(data) }),
  deleteSubtopic: (id: number) => request("/api/admin/subtopics/" + id, { method: "DELETE" }),

  createPlaycard: (data: object) => request<{ id: number }>("/api/admin/playcards", { method: "POST", body: JSON.stringify(data) }),
  updatePlaycard: (id: number, data: object) => request("/api/admin/playcards/" + id, { method: "PUT", body: JSON.stringify(data) }),
  deletePlaycard: (id: number) => request("/api/admin/playcards/" + id, { method: "DELETE" }),

  listExercises: (playcardId: number) => request<AdminExercise[]>(`/api/admin/playcards/${playcardId}/exercises`),
  createExercise: (data: object) => request<{ id: number }>("/api/admin/exercises", { method: "POST", body: JSON.stringify(data) }),
  updateExercise: (id: number, data: object) => request("/api/admin/exercises/" + id, { method: "PUT", body: JSON.stringify(data) }),
  deleteExercise: (id: number) => request("/api/admin/exercises/" + id, { method: "DELETE" }),

  createVideo: (data: object) => request<{ id: number }>("/api/admin/videos", { method: "POST", body: JSON.stringify(data) }),
  deleteVideo: (id: number) => request("/api/admin/videos/" + id, { method: "DELETE" }),

  listProblems: () => request<AdminProblem[]>("/api/admin/problems"),
  createProblem: (data: object) => request<{ id: number; slug: string }>("/api/admin/problems", { method: "POST", body: JSON.stringify(data) }),
  updateProblem: (id: number, data: object) => request("/api/admin/problems/" + id, { method: "PUT", body: JSON.stringify(data) }),
  deleteProblem: (id: number) => request("/api/admin/problems/" + id, { method: "DELETE" }),

  getAiConfig: () => request<Record<string, string>>("/api/admin/ai-config"),
  saveAiConfig: (updates: Record<string, string>) => request("/api/admin/ai-config", { method: "PUT", body: JSON.stringify({ updates }) }),

  listVideoFiles: () => request<VideoFile[]>("/api/admin/videos/files"),
  deleteVideoFile: (filename: string) => request(`/api/admin/videos/files/${encodeURIComponent(filename)}`, { method: "DELETE" }),
  uploadVideo: async (file: File): Promise<VideoFile> => {
    const token = getToken();
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${BASE}/api/admin/videos/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!res.ok) { const e = await res.json().catch(() => ({ detail: res.statusText })); throw new Error(e.detail); }
    return res.json();
  },
  listYoutubeVideos: () => request<Array<{ id: number; title: string; youtube_id: string; topic_id: number; order_index: number }>>("/api/admin/videos"),
  getMonitoring: () => request<AdminMonitoring>("/api/admin/monitoring"),
};

export interface AdminMonitoring {
  total_users: number;
  new_users_7d: number;
  new_users_30d: number;
  active_users_7d: number;
  signups_by_day: Array<{ date: string; signups: number }>;
  gate_sessions_total: number;
  gate_sessions_7d: number;
  tutor_by_day: Array<{ date: string; sessions: number }>;
  quiz_attempts_total: number;
  quiz_passed_total: number;
  quiz_attempts_7d: number;
  incidents_started_total: number;
  incidents_solved_total: number;
  incidents_started_7d: number;
  badges_earned_total: number;
  video_completions_total: number;
}
