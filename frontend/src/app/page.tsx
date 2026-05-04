"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

// ── Decorative Bodhi tree SVG ─────────────────────────────────────────────────
function BodhiTreeIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 400" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Roots */}
      <path d="M160 390 Q138 383 112 386" stroke="#6c5238" strokeWidth="3" strokeLinecap="round" opacity="0.55"/>
      <path d="M160 390 Q182 383 208 386" stroke="#6c5238" strokeWidth="3" strokeLinecap="round" opacity="0.55"/>
      <path d="M160 393 Q128 388 100 392" stroke="#6c5238" strokeWidth="2" strokeLinecap="round" opacity="0.35"/>
      <path d="M160 393 Q192 388 220 392" stroke="#6c5238" strokeWidth="2" strokeLinecap="round" opacity="0.35"/>
      <path d="M140 390 Q120 396 105 393" stroke="#6c5238" strokeWidth="1.5" strokeLinecap="round" opacity="0.25"/>
      <path d="M180 390 Q200 396 215 393" stroke="#6c5238" strokeWidth="1.5" strokeLinecap="round" opacity="0.25"/>
      {/* Trunk */}
      <path d="M160 390 Q158 340 160 290 Q162 250 160 210" stroke="#5a3e28" strokeWidth="11" strokeLinecap="round"/>
      {/* Bark texture lines */}
      <path d="M157 360 Q154 352 155 342" stroke="#8c7054" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
      <path d="M163 335 Q166 325 164 315" stroke="#8c7054" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
      <path d="M157 300 Q154 292 156 282" stroke="#8c7054" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
      {/* Lower main branches */}
      <path d="M160 310 Q118 286 78 270" stroke="#5a3e28" strokeWidth="7" strokeLinecap="round"/>
      <path d="M160 310 Q202 286 242 270" stroke="#5a3e28" strokeWidth="7" strokeLinecap="round"/>
      {/* Mid branches */}
      <path d="M160 270 Q128 244 98 226" stroke="#5a3e28" strokeWidth="5" strokeLinecap="round"/>
      <path d="M160 270 Q192 244 222 226" stroke="#5a3e28" strokeWidth="5" strokeLinecap="round"/>
      {/* Upper branches */}
      <path d="M160 240 Q146 210 138 185" stroke="#5a3e28" strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M160 240 Q174 210 182 185" stroke="#5a3e28" strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M160 225 Q160 192 160 162" stroke="#5a3e28" strokeWidth="3" strokeLinecap="round"/>
      {/* Secondary off lower-left */}
      <path d="M78 270 Q55 252 36 244" stroke="#5a3e28" strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M78 270 Q66 248 60 228" stroke="#5a3e28" strokeWidth="3" strokeLinecap="round"/>
      {/* Secondary off lower-right */}
      <path d="M242 270 Q265 252 284 244" stroke="#5a3e28" strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M242 270 Q254 248 260 228" stroke="#5a3e28" strokeWidth="3" strokeLinecap="round"/>
      {/* Tertiary small */}
      <path d="M36 244 Q22 232 14 226" stroke="#5a3e28" strokeWidth="2" strokeLinecap="round"/>
      <path d="M60 228 Q50 210 48 196" stroke="#5a3e28" strokeWidth="2" strokeLinecap="round"/>
      <path d="M98 226 Q84 206 80 188" stroke="#5a3e28" strokeWidth="2" strokeLinecap="round"/>
      <path d="M284 244 Q298 232 306 226" stroke="#5a3e28" strokeWidth="2" strokeLinecap="round"/>
      <path d="M260 228 Q270 210 272 196" stroke="#5a3e28" strokeWidth="2" strokeLinecap="round"/>
      <path d="M222 226 Q236 206 240 188" stroke="#5a3e28" strokeWidth="2" strokeLinecap="round"/>
      {/* Leaf canopy — layered ellipses for depth */}
      {/* Far left */}
      <ellipse cx="16" cy="218" rx="18" ry="22" fill="#1e5030" opacity="0.8" transform="rotate(-18 16 218)"/>
      <ellipse cx="28" cy="208" rx="16" ry="20" fill="#276940" opacity="0.85" transform="rotate(-8 28 208)"/>
      {/* Mid-left lower */}
      <ellipse cx="48" cy="188" rx="20" ry="25" fill="#1e5030" opacity="0.85" transform="rotate(-12 48 188)"/>
      <ellipse cx="60" cy="178" rx="18" ry="22" fill="#276940" opacity="0.9" transform="rotate(-4 60 178)"/>
      <ellipse cx="72" cy="185" rx="14" ry="18" fill="#34834e" opacity="0.75" transform="rotate(6 72 185)"/>
      {/* Mid-left upper */}
      <ellipse cx="80" cy="172" rx="22" ry="27" fill="#1e5030" opacity="0.9" transform="rotate(-8 80 172)"/>
      <ellipse cx="96" cy="160" rx="20" ry="24" fill="#276940" opacity="0.85"/>
      <ellipse cx="84" cy="155" rx="15" ry="18" fill="#34834e" opacity="0.7" transform="rotate(5 84 155)"/>
      {/* Center-left */}
      <ellipse cx="130" cy="170" rx="24" ry="30" fill="#1e5030" opacity="0.92"/>
      <ellipse cx="118" cy="158" rx="20" ry="24" fill="#276940" opacity="0.85" transform="rotate(-5 118 158)"/>
      <ellipse cx="134" cy="150" rx="18" ry="22" fill="#34834e" opacity="0.8"/>
      {/* Center top */}
      <ellipse cx="160" cy="148" rx="30" ry="36" fill="#143620" opacity="0.92"/>
      <ellipse cx="148" cy="138" rx="22" ry="27" fill="#1e5030" opacity="0.88"/>
      <ellipse cx="172" cy="136" rx="22" ry="27" fill="#1e5030" opacity="0.88"/>
      <ellipse cx="160" cy="126" rx="20" ry="25" fill="#276940" opacity="0.85"/>
      <ellipse cx="152" cy="118" rx="14" ry="17" fill="#34834e" opacity="0.75"/>
      <ellipse cx="168" cy="116" rx="14" ry="17" fill="#34834e" opacity="0.75"/>
      {/* Center-right */}
      <ellipse cx="190" cy="170" rx="24" ry="30" fill="#1e5030" opacity="0.92"/>
      <ellipse cx="202" cy="158" rx="20" ry="24" fill="#276940" opacity="0.85" transform="rotate(5 202 158)"/>
      <ellipse cx="186" cy="150" rx="18" ry="22" fill="#34834e" opacity="0.8"/>
      {/* Mid-right upper */}
      <ellipse cx="240" cy="172" rx="22" ry="27" fill="#1e5030" opacity="0.9" transform="rotate(8 240 172)"/>
      <ellipse cx="224" cy="160" rx="20" ry="24" fill="#276940" opacity="0.85"/>
      <ellipse cx="236" cy="155" rx="15" ry="18" fill="#34834e" opacity="0.7" transform="rotate(-5 236 155)"/>
      {/* Mid-right lower */}
      <ellipse cx="272" cy="188" rx="20" ry="25" fill="#1e5030" opacity="0.85" transform="rotate(12 272 188)"/>
      <ellipse cx="260" cy="178" rx="18" ry="22" fill="#276940" opacity="0.9" transform="rotate(4 260 178)"/>
      <ellipse cx="248" cy="185" rx="14" ry="18" fill="#34834e" opacity="0.75" transform="rotate(-6 248 185)"/>
      {/* Far right */}
      <ellipse cx="304" cy="218" rx="18" ry="22" fill="#1e5030" opacity="0.8" transform="rotate(18 304 218)"/>
      <ellipse cx="292" cy="208" rx="16" ry="20" fill="#276940" opacity="0.85" transform="rotate(8 292 208)"/>
      {/* Highlight glints */}
      <ellipse cx="148" cy="132" rx="6" ry="8" fill="#4da066" opacity="0.4"/>
      <ellipse cx="96" cy="162" rx="5" ry="7" fill="#4da066" opacity="0.35"/>
      <ellipse cx="224" cy="162" rx="5" ry="7" fill="#4da066" opacity="0.35"/>
    </svg>
  );
}

