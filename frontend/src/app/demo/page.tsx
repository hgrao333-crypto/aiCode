"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { listTopics, getUserStats, TopicListItem, UserStats } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

function NavXP({ stats }: { stats: UserStats | null }) {
  if (!stats) return null;
  const pct = Math.round((stats.xp_in_level / stats.xp_to_next) * 100);
  return (
    <div className="flex items-center gap-1.5 bg-white border border-zinc-200 rounded-full px-3 py-1 shadow-sm">
      <span className="text-sky-600 text-xs font-bold">Lv.{stats.level}</span>
      <div className="w-20 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
        <div className="h-full bg-sky-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-zinc-500 text-xs">{stats.xp} XP</span>
    </div>
  );
}

function CourseCard({ topic }: { topic: TopicListItem }) {
  const pct = topic.subtopics_total === 0 ? 0 : Math.round((topic.subtopics_passed / topic.subtopics_total) * 100);
  const started = topic.subtopics_passed > 0;
  const completed = pct === 100 && topic.subtopics_total > 0;

  return (
    <Link href={`/topics/${topic.slug}`}>
      <div className="group relative p-8 rounded-2xl border border-emerald-200 bg-white hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer">
        {completed && (
          <div className="absolute -top-3 -right-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-sm font-bold text-white">✓</div>
        )}

        <div className="w-full h-48 rounded-xl overflow-hidden mb-6 bg-emerald-50">
          <img
            src={`/images/topic_${topic.slug}.png`}
            alt={topic.title}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>

        <div className="flex items-start gap-5 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-4xl flex-shrink-0">
            {topic.icon}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200 font-semibold">
                DEMO COURSE
              </span>
              {started && !completed && (
                <span className="text-xs px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full border border-sky-200">In progress</span>
              )}
              {completed && (
                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full border border-green-200">Completed</span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-zinc-800">{topic.title}</h2>
            <p className="text-zinc-600 text-sm mt-1 max-w-lg">{topic.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {[
            { icon: "🌳", label: "Brute force → DP" },
            { icon: "📝", label: "5 subtopics" },
            { icon: "💻", label: "15 coding problems" },
            { icon: "🧩", label: "Recognition exercises" },
            { icon: "🐛", label: "Debugging challenges" },
            { icon: "🎙️", label: "Voice-guided cards" },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-2 text-sm text-zinc-600">
              <span>{f.icon}</span>
              <span>{f.label}</span>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-xs text-zinc-500 mb-2">
            <span>{topic.subtopics_passed} / {topic.subtopics_total} subtopics passed</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
          completed ? "bg-green-600 hover:bg-green-500 text-white"
            : started ? "bg-emerald-600 hover:bg-emerald-500 text-white"
            : "bg-emerald-600 hover:bg-emerald-500 text-white"
        }`}>
          {completed ? "Review course" : started ? "Continue learning" : "Start course"}
          <span>→</span>
        </div>
      </div>
    </Link>
  );
}

export default function DemoPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [topics, setTopics] = useState<TopicListItem[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([listTopics("demo"), getUserStats()])
      .then(([t, s]) => { setTopics(t); setStats(s); })
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center text-zinc-500 text-sm">Loading...</div>;
  }

  return (
    <div className="min-h-screen text-zinc-800">
      <nav className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/demo" className="text-zinc-800 font-bold text-lg">Logos</Link>
          <Link href="/demo" className="text-emerald-600 text-sm font-medium">Demo Course</Link>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <NavXP stats={stats} />
          <span className="text-zinc-400 hidden sm:block">{user?.email}</span>
          <button onClick={logout} className="text-zinc-600 hover:text-zinc-800 transition-colors">Sign out</button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-zinc-800 mb-2">Demo Course</h1>
          <p className="text-zinc-600">
            A complete depth-first learning experience — five angles on one concept until it&apos;s genuinely yours.
          </p>
        </div>

        {topics.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 text-sm">No demo courses available yet.</div>
        ) : (
          <div className="space-y-4">
            {topics.map((t) => <CourseCard key={t.id} topic={t} />)}
          </div>
        )}
      </main>
    </div>
  );
}
