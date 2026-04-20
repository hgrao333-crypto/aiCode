"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import {
  getTopic,
  chatWithPlaycard,
  answerExercise,
  TopicDetail,
  SubTopicDetail,
  PlayCard,
  CheckpointExercise,
  ExerciseAnswerResult,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// ─── Audio player ──────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const SPEEDS = [1, 1.5, 2] as const;
type Speed = (typeof SPEEDS)[number];

function AudioPlayer({
  audioUrl,
  onEnded,
  autoPlay,
}: {
  audioUrl: string;
  onEnded?: () => void;
  autoPlay?: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState<Speed>(1);

  useEffect(() => {
    if (autoPlay && audioRef.current) {
      audioRef.current.play().catch(() => {});
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
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700 border border-slate-600/50">
      <audio
        ref={audioRef}
        src={`${BASE_URL}${audioUrl}`}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
          onEnded?.();
        }}
        onTimeUpdate={() => {
          const el = audioRef.current;
          if (el && el.duration) setProgress(el.currentTime / el.duration);
        }}
      />
      <button
        onClick={toggle}
        className="w-7 h-7 rounded-full bg-cyan-600 hover:bg-cyan-500 flex items-center justify-center text-white text-xs shrink-0 transition-colors"
      >
        {playing ? "⏸" : "▶"}
      </button>
      <div className="flex-1 h-1 bg-slate-600 rounded-full overflow-hidden">
        <div
          className="h-full bg-cyan-400 rounded-full transition-all"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <button
        onClick={cycleSpeed}
        className="text-xs font-mono px-2 py-0.5 rounded border border-slate-500/50 text-slate-300 hover:border-cyan-500 hover:text-cyan-300 transition-colors shrink-0 w-10 text-center"
      >
        {speed}x
      </button>
    </div>
  );
}

// ─── Exercise card ─────────────────────────────────────────────────────────────

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

  const typeStyle =
    TYPE_COLORS[exercise.exercise_type] ?? "text-slate-300 border-slate-600/50";
  const canSubmit =
    exercise.exercise_type === "recognition"
      ? selectedIndex !== null
      : textAnswer.trim().length > 0;

  return (
    <div className={`rounded-xl border p-5 space-y-4 ${typeStyle}`}>
      <div className="text-xs font-bold uppercase tracking-wider opacity-80">
        {TYPE_LABELS[exercise.exercise_type] ?? exercise.exercise_type}
      </div>

      <p className="text-white font-medium text-sm leading-relaxed">
        {exercise.question}
      </p>

      {exercise.exercise_type === "debugging" && exercise.buggy_code && (
        <pre className="bg-slate-900 border border-slate-700/50 rounded-lg p-3 text-xs text-slate-200 overflow-x-auto whitespace-pre-wrap font-mono">
          {exercise.buggy_code}
        </pre>
      )}

      {exercise.exercise_type === "recognition" &&
        exercise.options &&
        !result && (
          <div className="space-y-2">
            {exercise.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => setSelectedIndex(i)}
                className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                  selectedIndex === i
                    ? "border-cyan-500 bg-cyan-950 text-white"
                    : "border-slate-600/50 bg-slate-800 text-slate-200 hover:border-slate-500/50"
                }`}
              >
                <span className="text-slate-400 mr-2">
                  {String.fromCharCode(65 + i)}.
                </span>
                {opt}
              </button>
            ))}
          </div>
        )}

      {exercise.exercise_type !== "recognition" && !result && (
        <textarea
          className="w-full bg-slate-800 border border-slate-600/50 focus:border-cyan-500 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none resize-none"
          rows={exercise.exercise_type === "teach_back" ? 5 : 3}
          value={textAnswer}
          onChange={(e) => setTextAnswer(e.target.value)}
          placeholder={
            exercise.exercise_type === "debugging"
              ? "Describe the bug and why it causes incorrect output…"
              : exercise.exercise_type === "variation"
              ? "Think through this change and explain your reasoning…"
              : "Explain this concept as if talking to someone new to programming…"
          }
        />
      )}

      {!result && (
        <button
          onClick={submit}
          disabled={submitting || !canSubmit}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-sm rounded-lg transition-colors font-medium"
        >
          {submitting ? "Checking…" : "Submit"}
        </button>
      )}

      {result && (
        <div className="space-y-3">
          {exercise.exercise_type === "recognition" && exercise.options && (
            <div className="space-y-1">
              {exercise.options.map((opt, i) => {
                const isCorrect = i === exercise.correct_index;
                const isSelected = i === selectedIndex;
                return (
                  <div
                    key={i}
                    className={`px-3 py-2 rounded-lg text-sm border ${
                      isCorrect
                        ? "border-green-700 bg-green-950 text-green-300"
                        : isSelected && !isCorrect
                        ? "border-red-700 bg-red-950 text-red-300"
                        : "border-slate-700/50 text-slate-400"
                    }`}
                  >
                    <span className="mr-2">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                    {isCorrect && <span className="ml-2">✓</span>}
                    {isSelected && !isCorrect && <span className="ml-2">✗</span>}
                  </div>
                );
              })}
            </div>
          )}

          <div
            className={`flex items-start gap-2 p-3 rounded-lg ${
              result.correct
                ? "bg-green-950 border border-green-800"
                : "bg-orange-950 border border-orange-800"
            }`}
          >
            <span className="text-lg">{result.correct ? "✓" : "~"}</span>
            <p className="text-sm text-slate-100">{result.feedback}</p>
          </div>

          {result.explanation && (
            <div className="p-3 rounded-lg bg-slate-800 border border-slate-600/50">
              <p className="text-xs text-slate-400 font-semibold mb-1 uppercase tracking-wide">
                Explanation
              </p>
              <p className="text-sm text-slate-200">{result.explanation}</p>
            </div>
          )}

          <button
            onClick={onContinue}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm rounded-lg transition-colors font-medium"
          >
            Continue →
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Card content panel (top 60%) ─────────────────────────────────────────────

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

function CardPanel({
  topic,
  activeSubtopic,
  onSubtopicChange,
  onCardChange,
  onSubtopicHover,
  onSubtopicHoverEnd,
}: {
  topic: TopicDetail;
  activeSubtopic: SubTopicDetail;
  onSubtopicChange: (st: SubTopicDetail) => void;
  onCardChange: (card: PlayCard) => void;
  onSubtopicHover: (st: SubTopicDetail, x: number, y: number) => void;
  onSubtopicHoverEnd: () => void;
}) {
  const cards = activeSubtopic.play_cards;
  const [cardIdx, setCardIdx] = useState(0);
  const [mode, setMode] = useState<"card" | "exercise">("card");
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const currentCard: PlayCard | undefined = cards[cardIdx];
  const currentExercises: CheckpointExercise[] = currentCard?.exercises ?? [];

  useEffect(() => {
    setCardIdx(0);
    setMode("card");
    setExerciseIdx(0);
  }, [activeSubtopic.id]);

  useEffect(() => {
    setMode("card");
    setExerciseIdx(0);
  }, [cardIdx]);

  useEffect(() => {
    if (currentCard) onCardChange(currentCard);
  }, [currentCard, onCardChange]);

  function goToNextCard() {
    if (cardIdx < cards.length - 1) setCardIdx((i) => i + 1);
  }

  function onAudioEnded() {
    if (currentExercises.length > 0 && mode === "card") {
      setMode("exercise");
      setExerciseIdx(0);
    }
  }

  function handleNext() {
    if (mode === "card" && currentExercises.length > 0) {
      setMode("exercise");
      setExerciseIdx(0);
    } else {
      goToNextCard();
    }
  }

  function onExerciseContinue() {
    if (exerciseIdx < currentExercises.length - 1) {
      setExerciseIdx((i) => i + 1);
    } else {
      goToNextCard();
    }
  }

  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
        No cards for this subtopic yet.
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Collapsible subtopic sidebar */}
      <div className={`flex-shrink-0 flex flex-col border-r border-slate-700/50 transition-all duration-200 ${sidebarOpen ? "w-44" : "w-9"}`}>
        {/* Toggle button */}
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          className="flex items-center justify-center h-8 w-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors flex-shrink-0 border-b border-slate-700/50"
          title={sidebarOpen ? "Collapse menu" : "Expand menu"}
        >
          <span className="text-xs">{sidebarOpen ? "‹" : "›"}</span>
        </button>

        {/* Subtopic list */}
        {sidebarOpen && (
          <div className="flex flex-col gap-1 overflow-y-auto p-1.5 flex-1">
            {topic.subtopics.map((st) => (
              <button
                key={st.id}
                onClick={() => onSubtopicChange(st)}
                onMouseEnter={(e) => onSubtopicHover(st, e.clientX, e.clientY)}
                onMouseMove={(e) => onSubtopicHover(st, e.clientX, e.clientY)}
                onMouseLeave={onSubtopicHoverEnd}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors ${
                  st.id === activeSubtopic.id
                    ? "bg-cyan-900 text-cyan-200 border border-cyan-700"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {st.gate_passed && <span className="text-green-400 text-xs">✓</span>}
                  <span className="line-clamp-2">{st.title}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Collapsed: show dots for each subtopic */}
        {!sidebarOpen && (
          <div className="flex flex-col items-center gap-2 pt-2 flex-1 overflow-y-auto">
            {topic.subtopics.map((st) => (
              <button
                key={st.id}
                onClick={() => onSubtopicChange(st)}
                onMouseEnter={(e) => onSubtopicHover(st, e.clientX, e.clientY)}
                onMouseMove={(e) => onSubtopicHover(st, e.clientX, e.clientY)}
                onMouseLeave={onSubtopicHoverEnd}
                className={`w-3 h-3 rounded-full transition-colors flex-shrink-0 ${
                  st.id === activeSubtopic.id ? "bg-cyan-400" : "bg-slate-600 hover:bg-slate-500"
                }`}
                title={st.title}
              />
            ))}
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden px-4 pt-3 pb-2">
        {/* Subtopic title */}
        <div className="mb-3 flex-shrink-0 flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold text-sm">
              {activeSubtopic.title}
            </h3>
            {activeSubtopic.description && (
              <p className="text-slate-400 text-xs mt-0.5">
                {activeSubtopic.description}
              </p>
            )}
          </div>
          {activeSubtopic.gate_passed && (
            <span className="text-xs px-2 py-0.5 bg-green-900 text-green-300 rounded-full border border-green-700">
              Gate passed
            </span>
          )}
        </div>

        {/* Card nav dots */}
        <div className="flex items-center gap-2 mb-3 flex-shrink-0">
          <button
            onClick={() => setCardIdx((i) => Math.max(0, i - 1))}
            disabled={cardIdx === 0}
            className="px-2 py-1 rounded text-xs border border-slate-600/50 text-slate-300 hover:border-slate-500/50 disabled:opacity-30"
          >
            ← Prev
          </button>
          <div className="flex gap-1.5">
            {cards.map((_, i) => (
              <button
                key={i}
                onClick={() => setCardIdx(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === cardIdx ? "bg-cyan-400" : "bg-slate-600"
                }`}
              />
            ))}
          </div>
          {(cardIdx < cards.length - 1 || mode === "card") && (
            <button
              onClick={handleNext}
              disabled={
                cardIdx === cards.length - 1 && currentExercises.length === 0
              }
              className="px-2 py-1 rounded text-xs border border-slate-600/50 text-slate-300 hover:border-slate-500/50 disabled:opacity-30"
            >
              {mode === "card" && currentExercises.length > 0
                ? "Exercise →"
                : "Next →"}
            </button>
          )}
          <span className="ml-auto text-xs text-slate-500">
            {cardIdx + 1} / {cards.length}
          </span>
        </div>

        {/* Scrollable card body */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {mode === "exercise" && currentExercises[exerciseIdx] ? (
            <div className="space-y-2">
              <p className="text-xs text-slate-500 mb-2">
                Exercise {exerciseIdx + 1} of {currentExercises.length} ·{" "}
                {currentCard?.title}
              </p>
              <ExerciseCard
                key={`${cardIdx}-${exerciseIdx}`}
                exercise={currentExercises[exerciseIdx]}
                onContinue={onExerciseContinue}
              />
              <button
                onClick={() => setMode("card")}
                className="text-xs text-slate-500 hover:text-slate-300 mt-1"
              >
                ← Back to card
              </button>
            </div>
          ) : currentCard ? (
            <div className="rounded-xl border border-slate-700/50 bg-slate-800 overflow-hidden">
              {currentCard.image_url && (
                <div className="w-full h-32 overflow-hidden bg-slate-900">
                  <img
                    src={currentCard.image_url}
                    alt={currentCard.title}
                    className="w-full h-full object-cover opacity-90"
                  />
                </div>
              )}
              <div className="p-5">
                <h4 className="text-cyan-300 font-semibold text-sm mb-3">
                  {currentCard.title}
                </h4>
                <div className="mb-4">
                  {currentCard.audio_url ? (
                    <>
                      <AudioPlayer
                        key={currentCard.id}
                        audioUrl={currentCard.audio_url}
                        autoPlay
                        onEnded={onAudioEnded}
                      />
                      {currentExercises.length > 0 && (
                        <p className="text-xs text-slate-500 mt-1.5">
                          {currentExercises.length} exercise
                          {currentExercises.length > 1 ? "s" : ""} after audio
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50/50">
                      <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center text-slate-400 text-xs shrink-0">
                        ▶
                      </div>
                      <div className="flex-1 h-1 bg-slate-600/50 rounded-full" />
                      <span className="text-xs text-slate-500 shrink-0">Audio not generated yet</span>
                    </div>
                  )}
                </div>
                <div className="prose prose-invert prose-sm max-w-none prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-600/50 prose-code:text-cyan-300">
                  <ReactMarkdown>{currentCard.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── Chat panel (right side) ──────────────────────────────────────────────────

function ChatPanel({ currentCard }: { currentCard: PlayCard | null }) {
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevCardId = useRef<number | null>(null);

  useEffect(() => {
    if (currentCard && currentCard.id !== prevCardId.current) {
      prevCardId.current = currentCard.id;
      setChatHistory([]);
    }
  }, [currentCard]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !currentCard) return;
    const msg = input.trim();
    setInput("");
    setSending(true);
    setChatHistory((h) => [...h, { role: "user", content: msg }]);
    try {
      const history = chatHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const { reply } = await chatWithPlaycard(currentCard.id, msg, history);
      setChatHistory((h) => [...h, { role: "assistant", content: reply }]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error";
      setChatHistory((h) => [
        ...h,
        { role: "assistant", content: `Error: ${message}` },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-full border-l border-slate-700/50 bg-slate-900">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-700/50 flex-shrink-0">
        <div className="w-2 h-2 rounded-full bg-cyan-500" />
        <span className="text-xs text-slate-300 font-medium">
          Ask AI about this card
        </span>
        {currentCard && (
          <span className="text-xs text-slate-500 truncate">
            — {currentCard.title}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {chatHistory.length === 0 && (
          <p className="text-slate-500 text-xs text-center mt-4">
            {currentCard
              ? "Ask anything about this concept…"
              : "Select a card to start chatting"}
          </p>
        )}
        {chatHistory.map((msg, i) => (
          <div
            key={i}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-xl px-3 py-2 text-xs ${
                msg.role === "user"
                  ? "bg-cyan-800 text-white"
                  : "bg-slate-700 text-slate-100"
              }`}
            >
              <div className="prose prose-invert prose-xs max-w-none">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300">
              Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="flex gap-2 px-4 py-3 border-t border-slate-700/50 flex-shrink-0"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            currentCard ? "Ask a question…" : "Select a card first"
          }
          disabled={sending || !currentCard}
          className="flex-1 bg-slate-800 text-white text-xs px-3 py-2 rounded-lg border border-slate-600/50 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={sending || !input.trim() || !currentCard}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs rounded-lg transition-colors font-semibold"
        >
          Send
        </button>
      </form>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function LearnPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSubtopic, setActiveSubtopic] = useState<SubTopicDetail | null>(null);
  const [currentCard, setCurrentCard] = useState<PlayCard | null>(null);
  const [subtopicTooltip, setSubtopicTooltip] = useState<{
    subtopic: SubTopicDetail;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !slug) return;
    getTopic(slug)
      .then((t) => {
        setTopic(t);
        if (t.subtopics.length > 0) {
          setActiveSubtopic(t.subtopics[0]);
          if (t.subtopics[0].play_cards.length > 0) {
            setCurrentCard(t.subtopics[0].play_cards[0]);
          }
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user, slug]);

  const handleCardChange = useCallback((card: PlayCard) => {
    setCurrentCard(card);
  }, []);

  const handleSubtopicHover = useCallback((st: SubTopicDetail, x: number, y: number) => {
    setSubtopicTooltip({ subtopic: st, x, y });
  }, []);

  const handleSubtopicHoverEnd = useCallback(() => {
    setSubtopicTooltip(null);
  }, []);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">
        Loading…
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-400 text-sm">
        {error || "Topic not found"}
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-900">
      {/* Subtopic image tooltip — rendered at root so it's never clipped */}
      {subtopicTooltip && (
        <div
          className="fixed z-[9999] pointer-events-none rounded-xl overflow-hidden border border-white/10 shadow-2xl"
          style={{
            left: subtopicTooltip.x + 18,
            top: subtopicTooltip.y - 56,
            width: 192,
            height: 108,
          }}
        >
          <img
            src={`/images/subtopic_${subtopicTooltip.subtopic.slug}.png`}
            alt={subtopicTooltip.subtopic.title}
            className="w-full h-full object-cover"
            style={{ filter: "blur(1px) brightness(0.8)" }}
            onError={(e) => {
              (e.target as HTMLImageElement).closest("div")!.style.display = "none";
            }}
          />
          <div className="absolute inset-0 flex items-end p-2 bg-gradient-to-t from-black/70 to-transparent">
            <span className="text-white text-xs font-medium leading-tight">
              {subtopicTooltip.subtopic.title}
            </span>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="border-b border-slate-700/50 px-5 py-2.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/topics" className="text-white font-bold">
            Logos
          </Link>
          <Link
            href={`/topics/${slug}`}
            className="text-slate-300 text-sm hover:text-white transition-colors"
          >
            ← {topic.title}
          </Link>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-400 hidden sm:block">{user?.email}</span>
          <button
            onClick={logout}
            className="text-slate-300 hover:text-white transition-colors text-sm"
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* Split layout: content left, chat right */}
      <div className="flex-1 flex flex-row overflow-hidden">
        {/* Left: card content */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {activeSubtopic ? (
            <CardPanel
              topic={topic}
              activeSubtopic={activeSubtopic}
              onSubtopicChange={setActiveSubtopic}
              onCardChange={handleCardChange}
              onSubtopicHover={handleSubtopicHover}
              onSubtopicHoverEnd={handleSubtopicHoverEnd}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              No learning content yet.
            </div>
          )}
        </div>

        {/* Right: AI chat (fixed 320px) */}
        <div className="w-80 flex-shrink-0 overflow-hidden">
          <ChatPanel currentCard={currentCard} />
        </div>
      </div>
    </div>
  );
}
