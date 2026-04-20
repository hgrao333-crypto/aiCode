"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/context/AuthContext";
import {
  getProblem,
  runCode,
  submitAnswer,
  Problem,
  RunResponse,
  AnswerResponse,
  XPResult,
} from "@/lib/api";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

// ── XP Toast ─────────────────────────────────────────────────────────────────

function XPToast({ result, onDone }: { result: XPResult; onDone: () => void }) {
  const levelUp = result.new_level > result.old_level;
  useEffect(() => {
    const t = setTimeout(onDone, levelUp ? 3500 : 2500);
    return () => clearTimeout(t);
  }, [onDone, levelUp]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex flex-col items-center justify-start pt-20 gap-3">
      {/* XP gained */}
      <div className="animate-bounce-up px-5 py-2 rounded-full bg-indigo-600 border border-indigo-400 text-white font-bold text-lg shadow-lg shadow-indigo-900/50">
        +{result.xp_gained} XP
      </div>

      {/* Level up */}
      {levelUp && (
        <div className="animate-bounce-up-slow px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 border border-amber-300 text-white text-center shadow-xl shadow-amber-900/50">
          <div className="text-2xl font-black">Level Up! 🎉</div>
          <div className="text-sm font-medium opacity-90">
            Level {result.old_level} → Level {result.new_level}
          </div>
        </div>
      )}

      {/* Streak */}
      {result.streak_days >= 2 && (
        <div className="animate-bounce-up-slow px-4 py-1.5 rounded-full bg-orange-900/80 border border-orange-600 text-orange-300 text-sm font-semibold">
          🔥 {result.streak_days}-day streak
        </div>
      )}
    </div>
  );
}

type Phase =
  | "editing"
  | "questioning"
  | "teaching"
  | "verifying"
  | "passed"
  | "passed_assisted";

interface Message {
  role: "ai" | "user";
  content: string;
  type?: "question" | "teaching" | "verdict" | "code_result" | "hint";
}

const DIFF_COLOR: Record<string, string> = {
  easy: "text-green-400",
  medium: "text-yellow-400",
  hard: "text-red-400",
};

