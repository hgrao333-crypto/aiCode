"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getLearnerProfile, getUserStats, LearnerProfileData, UserStats } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const SUBTOPIC_LABELS: Record<string, string> = {
  "stage-1": "The Thief's Choice",
  "stage-2": "Overlapping Subproblems",
  "stage-3": "Building the Table",
  "stage-4": "One Row is Enough",
  "stage-5": "Variations",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<LearnerProfileData | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/auth/login"); return; }
    Promise.all([getLearnerProfile(), getUserStats()])
      .then(([p, s]) => { setProfile(p as LearnerProfileData); setStats(s); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center text-zinc-500 text-sm">Loading...</div>;
  }

  const completed = profile?.subtopics ?? [];
  const finalSolved = profile?.final_solved ?? false;
  const totalStages = 5;
  const pct = Math.round((completed.length / totalStages) * 100);

  return (
    <div className="min-h-screen bg-zinc-50">
      <nav className="border-b border-zinc-200 bg-white sticky top-0 z-10 px-6 py-3 flex items-center gap-3">
        <Link href="/demo" className="text-zinc-500 text-sm hover:text-zinc-800 transition-colors">← Course</Link>
        <span className="text-zinc-300">|</span>
        <span className="text-sm font-medium text-zinc-700">My Profile</span>
      </nav>

      <main className="max-w-xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <div className="p-6 rounded-2xl bg-white border border-zinc-200 space-y-1">
          <div className="text-2xl font-bold text-zinc-800">{user?.email}</div>
          {stats && (
            <div className="flex gap-4 pt-2 text-sm text-zinc-600">
              <span className="font-semibold text-indigo-600">{stats.xp} XP</span>
              <span>Level {stats.level}</span>
              <span>{stats.streak_days} day streak</span>
              <span>{stats.gates_passed} gates passed</span>
            </div>
          )}
        </div>

        {/* Course progress */}
        <section>
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">Knapsack DP — Course Progress</h2>
          <div className="p-5 rounded-2xl bg-white border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-700 font-medium">{completed.length} / {totalStages} subtopics complete</span>
              <span className={`font-semibold ${finalSolved ? "text-emerald-600" : "text-zinc-400"}`}>
                {finalSolved ? "✓ Final challenge solved" : "Final challenge locked"}
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="grid grid-cols-5 gap-2 pt-1">
              {Array.from({ length: totalStages }, (_, i) => {
                const key = `stage-${i + 1}`;
                const entry = completed.find(s => s.slug === key);
                return (
                  <div
                    key={key}
                    className={`p-2 rounded-xl border text-center text-xs leading-tight ${
                      entry
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-zinc-50 border-zinc-200 text-zinc-400"
                    }`}
                  >
                    <div className="font-medium mb-0.5">{SUBTOPIC_LABELS[key]?.split(" ").slice(0, 2).join(" ")}</div>
                    {entry && <div className="text-emerald-500">{formatDate(entry.completed_at)}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Timeline */}
        {completed.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">Activity Timeline</h2>
            <div className="space-y-2">
              {[...completed]
                .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
                .map(s => (
                  <div key={s.slug} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-zinc-200">
                    <span className="text-emerald-500 text-lg">✓</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-zinc-800 truncate">
                        {SUBTOPIC_LABELS[s.slug] ?? s.slug}
                      </div>
                      <div className="text-xs text-zinc-400">{formatDate(s.completed_at)}</div>
                    </div>
                  </div>
                ))
              }
              {finalSolved && profile?.final_solved_at && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="text-amber-500 text-lg">🏆</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-amber-800">Final Challenge Solved</div>
                    <div className="text-xs text-amber-500">{formatDate(profile.final_solved_at)}</div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {completed.length === 0 && !finalSolved && (
          <div className="text-center py-8 text-zinc-400 text-sm">
            No activity yet — start the course to track your progress.
          </div>
        )}
      </main>
    </div>
  );
}
