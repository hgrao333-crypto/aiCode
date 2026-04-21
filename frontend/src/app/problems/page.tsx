"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { listProblems, Problem } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const DIFFICULTY_COLOR = {
  easy: "text-green-400",
  medium: "text-yellow-400",
  hard: "text-red-400",
};

export default function ProblemsPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    listProblems("binary_search")
      .then(setProblems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Nav */}
      <nav className="border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/topics" className="text-white font-bold text-lg">Logos</Link>
          <Link href="/topics" className="text-gray-400 text-sm hover:text-white transition-colors">Curriculum</Link>
          <Link href="/problems" className="text-indigo-400 text-sm">Problems</Link>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500">{user?.email}</span>
          <button
            onClick={logout}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Binary Search</h1>
          <p className="text-gray-400 text-sm mt-1">
            5 problems · Master the search space reduction pattern
          </p>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="space-y-2">
          {problems.map((p, idx) => (
            <Link
              key={p.id}
              href={`/problems/${p.slug}`}
              className="flex items-center gap-4 p-4 rounded-lg border border-gray-800 bg-gray-900 hover:border-indigo-700 transition-colors group"
            >
              <span className="text-gray-600 text-sm w-6 text-right">{idx + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium group-hover:text-indigo-300 transition-colors">
                  {p.title}
                </div>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {p.concepts.slice(0, 3).map((c) => (
                    <span key={c} className="text-xs text-gray-500">
                      {c.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
              <span
                className={`text-xs font-medium ${DIFFICULTY_COLOR[p.difficulty] ?? "text-gray-400"}`}
              >
                {p.difficulty}
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
