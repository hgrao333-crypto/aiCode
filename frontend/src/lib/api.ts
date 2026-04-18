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
  return request<{ id: number; email: string }>("/api/auth/me");
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

export interface AnswerResponse {
  verdict: "PASS" | "FAIL" | "STUCK";
  follow_up: string;
  teaching: string;
  session_outcome: string;
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

export interface PlayCard {
  id: number;
  title: string;
  content: string;
  order_index: number;
  ai_summary?: string | null;
  audio_url?: string | null;
}

export interface SubTopicDetail {
  id: number;
  slug: string;
  title: string;
  description: string;
  order_index: number;
  gate_passed: boolean;
  play_cards: PlayCard[];
  problems: Array<{ id: number; slug: string; title: string; difficulty: string }>;
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

export async function listTopics(): Promise<TopicListItem[]> {
  return request("/api/topics/");
}

export async function getTopic(slug: string): Promise<TopicDetail> {
  return request(`/api/topics/${slug}`);
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
