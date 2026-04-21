"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getTopic, getUserStats, TopicDetail, UserStats } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// ─── Tab types ─────────────────────────────────────────────────────────────────

type Tab = "challenge" | "videos" | "problems";

// ─────────────────────────────────────────────────────────────────────────────
// CHALLENGE: Knapsack interactive puzzle
// ─────────────────────────────────────────────────────────────────────────────

type Item = { id: number; name: string; emoji: string; weight: number; value: number };
type StageData = {
  stage: number; title: string; context: string; capacity: number;
  items: Item[]; combinations: number; lesson: string; insight?: string;
};

const STAGES: StageData[] = [
  {
    stage: 1, title: "The Thief's Choice",
    context: "You're a thief with an 8 kg bag. Three items on the table. Which do you take?",
    capacity: 8,
    items: [
      { id: 1, name: "Diamond",      emoji: "💎", weight: 7, value: 10 },
      { id: 2, name: "Gold Bar",     emoji: "🥇", weight: 5, value: 8  },
      { id: 3, name: "Battery Pack", emoji: "🔋", weight: 3, value: 5  },
    ],
    combinations: 8,
    lesson: "The highest-value item isn't always best. Gold Bar + Battery Pack fits in 8 kg for $13 — more than the Diamond alone.",
  },
  {
    stage: 2, title: "Six Items, One Bag",
    context: "Your bag holds 15 kg. Six items. The clock is ticking — find the best combination.",
    capacity: 15,
    items: [
      { id: 1, name: "Monitor",    emoji: "🖥️", weight: 8, value: 12 },
      { id: 2, name: "Keyboard",   emoji: "⌨️", weight: 3, value: 5  },
      { id: 3, name: "Mouse",      emoji: "🖱️", weight: 2, value: 4  },
      { id: 4, name: "Phone",      emoji: "📱", weight: 4, value: 8  },
      { id: 5, name: "Headphones", emoji: "🎧", weight: 5, value: 9  },
      { id: 6, name: "Camera",     emoji: "📷", weight: 6, value: 10 },
    ],
    combinations: 64,
    lesson: "With 6 items there are 2⁶ = 64 possible combinations. Solvable, but how long did that take you?",
    insight: "Tip: The Monitor looks tempting ($12) but it's heavy. Sometimes smaller combinations beat the obvious pick.",
  },
  {
    stage: 3, title: "The Combinatorial Explosion",
    context: "15 items. Your bag holds 30 kg. Try your best — or just feel the impossibility.",
    capacity: 30,
    items: [
      { id: 1,  name: "Monitor",      emoji: "🖥️", weight: 8,  value: 13 },
      { id: 2,  name: "Laptop",       emoji: "💻", weight: 10, value: 17 },
      { id: 3,  name: "Keyboard",     emoji: "⌨️", weight: 3,  value: 5  },
      { id: 4,  name: "Mouse",        emoji: "🖱️", weight: 2,  value: 4  },
      { id: 5,  name: "Phone",        emoji: "📱", weight: 4,  value: 8  },
      { id: 6,  name: "Headphones",   emoji: "🎧", weight: 5,  value: 9  },
      { id: 7,  name: "Camera",       emoji: "📷", weight: 6,  value: 10 },
      { id: 8,  name: "Battery Bank", emoji: "🔋", weight: 3,  value: 6  },
      { id: 9,  name: "Textbook",     emoji: "📚", weight: 7,  value: 8  },
      { id: 10, name: "Controller",   emoji: "🎮", weight: 4,  value: 7  },
      { id: 11, name: "Lamp",         emoji: "💡", weight: 6,  value: 5  },
      { id: 12, name: "Skincare",     emoji: "🧴", weight: 2,  value: 3  },
      { id: 13, name: "Speaker",      emoji: "🔊", weight: 5,  value: 11 },
      { id: 14, name: "Keys",         emoji: "🔑", weight: 1,  value: 2  },
      { id: 15, name: "Smartwatch",   emoji: "⌚", weight: 2,  value: 7  },
    ],
    combinations: 32768,
    lesson: "2¹⁵ = 32,768 combinations — impossible to enumerate by hand. That's why we need a smarter approach.",
  },
];

