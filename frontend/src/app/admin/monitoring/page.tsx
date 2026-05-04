"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { adminApi, AdminMonitoring } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: number | string;
  sub?: string;
  accent?: "green" | "sky" | "amber" | "rose" | "purple";
}) {
  const colors: Record<string, string> = {
    green: "text-emerald-600",
    sky: "text-sky-600",
    amber: "text-amber-600",
    rose: "text-rose-600",
    purple: "text-purple-600",
  };
  return (
    <div className="p-5 rounded-2xl border border-zinc-200 bg-white">
      <p className="text-xs text-zinc-500 mb-1 font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold ${accent ? colors[accent] : "text-zinc-800"}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">{children}</h2>;
}

export default function MonitoringPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<AdminMonitoring | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/auth/login"); return; }
    if (!user.is_admin) { router.replace("/demo"); return; }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user?.is_admin) return;
    adminApi.getMonitoring()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center text-zinc-500 text-sm">Loading...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-rose-500 text-sm">{error}</div>;
  }

  if (!data) return null;

  const solveRate = data.incidents_started_total > 0
    ? Math.round((data.incidents_solved_total / data.incidents_started_total) * 100)
    : 0;
  const quizPassRate = data.quiz_attempts_total > 0
    ? Math.round((data.quiz_passed_total / data.quiz_attempts_total) * 100)
    : 0;

  return (
    <div className="min-h-screen text-zinc-800 bg-zinc-50">
      <nav className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/demo" className="text-zinc-800 font-bold text-lg">Bodhix</Link>
          <span className="text-zinc-400">/</span>
          <Link href="/admin" className="text-zinc-500 text-sm hover:text-zinc-800">Admin</Link>
          <span className="text-zinc-400">/</span>
          <span className="text-zinc-800 text-sm font-medium">Monitoring</span>
          <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full border border-amber-200 font-semibold">ADMIN</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-zinc-400">{user?.email}</span>
          <button onClick={logout} className="text-zinc-600 hover:text-zinc-800 transition-colors">Sign out</button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800 mb-1">Platform Monitoring</h1>
          <p className="text-sm text-zinc-500">Live stats from the production database. Refreshes on page load.</p>
        </div>

        {/* Users */}
        <section>
          <SectionTitle>Users</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Total Users" value={data.total_users} accent="sky" />
            <StatCard label="New (7 days)" value={data.new_users_7d} sub="registrations" accent="green" />
            <StatCard label="New (30 days)" value={data.new_users_30d} sub="registrations" />
            <StatCard label="Active (7 days)" value={data.active_users_7d} sub="used tutor or incidentlab" accent="purple" />
          </div>
        </section>

        {/* Signups chart */}
        <section>
          <SectionTitle>Daily Signups — last 14 days</SectionTitle>
          <div className="bg-white border border-zinc-200 rounded-2xl p-4">
            {data.signups_by_day.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-8">No signups in the last 14 days.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.signups_by_day} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#71717a" }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#71717a" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "#3f3f46", fontWeight: 600 }}
                  />
                  <Bar dataKey="signups" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* AI Tutor */}
        <section>
          <SectionTitle>AI Tutor (Gate Sessions)</SectionTitle>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <StatCard label="Total Sessions" value={data.gate_sessions_total} accent="sky" />
            <StatCard label="Sessions (7 days)" value={data.gate_sessions_7d} accent="green" />
          </div>
          <div className="bg-white border border-zinc-200 rounded-2xl p-4">
            <p className="text-xs text-zinc-500 mb-3 font-medium">Daily tutor sessions — last 14 days</p>
            {data.tutor_by_day.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-8">No tutor sessions in the last 14 days.</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data.tutor_by_day} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#71717a" }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#71717a" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "#3f3f46", fontWeight: 600 }}
                  />
                  <Bar dataKey="sessions" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* IncidentLab */}
        <section>
          <SectionTitle>IncidentLab</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Incidents Started" value={data.incidents_started_total} accent="sky" />
            <StatCard label="Started (7 days)" value={data.incidents_started_7d} accent="green" />
            <StatCard label="Solved" value={data.incidents_solved_total} sub={`${solveRate}% solve rate`} accent="green" />
            <StatCard label="Badges Earned" value={data.badges_earned_total} accent="amber" />
          </div>
        </section>

        {/* Quizzes */}
        <section>
          <SectionTitle>Quizzes</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Quiz Attempts" value={data.quiz_attempts_total} accent="sky" />
            <StatCard label="Attempts (7 days)" value={data.quiz_attempts_7d} accent="green" />
            <StatCard label="Passed" value={data.quiz_passed_total} sub={`${quizPassRate}% pass rate`} accent="green" />
            <StatCard label="Video Completions" value={data.video_completions_total} accent="purple" />
          </div>
        </section>
      </main>
    </div>
  );
}
