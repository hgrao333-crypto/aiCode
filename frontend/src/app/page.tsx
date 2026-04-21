"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/topics");
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-5xl font-bold tracking-tight text-zinc-800">Logos</h1>
          <p className="text-zinc-600 text-lg">
            The coding platform that teaches you to think, not just copy.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 text-sm">
          {["Socratic dialogue", "No copy-paste answers", "Adaptive teaching", "Binary Search → Graphs"].map(
            (f) => (
              <span key={f} className="px-3 py-1 rounded-full border border-zinc-200 bg-white text-zinc-600">
                {f}
              </span>
            )
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          {[
            {
              step: "01",
              title: "Write your solution",
              body: "Code in the editor. The Run button is locked until you're ready to be tested.",
            },
            {
              step: "02",
              title: "Answer Socratic questions",
              body: "The AI asks you to explain your own code. No hints — just focused questions.",
            },
            {
              step: "03",
              title: "Pass or get taught",
              body: "Demonstrate mastery to unlock the next problem. Stuck? The AI teaches using your code as the example.",
            },
          ].map((item) => (
            <div key={item.step} className="p-4 rounded-xl border border-zinc-200 bg-white">
              <div className="text-xs text-sky-600 font-semibold mb-1">{item.step}</div>
              <div className="text-zinc-800 font-semibold mb-1">{item.title}</div>
              <div className="text-zinc-600 text-sm">{item.body}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/auth/register"
            className="px-6 py-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold transition-colors"
          >
            Get started free
          </Link>
          <Link
            href="/auth/login"
            className="px-6 py-3 rounded-lg border border-zinc-300 hover:border-zinc-400 text-sky-600 hover:text-sky-700 transition-colors bg-white"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
