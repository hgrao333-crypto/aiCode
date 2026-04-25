"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const STAGE_LABELS = [
  { key: "1", title: "The Thief's Choice", icon: "🎒" },
  { key: "2", title: "Overlapping Subproblems", icon: "🔁" },
  { key: "3", title: "Building the Table", icon: "📊" },
  { key: "4", title: "One Row is Enough", icon: "➡️" },
  { key: "5", title: "Variations", icon: "🔀" },
];

export default function AiConfigPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("general");

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

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center text-zinc-500 text-sm">Loading...</div>;
  }

  return (
    <div className="min-h-screen text-zinc-800">
      <nav className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-zinc-500 text-sm hover:text-zinc-800 transition-colors">← Admin</Link>
          <span className="text-zinc-300">|</span>
          <span className="text-sm font-medium text-zinc-700">AI Model Config</span>
          <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full border border-amber-200 font-semibold">ADMIN</span>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-xs text-emerald-600 font-medium">✓ Saved to DB</span>}
          {error && <span className="text-xs text-red-600 max-w-xs truncate">{error}</span>}
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {saving ? "Saving…" : "Save All"}
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Tab bar */}
        <div className="flex gap-1 mb-6 border-b border-zinc-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab("general")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
              activeTab === "general" ? "border-sky-500 text-sky-700" : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
          >
            ⚙️ General
          </button>
          {STAGE_LABELS.map(s => (
            <button
              key={s.key}
              onClick={() => setActiveTab(s.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                activeTab === s.key ? "border-sky-500 text-sky-700" : "border-transparent text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {s.icon} Stage {s.key}
            </button>
          ))}
        </div>

        {/* General tab */}
        {activeTab === "general" && (
          <div className="space-y-5 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Gemini Model</label>
              <input
                type="text"
                value={config.gemini_model ?? ""}
                onChange={e => update("gemini_model", e.target.value)}
                className="w-full text-sm font-mono border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-sky-400 text-zinc-800"
                placeholder="gemini-2.5-flash"
              />
              <p className="text-xs text-zinc-400 mt-1">Model used for all Socratic tutor responses.</p>
            </div>
          </div>
        )}

        {/* Stage tabs */}
        {STAGE_LABELS.map(s => activeTab === s.key && (
          <div key={s.key} className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{s.icon}</span>
              <h2 className="text-lg font-semibold text-zinc-800">Stage {s.key}: {s.title}</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                System Prompt
                <span className="ml-2 text-xs text-zinc-400 font-normal">Controls the AI&apos;s Socratic guidance for this stage</span>
              </label>
              <textarea
                value={config[`tutor_system_${s.key}`] ?? ""}
                onChange={e => update(`tutor_system_${s.key}`, e.target.value)}
                rows={18}
                spellCheck={false}
                className="w-full text-xs font-mono border border-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:border-sky-400 resize-y bg-zinc-950 text-emerald-300 leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Opening Message
                <span className="ml-2 text-xs text-zinc-400 font-normal">Injected into system prompt as context for the first student message</span>
              </label>
              <textarea
                value={config[`stage_opener_${s.key}`] ?? ""}
                onChange={e => update(`stage_opener_${s.key}`, e.target.value)}
                rows={4}
                className="w-full text-sm border border-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:border-sky-400 resize-y text-zinc-800"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
