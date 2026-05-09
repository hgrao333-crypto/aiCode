"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// Registry of every topic that has a tutor config — add new ones here as they're built
const TOPIC_CONFIGS = [
  {
    slug: "knapsack",
    title: "Knapsack (Demo DP)",
    icon: "🎒",
    stages: [
      { n: 1, title: "The Thief's Choice" },
      { n: 2, title: "Overlapping Subproblems" },
      { n: 3, title: "Building the Table" },
      { n: 4, title: "One Row is Enough" },
      { n: 5, title: "Variations" },
    ],
  },
  {
    slug: "dynamic-programming",
    title: "Dynamic Programming",
    icon: "📊",
    stages: [
      { n: 1, title: "The Thief's Choice" },
      { n: 2, title: "Overlapping Subproblems" },
      { n: 3, title: "Building the Table" },
      { n: 4, title: "One Row is Enough" },
      { n: 5, title: "Variations" },
    ],
  },
  {
    slug: "arrays-hashing",
    title: "Arrays & Hashing",
    icon: "🧱",
    stages: [
      { n: 1, title: "Memory & Indexing" },
      { n: 2, title: "How Hashing Works" },
      { n: 3, title: "The Complement Trick" },
    ],
  },
  {
    slug: "two-pointers",
    title: "Two Pointers",
    icon: "👆👆",
    stages: [],
  },
  {
    slug: "sliding-window",
    title: "Sliding Window",
    icon: "🪟",
    stages: [],
  },
  {
    slug: "binary-search",
    title: "Binary Search",
    icon: "🔍",
    stages: [],
  },
  {
    slug: "stack",
    title: "Stack",
    icon: "📚",
    stages: [],
  },
  {
    slug: "linked-list",
    title: "Linked List",
    icon: "🔗",
    stages: [],
  },
  {
    slug: "trees",
    title: "Trees",
    icon: "🌲",
    stages: [],
  },
];

