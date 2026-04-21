"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { listTopics, getUserStats, TopicListItem, UserStats } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  indigo:  { bg: "bg-indigo-50",  border: "border-indigo-200",  text: "text-indigo-700",  icon: "bg-indigo-100"  },
  blue:    { bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-700",    icon: "bg-blue-100"    },
  cyan:    { bg: "bg-cyan-50",    border: "border-cyan-200",    text: "text-cyan-700",    icon: "bg-cyan-100"    },
  teal:    { bg: "bg-teal-50",    border: "border-teal-200",    text: "text-teal-700",    icon: "bg-teal-100"    },
  green:   { bg: "bg-green-50",   border: "border-green-200",   text: "text-green-700",   icon: "bg-green-100"   },
  yellow:  { bg: "bg-yellow-50",  border: "border-yellow-200",  text: "text-yellow-700",  icon: "bg-yellow-100"  },
  orange:  { bg: "bg-orange-50",  border: "border-orange-200",  text: "text-orange-700",  icon: "bg-orange-100"  },
  red:     { bg: "bg-red-50",     border: "border-red-200",     text: "text-red-700",     icon: "bg-red-100"     },
  purple:  { bg: "bg-purple-50",  border: "border-purple-200",  text: "text-purple-700",  icon: "bg-purple-100"  },
  pink:    { bg: "bg-pink-50",    border: "border-pink-200",    text: "text-pink-700",    icon: "bg-pink-100"    },
  violet:  { bg: "bg-violet-50",  border: "border-violet-200",  text: "text-violet-700",  icon: "bg-violet-100"  },
  emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", icon: "bg-emerald-100" },
  sky:     { bg: "bg-sky-50",     border: "border-sky-200",     text: "text-sky-700",     icon: "bg-sky-100"     },
};

function getColors(color: string, unlocked: boolean) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.indigo;
  if (!unlocked) {
    return { bg: "bg-zinc-50", border: "border-zinc-200", text: "text-zinc-400", icon: "bg-zinc-100" };
  }
  return c;
}

function ProgressBar({ passed, total }: { passed: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((passed / total) * 100);
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-zinc-500 mb-1">
        <span>{passed}/{total} subtopics</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1 bg-zinc-200 rounded-full overflow-hidden">
        <div className="h-full bg-sky-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function TopicCard({ topic }: { topic: TopicListItem }) {
  const completed = topic.subtopics_passed === topic.subtopics_total && topic.subtopics_total > 0;
  const colors = getColors(topic.color, topic.unlocked);

  const card = (
    <div className={`relative p-4 rounded-xl border transition-all ${colors.bg} ${colors.border} ${
      topic.unlocked ? "hover:scale-[1.02] hover:shadow-md cursor-pointer shadow-sm" : "opacity-60 cursor-not-allowed"
    }`}>
      {completed && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs text-white">✓</div>
      )}
      {!topic.unlocked && (
        <div className="absolute top-3 right-3 text-zinc-400 text-sm">🔒</div>
      )}
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg ${colors.icon} flex items-center justify-center text-xl flex-shrink-0`}>
          {topic.icon}
        </div>
        <div className="min-w-0">
          <div className={`font-semibold text-sm leading-tight ${topic.unlocked ? "text-zinc-800" : "text-zinc-400"}`}>
            {topic.title}
          </div>
          <div className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{topic.description}</div>
        </div>
      </div>
      {topic.prerequisites.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {topic.prerequisites.map((p) => (
            <span key={p} className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 border border-zinc-200">
              {p.replace(/-/g, " ")}
            </span>
          ))}
        </div>
      )}
      {topic.unlocked && <ProgressBar passed={topic.subtopics_passed} total={topic.subtopics_total} />}
    </div>
  );

  if (!topic.unlocked) return card;
  return <Link href={`/topics/${topic.slug}`}>{card}</Link>;
}

function NavXP({ stats }: { stats: UserStats | null }) {
  if (!stats) return null;
  const pct = Math.round((stats.xp_in_level / stats.xp_to_next) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 bg-white border border-zinc-200 rounded-full px-3 py-1 shadow-sm">
        <span className="text-sky-600 text-xs font-bold">Lv.{stats.level}</span>
        <div className="w-20 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
          <div className="h-full bg-sky-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-zinc-500 text-xs">{stats.xp} XP</span>
      </div>
      {stats.streak_days >= 2 && (
        <span className="text-xs text-orange-500 font-semibold">🔥{stats.streak_days}</span>
      )}
    </div>
  );
}

export default function TopicsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [topics, setTopics] = useState<TopicListItem[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([listTopics(), getUserStats()])
      .then(([t, s]) => { setTopics(t); setStats(s); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user]);

  const maxLevel = topics.reduce((m, t) => Math.max(m, t.level), 0);
  const levels: TopicListItem[][] = Array.from({ length: maxLevel + 1 }, (_, i) =>
    topics.filter((t) => t.level === i).sort((a, b) => a.position_in_level - b.position_in_level)
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-zinc-500 text-sm">Loading curriculum...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-zinc-800">
      <nav className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/topics" className="text-zinc-800 font-bold text-lg">Logos</Link>
          <Link href="/topics" className="text-sky-600 text-sm font-medium">Curriculum</Link>
          <Link href="/problems" className="text-zinc-600 text-sm hover:text-zinc-800 transition-colors">Problems</Link>
          <Link href="/demo" className="text-emerald-600 text-sm hover:text-emerald-700 transition-colors">Demo Course</Link>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <NavXP stats={stats} />
          <span className="text-zinc-400 hidden sm:block">{user?.email}</span>
          <button onClick={logout} className="text-zinc-600 hover:text-zinc-800 transition-colors">Sign out</button>
        </div>
      </nav>

      <main className="px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-800">Algorithm Curriculum</h1>
          <p className="text-zinc-600 text-sm mt-1">Complete each topic to unlock the next. Pass the gate for every subtopic to advance.</p>
        </div>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <div className="overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-max">
            {levels.map((levelTopics, level) => (
              <div key={level} className="flex flex-col gap-4">
                <div className="text-xs text-zinc-400 font-medium text-center px-2">
                  {level === 0 ? "Start" : `Level ${level}`}
                </div>
                <div className="flex flex-col gap-3 w-52">
                  {levelTopics.map((topic) => (
                    <TopicCard key={topic.id} topic={topic} />
                  ))}
                </div>
                {level < maxLevel && <div className="absolute" style={{ display: "none" }} />}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-sky-200 border border-sky-300" />
            <span>Unlocked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-zinc-200 border border-zinc-300" />
            <span>Locked (complete prerequisites first)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span>Completed</span>
          </div>
        </div>
      </main>
    </div>
  );
}