// ── Small Bodhi leaf badge icon ───────────────────────────────────────────────
function BodhiLeaf({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M12 2C12 2 3 9 3 17C3 22 7 26 12 26C17 26 21 22 21 17C21 9 12 2 12 2Z" fill="currentColor" opacity="0.9"/>
      <path d="M12 26 L11 30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
      <path d="M12 8 Q12 16 12 24" stroke="white" strokeWidth="0.8" strokeLinecap="round" opacity="0.35"/>
      <path d="M12 12 Q8 14 6 17" stroke="white" strokeWidth="0.6" strokeLinecap="round" opacity="0.25"/>
      <path d="M12 12 Q16 14 18 17" stroke="white" strokeWidth="0.6" strokeLinecap="round" opacity="0.25"/>
    </svg>
  );
}

// ── Branch divider ────────────────────────────────────────────────────────────
function BranchDivider() {
  return (
    <div className="flex items-center gap-4 my-2">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent to-bark-200" />
      <BodhiLeaf size={14} className="text-leaf-400" />
      <div className="flex-1 h-px bg-gradient-to-l from-transparent to-bark-200" />
    </div>
  );
}

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/demo");
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bark-50">
        <div className="text-bark-400 text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bark-50 text-bark-900">

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-bark-200/60 bg-bark-50/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-leaf-700 flex items-center justify-center shadow-sm">
              <BodhiLeaf size={16} className="text-saffron-200" />
            </div>
            <span className="font-display text-xl font-700 text-bark-900 tracking-tight">Bodhix</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-bark-600 hover:text-bark-900 transition-colors px-4 py-2">
              Sign in
            </Link>
            <Link
              href="/auth/register"
              className="text-sm font-semibold px-4 py-2 rounded-lg bg-saffron-600 hover:bg-saffron-500 text-white transition-colors shadow-sm"
            >
              Begin your journey
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="pt-36 pb-24 px-6 relative overflow-hidden">
        {/* Warm radial backdrop */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-leaf-100/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-saffron-100/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left: text */}
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-leaf-200 bg-leaf-50 text-leaf-700 text-xs font-semibold mb-8">
                <BodhiLeaf size={12} className="text-leaf-600" />
                Socratic AI Learning Platform
              </div>

              <h1 className="font-display text-5xl sm:text-6xl font-800 text-bark-900 mb-6 leading-[1.08]">
                Wisdom grows through
                <span className="block text-leaf-700 mt-1">understanding.</span>
              </h1>

              <p className="text-bark-600 text-lg leading-relaxed mb-3 max-w-lg">
                Bodhix uses the Socratic method — the same technique that produced Plato, Aristotle, and every great thinker since — powered by AI.
              </p>
              <p className="text-bark-500 text-base leading-relaxed mb-10 max-w-lg">
                You don&apos;t just receive answers. You are guided to find them yourself. That is the only learning that lasts.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-saffron-600 hover:bg-saffron-500 text-white font-semibold text-base transition-all hover:shadow-lg hover:shadow-saffron-200 shadow-sm"
                >
                  <BodhiLeaf size={15} className="text-saffron-200" />
                  Begin your journey
                </Link>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-bark-300 hover:border-bark-400 text-bark-700 hover:text-bark-900 font-semibold text-base transition-colors"
                >
                  Sign in
                </Link>
              </div>

              <p className="mt-5 text-xs text-bark-400">Free to start · No credit card required</p>
            </div>

            {/* Right: Bodhi tree illustration */}
            <div className="hidden lg:flex items-end justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-radial-gradient from-leaf-100/60 to-transparent blur-2xl rounded-full" />
                <BodhiTreeIllustration className="w-80 h-auto drop-shadow-sm" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quote / Divider ─────────────────────────────────────────────────── */}
      <div className="py-10 px-6 border-y border-bark-200/50 bg-leaf-700">
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-display text-xl sm:text-2xl font-600 text-leaf-100 leading-relaxed italic">
            &ldquo;Tell me and I forget. Teach me and I remember. Involve me and I learn.&rdquo;
          </p>
          <p className="text-leaf-300 text-sm mt-3 font-mono">— Benjamin Franklin</p>
        </div>
      </div>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-bark-100/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 text-leaf-600 text-xs font-semibold uppercase tracking-widest mb-3">
              <BodhiLeaf size={11} className="text-leaf-500" />
              The Method
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-700 text-bark-900">
              The oldest teaching method in the world.<br />
              <span className="text-leaf-700">Now AI-powered.</span>
            </h2>
            <p className="text-bark-500 mt-4 max-w-xl mx-auto">
              Bodhix puts you in the hot seat. You explain, the AI asks, probes, and adapts — until understanding genuinely takes root.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                step: "01",
                icon: "✍️",
                title: "Engage with the material",
                body: "Write code, solve problems, answer questions. No passive reading — progress only unlocks when you do the work.",
                border: "border-leaf-200",
                bg: "bg-leaf-50",
                tag: "text-leaf-600 bg-leaf-100",
              },
              {
                step: "02",
                icon: "🧠",
                title: "Defend your thinking",
                body: "The AI asks targeted questions about your reasoning. No hints, no spoilers — just you and what you actually know.",
                border: "border-saffron-200",
                bg: "bg-saffron-50",
                tag: "text-saffron-700 bg-saffron-100",
              },
              {
                step: "03",
                icon: "🌱",
                title: "Mastery unlocks the next step",
                body: "Demonstrate genuine understanding to move forward. The AI teaches through your own attempt — never a generic answer.",
                border: "border-bark-200",
                bg: "bg-bark-50",
                tag: "text-bark-600 bg-bark-100",
              },
            ].map((item) => (
              <div key={item.step} className={`p-7 rounded-2xl border ${item.border} ${item.bg} relative overflow-hidden`}>
                <div className="text-3xl mb-5">{item.icon}</div>
                <div className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mb-3 ${item.tag}`}>
                  Step {item.step}
                </div>
                <h3 className="font-display text-bark-900 font-700 text-lg mb-2 leading-snug">{item.title}</h3>
                <p className="text-bark-500 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What you can learn ──────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-bark-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 text-saffron-600 text-xs font-semibold uppercase tracking-widest mb-3">
              <BodhiLeaf size={11} className="text-saffron-500" />
              Courses
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-700 text-bark-900">
              Built for depth, not breadth.
            </h2>
            <p className="text-bark-500 mt-4 max-w-lg mx-auto">
              Each course is designed so you cannot move forward without genuinely understanding the previous step.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* DSA */}
            <div className="p-8 rounded-2xl border border-leaf-200 bg-white hover:border-leaf-400 hover:shadow-md transition-all group">
              <div className="w-14 h-14 rounded-xl bg-leaf-700 flex items-center justify-center mb-5 shadow-sm group-hover:bg-leaf-600 transition-colors">
                <BodhiTreeIllustration className="w-9 h-9" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-leaf-100 text-leaf-700 border border-leaf-200 font-semibold">Algorithms & DSA</span>
              </div>
              <h3 className="font-display text-xl font-700 text-bark-900 mb-2">Data Structures & Algorithms</h3>
              <p className="text-bark-500 text-sm mb-6 leading-relaxed">
                From arrays and hashing to dynamic programming. An AI tutor that forces you to explain your approach before ever giving a hint. No shortcuts.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Arrays & Hashing", "Binary Search", "Sliding Window", "DP", "Trees"].map(t => (
                  <span key={t} className="text-xs px-2.5 py-1 rounded-lg bg-bark-100 text-bark-600 border border-bark-200">{t}</span>
                ))}
              </div>
            </div>

            {/* IncidentLab */}
            <div className="p-8 rounded-2xl border border-bark-200 bg-bark-900 hover:border-bark-600 hover:shadow-md transition-all relative overflow-hidden group">
              <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-leaf-500/20 border border-leaf-500/30 text-leaf-300 text-xs font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-leaf-400 animate-pulse" />
                Beta
              </div>
              <div className="w-14 h-14 rounded-xl bg-bark-700 border border-bark-600 flex items-center justify-center text-3xl mb-5 shadow-sm">🔥</div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-bark-700 text-bark-200 border border-bark-600 font-semibold">IncidentLab</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-900/40 text-red-300 border border-red-800/40">Systems · DevOps</span>
              </div>
              <h3 className="font-display text-xl font-700 text-bark-50 mb-2">Production Incident Simulations</h3>
              <p className="text-bark-400 text-sm mb-6 leading-relaxed">
                Drop into real outages — N+1 queries, OOMKilled pods. Watch, quiz, diagnose, fix in a real editor. Earn badges.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Postgres N+1", "K8s OOMKilled", "Live editor", "Earn badges"].map(t => (
                  <span key={t} className="text-xs px-2.5 py-1 rounded-lg bg-bark-800 text-bark-400 border border-bark-700">{t}</span>
                ))}
              </div>
            </div>

            {/* Coming soon */}
            <div className="p-7 rounded-2xl border border-dashed border-bark-300 bg-bark-100/50 md:col-span-2">
              <p className="text-xs font-semibold text-bark-500 uppercase tracking-widest mb-4">Taking root soon</p>
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
                  <div key={s.label} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-bark-200 text-bark-500 text-sm hover:border-bark-300 transition-colors">
                    <span>{s.icon}</span>
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Bodhix ──────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-leaf-700 relative overflow-hidden">
        {/* Subtle tree watermark */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-[0.06] pointer-events-none">
          <BodhiTreeIllustration className="w-80 h-auto" />
        </div>

        <div className="max-w-5xl mx-auto relative">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 text-leaf-300 text-xs font-semibold uppercase tracking-widest mb-3">
              <BodhiLeaf size={11} className="text-leaf-400" />
              Why Bodhix
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-700 text-white leading-tight">
              Most platforms teach you to perform.<br />
              <span className="text-saffron-300">We teach you to understand.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: "🚫", title: "No copy-paste", body: "Answers are never shown upfront. You reason first, always." },
              { icon: "🎯", title: "Adaptive dialogue", body: "The AI responds to what you actually said — not a preset script." },
              { icon: "💬", title: "Dialogue over lecture", body: "Every lesson is a two-way conversation, not a video you passively watch." },
              { icon: "🌱", title: "Mastery-gated growth", body: "You cannot skip forward. Each concept must take root before the next one can grow." },
            ].map(f => (
              <div key={f.title} className="p-6 rounded-2xl border border-leaf-600 bg-leaf-800/60 backdrop-blur-sm hover:bg-leaf-800/80 transition-colors">
                <div className="text-2xl mb-4">{f.icon}</div>
                <h3 className="text-white font-semibold mb-2 leading-snug">{f.title}</h3>
                <p className="text-leaf-300 text-sm leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-bark-100/50 border-y border-bark-200/50">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {[
              { value: "Any", label: "Subject" },
              { value: "100%", label: "Socratic method" },
              { value: "0", label: "Passive lectures" },
              { value: "∞", label: "Patience" },
            ].map((s) => (
              <div key={s.label}>
                <div className="font-display text-4xl font-800 text-bark-900 mb-1">{s.value}</div>
                <div className="text-sm text-bark-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────────── */}
      <section className="py-28 px-6 text-center bg-gradient-to-b from-bark-50 to-bark-100 relative overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 opacity-[0.07] pointer-events-none">
          <BodhiTreeIllustration className="w-96 h-auto" />
        </div>
        <div className="relative max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-leaf-700 flex items-center justify-center mx-auto mb-6 shadow-md">
            <BodhiLeaf size={32} className="text-saffron-300" />
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-800 text-bark-900 mb-5 leading-tight">
            Ready to truly<br />
            <span className="text-leaf-700">understand something?</span>
          </h2>
          <p className="text-bark-500 text-lg mb-10 max-w-lg mx-auto">
            Join Bodhix and feel the difference between knowing an answer and understanding why it is true.
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-3 px-10 py-4 rounded-xl bg-saffron-600 hover:bg-saffron-500 text-white font-semibold text-lg transition-all hover:shadow-xl hover:shadow-saffron-200/40 shadow-md"
          >
            <BodhiLeaf size={18} className="text-saffron-200" />
            Start for free
          </Link>
          <p className="mt-5 text-xs text-bark-400">Free · No credit card · Start in 30 seconds</p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-bark-800 py-10 px-6 bg-bark-900">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-leaf-700 flex items-center justify-center">
                <BodhiLeaf size={15} className="text-saffron-300" />
              </div>
              <span className="font-display text-xl font-700 text-bark-100">Bodhix</span>
            </div>
            <p className="text-bark-500 text-sm">The platform that grows understanding, not just answers.</p>
            <div className="flex gap-5 text-sm text-bark-500">
              <Link href="/auth/login" className="hover:text-bark-200 transition-colors">Sign in</Link>
              <Link href="/auth/register" className="hover:text-bark-200 transition-colors">Register</Link>
            </div>
          </div>
          <BranchDivider />
          <p className="text-center text-xs text-bark-600 mt-4">
            Under the Bodhi tree, every question is the beginning of wisdom.
          </p>
        </div>
      </footer>

    </div>
  );
}
