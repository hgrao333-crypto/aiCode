"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { listTopics, TopicListItem } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

function DSACourseCard({ topics }: { topics: TopicListItem[] }) {
  const totalSubtopics = topics.reduce((s, t) => s + t.subtopics_total, 0);
  const passedSubtopics = topics.reduce((s, t) => s + t.subtopics_passed, 0);
  const pct = totalSubtopics === 0 ? 0 : Math.round((passedSubtopics / totalSubtopics) * 100);
  const started = passedSubtopics > 0;
  const completed = pct === 100 && totalSubtopics > 0;

  return (
    <Link href="/topics">
      <div className="group relative p-8 rounded-2xl border border-leaf-200 bg-white hover:border-leaf-400 hover:shadow-lg transition-all cursor-pointer">
        {completed && (
          <div className="absolute -top-3 -right-3 w-8 h-8 bg-leaf-600 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm">✓</div>
        )}

        <div className="flex items-start gap-5 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-leaf-700 flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-3xl">🌳</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs px-2.5 py-0.5 bg-leaf-100 text-leaf-700 rounded-full border border-leaf-200 font-semibold">COURSE</span>
              <span className="text-xs px-2.5 py-0.5 bg-bark-100 text-bark-600 rounded-full border border-bark-200">Algorithms & DSA</span>
              {started && !completed && (
                <span className="text-xs px-2.5 py-0.5 bg-saffron-100 text-saffron-700 rounded-full border border-saffron-200">In progress</span>
              )}
            </div>
            <h2 className="font-display text-2xl font-bold text-bark-900">Data Structures & Algorithms</h2>
            <p className="text-bark-500 text-sm mt-1">
              From arrays to dynamic programming — master every core pattern with an AI tutor that forces you to explain before it helps.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { icon: "📚", label: `${topics.length} topics` },
            { icon: "🧩", label: `${totalSubtopics} subtopics` },
            { icon: "💻", label: "Coding problems" },
            { icon: "🔒", label: "Mastery-gated" },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-2 text-sm text-bark-600">
              <span>{f.icon}</span>
              <span>{f.label}</span>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-xs text-bark-500 mb-2">
            <span>{passedSubtopics} / {totalSubtopics} subtopics passed</span>
            <span className="font-semibold text-leaf-700">{pct}%</span>
          </div>
          <div className="h-2 bg-bark-100 rounded-full overflow-hidden">
            <div className="h-full bg-leaf-600 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm ${
          completed ? "bg-leaf-700 hover:bg-leaf-600 text-white"
            : started ? "bg-saffron-600 hover:bg-saffron-500 text-white"
            : "bg-leaf-700 hover:bg-leaf-600 text-white"
        }`}>
          {completed ? "Review course" : started ? "Continue learning" : "Start course"}
          <span>→</span>
        </div>
      </div>
    </Link>
  );
}


function IncidentLabCard() {
  return (
    <Link href="/incidents">
      <div className="group relative p-8 rounded-2xl border border-zinc-700 bg-zinc-900 hover:border-zinc-500 hover:shadow-md transition-all cursor-pointer">
        <div className="absolute -top-3 -right-3 flex items-center gap-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-mono px-2 py-0.5 rounded-full">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          beta
        </div>

        <div className="w-full h-48 rounded-xl overflow-hidden mb-6 bg-zinc-800 flex items-center justify-center">
          <div className="font-mono text-xs text-zinc-300 text-left w-full p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-red-500/70" />
              <span className="h-2 w-2 rounded-full bg-amber-500/70" />
              <span className="h-2 w-2 rounded-full bg-emerald-500/70" />
              <span className="ml-1 text-zinc-500 text-xs">~/incidentlab</span>
            </div>
            <div className="text-zinc-400">$ <span className="text-zinc-300">psql -c &quot;SELECT count(*) FROM pg_stat_statements&quot;</span></div>
            <div className="text-red-400 mt-1"> count: 51  {"<-- N+1 confirmed"}</div>
            <div className="text-zinc-400 mt-1">$ <span className="text-zinc-300">make check</span></div>
            <div className="text-emerald-400 mt-1">✔ incident resolved</div>
          </div>
        </div>

        <div className="flex items-start gap-5 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-3xl flex-shrink-0">
            🔥
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded-full border border-zinc-700 font-semibold">
                DEMO COURSE
              </span>
              <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full border border-red-500/30">On-call sim</span>
            </div>
            <h2 className="text-2xl font-bold text-zinc-100">IncidentLab</h2>
            <p className="text-zinc-400 text-sm mt-1">
              Drop into realistic production outages — slow queries, OOMKilled pods — with a real editor, terminal, and metrics. Watch, quiz, fix. Earn badges.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {[
            { icon: "▶️", label: "Micro-video lessons" },
            { icon: "✅", label: "4-question quizzes" },
            { icon: "⚡", label: "Monaco + terminal" },
            { icon: "🐘", label: "Postgres N+1" },
            { icon: "☸️", label: "K8s OOMKilled" },
            { icon: "🏅", label: "Earn badges" },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-2 text-sm text-zinc-400">
              <span>{f.icon}</span>
              <span>{f.label}</span>
            </div>
          ))}
        </div>

        <div className="mb-6 space-y-2">
          <div className="text-xs text-zinc-500 mb-2">2 incidents available</div>
          {[
            { slug: "postgres-n-plus-1", title: "Postgres N+1 Killing the API", difficulty: "MEDIUM", domain: "Backend · Database" },
            { slug: "k8s-oomkilled", title: "K8s Pod OOMKilled on Deploy", difficulty: "HARD", domain: "DevOps · Kubernetes" },
          ].map((inc) => (
            <div key={inc.slug} className="flex items-center justify-between bg-zinc-800 rounded-lg px-3 py-2 border border-zinc-700">
              <span className="text-sm text-zinc-300 font-mono">{inc.title}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">{inc.domain}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${inc.difficulty === "HARD" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"}`}>
                  {inc.difficulty}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-bark-700 hover:bg-bark-600 text-bark-100 transition-colors shadow-sm">
          Open IncidentLab
          <span>→</span>
        </div>
      </div>
    </Link>
  );
}

