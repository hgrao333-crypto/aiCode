"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminApi, AdminOverview } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function AdminDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/auth/login"); return; }
    if (!user.is_admin) { router.replace("/topics"); return; }
    adminApi.overview()
      .then(setOverview)
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">Loading...</div>;
  }

  const stats = [
    { label: "Topics", value: overview?.topics, href: "/admin/topics", icon: "🗂️" },
    { label: "Subtopics", value: overview?.subtopics, href: "/admin/topics", icon: "📑" },
    { label: "PlayCards", value: overview?.playcards, href: "/admin/topics", icon: "🃏" },
    { label: "Problems", value: overview?.problems, href: "/admin/problems", icon: "💻" },
    { label: "Users", value: overview?.users, href: "#", icon: "👤" },
  ];

  return (
    <div className="min-h-screen">
      <nav className="border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/topics" className="text-white font-bold text-lg">Logos</Link>
          <span className="text-xs px-2 py-0.5 bg-amber-900 text-amber-300 rounded-full border border-amber-700 font-semibold">ADMIN</span>
          <Link href="/admin/topics" className="text-gray-400 text-sm hover:text-white transition-colors">Topics</Link>
          <Link href="/admin/problems" className="text-gray-400 text-sm hover:text-white transition-colors">Problems</Link>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-500">{user?.email}</span>
          <button onClick={logout} className="text-gray-400 hover:text-white transition-colors">Sign out</button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-white mb-1">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mb-8">Manage all course content from here.</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
          {stats.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className="p-4 rounded-xl border border-gray-800 bg-gray-900 hover:border-indigo-700 transition-colors text-center"
            >
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold text-white">{s.value ?? "–"}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/admin/topics"
            className="p-5 rounded-xl border border-gray-800 bg-gray-900 hover:border-indigo-700 transition-colors"
          >
            <div className="text-lg font-semibold text-white mb-1">📚 Curriculum Editor</div>
            <div className="text-sm text-gray-400">
              Create and edit topics, subtopics, playcards, and YouTube videos.
            </div>
          </Link>
          <Link
            href="/admin/problems"
            className="p-5 rounded-xl border border-gray-800 bg-gray-900 hover:border-indigo-700 transition-colors"
          >
            <div className="text-lg font-semibold text-white mb-1">💻 Problem Bank</div>
            <div className="text-sm text-gray-400">
              Add and edit coding problems with test cases, starter code, and concepts.
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
