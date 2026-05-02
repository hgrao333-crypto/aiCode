"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/demo");
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-zinc-400 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-800">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-lg font-bold text-zinc-800">Logos</span>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-zinc-500 hover:text-zinc-800 transition-colors px-4 py-2">
              Sign in
            </Link>
            <Link href="/auth/register" className="text-sm font-semibold px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors">
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-28 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-emerald-50 rounded-full blur-3xl pointer-events-none opacity-80" />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-medium mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Now in beta · AI-powered learning for any subject
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-zinc-800 mb-6 leading-[1.05]">
            Learn anything by
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-sky-500">
              actually understanding it
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-zinc-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Logos uses Socratic AI to guide you through any subject — coding, systems, math, and more.
            Not flashcards. Not lectures. Real understanding through dialogue.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-base transition-all hover:shadow-lg hover:shadow-emerald-200"
            >
              Start learning free →
            </Link>
            <Link
              href="/auth/login"
              className="px-8 py-4 rounded-xl border border-zinc-200 hover:border-zinc-300 text-zinc-600 hover:text-zinc-800 font-semibold text-base transition-colors"
            >
              Sign in
            </Link>
          </div>

          <p className="mt-5 text-xs text-zinc-400">No credit card required · Free forever for demo courses</p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 border-t border-zinc-100 bg-zinc-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-emerald-600 text-sm font-semibold uppercase tracking-widest mb-3">The method</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-800">Teaching yourself is the fastest way to learn.</h2>
            <p className="text-zinc-500 mt-3 max-w-xl mx-auto">Logos puts you in the hot seat — you explain, the AI listens, asks, and adapts.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                icon: "✍️",
                title: "Engage with the material",
                body: "Write code, solve problems, answer questions. No passive reading — Logos only unlocks progress when you do the work.",
                accent: "border-sky-200 bg-sky-50",
                tag: "text-sky-600",
              },
              {
                step: "02",
                icon: "🧠",
                title: "Defend your thinking",
                body: "The AI asks targeted Socratic questions about your reasoning. No hints, no spoilers — just you and what you actually know.",
                accent: "border-emerald-200 bg-emerald-50",
                tag: "text-emerald-600",
              },
              {
                step: "03",
                icon: "🚀",
                title: "Pass or get taught",
                body: "Demonstrate mastery to move forward. Stuck? The AI teaches using your own attempt as the example — not a generic explanation.",
                accent: "border-amber-200 bg-amber-50",
                tag: "text-amber-600",
              },
            ].map((item) => (
              <div key={item.step} className={`p-6 rounded-2xl border ${item.accent}`}>
                <div className="text-3xl mb-4">{item.icon}</div>
                <div className={`text-xs font-mono font-semibold mb-2 ${item.tag}`}>{item.step}</div>
                <h3 className="text-zinc-800 font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subjects / courses */}
      <section className="py-24 px-6 border-t border-zinc-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sky-600 text-sm font-semibold uppercase tracking-widest mb-3">What you can learn</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-800">Built for depth, not breadth</h2>
            <p className="text-zinc-500 mt-3 max-w-xl mx-auto">Each course is designed so you can't move forward without genuinely understanding the previous step.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* DSA */}
            <div className="p-8 rounded-2xl border border-emerald-200 bg-white hover:border-emerald-400 hover:shadow-md transition-all">
              <div className="text-4xl mb-5">🌳</div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium">Algorithms & DSA</span>
              </div>
              <h3 className="text-xl font-bold text-zinc-800 mb-2">Data Structures & Algorithms</h3>
              <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
                From brute force to dynamic programming. An AI tutor that forces you to explain your approach before it ever gives you a hint. No shortcuts.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Binary Search", "Sliding Window", "Dynamic Programming", "Graphs", "Trees"].map(t => (
                  <span key={t} className="text-xs px-2 py-1 rounded-lg bg-zinc-100 text-zinc-500 border border-zinc-200">{t}</span>
                ))}
              </div>
            </div>

            {/* IncidentLab */}
            <div className="p-8 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-400 hover:shadow-md transition-all relative overflow-hidden">
              <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                New
              </div>
              <div className="text-4xl mb-5">🔥</div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200 font-medium">IncidentLab</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200 font-medium">Systems · DevOps</span>
              </div>
              <h3 className="text-xl font-bold text-zinc-800 mb-2">Production Incident Simulations</h3>
              <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
                Drop into real-world outages — N+1 queries, OOMKilled pods. Watch micro-videos, pass a quiz, diagnose and fix in a real editor. Earn badges.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Postgres N+1", "K8s OOMKilled", "Live editor", "Earn badges"].map(t => (
                  <span key={t} className="text-xs px-2 py-1 rounded-lg bg-zinc-100 text-zinc-500 border border-zinc-200">{t}</span>
                ))}
              </div>
            </div>

            {/* Coming soon */}
            <div className="p-8 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 md:col-span-2">
              <p className="text-sm font-semibold text-zinc-500 mb-4">Coming soon</p>
              <div className="flex flex-wrap gap-3">
                {[
                  { icon: "📐", label: "Mathematics" },
                  { icon: "⚛️", label: "Physics" },
                  { icon: "🧬", label: "Biology" },
                  { icon: "💹", label: "Economics" },
                  { icon: "🗣️", label: "Languages" },
                  { icon: "🏛️", label: "History" },
                  { icon: "🔐", label: "Security" },
                  { icon: "🤖", label: "Machine Learning" },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-500 text-sm">
                    <span>{s.icon}</span>
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why different */}
      <section className="py-24 px-6 border-t border-zinc-100 bg-zinc-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-purple-600 text-sm font-semibold uppercase tracking-widest mb-3">Why Logos</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-800">Most platforms teach you to perform. We teach you to understand.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: "🚫", title: "No copy-paste", body: "Answers are never shown upfront. You reason first, always." },
              { icon: "🎯", title: "Adaptive difficulty", body: "The AI adjusts based on what you actually said, not a preset level." },
              { icon: "💬", title: "Dialogue over lecture", body: "Every lesson is a two-way conversation, not a video you passively watch." },
              { icon: "🏅", title: "Mastery-gated progress", body: "You can't skip forward. Each concept is truly understood before the next unlocks." },
            ].map(f => (
              <div key={f.title} className="p-6 rounded-2xl border border-zinc-200 bg-white">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="text-zinc-800 font-semibold mb-1">{f.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-6 border-t border-zinc-100">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {[
              { value: "Any", label: "Subject" },
              { value: "100%", label: "Socratic method" },
              { value: "0", label: "Passive lectures" },
              { value: "∞", label: "Patience" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-bold text-zinc-800 mb-1">{s.value}</div>
                <div className="text-sm text-zinc-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-6 border-t border-zinc-100 text-center bg-gradient-to-b from-white to-emerald-50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold text-zinc-800 mb-5">
            Ready to actually<br />understand something?
          </h2>
          <p className="text-zinc-500 text-lg mb-10">
            Join Logos and experience the difference between knowing the answer and truly understanding why.
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-lg transition-all hover:shadow-lg hover:shadow-emerald-200"
          >
            Start for free →
          </Link>
          <p className="mt-4 text-xs text-zinc-400">Free · No credit card · Start in 30 seconds</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-8 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-400">
          <span className="font-semibold text-zinc-600">Logos</span>
          <span>The learning platform that teaches you to understand, not memorize.</span>
          <div className="flex gap-4">
            <Link href="/auth/login" className="hover:text-zinc-600 transition-colors">Sign in</Link>
            <Link href="/auth/register" className="hover:text-zinc-600 transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