function computeOptimal(items: Item[], capacity: number): { value: number; selected: Set<number> } {
  const n = items.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(capacity + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    const { weight, value } = items[i - 1];
    for (let w = 0; w <= capacity; w++) {
      dp[i][w] = dp[i - 1][w];
      if (weight <= w) dp[i][w] = Math.max(dp[i][w], dp[i - 1][w - weight] + value);
    }
  }
  const selected = new Set<number>();
  let w = capacity;
  for (let i = n; i >= 1; i--) {
    if (dp[i][w] !== dp[i - 1][w]) { selected.add(items[i - 1].id); w -= items[i - 1].weight; }
  }
  return { value: dp[n][capacity], selected };
}

type StageState = "playing" | "submitted" | "revealed";

function KnapsackStage({ stageData, onComplete }: { stageData: StageData; onComplete: () => void }) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [state, setState] = useState<StageState>("playing");

  const optimal = useMemo(() => computeOptimal(stageData.items, stageData.capacity), [stageData]);

  const selectedItems = stageData.items.filter((i) => selected.has(i.id));
  const currentWeight = selectedItems.reduce((s, i) => s + i.weight, 0);
  const currentValue = selectedItems.reduce((s, i) => s + i.value, 0);
  const overweight = currentWeight > stageData.capacity;
  const weightPct = Math.min(100, (currentWeight / stageData.capacity) * 100);
  const isOptimal = !overweight && currentValue === optimal.value;
  const showResult = state !== "playing";

  function toggle(id: number) {
    if (state !== "playing") return;
    setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  return (
    <div>
      <div className="mb-6 p-4 rounded-xl bg-zinc-50 border border-zinc-200">
        <p className="text-zinc-700 text-sm leading-relaxed">{stageData.context}</p>
        {stageData.insight && state === "playing" && (
          <p className="text-xs text-zinc-500 mt-2 italic">{stageData.insight}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Items grid */}
        <div>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Available Items</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {stageData.items.map((item) => {
              const inBag = selected.has(item.id);
              const isOptItem = state === "revealed" && optimal.selected.has(item.id);
              const isWrongPick = state === "revealed" && inBag && !optimal.selected.has(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => toggle(item.id)}
                  disabled={state !== "playing"}
                  className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                    state === "revealed"
                      ? isOptItem ? "border-emerald-400 bg-emerald-50 shadow-sm"
                        : isWrongPick ? "border-red-300 bg-red-50 opacity-60"
                        : "border-zinc-200 bg-zinc-50 opacity-40"
                      : inBag ? "border-sky-400 bg-sky-50 shadow-sm"
                      : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm cursor-pointer"
                  }`}
                >
                  {inBag && state === "playing" && (
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-sky-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold">✓</div>
                  )}
                  {isOptItem && (
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold">★</div>
                  )}
                  {isWrongPick && (
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-400 rounded-full flex items-center justify-center text-white text-[9px] font-bold">✗</div>
                  )}
                  <div className="text-2xl mb-1.5">{item.emoji}</div>
                  <div className="text-xs font-semibold text-zinc-700 leading-tight">{item.name}</div>
                  <div className="mt-1 flex gap-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 bg-zinc-100 text-zinc-500 rounded font-mono">{item.weight}kg</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded font-mono font-semibold">${item.value}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bag panel */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🎒</span>
              <div>
                <div className="font-semibold text-zinc-800">Your Bag</div>
                <div className="text-xs text-zinc-500">Capacity: {stageData.capacity} kg</div>
              </div>
            </div>
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1.5">
                <span className={overweight ? "text-red-600 font-semibold" : "text-zinc-600"}>
                  {currentWeight} / {stageData.capacity} kg{overweight && " — Too heavy!"}
                </span>
                <span className="font-bold text-zinc-800">Value: ${currentValue}</span>
              </div>
              <div className="h-3 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${overweight ? "bg-red-400" : "bg-sky-500"}`}
                  style={{ width: `${weightPct}%` }}
                />
              </div>
            </div>
            {selectedItems.length === 0 ? (
              <div className="text-center py-5 text-zinc-400 text-sm border-2 border-dashed border-zinc-200 rounded-xl">
                Click items to add them to the bag
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {selectedItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 rounded-lg border border-zinc-100">
                    <span className="text-base">{item.emoji}</span>
                    <span className="text-zinc-700 flex-1 text-xs font-medium">{item.name}</span>
                    <span className="text-zinc-500 text-xs font-mono">{item.weight}kg · ${item.value}</span>
                  </div>
                ))}
                <div className="pt-1 border-t border-zinc-200 flex justify-between text-xs font-semibold px-1">
                  <span className="text-zinc-600">Total</span>
                  <span className="text-zinc-800">{currentWeight}kg · ${currentValue}</span>
                </div>
              </div>
            )}
          </div>

          {state === "playing" && (
            <div className="flex gap-3">
              <button
                onClick={() => setState("submitted")}
                disabled={selectedItems.length === 0 || overweight}
                className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-semibold text-sm transition-colors shadow-sm"
              >
                Lock In My Answer
              </button>
              <button
                onClick={() => setState("revealed")}
                className="px-4 py-2.5 rounded-xl border border-zinc-300 hover:border-zinc-400 text-zinc-600 text-sm transition-colors"
              >
                Give Up →
              </button>
            </div>
          )}

          {showResult && (
            <div className={`p-4 rounded-xl border ${
              state === "submitted" && isOptimal ? "border-emerald-300 bg-emerald-50"
                : state === "submitted" ? "border-amber-200 bg-amber-50"
                : "border-zinc-200 bg-zinc-50"
            }`}>
              {state === "submitted" && (
                <div className="font-semibold text-sm mb-2">
                  {isOptimal
                    ? <span className="text-emerald-700">🎉 Perfect — that&apos;s the optimal solution!</span>
                    : <span className="text-amber-700">Not quite — your answer: ${currentValue}. Optimal is ${optimal.value}.</span>
                  }
                </div>
              )}
              {state === "revealed" && (
                <div className="font-semibold text-sm mb-2 text-zinc-700">Here&apos;s the optimal solution:</div>
              )}
              {(!isOptimal || state === "revealed") && (
                <div className="text-sm text-zinc-600">
                  <span className="font-semibold text-zinc-800">
                    ${optimal.value} — {stageData.items.filter((i) => optimal.selected.has(i.id)).map((i) => `${i.emoji} ${i.name}`).join(" + ")}
                  </span>
                  <div className="text-xs text-zinc-500 mt-1">
                    Total weight: {stageData.items.filter((i) => optimal.selected.has(i.id)).reduce((s, i) => s + i.weight, 0)} kg
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showResult && (
        <div className="mt-6 p-5 rounded-xl border border-sky-200 bg-sky-50">
          <div className="text-xs font-bold text-sky-600 uppercase tracking-wide mb-2">
            {stageData.stage === 3 ? "💡 The Core Insight" : "💡 What This Teaches"}
          </div>
          <p className="text-sm text-zinc-700 leading-relaxed">{stageData.lesson}</p>
          {stageData.stage === 3 && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-xs">
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-center">
                <div className="text-xl font-bold text-red-600">{stageData.combinations.toLocaleString()}</div>
                <div className="text-xs text-red-500 mt-0.5 font-medium">Brute force combos</div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <div className="text-xl font-bold text-emerald-600">450</div>
                <div className="text-xs text-emerald-600 mt-0.5 font-medium">DP steps (15 × 30)</div>
              </div>
            </div>
          )}
        </div>
      )}

      {showResult && (
        <div className="mt-5 flex justify-end">
          <button
            onClick={onComplete}
            className="px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm transition-colors shadow-sm"
          >
            {stageData.stage < 3 ? "Next Challenge →" : "Now Learn Why →"}
          </button>
        </div>
      )}
    </div>
  );
}

function ChallengeTab({ slug }: { slug: string }) {
  const [stageIdx, setStageIdx] = useState(0);
  const [completed, setCompleted] = useState(false);

  const currentStage = STAGES[stageIdx];

  function handleStageComplete() {
    if (stageIdx < STAGES.length - 1) {
      setStageIdx((i) => i + 1);
      window.scrollTo({ top: 120, behavior: "smooth" });
    } else {
      setCompleted(true);
    }
  }

  if (completed) {
    return (
      <div className="text-center py-12 space-y-6 max-w-xl mx-auto">
        <div className="text-5xl">🧠</div>
        <h2 className="text-xl font-bold text-zinc-800">You felt the explosion</h2>
        <p className="text-zinc-600 leading-relaxed text-sm">
          3 items — solved by intuition. 6 items — solved by patience. 15 items — impossible by hand.
          <br /><br />
          That feeling is the entire motivation for Dynamic Programming. You&apos;re not learning an abstract algorithm anymore —
          you&apos;re learning the solution to a problem you just experienced.
        </p>
        <div className="grid grid-cols-3 gap-3 my-4">
          {[
            { label: "2³ = 8",        sub: "Solved by intuition", color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
            { label: "2⁶ = 64",       sub: "Solved by patience",  color: "bg-amber-50 border-amber-200 text-amber-700" },
            { label: "2¹⁵ = 32,768",  sub: "Needs a smarter way", color: "bg-red-50 border-red-200 text-red-700" },
          ].map((card) => (
            <div key={card.label} className={`p-3 rounded-xl border text-center ${card.color}`}>
              <div className="text-sm font-bold font-mono">{card.label}</div>
              <div className="text-xs mt-1 opacity-80">{card.sub}</div>
            </div>
          ))}
        </div>
        <Link
          href={`/topics/${slug}/learn`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold transition-colors shadow-sm"
        >
          Learn the DP Solution →
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Stage progress */}
      <div className="flex items-center gap-3 mb-8">
        {STAGES.map((s, i) => (
          <div key={s.stage} className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              i < stageIdx ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                : i === stageIdx ? "bg-sky-100 text-sky-700 border-sky-300"
                : "bg-zinc-100 text-zinc-400 border-zinc-200"
            }`}>
              {i < stageIdx ? "✓" : `${i + 1}`}
              <span className="hidden sm:inline">{s.title}</span>
              <span className="sm:hidden">Stage {i + 1}</span>
            </div>
            {i < STAGES.length - 1 && (
              <div className={`h-px w-6 ${i < stageIdx ? "bg-emerald-300" : "bg-zinc-200"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="mb-5">
        <h2 className="text-xl font-bold text-zinc-800">
          <span className="text-zinc-400 font-normal mr-2">Stage {currentStage.stage} —</span>
          {currentStage.title}
        </h2>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-500">
          <span className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded">{currentStage.items.length} items</span>
          <span className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded">{currentStage.capacity}kg capacity</span>
          <span className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded">
            2<sup>{currentStage.items.length}</sup> = {currentStage.combinations.toLocaleString()} combos
          </span>
        </div>
      </div>

      <KnapsackStage key={stageIdx} stageData={currentStage} onComplete={handleStageComplete} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// YouTube embed + Problems tab (unchanged logic, light theme)
// ─────────────────────────────────────────────────────────────────────────────

function YouTubeEmbed({ youtubeId, title }: { youtubeId: string; title: string }) {
  return (
    <div className="rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50 shadow-sm">
      <div className="aspect-video w-full">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="w-full h-full"
        />
      </div>
      <div className="px-3 py-2 text-sm text-zinc-700">{title}</div>
    </div>
  );
}

const DIFF_ORDER: Record<string, number> = { easy: 0, medium: 1, hard: 2 };
const DIFF_COLOR: Record<string, string> = { easy: "text-green-600", medium: "text-yellow-600", hard: "text-red-600" };
const DIFF_LOCK_LABEL: Record<string, string> = { medium: "Complete Easy first", hard: "Complete Medium first" };

function ProblemsTab({ topic }: { topic: TopicDetail }) {
  const hasProblems = topic.subtopics.some(st => st.problems.length > 0);
  if (!hasProblems) {
    return <div className="text-center py-16 text-zinc-500 text-sm">No problems yet for this topic.</div>;
  }
  return (
    <div className="space-y-8">
      {topic.subtopics.map((st) => {
        if (st.problems.length === 0) return null;
        const sorted = [...st.problems].sort((a, b) => (DIFF_ORDER[a.difficulty] ?? 3) - (DIFF_ORDER[b.difficulty] ?? 3));
        const easyPassed = sorted.filter(p => p.difficulty === "easy").every(p => p.gate_passed);
        const mediumPassed = sorted.filter(p => p.difficulty === "medium").every(p => p.gate_passed);
        function isLocked(d: string) { return d === "medium" ? !easyPassed : d === "hard" ? !mediumPassed : false; }
        return (
          <div key={st.id}>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-zinc-800 font-semibold text-sm">{st.title}</h3>
              {st.gate_passed && (
                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full border border-green-200">Gate passed</span>
              )}
            </div>
            <div className="space-y-2">
              {sorted.map((p) => isLocked(p.difficulty) ? (
                <div key={p.id} className="flex items-center gap-4 p-3 rounded-lg border border-zinc-200 bg-zinc-50 opacity-50 cursor-not-allowed">
                  <span className="text-zinc-400 text-sm">🔒</span>
                  <div className="flex-1 text-sm text-zinc-500">{p.title}</div>
                  <span className="text-xs text-zinc-400">{DIFF_LOCK_LABEL[p.difficulty]}</span>
                  <span className={`text-xs font-medium ${DIFF_COLOR[p.difficulty] ?? "text-zinc-600"}`}>{p.difficulty}</span>
                </div>
              ) : (
                <Link key={p.id} href={`/problems/${p.slug}`}
                  className={`flex items-center gap-4 p-3 rounded-lg border transition-colors group ${
                    p.gate_passed ? "border-green-200 bg-green-50 hover:border-green-300"
                      : "border-zinc-200 bg-white hover:border-sky-300 shadow-sm"
                  }`}>
                  <span className="text-sm">{p.gate_passed ? "✓" : "→"}</span>
                  <div className={`flex-1 text-sm transition-colors ${p.gate_passed ? "text-green-700" : "text-zinc-800 group-hover:text-sky-600"}`}>
                    {p.title}
                  </div>
                  {p.gate_passed && <span className="text-xs text-green-600">Passed</span>}
                  <span className={`text-xs font-medium ${DIFF_COLOR[p.difficulty] ?? "text-zinc-600"}`}>{p.difficulty}</span>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── NavXP ────────────────────────────────────────────────────────────────────

function NavXP({ stats }: { stats: UserStats | null }) {
  if (!stats) return null;
  const pct = Math.round((stats.xp_in_level / stats.xp_to_next) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 bg-white border border-zinc-200 rounded-full px-3 py-1 shadow-sm">
        <span className="text-sky-600 text-xs font-bold">Lv.{stats.level}</span>
        <div className="w-20 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
          <div className="h-full bg-sky-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-zinc-500 text-xs">{stats.xp} XP</span>
      </div>
      {stats.streak_days >= 2 && <span className="text-xs text-orange-500 font-semibold">🔥{stats.streak_days}</span>}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TopicPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("challenge");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !slug) return;
    Promise.all([getTopic(slug), getUserStats()])
      .then(([t, s]) => { setTopic(t); setUserStats(s); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user, slug]);

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-zinc-500 text-sm">Loading topic...</div></div>;
  }

  if (error || !topic) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-red-600 text-sm">{error || "Topic not found"}</div></div>;
  }

  const totalPassed = topic.subtopics.filter((st) => st.gate_passed).length;
  const totalSubtopics = topic.subtopics.length;
  const pct = totalSubtopics === 0 ? 0 : Math.round((totalPassed / totalSubtopics) * 100);

  return (
    <div className="min-h-screen text-zinc-800">
      <nav className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/topics" className="text-zinc-800 font-bold text-lg">Logos</Link>
          <Link href="/topics" className="text-zinc-600 text-sm hover:text-zinc-800 transition-colors">← Curriculum</Link>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <NavXP stats={userStats} />
          <span className="text-zinc-400 hidden sm:block">{user?.email}</span>
          <button onClick={logout} className="text-zinc-600 hover:text-zinc-800 transition-colors">Sign out</button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Topic header */}
        <div className="mb-6">
          <div className="w-full h-52 rounded-2xl overflow-hidden mb-5 bg-zinc-100 border border-zinc-200 shadow-sm">
            <img
              src={`/images/topic_${topic.slug}.png`}
              alt={topic.title}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
          <div className="flex items-start gap-4">
            <div className="text-4xl">{topic.icon}</div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-zinc-800">{topic.title}</h1>
              <p className="text-zinc-600 text-sm mt-1">{topic.description}</p>
              {totalSubtopics > 0 && (
                <div className="mt-3 max-w-xs">
                  <div className="flex justify-between text-xs text-zinc-500 mb-1">
                    <span>{totalPassed}/{totalSubtopics} subtopics passed</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-zinc-200">
          {/* Challenge — first, default */}
          <button
            onClick={() => setTab("challenge")}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
              tab === "challenge" ? "border-emerald-500 text-emerald-700" : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
          >
            🧩 Challenge
          </button>

          {(["videos", "problems"] as const).map((t) => {
            const labels = { videos: "Videos", problems: "Problems" };
            const counts = {
              videos: topic.videos.length,
              problems: topic.subtopics.reduce((s, st) => s + st.problems.length, 0),
            };
            return (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  tab === t ? "border-sky-500 text-sky-600" : "border-transparent text-zinc-500 hover:text-zinc-700"
                }`}
              >
                {labels[t]}
                {(counts[t] ?? 0) > 0 && <span className="ml-1.5 text-xs text-zinc-400">({counts[t]})</span>}
              </button>
            );
          })}

          {/* Learn with AI */}
          {topic.subtopics.some(st => st.play_cards.length > 0) && (
            <Link
              href={`/topics/${topic.slug}/learn`}
              className="px-4 py-2 text-sm font-medium text-sky-600 hover:text-sky-700 border-b-2 border-transparent -mb-px transition-colors flex items-center gap-1.5"
            >
              Learn with AI
              <span className="text-xs text-zinc-400">({topic.subtopics.reduce((s, st) => s + st.play_cards.length, 0)})</span>
              <span className="text-xs">↗</span>
            </Link>
          )}
        </div>

        {/* Tab content */}
        {tab === "challenge" && <ChallengeTab slug={slug} />}

        {tab === "videos" && (
          topic.videos.length === 0
            ? <div className="text-center py-16 text-zinc-500 text-sm">No videos have been added for this topic yet.</div>
            : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topic.videos.map((v) => <YouTubeEmbed key={v.id} youtubeId={v.youtube_id} title={v.title} />)}
              </div>
        )}

        {tab === "problems" && <ProblemsTab topic={topic} />}
      </main>
    </div>
  );
}
