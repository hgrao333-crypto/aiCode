"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function AdminDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/auth/login"); return; }
    if (!user.is_admin) { router.replace("/demo"); return; }
  }, [user, authLoading, router]);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-zinc-500 text-sm">Loading...</div>;
  }

  return (
    <div className="min-h-screen text-zinc-800">
      <nav className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/demo" className="text-zinc-800 font-bold text-lg">Logos</Link>
          <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full border border-amber-200 font-semibold">ADMIN</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-zinc-400">{user?.email}</span>
          <button onClick={logout} className="text-zinc-600 hover:text-zinc-800 transition-colors">Sign out</button>
        </div>
      </nav>

      <main className="max-w-xl mx-auto px-6 py-12 space-y-4">
        <h1 className="text-2xl font-bold text-zinc-800 mb-6">Admin</h1>

        <Link
          href="/admin/ai-script"
          className="block p-6 rounded-2xl border border-zinc-200 bg-white hover:border-sky-300 hover:shadow-sm transition-all"
        >
          <div className="text-xl font-semibold text-zinc-800 mb-1">🤖 AI Model Script</div>
          <p className="text-sm text-zinc-500 leading-relaxed">
            View and edit <code className="font-mono text-xs bg-zinc-100 px-1 py-0.5 rounded">socratic_engine.py</code> — Gemini prompts, retry logic, and Socratic tutor stages.
          </p>
        </Link>

        <Link
          href="/admin/videos"
          className="block p-6 rounded-2xl border border-zinc-200 bg-white hover:border-sky-300 hover:shadow-sm transition-all"
        >
          <div className="text-xl font-semibold text-zinc-800 mb-1">🎥 Videos</div>
          <p className="text-sm text-zinc-500 leading-relaxed">
            Upload video files to the server and manage YouTube links for course topics.
          </p>
        </Link>

        <Link
          href="/admin/monitoring"
          className="block p-6 rounded-2xl border border-zinc-200 bg-white hover:border-sky-300 hover:shadow-sm transition-all"
        >
          <div className="text-xl font-semibold text-zinc-800 mb-1">📊 Monitoring</div>
          <p className="text-sm text-zinc-500 leading-relaxed">
            User signups, active users, AI tutor sessions, IncidentLab solves, quiz pass rates, and more.
          </p>
        </Link>
      </main>
    </div>
  );
}