function CourseCard({ topic }: { topic: TopicListItem }) {
  const pct = topic.subtopics_total === 0 ? 0 : Math.round((topic.subtopics_passed / topic.subtopics_total) * 100);
  const started = topic.subtopics_passed > 0;
  const completed = pct === 100 && topic.subtopics_total > 0;

  return (
    <Link href={`/topics/${topic.slug}`}>
      <div className="group relative p-8 rounded-2xl border border-bark-200 bg-white hover:border-leaf-300 hover:shadow-lg transition-all cursor-pointer">
        {completed && (
          <div className="absolute -top-3 -right-3 w-8 h-8 bg-leaf-600 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm">✓</div>
        )}

        <div className="w-full h-48 rounded-xl overflow-hidden mb-6 bg-bark-100">
          <img
            src={`/images/topic_${topic.slug}.png`}
            alt={topic.title}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>

        <div className="flex items-start gap-5 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-bark-100 border border-bark-200 flex items-center justify-center text-4xl flex-shrink-0">
            {topic.icon}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs px-2.5 py-0.5 bg-saffron-100 text-saffron-700 rounded-full border border-saffron-200 font-semibold">
                DEMO
              </span>
              {started && !completed && (
                <span className="text-xs px-2.5 py-0.5 bg-leaf-100 text-leaf-700 rounded-full border border-leaf-200">In progress</span>
              )}
              {completed && (
                <span className="text-xs px-2.5 py-0.5 bg-leaf-100 text-leaf-700 rounded-full border border-leaf-200">Completed</span>
              )}
            </div>
            <h2 className="font-display text-2xl font-bold text-bark-900">{topic.title}</h2>
            <p className="text-bark-500 text-sm mt-1">{topic.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {[
            { icon: "🌱", label: "Brute force → DP" },
            { icon: "📝", label: "5 subtopics" },
            { icon: "💻", label: "15 coding problems" },
            { icon: "🧩", label: "Recognition exercises" },
            { icon: "🐛", label: "Debugging challenges" },
            { icon: "🎙️", label: "Voice-guided cards" },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-2 text-sm text-bark-600">
              <span>{f.icon}</span>
              <span>{f.label}</span>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-xs text-bark-500 mb-2">
            <span>{topic.subtopics_passed} / {topic.subtopics_total} subtopics passed</span>
            <span className="font-semibold text-leaf-700">{pct}%</span>
          </div>
          <div className="h-2 bg-bark-100 rounded-full overflow-hidden">
            <div className="h-full bg-leaf-600 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm ${
          completed ? "bg-leaf-700 hover:bg-leaf-600 text-white"
            : started ? "bg-saffron-600 hover:bg-saffron-500 text-white"
            : "bg-leaf-700 hover:bg-leaf-600 text-white"
        }`}>
          {completed ? "Review course" : started ? "Continue learning" : "Start course"}
          <span>→</span>
        </div>
      </div>
    </Link>
  );
}

const TABS = [
  { id: "demo", label: "Demo Courses" },
  { id: "courses", label: "Courses" },
  { id: "incidents", label: "Incidents" },
  { id: "capsules", label: "Capsules" },
];

export default function DemoPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [demoTopics, setDemoTopics] = useState<TopicListItem[]>([]);
  const [mainTopics, setMainTopics] = useState<TopicListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("demo");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    Promise.allSettled([listTopics("demo"), listTopics("main")])
      .then(([demo, main]) => {
        if (demo.status === "fulfilled") setDemoTopics(demo.value);
        if (main.status === "fulfilled") setMainTopics(main.value);
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center text-bark-500 text-sm">Loading…</div>;
  }

  const showDemo = activeTab === "demo";
  const showCourses = activeTab === "courses";

  return (
    <div className="min-h-screen text-bark-900">
      <nav className="border-b border-bark-200 bg-bark-50/90 backdrop-blur-sm sticky top-0 z-10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/demo" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-leaf-700 flex items-center justify-center shadow-sm">
              <svg width="15" height="19" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C12 2 3 9 3 17C3 22 7 26 12 26C17 26 21 22 21 17C21 9 12 2 12 2Z" fill="#fcd99a" opacity="0.9"/>
                <path d="M12 26 L11 30" stroke="#fcd99a" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
              </svg>
            </div>
            <span className="font-display text-lg font-bold text-bark-900">Bodhix</span>
          </Link>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-bark-400 hidden sm:block">{user?.email}</span>
          <button onClick={logout} className="text-bark-600 hover:text-bark-900 transition-colors">Sign out</button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-bark-900 mb-2">Welcome back</h1>
          <p className="text-bark-500 mb-6">
            Bodhix teaches through dialogue, not lectures. Pick a course, engage with the material, and defend your thinking to an AI that never gives you the answer — only the right questions.
          </p>

          {/* Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  activeTab === tab.id
                    ? "bg-leaf-700 text-white border-leaf-700 shadow-sm"
                    : "bg-bark-50 text-bark-600 border-bark-200 hover:border-leaf-300 hover:text-leaf-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {showDemo && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {demoTopics.map((t) => <CourseCard key={t.id} topic={t} />)}
            <IncidentLabCard />
          </div>
        )}

        {showCourses && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DSACourseCard topics={mainTopics} />
          </div>
        )}

        {!showDemo && !showCourses && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-bark-100 border border-bark-200 flex items-center justify-center text-3xl mb-4">🌱</div>
            <h3 className="font-display text-lg font-semibold text-bark-700 mb-2">Taking root soon</h3>
            <p className="text-sm text-bark-400 max-w-xs">
              This section is growing. Check back soon or explore the Demo Courses in the meantime.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