export default function ProblemPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [problem, setProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [phase, setPhase] = useState<Phase>("editing");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [turnCount, setTurnCount] = useState(0);
  const [leftTab, setLeftTab] = useState<"problem" | "editor">("problem");
  const [xpToast, setXpToast] = useState<XPResult | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const answerRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    getProblem(slug)
      .then((p) => { setProblem(p); setCode(p.starter_code); })
      .catch(() => router.replace("/problems"))
      .finally(() => setLoading(false));
  }, [slug, user, router]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-focus answer box whenever a question is active
  useEffect(() => {
    if (phase === "questioning" || phase === "verifying") {
      setTimeout(() => answerRef.current?.focus(), 100);
    }
  }, [phase, currentQuestion]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleRun = async () => {
    if (!problem) return;
    setRunning(true);
    try {
      const res: RunResponse = await runCode(problem.slug, code);
      setSessionId(res.session_id);
      setTurnCount(0);
      setCurrentQuestion(res.question);

      const msgs: Message[] = [];

      // Code result — compact
      const passed = res.code_result.results?.filter((r) => r.passed).length ?? 0;
      const total = res.code_result.results?.length ?? 0;
      msgs.push({
        role: "ai",
        type: "code_result",
        content: res.code_result.error
          ? `Error: ${res.code_result.error}`
          : `${passed}/${total} test cases passed`,
      });

      msgs.push({ role: "ai", type: "question", content: res.question });
      setMessages(msgs);
      setPhase("questioning");
      setLeftTab("editor");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to run code");
    } finally {
      setRunning(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!sessionId || !answer.trim() || submitting) return;
    setSubmitting(true);

    const trimmed = answer.trim();
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setAnswer("");

    try {
      const res: AnswerResponse = await submitAnswer(sessionId, trimmed);
      setTurnCount((t) => t + 1);

      if (res.verdict === "PASS") {
        const assisted = res.session_outcome === "PASS_ASSISTED";
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            type: "verdict",
            content: assisted
              ? "Gate passed with help. Partial mastery recorded."
              : "Gate passed! Full mastery unlocked.",
          },
        ]);
        setCurrentQuestion("");
        setPhase(assisted ? "passed_assisted" : "passed");
        if (res.xp) setXpToast(res.xp);

      } else if (res.verdict === "FAIL") {
        if (res.follow_up) {
          setCurrentQuestion(res.follow_up);
          setMessages((prev) => [
            ...prev,
            { role: "ai", type: "question", content: res.follow_up },
          ]);
          setPhase("questioning");
        } else {
          // Backend now escalates FAIL-with-no-followup to STUCK, but handle gracefully
          setPhase("teaching");
        }

      } else if (res.verdict === "STUCK") {
        setMessages((prev) => [
          ...prev,
          { role: "ai", type: "teaching", content: res.teaching },
        ]);
        const checkQ = extractCheckQuestion(res.teaching);
        setCurrentQuestion(checkQ);
        setPhase("teaching");
      }
    } catch (e: unknown) {
      // Re-show question on error
      setMessages((prev) => [
        ...prev,
        { role: "ai", type: "hint", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAfterTeaching = () => {
    if (currentQuestion) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", type: "question", content: currentQuestion },
      ]);
    }
    setPhase("verifying");
  };

  const handleRetry = () => {
    setPhase("editing");
    setMessages([]);
    setSessionId(null);
    setTurnCount(0);
    setAnswer("");
    setCurrentQuestion("");
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">
        Loading...
      </div>
    );
  }

  const isComplete = phase === "passed" || phase === "passed_assisted";
  const gateActive = phase !== "editing";

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-950">
      {/* ── XP Toast ── */}
      {xpToast && <XPToast result={xpToast} onDone={() => setXpToast(null)} />}

      {/* ── Nav ── */}
      <nav className="shrink-0 border-b border-gray-800 px-4 h-10 flex items-center gap-3">
        <Link href="/problems" className="text-gray-500 hover:text-white text-xs transition-colors">
          ← Problems
        </Link>
        <span className="text-white text-sm font-semibold">{problem?.title}</span>
        <span className={`text-xs font-medium ${DIFF_COLOR[problem?.difficulty ?? "medium"]}`}>
          {problem?.difficulty}
        </span>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-gray-600 text-xs">{user?.email}</span>
          <button onClick={logout} className="text-gray-600 hover:text-gray-400 text-xs transition-colors">
            sign out
          </button>
        </div>
      </nav>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: Problem + Editor ── */}
        <div className="flex flex-col w-[55%] border-r border-gray-800 overflow-hidden">
          {/* Tab bar */}
          <div className="shrink-0 flex border-b border-gray-800 bg-gray-950">
            {(["problem", "editor"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setLeftTab(tab)}
                className={`px-4 py-2 text-xs font-medium transition-colors ${
                  leftTab === tab
                    ? "text-white border-b-2 border-indigo-500"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {tab === "problem" ? "Problem" : "Code"}
              </button>
            ))}

            {/* Run button lives in this bar */}
            <div className="ml-auto flex items-center px-3">
              {gateActive && !isComplete ? (
                <span className="text-xs text-amber-400 font-medium">
                  Gate in progress — Q {turnCount + 1} of up to 4
                </span>
              ) : isComplete ? (
                <span className={`text-xs font-medium ${phase === "passed" ? "text-green-400" : "text-amber-400"}`}>
                  {phase === "passed" ? "Full mastery" : "Partial mastery"}
                </span>
              ) : (
                <button
                  onClick={handleRun}
                  disabled={running}
                  className="px-4 py-1 rounded bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white text-xs font-semibold transition-colors"
                >
                  {running ? "Running..." : "▶  Run"}
                </button>
              )}
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            {leftTab === "problem" ? (
              <div className="h-full overflow-y-auto p-5">
                <div className="prose prose-invert prose-sm max-w-none text-gray-300">
                  <ReactMarkdown>{problem?.description ?? ""}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <MonacoEditor
                height="100%"
                language="python"
                theme="vs-dark"
                value={code}
                onChange={(val) => setCode(val ?? "")}
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  tabSize: 4,
                  insertSpaces: true,
                  automaticLayout: true,
                  readOnly: gateActive,
                }}
              />
            )}
          </div>
        </div>

        {/* ── RIGHT: Socratic Chat ── */}
        <div className="flex flex-col w-[45%] overflow-hidden bg-gray-950">

          {/* Chat header */}
          <div className="shrink-0 px-4 py-2 border-b border-gray-800 flex items-center justify-between">
            <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">
              Socratic Gate
            </span>
            {gateActive && !isComplete && (
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className={`w-2 h-2 rounded-full ${
                      n <= turnCount ? "bg-indigo-500" : "bg-gray-700"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {!gateActive && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 pb-10">
                <div className="text-4xl">🔒</div>
                <p className="text-gray-400 text-sm max-w-xs">
                  Write your solution in the editor, then click{" "}
                  <span className="text-emerald-400 font-semibold">Run</span> to unlock the gate.
                </p>
                <p className="text-gray-600 text-xs max-w-xs">
                  The AI will ask you to explain your own code before it reveals test results.
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <ChatMessage key={i} msg={msg} />
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* ── Input zone ── */}
          <div className="shrink-0 border-t border-gray-800">
            {(phase === "questioning" || phase === "verifying") && (
              <div className="p-4 space-y-3">
                {/* Pinned current question — rendered as markdown */}
                <div className="bg-gray-900 border border-indigo-900/60 rounded-lg px-3 py-2">
                  <span className="text-indigo-400 text-xs font-semibold uppercase tracking-wider">
                    Question
                  </span>
                  <div className="text-gray-200 text-sm mt-1 prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>
                      {currentQuestion ||
                        // fallback: last AI question from messages
                        [...messages].reverse().find((m) => m.type === "question")?.content ||
                        ""}
                    </ReactMarkdown>
                  </div>
                </div>

                <textarea
                  ref={answerRef}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleSubmitAnswer();
                    }
                  }}
                  placeholder="Type your answer here..."
                  className="w-full bg-gray-900 border border-gray-700 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 resize-none focus:outline-none transition-colors"
                  rows={4}
                  disabled={submitting}
                />
                <button
                  onClick={handleSubmitAnswer}
                  disabled={submitting || !answer.trim()}
                  className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-semibold transition-colors"
                >
                  {submitting ? "Evaluating..." : "Submit  ↵ Ctrl+Enter"}
                </button>
              </div>
            )}

            {phase === "teaching" && (
              <div className="p-4">
                <button
                  onClick={handleAfterTeaching}
                  className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors"
                >
                  I&apos;ve read the explanation → Answer the check question
                </button>
              </div>
            )}

            {isComplete && (
              <div className="p-4 space-y-3">
                <div
                  className={`text-center text-sm font-semibold py-2 rounded-lg ${
                    phase === "passed"
                      ? "bg-green-900/40 text-green-400 border border-green-800"
                      : "bg-amber-900/40 text-amber-400 border border-amber-800"
                  }`}
                >
                  {phase === "passed" ? "🎉 Full mastery unlocked!" : "✓ Partial mastery (assisted)"}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleRetry}
                    className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-300 text-sm hover:border-gray-500 transition-colors"
                  >
                    Try again
                  </button>
                  <Link
                    href="/problems"
                    className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors text-center"
                  >
                    Next problem →
                  </Link>
                </div>
              </div>
            )}

            {phase === "editing" && (
              <div className="p-4">
                <button
                  onClick={() => { handleRun(); setLeftTab("editor"); }}
                  disabled={running}
                  className="w-full py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white text-sm font-semibold transition-colors"
                >
                  {running ? "Running..." : "▶  Run to start gate"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ChatMessage ──────────────────────────────────────────────────────────────

function ChatMessage({ msg }: { msg: Message }) {
  if (msg.type === "code_result") {
    const passed = msg.content.startsWith("Error") ? false : true;
    return (
      <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${
        passed ? "border-green-900/50 bg-green-950/20 text-green-400" : "border-red-900/50 bg-red-950/20 text-red-400"
      }`}>
        <span>{passed ? "✓" : "✗"}</span>
        <span className="font-mono">{msg.content}</span>
      </div>
    );
  }

  if (msg.type === "teaching") {
    return (
      <div className="bg-amber-950/20 border border-amber-900/40 rounded-lg p-4 space-y-2">
        <div className="text-amber-400 text-xs font-semibold uppercase tracking-wider">
          Teaching
        </div>
        <div className="prose prose-invert prose-sm max-w-none text-gray-300">
          <ReactMarkdown>{msg.content}</ReactMarkdown>
        </div>
      </div>
    );
  }

  if (msg.type === "verdict") {
    const isFullPass = msg.content.includes("Full mastery");
    return (
      <div className={`text-sm text-center font-medium py-2 px-3 rounded-lg border ${
        isFullPass
          ? "bg-green-950/30 border-green-800 text-green-400"
          : "bg-amber-950/30 border-amber-800 text-amber-400"
      }`}>
        {msg.content}
      </div>
    );
  }

  if (msg.type === "hint") {
    return (
      <div className="text-xs text-gray-500 italic px-2">{msg.content}</div>
    );
  }

  // question or user answer
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-5 h-5 rounded-full bg-indigo-700 flex items-center justify-center text-xs text-white shrink-0 mt-0.5 mr-2">
          A
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
          isUser
            ? "bg-indigo-600/80 text-white"
            : "bg-gray-800 text-gray-200 border border-gray-700"
        }`}
      >
        {isUser ? (
          msg.content
        ) : (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractCheckQuestion(teachingText: string): string {
  const marker = "## Check";
  const idx = teachingText.indexOf(marker);
  if (idx === -1) return "";
  const after = teachingText.slice(idx + marker.length).trim();
  for (const line of after.split("\n")) {
    const t = line.trim();
    if (t) return t;
  }
  return "";
}
