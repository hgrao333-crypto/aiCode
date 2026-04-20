"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { getTopic, getUserStats, chatWithPlaycard, answerExercise, TopicDetail, SubTopicDetail, PlayCard, CheckpointExercise, ExerciseAnswerResult, UserStats } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// ─── Tab types ────────────────────────────────────────────────────────────────

type Tab = "videos" | "learn" | "problems";

// ─── YouTube embed ─────────────────────────────────────────────────────────────

function YouTubeEmbed({ youtubeId, title }: { youtubeId: string; title: string }) {
  return (
    <div className="rounded-lg overflow-hidden border border-gray-800 bg-gray-900">
      <div className="aspect-video w-full">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="w-full h-full"
        />
      </div>
      <div className="px-3 py-2 text-sm text-gray-300">{title}</div>
    </div>
  );
}

// ─── Audio player ─────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const SPEEDS = [1, 1.5, 2] as const;
type Speed = typeof SPEEDS[number];

function AudioPlayer({ audioUrl, onEnded, autoPlay }: { audioUrl: string; onEnded?: () => void; autoPlay?: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState<Speed>(1);

  useEffect(() => {
    if (autoPlay && audioRef.current) {
      audioRef.current.play().catch(() => {/* autoplay blocked — user must click */});
    }
  }, [autoPlay, audioUrl]);

  const toggle = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    playing ? el.pause() : el.play();
  }, [playing]);

  const cycleSpeed = useCallback(() => {
    const el = audioRef.current;
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    setSpeed(next);
    if (el) el.playbackRate = next;
  }, [speed]);

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700">
      <audio
        ref={audioRef}
        src={`${BASE_URL}${audioUrl}`}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setProgress(0); onEnded?.(); }}
        onTimeUpdate={() => {
          const el = audioRef.current;
          if (el && el.duration) setProgress(el.currentTime / el.duration);
        }}
      />
      <button onClick={toggle}
        className="w-7 h-7 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white text-xs shrink-0 transition-colors"
        title={playing ? "Pause" : "Play summary"}>
        {playing ? "⏸" : "▶"}
      </button>
      <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-400 rounded-full transition-all" style={{ width: `${progress * 100}%` }} />
      </div>
      <button onClick={cycleSpeed}
        className="text-xs font-mono px-2 py-0.5 rounded border border-gray-600 text-gray-400 hover:border-indigo-500 hover:text-indigo-300 transition-colors shrink-0 w-10 text-center"
        title="Cycle playback speed">
        {speed}x
      </button>
    </div>
  );
}

// ─── Exercise renderers ───────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  recognition: "Pattern Recognition",
  debugging: "Debug the Code",
  variation: "What If?",
  teach_back: "Teach It Back",
};
const TYPE_COLORS: Record<string, string> = {
  recognition: "text-blue-400 border-blue-800 bg-blue-950/40",
  debugging: "text-red-400 border-red-800 bg-red-950/40",
  variation: "text-purple-400 border-purple-800 bg-purple-950/40",
  teach_back: "text-amber-400 border-amber-800 bg-amber-950/40",
};

