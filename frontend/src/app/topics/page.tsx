"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { listTopics, TopicListItem } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  indigo:  { bg: "bg-indigo-950",  border: "border-indigo-700",  text: "text-indigo-300",  icon: "bg-indigo-700"  },
  blue:    { bg: "bg-blue-950",    border: "border-blue-700",    text: "text-blue-300",    icon: "bg-blue-700"    },
  cyan:    { bg: "bg-cyan-950",    border: "border-cyan-700",    text: "text-cyan-300",    icon: "bg-cyan-700"    },
  teal:    { bg: "bg-teal-950",    border: "border-teal-700",    text: "text-teal-300",    icon: "bg-teal-700"    },
  green:   { bg: "bg-green-950",   border: "border-green-700",   text: "text-green-300",   icon: "bg-green-700"   },
  yellow:  { bg: "bg-yellow-950",  border: "border-yellow-700",  text: "text-yellow-300",  icon: "bg-yellow-700"  },
  orange:  { bg: "bg-orange-950",  border: "border-orange-700",  text: "text-orange-300",  icon: "bg-orange-700"  },
  red:     { bg: "bg-red-950",     border: "border-red-700",     text: "text-red-300",     icon: "bg-red-700"     },
  purple:  { bg: "bg-purple-950",  border: "border-purple-700",  text: "text-purple-300",  icon: "bg-purple-700"  },
  pink:    { bg: "bg-pink-950",    border: "border-pink-700",    text: "text-pink-300",    icon: "bg-pink-700"    },
  violet:  { bg: "bg-violet-950",  border: "border-violet-700",  text: "text-violet-300",  icon: "bg-violet-700"  },
  emerald: { bg: "bg-emerald-950", border: "border-emerald-700", text: "text-emerald-300", icon: "bg-emerald-700" },
  sky:     { bg: "bg-sky-950",     border: "border-sky-700",     text: "text-sky-300",     icon: "bg-sky-700"     },
};

function getColors(color: string, unlocked: boolean) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.indigo;
  if (!unlocked) {
    return {
      bg: "bg-gray-900",
      border: "border-gray-800",
      text: "text-gray-600",
      icon: "bg-gray-800",
    };
  }
  return c;
}

function ProgressBar({ passed, total }: { passed: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((passed / total) * 100);
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{passed}/{total} subtopics</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function TopicCard({ topic }: { topic: TopicListItem }) {
  const completed = topic.subtopics_passed === topic.subtopics_total && topic.subtopics_total > 0;
  const colors = getColors(topic.color, topic.unlocked);

  const card = (
    <div
      className={`
        relative p-4 rounded-xl border transition-all
        ${colors.bg} ${colors.border}
        ${topic.unlocked ? "hover:scale-[1.02] hover:shadow-lg cursor-pointer" : "opacity-60 cursor-not-allowed"}
      `}
    >
      {/* Completion badge */}
      {completed && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs">
          ✓
        </div>
      )}

      {/* Lock overlay */}
      {!topic.unlocked && (
        <div className="absolute top-3 right-3 text-gray-600 text-sm">🔒</div>
      )}

      {/* Icon + Title */}
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg ${colors.icon} flex items-center justify-center text-xl flex-shrink-0`}>
          {topic.icon}
        </div>
        <div className="min-w-0">
          <div className={`font-semibold text-sm leading-tight ${topic.unlocked ? "text-white" : "text-gray-600"}`}>
            {topic.title}
          </div>
          <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{topic.description}</div>
        </div>
      </div>

      {/* Prerequisites */}
      {topic.prerequisites.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {topic.prerequisites.map((p) => (
            <span key={p} className="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">
              {p.replace(/-/g, " ")}
            </span>
          ))}
        </div>
      )}

      {/* Progress */}
      {topic.unlocked && <ProgressBar passed={topic.subtopics_passed} total={topic.subtopics_total} />}
    </div>
  );

  if (!topic.unlocked) return card;

  return <Link href={`/topics/${topic.slug}`}>{card}</Link>;
}

export default function TopicsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [topics, setTopics] = useState<TopicListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    listTopics()
      .then(setTopics)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user]);

  // Group topics by level
  const maxLevel = topics.reduce((m, t) => Math.max(m, t.level), 0);
  const levels: TopicListItem[][] = Array.from({ length: maxLevel + 1 }, (_, i) =>
    topics.filter((t) => t.level === i).sort((a, b) => a.position_in_level - b.position_in_level)
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 text-sm">Loading curriculum...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/topics" className="text-white font-bold text-lg">Logos</Link>
          <Link href="/topics" className="text-indigo-400 text-sm">Curriculum</Link>
          <Link href="/problems" className="text-gray-400 text-sm hover:text-white transition-colors">Problems</Link>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500">{user?.email}</span>
          <button onClick={logout} className="text-gray-400 hover:text-white transition-colors">
            Sign out
          </button>
        </div>
      </nav>

      <main className="px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Algorithm Curriculum</h1>
          <p className="text-gray-400 text-sm mt-1">
            Complete each topic to unlock the next. Pass the gate for every subtopic to advance.
          </p>
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {/* Flowchart: horizontal scroll with levels as columns */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-max">
            {levels.map((levelTopics, level) => (
              <div key={level} className="flex flex-col gap-4">
                {/* Level label */}
                <div className="text-xs text-gray-600 font-medium text-center px-2">
                  {level === 0 ? "Start" : `Level ${level}`}
                </div>

                {/* Topic cards */}
                <div className="flex flex-col gap-3 w-52">
                  {levelTopics.map((topic) => (
                    <TopicCard key={topic.id} topic={topic} />
                  ))}
                </div>

                {/* Arrow connector (except last level) */}
                {level < maxLevel && (
                  <div className="absolute" style={{ display: "none" }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-8 flex flex-wrap gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-indigo-700" />
            <span>Unlocked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gray-800 border border-gray-700" />
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
