"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { getTopic, chatWithPlaycard, TopicDetail, SubTopicDetail, PlayCard } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// ─── Tab types ────────────────────────────────────────────────────────────────

type Tab = "videos" | "learn" | "problems";

// ─── YouTube embed ─────────────────────────────────────────────────────────────

function YouTubeEmbed({ youtubeId, title }: { youtubeId: string; title: string }) {
  return (
    <div className="rounded-lg overflow-hidden border border-gray-800 bg-gray-900">
      <div className="aspect-video w-full">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
      <div className="px-3 py-2 text-sm text-gray-300">{title}</div>
    </div>
  );
}

// ─── Audio player ─────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function AudioPlayer({ audioUrl }: { audioUrl: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const toggle = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
    } else {
      el.play();
    }
  }, [playing]);

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700">
      <audio
        ref={audioRef}
        src={`${BASE_URL}${audioUrl}`}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setProgress(0); }}
        onTimeUpdate={() => {
          const el = audioRef.current;
          if (el && el.duration) setProgress(el.currentTime / el.duration);
        }}
      />
      <button
        onClick={toggle}
        className="w-7 h-7 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white text-xs shrink-0 transition-colors"
        title={playing ? "Pause" : "Play summary"}
      >
        {playing ? "⏸" : "▶"}
      </button>
      <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-400 rounded-full transition-all"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 shrink-0">Listen</span>
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
  const [chatOpen, setChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const currentCard: PlayCard | undefined = cards[cardIdx];

  // Reset card index when subtopic changes
  useEffect(() => {
    setCardIdx(0);
    setChatHistory([]);
    setChatOpen(false);
  }, [subtopic.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !currentCard) return;
    const msg = input.trim();
    setInput("");
    setSending(true);

    const userMsg: ChatMsg = { role: "user", content: msg };
    setChatHistory((h) => [...h, userMsg]);

    try {
      // Build history in Anthropic format (alternating user/assistant)
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
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
        No cards for this subtopic yet.
      </div>
    );
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-220px)]">
      {/* Subtopic sidebar */}
      <div className="w-44 flex-shrink-0 space-y-1 overflow-y-auto pr-1">
        {allSubtopics.map((st) => (
          <button
            key={st.id}
            onClick={() => onSubtopicChange(st)}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
              st.id === subtopic.id
                ? "bg-indigo-900 text-indigo-200 border border-indigo-700"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-1.5">
              {st.gate_passed && <span className="text-green-400">✓</span>}
              <span className="line-clamp-2">{st.title}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Card + chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Subtopic header */}
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold">{subtopic.title}</h3>
            {subtopic.description && (
              <p className="text-gray-500 text-xs mt-0.5">{subtopic.description}</p>
            )}
          </div>
          {subtopic.gate_passed && (
            <span className="text-xs px-2 py-1 bg-green-900 text-green-300 rounded-full border border-green-700">
              Gate passed
            </span>
          )}
        </div>

        {/* Card navigation */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => setCardIdx((i) => Math.max(0, i - 1))}
            disabled={cardIdx === 0}
            className="px-2 py-1 rounded text-xs border border-gray-700 text-gray-400 hover:border-gray-500 disabled:opacity-30"
          >
            ← Prev
          </button>
          <div className="flex gap-1.5">
            {cards.map((_, i) => (
              <button
                key={i}
                onClick={() => setCardIdx(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === cardIdx ? "bg-indigo-400" : "bg-gray-700"
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => setCardIdx((i) => Math.min(cards.length - 1, i + 1))}
            disabled={cardIdx === cards.length - 1}
            className="px-2 py-1 rounded text-xs border border-gray-700 text-gray-400 hover:border-gray-500 disabled:opacity-30"
          >
            Next →
          </button>
          <span className="ml-auto text-xs text-gray-600">
            {cardIdx + 1} / {cards.length}
          </span>
        </div>

        {/* PlayCard content */}
        {currentCard && (
          <div className="flex-1 overflow-y-auto rounded-xl border border-gray-800 bg-gray-900 p-5">
            <h4 className="text-indigo-300 font-semibold text-sm mb-3">{currentCard.title}</h4>
            {currentCard.audio_url && (
              <div className="mb-4">
                <AudioPlayer key={currentCard.id} audioUrl={currentCard.audio_url} />
              </div>
            )}
            <div className="prose prose-invert prose-sm max-w-none prose-pre:bg-gray-950 prose-pre:border prose-pre:border-gray-700 prose-code:text-indigo-300">
              <ReactMarkdown>{currentCard.content}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Chat toggle */}
        <div className="mt-3">
          <button
            onClick={() => setChatOpen((o) => !o)}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            {chatOpen ? "▼ Hide AI chat" : "▶ Ask AI about this card"}
          </button>
        </div>

        {/* Chat panel */}
        {chatOpen && (
          <div className="mt-2 border border-gray-800 rounded-xl bg-gray-950 flex flex-col" style={{ height: "220px" }}>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {chatHistory.length === 0 && (
                <p className="text-gray-600 text-xs text-center mt-4">
                  Ask a question about this card...
                </p>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-xs ${
                      msg.role === "user"
                        ? "bg-indigo-800 text-white"
                        : "bg-gray-800 text-gray-200"
                    }`}
                  >
                    <ReactMarkdown className="prose prose-invert prose-xs max-w-none">
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 rounded-lg px-3 py-2 text-xs text-gray-400">
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="border-t border-gray-800 p-2 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs rounded-lg transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Problems tab ─────────────────────────────────────────────────────────────

function ProblemsTab({ topic }: { topic: TopicDetail }) {
  const DIFF_COLOR: Record<string, string> = {
    easy: "text-green-400",
    medium: "text-yellow-400",
    hard: "text-red-400",
  };

  const allProblems = topic.subtopics.flatMap((st) =>
    st.problems.map((p) => ({ ...p, subtopic: st }))
  );

  if (allProblems.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500 text-sm">
        No problems yet for this topic. Come back soon!
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {topic.subtopics.map((st) => {
        if (st.problems.length === 0) return null;
        return (
          <div key={st.id}>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-white font-semibold text-sm">{st.title}</h3>
              {st.gate_passed && (
                <span className="text-xs px-2 py-0.5 bg-green-900 text-green-300 rounded-full border border-green-700">
                  Gate passed
                </span>
              )}
            </div>
            <div className="space-y-2">
              {st.problems.map((p, idx) => (
                <Link
                  key={p.id}
                  href={`/problems/${p.slug}`}
                  className="flex items-center gap-4 p-3 rounded-lg border border-gray-800 bg-gray-900 hover:border-indigo-700 transition-colors group"
                >
                  <span className="text-gray-600 text-xs w-5 text-right">{idx + 1}</span>
                  <div className="flex-1 text-sm text-white group-hover:text-indigo-300 transition-colors">
                    {p.title}
                  </div>
                  <span className={`text-xs font-medium ${DIFF_COLOR[p.difficulty] ?? "text-gray-400"}`}>
                    {p.difficulty}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TopicPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("videos");
  const [activeSubtopic, setActiveSubtopic] = useState<SubTopicDetail | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !slug) return;
    getTopic(slug)
      .then((t) => {
        setTopic(t);
        if (t.subtopics.length > 0) setActiveSubtopic(t.subtopics[0]);
        // Default to learn tab if no videos
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
          <span className="text-gray-500">{user?.email}</span>
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