function ExerciseCard({
  exercise,
  onContinue,
}: {
  exercise: CheckpointExercise;
  onContinue: () => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [result, setResult] = useState<ExerciseAnswerResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      const res = await answerExercise(exercise.id, textAnswer, selectedIndex);
      setResult(res);
    } finally {
      setSubmitting(false);
    }
  }

  const typeStyle = TYPE_COLORS[exercise.exercise_type] ?? "text-gray-400 border-gray-700";
  const canSubmit = exercise.exercise_type === "recognition"
    ? selectedIndex !== null
    : textAnswer.trim().length > 0;

  return (
    <div className={`rounded-xl border p-5 space-y-4 ${typeStyle}`}>
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider opacity-80">
          {TYPE_LABELS[exercise.exercise_type] ?? exercise.exercise_type}
        </span>
      </div>

      <p className="text-white font-medium text-sm leading-relaxed">{exercise.question}</p>

      {/* Debugging: show buggy code */}
      {exercise.exercise_type === "debugging" && exercise.buggy_code && (
        <pre className="bg-gray-950 border border-gray-800 rounded-lg p-3 text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap font-mono">
          {exercise.buggy_code}
        </pre>
      )}

      {/* Recognition: radio options */}
      {exercise.exercise_type === "recognition" && exercise.options && !result && (
        <div className="space-y-2">
          {exercise.options.map((opt, i) => (
            <button key={i} onClick={() => setSelectedIndex(i)}
              className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                selectedIndex === i
                  ? "border-indigo-500 bg-indigo-950 text-white"
                  : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"
              }`}>
              <span className="text-gray-500 mr-2">{String.fromCharCode(65 + i)}.</span>{opt}
            </button>
          ))}
        </div>
      )}

      {/* Free-text: debugging / variation / teach_back */}
      {exercise.exercise_type !== "recognition" && !result && (
        <textarea
          className="w-full bg-gray-900 border border-gray-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none resize-none"
          rows={exercise.exercise_type === "teach_back" ? 5 : 3}
          value={textAnswer}
          onChange={e => setTextAnswer(e.target.value)}
          placeholder={
            exercise.exercise_type === "debugging" ? "Describe the bug and why it causes incorrect output…" :
            exercise.exercise_type === "variation" ? "Think through this change and explain your reasoning…" :
            "Explain this concept as if talking to someone new to programming…"
          }
        />
      )}

      {/* Submit button */}
      {!result && (
        <button onClick={submit} disabled={submitting || !canSubmit}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm rounded-lg transition-colors font-medium">
          {submitting ? "Checking…" : "Submit"}
        </button>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-3">
          {/* Show selected option for recognition */}
          {exercise.exercise_type === "recognition" && exercise.options && (
            <div className="space-y-1">
              {exercise.options.map((opt, i) => {
                const isCorrect = i === exercise.correct_index;
                const isSelected = i === selectedIndex;
                return (
                  <div key={i} className={`px-3 py-2 rounded-lg text-sm border ${
                    isCorrect ? "border-green-700 bg-green-950 text-green-300" :
                    isSelected && !isCorrect ? "border-red-700 bg-red-950 text-red-300" :
                    "border-gray-800 text-gray-500"
                  }`}>
                    <span className="mr-2">{String.fromCharCode(65 + i)}.</span>{opt}
                    {isCorrect && <span className="ml-2">✓</span>}
                    {isSelected && !isCorrect && <span className="ml-2">✗</span>}
                  </div>
                );
              })}
            </div>
          )}

          <div className={`flex items-start gap-2 p-3 rounded-lg ${result.correct ? "bg-green-950 border border-green-800" : "bg-orange-950 border border-orange-800"}`}>
            <span className="text-lg">{result.correct ? "✓" : "~"}</span>
            <p className="text-sm text-gray-200">{result.feedback}</p>
          </div>

          {result.explanation && (
            <div className="p-3 rounded-lg bg-gray-900 border border-gray-700">
              <p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wide">Explanation</p>
              <p className="text-sm text-gray-300">{result.explanation}</p>
            </div>
          )}

          <button onClick={onContinue}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors font-medium">
            Continue →
          </button>
        </div>
      )}
    </div>
  );
}

// ─── PlayCard viewer ──────────────────────────────────────────────────────────

interface ChatMsg { role: "user" | "assistant"; content: string }

function PlayCardPanel({
  subtopic,
  allSubtopics,
  onSubtopicChange,
}: {
  subtopic: SubTopicDetail;
  allSubtopics: SubTopicDetail[];
  onSubtopicChange: (st: SubTopicDetail) => void;
}) {
  const cards = subtopic.play_cards;
  const [cardIdx, setCardIdx] = useState(0);
  // "card" = reading/listening, "exercise" = doing an exercise for current card
  const [mode, setMode] = useState<"card" | "exercise">("card");
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const currentCard: PlayCard | undefined = cards[cardIdx];
  const currentExercises: CheckpointExercise[] = currentCard?.exercises ?? [];

  useEffect(() => {
    setCardIdx(0);
    setMode("card");
    setExerciseIdx(0);
    setChatHistory([]);
    setChatOpen(false);
  }, [subtopic.id]);

  useEffect(() => {
    // Reset exercise state when card changes
    setMode("card");
    setExerciseIdx(0);
  }, [cardIdx]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  function goToNextCard() {
    if (cardIdx < cards.length - 1) {
      setCardIdx(i => i + 1);
    }
  }

  // Called when audio ends — enter exercise mode if there are exercises
  function onAudioEnded() {
    if (currentExercises.length > 0 && mode === "card") {
      setMode("exercise");
      setExerciseIdx(0);
    }
  }

  // "Next →" button behavior
  function handleNext() {
    if (mode === "card" && currentExercises.length > 0) {
      setMode("exercise");
      setExerciseIdx(0);
    } else {
      goToNextCard();
    }
  }

  // After an exercise's "Continue →" is clicked
  function onExerciseContinue() {
    if (exerciseIdx < currentExercises.length - 1) {
      setExerciseIdx(i => i + 1);
    } else {
      goToNextCard();
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !currentCard) return;
    const msg = input.trim();
    setInput("");
    setSending(true);
    const userMsg: ChatMsg = { role: "user", content: msg };
    setChatHistory((h) => [...h, userMsg]);
    try {
      const history = chatHistory.map((m) => ({ role: m.role, content: m.content }));
      const { reply } = await chatWithPlaycard(currentCard.id, msg, history);
      setChatHistory((h) => [...h, { role: "assistant", content: reply }]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error";
      setChatHistory((h) => [...h, { role: "assistant", content: `Error: ${message}` }]);
    } finally {
      setSending(false);
    }
  }

  if (cards.length === 0) {
    return <div className="flex items-center justify-center h-64 text-gray-500 text-sm">No cards for this subtopic yet.</div>;
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-220px)]">
      {/* Subtopic sidebar */}
      <div className="w-44 flex-shrink-0 space-y-1 overflow-y-auto pr-1">
        {allSubtopics.map((st) => (
          <button key={st.id} onClick={() => onSubtopicChange(st)}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
              st.id === subtopic.id ? "bg-indigo-900 text-indigo-200 border border-indigo-700" : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`}>
            <div className="flex items-center gap-1.5">
              {st.gate_passed && <span className="text-green-400">✓</span>}
              <span className="line-clamp-2">{st.title}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Subtopic header */}
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold">{subtopic.title}</h3>
            {subtopic.description && <p className="text-gray-500 text-xs mt-0.5">{subtopic.description}</p>}
          </div>
          {subtopic.gate_passed && (
            <span className="text-xs px-2 py-1 bg-green-900 text-green-300 rounded-full border border-green-700">Gate passed</span>
          )}
        </div>

        {/* Card navigation dots + Prev/Next */}
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => { setCardIdx(i => Math.max(0, i - 1)); }} disabled={cardIdx === 0}
            className="px-2 py-1 rounded text-xs border border-gray-700 text-gray-400 hover:border-gray-500 disabled:opacity-30">
            ← Prev
          </button>
          <div className="flex gap-1.5">
            {cards.map((_, i) => (
              <button key={i} onClick={() => setCardIdx(i)}
                className={`w-2 h-2 rounded-full transition-colors ${i === cardIdx ? "bg-indigo-400" : "bg-gray-700"}`} />
            ))}
          </div>
          {/* Next button: greyed out on last card, shows "→ Exercise" if exercises pending */}
          {cardIdx < cards.length - 1 || mode === "card" ? (
            <button
              onClick={handleNext}
              disabled={cardIdx === cards.length - 1 && currentExercises.length === 0}
              className="px-2 py-1 rounded text-xs border border-gray-700 text-gray-400 hover:border-gray-500 disabled:opacity-30"
            >
              {mode === "card" && currentExercises.length > 0 ? "Exercise →" : "Next →"}
            </button>
          ) : null}
          <span className="ml-auto text-xs text-gray-600">{cardIdx + 1} / {cards.length}</span>
        </div>

        {/* Content area: card OR exercise */}
        <div className="flex-1 overflow-y-auto">
          {mode === "exercise" && currentExercises[exerciseIdx] ? (
            <div className="space-y-2">
              <p className="text-xs text-gray-600 mb-2">
                Exercise {exerciseIdx + 1} of {currentExercises.length} · {currentCard?.title}
              </p>
              <ExerciseCard
                key={`${cardIdx}-${exerciseIdx}`}
                exercise={currentExercises[exerciseIdx]}
                onContinue={onExerciseContinue}
              />
              <button onClick={() => setMode("card")} className="text-xs text-gray-600 hover:text-gray-400 mt-1">
                ← Back to card
              </button>
            </div>
          ) : currentCard ? (
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
              <h4 className="text-indigo-300 font-semibold text-sm mb-3">{currentCard.title}</h4>
              {currentCard.audio_url && (
                <div className="mb-4">
                  <AudioPlayer
                    key={currentCard.id}
                    audioUrl={currentCard.audio_url}
                    autoPlay
                    onEnded={onAudioEnded}
                  />
                  {currentExercises.length > 0 && (
                    <p className="text-xs text-gray-600 mt-1.5">
                      {currentExercises.length} exercise{currentExercises.length > 1 ? "s" : ""} after audio
                    </p>
                  )}
                </div>
              )}
              <div className="prose prose-invert prose-sm max-w-none prose-pre:bg-gray-950 prose-pre:border prose-pre:border-gray-700 prose-code:text-indigo-300">
                <ReactMarkdown>{currentCard.content}</ReactMarkdown>
              </div>
            </div>
          ) : null}
        </div>

        {/* Chat toggle — only in card mode */}
        {mode === "card" && (
          <>
            <div className="mt-3">
              <button onClick={() => setChatOpen((o) => !o)} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                {chatOpen ? "▼ Hide AI chat" : "▶ Ask AI about this card"}
              </button>
            </div>
            {chatOpen && (
              <div className="mt-2 border border-gray-800 rounded-xl bg-gray-950 flex flex-col" style={{ height: "220px" }}>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {chatHistory.length === 0 && (
                    <p className="text-gray-600 text-xs text-center mt-4">Ask a question about this card...</p>
                  )}
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-lg px-3 py-2 text-xs ${msg.role === "user" ? "bg-indigo-800 text-white" : "bg-gray-800 text-gray-200"}`}>
                        <div className="prose prose-invert prose-xs max-w-none"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                      </div>
                    </div>
                  ))}
                  {sending && (
                    <div className="flex justify-start">
                      <div className="bg-gray-800 rounded-lg px-3 py-2 text-xs text-gray-400">Thinking...</div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
                <form onSubmit={sendMessage} className="border-t border-gray-800 p-2 flex gap-2">
                  <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask a question..."
                    className="flex-1 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500" disabled={sending} />
                  <button type="submit" disabled={sending || !input.trim()}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs rounded-lg transition-colors">
                    Send
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Problems tab — difficulty ladder ────────────────────────────────────────

const DIFF_ORDER: Record<string, number> = { easy: 0, medium: 1, hard: 2 };
const DIFF_COLOR: Record<string, string> = { easy: "text-green-400", medium: "text-yellow-400", hard: "text-red-400" };
const DIFF_LOCK_LABEL: Record<string, string> = { medium: "Complete Easy first", hard: "Complete Medium first" };

function ProblemsTab({ topic }: { topic: TopicDetail }) {
  const hasProblems = topic.subtopics.some(st => st.problems.length > 0);
  if (!hasProblems) {
    return <div className="text-center py-16 text-gray-500 text-sm">No problems yet for this topic.</div>;
  }

  return (
    <div className="space-y-8">
      {topic.subtopics.map((st) => {
        if (st.problems.length === 0) return null;
        const sorted = [...st.problems].sort((a, b) => (DIFF_ORDER[a.difficulty] ?? 3) - (DIFF_ORDER[b.difficulty] ?? 3));

        // Lock logic: easy always open; medium needs easy passed; hard needs medium passed
        const easyPassed = sorted.filter(p => p.difficulty === "easy").every(p => p.gate_passed);
        const mediumPassed = sorted.filter(p => p.difficulty === "medium").every(p => p.gate_passed);

        function isLocked(difficulty: string) {
          if (difficulty === "medium") return !easyPassed;
          if (difficulty === "hard") return !mediumPassed;
          return false;
        }

        return (
          <div key={st.id}>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-white font-semibold text-sm">{st.title}</h3>
              {st.gate_passed && (
                <span className="text-xs px-2 py-0.5 bg-green-900 text-green-300 rounded-full border border-green-700">Gate passed</span>
              )}
            </div>
            <div className="space-y-2">
              {sorted.map((p) => {
                const locked = isLocked(p.difficulty);
                return locked ? (
                  <div key={p.id} className="flex items-center gap-4 p-3 rounded-lg border border-gray-800 bg-gray-950 opacity-50 cursor-not-allowed">
                    <span className="text-gray-600 text-sm">🔒</span>
                    <div className="flex-1 text-sm text-gray-500">{p.title}</div>
                    <span className="text-xs text-gray-600">{DIFF_LOCK_LABEL[p.difficulty]}</span>
                    <span className={`text-xs font-medium ${DIFF_COLOR[p.difficulty] ?? "text-gray-400"}`}>{p.difficulty}</span>
                  </div>
                ) : (
                  <Link key={p.id} href={`/problems/${p.slug}`}
                    className={`flex items-center gap-4 p-3 rounded-lg border transition-colors group ${
                      p.gate_passed
                        ? "border-green-800 bg-green-950/20 hover:border-green-600"
                        : "border-gray-800 bg-gray-900 hover:border-indigo-700"
                    }`}>
                    <span className="text-sm">{p.gate_passed ? "✓" : "→"}</span>
                    <div className={`flex-1 text-sm transition-colors ${p.gate_passed ? "text-green-300" : "text-white group-hover:text-indigo-300"}`}>
                      {p.title}
                    </div>
                    {p.gate_passed && <span className="text-xs text-green-600">Passed</span>}
                    <span className={`text-xs font-medium ${DIFF_COLOR[p.difficulty] ?? "text-gray-400"}`}>{p.difficulty}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function NavXP({ stats }: { stats: UserStats | null }) {
  if (!stats) return null;
  const pct = Math.round((stats.xp_in_level / stats.xp_to_next) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-700 rounded-full px-3 py-1">
        <span className="text-indigo-400 text-xs font-bold">Lv.{stats.level}</span>
        <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-gray-500 text-xs">{stats.xp} XP</span>
      </div>
      {stats.streak_days >= 2 && (
        <span className="text-xs text-orange-400 font-semibold">🔥{stats.streak_days}</span>
      )}
    </div>
  );
}

export default function TopicPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("videos");
  const [activeSubtopic, setActiveSubtopic] = useState<SubTopicDetail | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !slug) return;
    Promise.all([getTopic(slug), getUserStats()])
      .then(([t, s]) => {
        setTopic(t);
        setUserStats(s);
        if (t.subtopics.length > 0) setActiveSubtopic(t.subtopics[0]);
        if (t.videos.length === 0) setTab("learn");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user, slug]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 text-sm">Loading topic...</div>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-400 text-sm">{error || "Topic not found"}</div>
      </div>
    );
  }

  const totalPassed = topic.subtopics.filter((st) => st.gate_passed).length;
  const totalSubtopics = topic.subtopics.length;
  const pct = totalSubtopics === 0 ? 0 : Math.round((totalPassed / totalSubtopics) * 100);

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/topics" className="text-white font-bold text-lg">Logos</Link>
          <Link href="/topics" className="text-gray-400 text-sm hover:text-white transition-colors">
            ← Curriculum
          </Link>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <NavXP stats={userStats} />
          <span className="text-gray-500 hidden sm:block">{user?.email}</span>
          <button onClick={logout} className="text-gray-400 hover:text-white transition-colors">
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Topic header */}
        <div className="mb-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">{topic.icon}</div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">{topic.title}</h1>
              <p className="text-gray-400 text-sm mt-1">{topic.description}</p>
              {/* Progress bar */}
              {totalSubtopics > 0 && (
                <div className="mt-3 max-w-xs">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{totalPassed}/{totalSubtopics} subtopics passed</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-800">
          {(["videos", "learn", "problems"] as Tab[]).map((t) => {
            const labels = { videos: "Videos", learn: "Learn with AI", problems: "Problems" };
            const counts = {
              videos: topic.videos.length,
              learn: topic.subtopics.reduce((s, st) => s + st.play_cards.length, 0),
              problems: topic.subtopics.reduce((s, st) => s + st.problems.length, 0),
            };
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  tab === t
                    ? "border-indigo-500 text-indigo-300"
                    : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                {labels[t]}
                {counts[t] > 0 && (
                  <span className="ml-1.5 text-xs text-gray-600">({counts[t]})</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {tab === "videos" && (
          <div>
            {topic.videos.length === 0 ? (
              <div className="text-center py-16 text-gray-500 text-sm">
                No videos have been added for this topic yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topic.videos.map((v) => (
                  <YouTubeEmbed key={v.id} youtubeId={v.youtube_id} title={v.title} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "learn" && (
          <div>
            {topic.subtopics.length === 0 ? (
              <div className="text-center py-16 text-gray-500 text-sm">
                No learning cards yet for this topic.
              </div>
            ) : activeSubtopic ? (
              <PlayCardPanel
                subtopic={activeSubtopic}
                allSubtopics={topic.subtopics}
                onSubtopicChange={setActiveSubtopic}
              />
            ) : null}
          </div>
        )}

        {tab === "problems" && <ProblemsTab topic={topic} />}
      </main>
    </div>
  );
}