export default function AiConfigPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [activeTopic, setActiveTopic] = useState("__general__");
  const [activeStage, setActiveStage] = useState(1);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/auth/login"); return; }
    if (!user.is_admin) { router.replace("/demo"); return; }
    adminApi.getAiConfig()
      .then(setConfig)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  function update(key: string, value: string) {
    setConfig(prev => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      await adminApi.saveAiConfig(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function selectTopic(slug: string) {
    setActiveTopic(slug);
    const topic = TOPIC_CONFIGS.find(t => t.slug === slug);
    setActiveStage(topic?.stages[0]?.n ?? 1);
  }

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center text-bark-500 text-sm">Loading…</div>;
  }

  const currentTopic = TOPIC_CONFIGS.find(t => t.slug === activeTopic);

  return (
    <div className="min-h-screen text-bark-900 flex flex-col">
      {/* Nav */}
      <nav className="border-b border-bark-200 bg-bark-50/90 backdrop-blur-sm sticky top-0 z-10 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-bark-500 text-sm hover:text-bark-900 transition-colors">← Admin</Link>
          <span className="text-bark-300">|</span>
          <span className="text-sm font-medium text-bark-700">AI Tutor Config</span>
          <span className="text-xs px-2 py-0.5 bg-saffron-100 text-saffron-700 rounded-full border border-saffron-200 font-semibold">ADMIN</span>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-xs text-leaf-600 font-medium">✓ Saved</span>}
          {error && <span className="text-xs text-red-600 max-w-xs truncate">{error}</span>}
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-1.5 rounded-lg bg-leaf-700 hover:bg-leaf-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {saving ? "Saving…" : "Save All"}
          </button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: topic list */}
        <aside className="w-56 flex-shrink-0 border-r border-bark-200 bg-bark-50 overflow-y-auto">
          <div className="p-3 space-y-0.5">
            {/* General */}
            <button
              onClick={() => setActiveTopic("__general__")}
              className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeTopic === "__general__"
                  ? "bg-leaf-700 text-white font-medium"
                  : "text-bark-700 hover:bg-bark-100"
              }`}
            >
              <span>⚙️</span>
              <span>General</span>
            </button>

            <div className="pt-3 pb-1 px-3 text-[10px] font-semibold text-bark-400 uppercase tracking-widest">
              Tutor Configs
            </div>

            {TOPIC_CONFIGS.map(topic => (
              <button
                key={topic.slug}
                onClick={() => selectTopic(topic.slug)}
                className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeTopic === topic.slug
                    ? "bg-leaf-700 text-white font-medium"
                    : "text-bark-700 hover:bg-bark-100"
                }`}
              >
                <span>{topic.icon}</span>
                <span className="truncate">{topic.title}</span>
                {topic.stages.length === 0 && (
                  <span className="ml-auto text-[10px] opacity-50">—</span>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-8 py-7 max-w-4xl">

          {/* General settings */}
          {activeTopic === "__general__" && (
            <div className="space-y-6 max-w-lg">
              <h2 className="font-display text-xl font-bold text-bark-900">General Settings</h2>
              <div>
                <label className="block text-sm font-medium text-bark-700 mb-1">Gemini Model</label>
                <input
                  type="text"
                  value={config.gemini_model ?? ""}
                  onChange={e => update("gemini_model", e.target.value)}
                  className="w-full text-sm font-mono border border-bark-200 rounded-lg px-3 py-2 focus:outline-none focus:border-leaf-400 bg-white text-bark-800"
                  placeholder="gemini-2.5-flash-preview-05-20"
                />
                <p className="text-xs text-bark-400 mt-1">Model used for all Socratic tutor responses.</p>
              </div>
            </div>
          )}

          {/* Topic with no stages yet */}
          {currentTopic && currentTopic.stages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="text-4xl mb-4">{currentTopic.icon}</div>
              <h3 className="font-display text-lg font-semibold text-bark-700 mb-2">{currentTopic.title}</h3>
              <p className="text-sm text-bark-400 max-w-xs">
                No AI tutor config has been built for this topic yet. Add stages to{" "}
                <code className="font-mono text-xs bg-bark-100 px-1 py-0.5 rounded">TOPIC_TUTOR_SYSTEMS</code>{" "}
                in <code className="font-mono text-xs bg-bark-100 px-1 py-0.5 rounded">socratic_engine.py</code> to unlock editing here.
              </p>
            </div>
          )}

          {/* Topic with stages */}
          {currentTopic && currentTopic.stages.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">{currentTopic.icon}</span>
                <h2 className="font-display text-xl font-bold text-bark-900">{currentTopic.title}</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-bark-100 text-bark-500 border border-bark-200 font-mono">
                  {currentTopic.stages.length} stages
                </span>
              </div>

              {/* Stage pill tabs */}
              <div className="flex gap-1.5 flex-wrap mb-7">
                {currentTopic.stages.map(s => (
                  <button
                    key={s.n}
                    onClick={() => setActiveStage(s.n)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      activeStage === s.n
                        ? "bg-leaf-700 text-white border-leaf-700"
                        : "bg-bark-50 text-bark-600 border-bark-200 hover:border-leaf-300 hover:text-leaf-700"
                    }`}
                  >
                    Stage {s.n} — {s.title}
                  </button>
                ))}
              </div>

              {currentTopic.stages.filter(s => s.n === activeStage).map(s => {
                const sysKey = `${currentTopic.slug}_system_${s.n}`;
                const openerKey = `${currentTopic.slug}_opener_${s.n}`;
                return (
                  <div key={s.n} className="space-y-6">
                    {/* System prompt */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-bark-700">
                          System Prompt
                        </label>
                        <span className="text-xs font-mono text-bark-400 bg-bark-100 px-2 py-0.5 rounded border border-bark-200">
                          {sysKey}
                        </span>
                      </div>
                      <p className="text-xs text-bark-400 mb-2">
                        Controls the AI&apos;s Socratic guidance strategy, hint ladder, and [ADVANCE] conditions for this stage.
                      </p>
                      <textarea
                        value={config[sysKey] ?? ""}
                        onChange={e => update(sysKey, e.target.value)}
                        rows={20}
                        spellCheck={false}
                        className="w-full text-xs font-mono border border-bark-200 rounded-xl px-4 py-3 focus:outline-none focus:border-leaf-400 resize-y bg-zinc-950 text-emerald-300 leading-relaxed"
                        placeholder={`System prompt for ${currentTopic.title} stage ${s.n}…`}
                      />
                    </div>

                    {/* Opener */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-bark-700">
                          Opening Question
                        </label>
                        <span className="text-xs font-mono text-bark-400 bg-bark-100 px-2 py-0.5 rounded border border-bark-200">
                          {openerKey}
                        </span>
                      </div>
                      <p className="text-xs text-bark-400 mb-2">
                        The first message shown to the student. Also injected into the system prompt so the AI knows what it asked.
                      </p>
                      <textarea
                        value={config[openerKey] ?? ""}
                        onChange={e => update(openerKey, e.target.value)}
                        rows={4}
                        className="w-full text-sm border border-bark-200 rounded-xl px-4 py-3 focus:outline-none focus:border-leaf-400 resize-y bg-white text-bark-800"
                        placeholder={`Opening question for stage ${s.n}…`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
