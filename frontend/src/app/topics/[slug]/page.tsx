"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getTopic, getUserStats, TopicDetail, UserStats } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// ─── Tab types ────────────────────────────────────────────────────────────────

type Tab = "videos" | "problems";

// ─── YouTube embed ─────────────────────────────────────────────────────────────

function YouTubeEmbed({ youtubeId, title }: { youtubeId: string; title: string }) {
  return (
    <div className="rounded-lg overflow-hidden border border-slate-700/50 bg-slate-800">
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
      <div className="px-3 py-2 text-sm text-slate-200">{title}</div>
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
    return <div className="text-center py-16 text-slate-400 text-sm">No problems yet for this topic.</div>;
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
                  <div key={p.id} className="flex items-center gap-4 p-3 rounded-lg border border-slate-700/50 bg-slate-900 opacity-50 cursor-not-allowed">
                    <span className="text-slate-500 text-sm">🔒</span>
                    <div className="flex-1 text-sm text-slate-400">{p.title}</div>
                    <span className="text-xs text-slate-500">{DIFF_LOCK_LABEL[p.difficulty]}</span>
                    <span className={`text-xs font-medium ${DIFF_COLOR[p.difficulty] ?? "text-slate-300"}`}>{p.difficulty}</span>
                  </div>
                ) : (
                  <Link key={p.id} href={`/problems/${p.slug}`}
                    className={`flex items-center gap-4 p-3 rounded-lg border transition-colors group ${
                      p.gate_passed
                        ? "border-green-800 bg-green-950/20 hover:border-green-600"
                        : "border-slate-700/50 bg-slate-800 hover:border-cyan-700"
                    }`}>
                    <span className="text-sm">{p.gate_passed ? "✓" : "→"}</span>
                    <div className={`flex-1 text-sm transition-colors ${p.gate_passed ? "text-green-300" : "text-white group-hover:text-cyan-300"}`}>
                      {p.title}
                    </div>
                    {p.gate_passed && <span className="text-xs text-green-600">Passed</span>}
                    <span className={`text-xs font-medium ${DIFF_COLOR[p.difficulty] ?? "text-slate-300"}`}>{p.difficulty}</span>
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
      <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-600/50 rounded-full px-3 py-1">
        <span className="text-cyan-400 text-xs font-bold">Lv.{stats.level}</span>
        <div className="w-20 h-1.5 bg-slate-600 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-slate-400 text-xs">{stats.xp} XP</span>
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

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !slug) return;
    Promise.all([getTopic(slug), getUserStats()])
      .then(([t, s]) => {
        setTopic(t);
        setUserStats(s);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user, slug]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading topic...</div>
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
    <div className="min-h-screen bg-slate-900">
      {/* Nav */}
      <nav className="border-b border-slate-700/50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/topics" className="text-white font-bold text-lg">Logos</Link>
          <Link href="/topics" className="text-slate-300 text-sm hover:text-white transition-colors">
            ← Curriculum
          </Link>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <NavXP stats={userStats} />
          <span className="text-slate-400 hidden sm:block">{user?.email}</span>
          <button onClick={logout} className="text-slate-300 hover:text-white transition-colors">
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Topic header */}
        <div className="mb-6">
          {/* Cinematic cover image */}
          <div className="w-full h-52 rounded-2xl overflow-hidden mb-5 bg-slate-800 border border-slate-700/50">
            <img
              src={`/images/topic_${topic.slug}.png`}
              alt={topic.title}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
          <div className="flex items-start gap-4">
            <div className="text-4xl">{topic.icon}</div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">{topic.title}</h1>
              <p className="text-slate-300 text-sm mt-1">{topic.description}</p>
              {/* Progress bar */}
              {totalSubtopics > 0 && (
                <div className="mt-3 max-w-xs">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>{totalPassed}/{totalSubtopics} subtopics passed</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-slate-700/50">
          {(["videos", "problems"] as Tab[]).map((t) => {
            const labels = { videos: "Videos", problems: "Problems" };
            const counts = {
              videos: topic.videos.length,
              problems: topic.subtopics.reduce((s, st) => s + st.problems.length, 0),
            };
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  tab === t
                    ? "border-cyan-500 text-cyan-300"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                {labels[t as keyof typeof labels]}
                {(counts[t as keyof typeof counts] ?? 0) > 0 && (
                  <span className="ml-1.5 text-xs text-slate-500">({counts[t as keyof typeof counts]})</span>
                )}
              </button>
            );
          })}

          {/* Learn with AI — opens dedicated page */}
          {topic.subtopics.some(st => st.play_cards.length > 0) && (
            <Link
              href={`/topics/${topic.slug}/learn`}
              className="px-4 py-2 text-sm font-medium text-cyan-400 hover:text-cyan-300 border-b-2 border-transparent -mb-px transition-colors flex items-center gap-1.5"
            >
              Learn with AI
              <span className="text-xs text-slate-500">
                ({topic.subtopics.reduce((s, st) => s + st.play_cards.length, 0)})
              </span>
              <span className="text-xs">↗</span>
            </Link>
          )}
        </div>

        {/* Tab content */}
        {tab === "videos" && (
          <div>
            {topic.videos.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm">
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

        {tab === "problems" && <ProblemsTab topic={topic} />}
      </main>
    </div>
  );
}
