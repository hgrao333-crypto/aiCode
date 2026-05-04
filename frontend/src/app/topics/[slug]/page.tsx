"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { getTopic, getUserStats, tutorChat, TopicDetail, SubTopicDetail, UserStats, getTutorProgress, saveTutorProgress, completeSubtopic, completeFinal, markSubtopicPassed } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { TopicExplorer } from "./explorer";

// ─── Tab types ─────────────────────────────────────────────────────────────────

type Tab = "explore" | "tutor" | "problems" | "videos";

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

function ChallengeTab({ slug, onComplete }: { slug: string; onComplete: () => void }) {
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
        <button
          onClick={onComplete}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold transition-colors shadow-sm"
        >
          Learn the DP Solution →
        </button>
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
// TUTOR: Socratic AI tutor — 5 subtopics + assessment
// ─────────────────────────────────────────────────────────────────────────────

// ── Assessment question types ────────────────────────────────────────────────
type MCQQuestion  = { type: "mcq";   q: string; options: string[]; correct: number; explanation: string };
type DebugQuestion = { type: "debug"; q: string; code: string; explanation: string };
type TraceQuestion = { type: "trace"; q: string; hint: string; answer: string; explanation: string };
type AssessQ = MCQQuestion | DebugQuestion | TraceQuestion;
type Blank = { label: string; answer: string };
type CodingProblem = { title: string; description: string; code: string; blanks: Blank[]; hint: string };

interface SubtopicCfg {
  stage: number; title: string; icon: string;
  concepts: string[]; opener: string; assessment: AssessQ[];
}

const SUBTOPICS: SubtopicCfg[] = [
  {
    stage: 1, title: "The Thief's Choice", icon: "🎒",
    concepts: ["Problem framing", "Why greedy fails", "2ⁿ decision tree"],
    opener: "Let's start with the problem. Items A(3kg,$5), B(2kg,$3), C(2kg,$3), capacity 4kg. Easy approach: take the best value-per-kg first. Greedy takes A (ratio 1.67), leaving 1kg — neither B nor C fits. Result: $5. Can you find a better selection?",
    assessment: [
      {
        type: "mcq",
        q: "Items A(3kg,$5), B(2kg,$3), C(2kg,$3), capacity 4kg. Greedy picks A → $5. Why did greedy fail here?",
        options: [
          "Greedy didn't sort by weight",
          "Taking A used 3kg, leaving no room for B+C which together give $6",
          "Greedy is correct — $5 is optimal",
          "Greedy should pick by value alone, not ratio",
        ],
        correct: 1,
        explanation: "B+C = 4kg, $6 beats greedy's $5. Greedy locked in a 'good' item that crowded out a better combination. One choice changes what's possible later — that's why greedy fails.",
      },
      {
        type: "debug",
        q: "This greedy function returns wrong results. What's the bug?",
        code: `def greedy_knapsack(items, capacity):
    # items = [(weight, value), ...]
    items.sort(key=lambda x: x[1] / x[0])   # sort by value/weight ratio
    total, remaining = 0, capacity
    for w, v in items:
        if w <= remaining:
            total += v
            remaining -= w
    return total`,
        explanation: "The sort is ascending — it picks items with the LOWEST value/weight ratio first! Fix: add `reverse=True` to the sort call. Always double-check sort direction when greedy involves ratios.",
      },
    ],
  },
  {
    stage: 2, title: "Overlapping Subproblems", icon: "🔁",
    concepts: ["Recursive structure", "Repeated sub-problems", "Memoization"],
    opener: "Greedy fails, so try brute force: check every take-or-skip combination. But in the recursion tree, sub-problems repeat — knapsack(items 1-2, capacity 3kg) might appear on dozens of branches. What's the simplest fix for recomputed answers?",
    assessment: [
      {
        type: "mcq",
        q: "What is the time complexity of knapsack with memoization (top-down DP)?",
        options: [
          "O(2ⁿ) — same as brute force",
          "O(n × W) — each unique (i, w) pair solved exactly once",
          "O(n²) — nested loops",
          "O(n log W) — binary search on capacity",
        ],
        correct: 1,
        explanation: "There are exactly n×W unique (item index, remaining capacity) pairs. Memoization ensures each is computed once and cached. Both time and space become O(n×W) — dramatically better than O(2ⁿ).",
      },
      {
        type: "trace",
        q: "Memoized knapsack: items = [(2kg,$3), (3kg,$4)], capacity = 5. What is memo[(2, 5)]?",
        hint: "2 items, capacity 5. Can both fit? 2+3=5 ≤ 5. Total value = $3+$4 = ?",
        answer: "7",
        explanation: "Both items fit: 2+3=5kg, value $3+$4=$7. memo[(2,5)] = 7. The sub-problem 'best value using first 2 items at capacity 5' is solved once and stored.",
      },
    ],
  },
  {
    stage: 3, title: "Building the Table", icon: "📊",
    concepts: ["Bottom-up DP", "2D table dp[i][w]", "Recurrence: skip vs take"],
    opener: "Memoization works top-down. Now go bottom-up: build a table dp[i][w] = best value using first i items at capacity w. Start with the base case — the whole first row dp[0][w] = ? (no items, any capacity.)",
    assessment: [
      {
        type: "mcq",
        q: "In dp[i][w] = max(dp[i-1][w], dp[i-1][w−wᵢ]+vᵢ), what does dp[i-1][w−wᵢ] represent?",
        options: [
          "Best value using all items at capacity w",
          "Best value using first (i-1) items with capacity (w-wᵢ) — after making room for item i",
          "The value of item i",
          "The weight remaining after taking item i",
        ],
        correct: 1,
        explanation: "If you take item i (weight wᵢ), you use wᵢ capacity. The best you can do with the remaining (w-wᵢ) capacity using items before i is dp[i-1][w-wᵢ]. Add vᵢ and compare with skipping.",
      },
      {
        type: "debug",
        q: "This 2D DP gives values that are too high. What's wrong?",
        code: `dp = [[0]*(W+1) for _ in range(n+1)]
for i in range(1, n+1):
    wi, vi = items[i-1]
    for w in range(W+1):
        dp[i][w] = dp[i-1][w]           # skip
        if wi <= w:
            dp[i][w] = max(dp[i][w],
                dp[i][w-wi] + vi)        # ← look here`,
        explanation: "`dp[i][w-wi]` should be `dp[i-1][w-wi]`. Using the current row i means you can pick item i multiple times in one pass — that's unbounded knapsack. Always look back to row i-1 when 'taking' an item in 0/1 knapsack.",
      },
    ],
  },
  {
    stage: 4, title: "One Row is Enough", icon: "➡️",
    concepts: ["1D DP array", "Right-to-left iteration", "O(W) space"],
    opener: "Our 2D table uses O(n×W) space — but dp[i][w] only reads row i-1. Can we compress to a single 1D array dp[w] updated in place? What breaks if you update left-to-right?",
    assessment: [
      {
        type: "mcq",
        q: "In 1D DP, why iterate w from W down to wᵢ (right-to-left)?",
        options: [
          "It's faster on modern CPUs due to cache locality",
          "Left-to-right updates dp[w-wᵢ] first — item i could be counted twice in one pass",
          "Going left-to-right would skip some capacities",
          "Both directions are equivalent for 0/1 knapsack",
        ],
        correct: 1,
        explanation: "Left-to-right: when computing dp[w], dp[w-wᵢ] was already updated this iteration → item i gets added again (unbounded behavior). Right-to-left ensures dp[w-wᵢ] still holds the 'before this item' value.",
      },
      {
        type: "trace",
        q: "1D DP: single item (2kg,$3), W=4. Starting from dp=[0,0,0,0,0], after processing this item right-to-left, what is dp[4]?",
        hint: "Iterate w=4,3,2. At w=4: dp[4]=max(dp[4], dp[4-2]+3)=max(0, dp[2]+3). dp[2] hasn't been updated yet → dp[2]=0.",
        answer: "3",
        explanation: "Right-to-left: w=4→max(0,dp[2]+3)=3, w=3→max(0,dp[1]+3)=3, w=2→max(0,dp[0]+3)=3. Each capacity gets the item at most once. dp[4]=3 (one copy of the item).",
      },
    ],
  },
  {
    stage: 5, title: "Variations", icon: "🔀",
    concepts: ["Subset Sum mapping", "Unbounded Knapsack", "Pattern recognition"],
    opener: "You know 0/1 Knapsack cold. New problem: given integers [3,1,5,9,12], can any subset sum to exactly 14? Before writing code — does this feel structurally similar to anything you've seen?",
    assessment: [
      {
        type: "mcq",
        q: "Subset Sum mapped to knapsack: weight=value=num, capacity=target. What does dp[n][target]=target mean?",
        options: [
          "We found exactly 'target' items in the array",
          "A subset exists that sums to target (since value=weight, total_value=total_weight=target)",
          "The array length equals target",
          "The greedy approach would work here",
        ],
        correct: 1,
        explanation: "Since value=weight=num, dp[n][target]=target means we packed exactly 'target' units of value into 'target' capacity — the selected numbers sum to target. dp[n][target] < target means no valid subset.",
      },
      {
        type: "debug",
        q: "This is meant to be unbounded knapsack (each item usable unlimited times). It's accidentally doing 0/1 knapsack. Fix it:",
        code: `dp = [0] * (W+1)
for wi, vi in items:
    for w in range(W, wi-1, -1):   # right-to-left
        dp[w] = max(dp[w], dp[w-wi] + vi)
return dp[W]`,
        explanation: "Change the loop to left-to-right: `range(wi, W+1)`. Left-to-right means dp[w-wi] was already updated this iteration → the same item can be added multiple times. Right-to-left = 0/1 (one copy). Left-to-right = unbounded. One direction change, completely different problem.",
      },
    ],
  },
];

// ── Per-subtopic easy coding exercises ───────────────────────────────────────

const CODING_PROBLEMS: CodingProblem[] = [
  {
    title: "Brute Force Recursion",
    description: "Complete the recursive knapsack. When you take item i, the remaining capacity shrinks by its weight. Return the better of skip vs take.",
    code: `def knapsack(items, capacity, i=0):
    if i == len(items) or capacity == 0:
        return 0
    w, v = items[i]
    skip = knapsack(items, capacity, i + 1)
    if w > capacity:
        return skip
    take = v + knapsack(items, [1], i + 1)
    return [2]`,
    blanks: [
      { label: "Capacity left after taking item i (weight w)", answer: "capacity - w" },
      { label: "Return the better choice between skip and take", answer: "max(skip, take)" },
    ],
    hint: "Taking item i costs w capacity. The recursive call for 'take' must reflect that reduced capacity. The function should return whichever path gives more total value.",
  },
  {
    title: "Add Memoization",
    description: "The brute force recomputes identical sub-problems. Add a cache dict. The key must uniquely identify a sub-problem — what two values define it?",
    code: `memo = {}
def knapsack(items, capacity, i=0):
    if i == len(items) or capacity == 0:
        return 0
    key = [1]
    if key in memo:
        return memo[key]
    w, v = items[i]
    skip = knapsack(items, capacity, i + 1)
    take = (v + knapsack(items, capacity - w, i + 1)) if w <= capacity else 0
    memo[key] = max(skip, take)
    return memo[key]`,
    blanks: [
      { label: "Cache key that uniquely identifies this sub-problem (item index, remaining capacity)", answer: "(i, capacity)" },
    ],
    hint: "A sub-problem is fully defined by two numbers: which item we're deciding on now, and how much capacity remains.",
  },
  {
    title: "Fill the 2D Recurrence",
    description: "Bottom-up DP: dp[i][w] = best value using first i items at capacity w. Fill the 'take item i' branch of the recurrence.",
    code: `def knapsack(items, W):
    n = len(items)
    dp = [[0] * (W + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        w, v = items[i - 1]
        for cap in range(W + 1):
            dp[i][cap] = dp[i-1][cap]      # skip
            if w <= cap:
                dp[i][cap] = max(dp[i][cap],
                    [1] + v)               # take item i
    return dp[n][W]`,
    blanks: [
      { label: "Best value using first i-1 items, capacity after making room for item i", answer: "dp[i-1][cap-w]" },
    ],
    hint: "Taking item i uses w capacity. What's the best we could do with (cap-w) capacity, using only the items before i (row i-1)?",
  },
  {
    title: "1D DP — Right to Left",
    description: "Compress the 2D table to one array. Fill the iteration start and the dp lookup for the 'take' case.",
    code: `def knapsack(items, W):
    dp = [0] * (W + 1)
    for w, v in items:
        for cap in range([1], w - 1, -1):  # right-to-left
            dp[cap] = max(dp[cap], [2] + v)
    return dp[W]`,
    blanks: [
      { label: "Start of the right-to-left range (largest capacity first)", answer: "W" },
      { label: "dp lookup for taking the item (capacity before this item was added)", answer: "dp[cap-w]" },
    ],
    hint: "range(start, stop, step=-1) goes from start down to stop+1. Start at max capacity W. Taking the item means looking back at dp[cap-w] — the value before this item occupied w space.",
  },
  {
    title: "Subset Sum via DP",
    description: "Can [3,1,5,9,12] be split into two equal subsets? Use a boolean DP: dp[cap] = True if some subset sums to cap.",
    code: `def can_partition(nums):
    total = sum(nums)
    if total % 2 != 0:
        return False
    target = total // 2
    dp = [False] * (target + 1)
    dp[0] = [1]                          # empty subset always sums to 0
    for n in nums:
        for cap in range(target, n - 1, -1):
            dp[cap] = dp[cap] or [2]
    return dp[target]`,
    blanks: [
      { label: "Initial value for dp[0] — can we reach sum 0?", answer: "True" },
      { label: "Transition: can we reach cap by including this number?", answer: "dp[cap-n]" },
    ],
    hint: "dp[0]=True because an empty subset sums to 0. Transition: we can reach 'cap' if we could previously reach 'cap-n' (and now add n to that subset).",
  },
];

const FINAL_PROBLEM: CodingProblem = {
  title: "Knapsack with Item Tracking",
  description: "Hard: find the maximum value AND recover the list of items chosen. Fill the forward DP recurrence, then complete the backtracking pass.",
  code: `def knapsack_with_items(items, W):
    # items = [(weight, value), ...]
    n = len(items)
    dp = [[0] * (W + 1) for _ in range(n + 1)]

    for i in range(1, n + 1):
        wi, vi = items[i - 1]
        for cap in range(W + 1):
            dp[i][cap] = dp[i-1][cap]
            if wi <= cap:
                dp[i][cap] = max(dp[i][cap],
                    [1] + vi)    # take item i

    chosen, cap = [], W
    for i in range(n, 0, -1):
        if dp[i][cap] != [2]:    # item i was taken
            chosen.append(items[i-1])
            cap -= [3]           # reduce remaining capacity
    return dp[n][W], chosen`,
  blanks: [
    { label: "Recurrence: best value using first i-1 items with capacity after taking item i", answer: "dp[i-1][cap-wi]" },
    { label: "Backtrack check: value at this capacity WITHOUT item i (if unchanged, item was skipped)", answer: "dp[i-1][cap]" },
    { label: "Reduce remaining capacity after confirming item i was taken (item i has weight wi)", answer: "wi" },
  ],
  hint: "Backtracking: if dp[i][cap] == dp[i-1][cap], the value didn't change → item i was skipped. If it changed, item i was taken — append it and subtract its weight from cap.",
};

// ── Arrays & Hashing tutor config ────────────────────────────────────────────

const AH_SUBTOPICS: SubtopicCfg[] = [
  {
    stage: 1, title: "Memory & Indexing", icon: "🧱",
    concepts: ["Contiguous memory", "Base + offset formula", "O(1) random access"],
    opener: "Here's an array [10, 20, 30, 40] stored in memory starting at address 1000, each element taking 4 bytes. You want arr[2]. How does Python find it instantly — without scanning index 0 and 1 first?",
    assessment: [
      {
        type: "mcq",
        q: "Why is arr[i] O(1) while a linked-list lookup is O(n)?",
        options: [
          "Python caches the most recently accessed elements",
          "Array elements sit at address base + i×size — a direct calculation, no scanning",
          "Python uses binary search inside the array",
          "The OS pre-loads small arrays into registers",
        ],
        correct: 1,
        explanation: "Arrays are contiguous — element i is always at base + i × element_size. Python computes this address directly (one multiply + add). A linked list must follow pointers one node at a time → O(n).",
      },
      {
        type: "debug",
        q: "This function returns the correct value but is much slower than it needs to be. What's wrong?",
        code: `def get_at_index(arr, i):
    count = 0
    for item in arr:
        if count == i:
            return item
        count += 1`,
        explanation: "This is O(n) — it scans from the front every time. Python's arr[i] uses the formula address = base + i×size and reads memory in one step. Never loop to simulate index access on a list.",
      },
    ],
  },
  {
    stage: 2, title: "How Hashing Works", icon: "🗝️",
    concepts: ["Hash function", "Buckets", "O(1) average lookup"],
    opener: "A Python dict stores 'apple': 5. When you write d['apple'], Python returns 5 in O(1) — without looping through every key. How?",
    assessment: [
      {
        type: "mcq",
        q: "What does a hash function do in a hash map?",
        options: [
          "Sorts the keys for binary search",
          "Maps any key to a fixed bucket index for direct O(1) access",
          "Encrypts the key before storage",
          "Counts how many times the key has been inserted",
        ],
        correct: 1,
        explanation: "hash(key) converts the key to an integer. bucket = hash(key) % num_buckets. Python reads exactly that bucket — no search needed. Average O(1) for both get and set.",
      },
      {
        type: "trace",
        q: "freq = {}; freq['a'] = freq.get('a', 0) + 1; freq['b'] = freq.get('b', 0) + 1; freq['a'] = freq.get('a', 0) + 1. What is freq['a']?",
        hint: "Start empty. Trace each assignment. How many times is 'a' incremented?",
        answer: "2",
        explanation: "Line 1: freq['a'] = 0+1 = 1. Line 3: freq['a'] = 1+1 = 2. freq['b'] = 1. dict.get(key, 0)+1 is the standard frequency-counting idiom.",
      },
    ],
  },
  {
    stage: 3, title: "The Complement Trick", icon: "🎯",
    concepts: ["Single-pass hash map", "Complement lookup", "O(n) time, O(n) space"],
    opener: "Array [2, 7, 11, 15], target = 9. Brute force: for every pair (i, j) check if they sum to 9 — that's O(n²). Can you do it in a single pass? What would you need to keep track of?",
    assessment: [
      {
        type: "mcq",
        q: "In the one-pass Two Sum solution, what does the hash map store?",
        options: [
          "All pairs (i, j) whose elements sum to target",
          "Each number and its index — {value: index}",
          "All numbers in sorted order",
          "The count of each number",
        ],
        correct: 1,
        explanation: "seen = {value: index}. At each num, check if (target−num) is already in seen. If yes → return [seen[target−num], i]. If no → store seen[num] = i and continue. One pass, O(n) time.",
      },
      {
        type: "debug",
        q: "This Two Sum runs in O(n²) instead of O(n). What's the bug?",
        code: `def two_sum(nums, target):
    seen = []
    for i, n in enumerate(nums):
        comp = target - n
        if comp in seen:
            return [seen.index(comp), i]
        seen.append(n)
    return []`,
        explanation: "`seen` is a list — `comp in seen` is O(n) and `.index(comp)` is O(n). Change to a dict: `seen = {}`, store `seen[n] = i`, and look up `seen[comp]` for O(1). Same logic, O(n) total.",
      },
    ],
  },
];

const AH_CODING_PROBLEMS: CodingProblem[] = [
  {
    title: "Frequency Counter",
    description: "Count how many times each number appears. Use dict.get(key, default) to handle missing keys without a KeyError.",
    code: `def count_frequencies(nums):
    freq = {}
    for num in nums:
        freq[num] = freq.[1](num, 0) + [2]
    return freq`,
    blanks: [
      { label: "Dict method that returns a default if key is absent", answer: "get" },
      { label: "Increment the count by this amount each time", answer: "1" },
    ],
    hint: "dict.get(key, 0) returns the current count or 0 if the key doesn't exist yet. Add 1 to that to increment.",
  },
  {
    title: "Contains Duplicate",
    description: "Return True if any value appears more than once. A set gives O(1) membership tests — better than a list's O(n).",
    code: `def contains_duplicate(nums):
    seen = [1]
    for n in nums:
        if n in seen:
            return [2]
        seen.add(n)
    return False`,
    blanks: [
      { label: "Data structure with O(1) membership tests (not a list)", answer: "set()" },
      { label: "Return value when a duplicate is found", answer: "True" },
    ],
    hint: "A set has O(1) `in` checks. If the number is already in the set, it's a duplicate. Otherwise, add it and keep scanning.",
  },
  {
    title: "Valid Anagram",
    description: "Two strings are anagrams if they use the same letters the same number of times. Count up for s, count down for t.",
    code: `def is_anagram(s, t):
    if len(s) != len(t):
        return False
    count = {}
    for c in s:
        count[c] = count.[1](c, 0) + 1
    for c in t:
        count[c] = count.[2](c, 0) - 1
        if count[c] < [3]:
            return False
    return True`,
    blanks: [
      { label: "Dict method to get current count (default 0) — for s loop", answer: "get" },
      { label: "Dict method to get current count (default 0) — for t loop", answer: "get" },
      { label: "Threshold: a negative count means t has more of this letter than s", answer: "0" },
    ],
    hint: "Count each letter in s (+1), then subtract for each letter in t (−1). If any count goes negative, t has more of that letter than s → not an anagram.",
  },
];

const AH_FINAL_PROBLEM: CodingProblem = {
  title: "Two Sum — One Pass",
  description: "Hard: find indices of the two numbers that sum to target. O(n) time, O(n) space. Fill the complement formula, the index lookup, and the storage line.",
  code: `def two_sum(nums, target):
    seen = {}   # {value: index}
    for i, n in enumerate(nums):
        complement = [1]
        if complement in seen:
            return [[2], i]
        seen[n] = [3]
    return []`,
  blanks: [
    { label: "Number that pairs with n to reach target", answer: "target - n" },
    { label: "Index of the complement (retrieve from seen dict)", answer: "seen[complement]" },
    { label: "Store current number's index so future elements can find it", answer: "i" },
  ],
  hint: "For each n, check if its partner (target−n) was already seen. Store {value: index} so you can retrieve the partner's index in O(1) when needed.",
};

// ── Topic tutor config registry ───────────────────────────────────────────────

interface TopicTutorCfg { subtopics: SubtopicCfg[]; codingProblems: CodingProblem[]; finalProblem: CodingProblem }

const TOPIC_TUTOR_CONFIG: Record<string, TopicTutorCfg> = {
  "knapsack":            { subtopics: SUBTOPICS, codingProblems: CODING_PROBLEMS, finalProblem: FINAL_PROBLEM },
  "dynamic-programming": { subtopics: SUBTOPICS, codingProblems: CODING_PROBLEMS, finalProblem: FINAL_PROBLEM },
  "arrays-hashing":      { subtopics: AH_SUBTOPICS, codingProblems: AH_CODING_PROBLEMS, finalProblem: AH_FINAL_PROBLEM },
};

// ── Visual aid per subtopic ───────────────────────────────────────────────────

function SubtopicVisual({ stage, slug }: { stage: number; slug: string }) {
  if (slug === "arrays-hashing") {
    if (stage === 1) return (
      <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-sm space-y-3">
        <div className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Memory Layout</div>
        <div className="font-mono text-xs space-y-1.5">
          <div className="text-zinc-500">arr = [10, 20, 30, 40]  (base = 1000, 4 bytes each)</div>
          {[0,1,2,3].map(i => (
            <div key={i} className={`flex items-center gap-3 p-1.5 rounded-lg ${i===2?"bg-sky-50 border border-sky-200":""}`}>
              <span className="text-zinc-400 w-20">addr {1000+i*4}</span>
              <span className={`font-bold ${i===2?"text-sky-600":"text-zinc-700"}`}>{[10,20,30,40][i]}</span>
              <span className="text-zinc-400">← arr[{i}]{i===2?" ← you want this":""}</span>
            </div>
          ))}
        </div>
        <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-mono">
          <span className="text-sky-600 font-bold">addr</span> = 1000 + 2 × 4 = <span className="text-emerald-600 font-bold">1008</span> — direct, no scan
        </div>
      </div>
    );
    if (stage === 2) return (
      <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-sm space-y-3">
        <div className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Hash Map Buckets</div>
        <div className="grid grid-cols-4 gap-1 text-xs font-mono">
          {["apple→5","—","—","—","—","cat→2","—","dog→8"].map((v,i)=>(
            <div key={i} className={`p-1.5 rounded-md text-center border ${v==="—"?"bg-zinc-50 border-zinc-200 text-zinc-300":"bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold"}`}>
              <div className="text-zinc-400 text-[10px] mb-0.5">b{i}</div>
              {v}
            </div>
          ))}
        </div>
        <div className="text-xs text-zinc-500">
          hash(&apos;apple&apos;) % 8 = <span className="text-indigo-600 font-bold">0</span> → read bucket 0 directly → O(1)
        </div>
      </div>
    );
    if (stage === 3) return (
      <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-sm space-y-3">
        <div className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Two Sum: [2, 7, 11, 15], target=9</div>
        <div className="text-xs font-mono space-y-1.5">
          {[{n:2,comp:7,found:false,seen:"{}→{2:0}"},{n:7,comp:2,found:true,seen:"{2:0}"}].map((row,i)=>(
            <div key={i} className={`flex items-center gap-2 p-1.5 rounded-lg ${row.found?"bg-emerald-50 border border-emerald-200":""}`}>
              <span className="text-zinc-400 w-4">{i}</span>
              <span className={row.found?"text-emerald-600 font-bold":"text-zinc-700"}>n={row.n}</span>
              <span className="text-zinc-400">comp={row.comp}</span>
              {row.found
                ? <span className="text-emerald-600 font-bold ml-auto">✓ found! return [0,1]</span>
                : <span className="text-zinc-500 ml-auto">store → {row.seen}</span>}
            </div>
          ))}
        </div>
        <div className="text-xs text-zinc-500">One pass, O(n). Each element: check complement → store or return.</div>
      </div>
    );
    return null;
  }
  if (stage === 1) return (
    <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-sm space-y-3">
      <div className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Decision Tree</div>
      <div className="text-xs space-y-1.5 font-mono">
        <div className="text-zinc-500">For each item i:</div>
        <div className="pl-3 space-y-1">
          <div><span className="text-sky-600 font-bold">SKIP</span> → solve(rest, same capacity)</div>
          <div><span className="text-emerald-600 font-bold">TAKE</span> → solve(rest, W−wᵢ) + vᵢ</div>
        </div>
        <div className="pt-1.5 text-zinc-500">n items → <span className="text-red-600 font-bold">2ⁿ leaves</span></div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs text-center">
        {[["n=3","8"],["n=15","32,768"],["n=30","1B+"]].map(([n,c])=>(
          <div key={n} className="p-2 rounded-lg bg-zinc-50 border border-zinc-200">
            <div className="font-mono font-bold text-zinc-700">{n}</div>
            <div className="text-red-500 font-semibold text-[11px]">{c}</div>
          </div>
        ))}
      </div>
    </div>
  );
  if (stage === 2) return (
    <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-sm space-y-3">
      <div className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Memoization</div>
      <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 font-mono text-xs text-zinc-700">
        memo[(i, w)] = best value<br/>using first i items, capacity w
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 rounded-lg bg-red-50 border border-red-200">
          <div className="font-bold text-red-700 mb-0.5">Without cache</div>
          <div className="text-red-600 leading-snug">Same (i,w) solved O(2ⁿ) times</div>
        </div>
        <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
          <div className="font-bold text-emerald-700 mb-0.5">With cache</div>
          <div className="text-emerald-600 leading-snug">Each (i,w) solved once → O(n×W)</div>
        </div>
      </div>
    </div>
  );
  if (stage === 3) return (
    <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-sm space-y-2">
      <div className="text-xs font-bold text-zinc-500 uppercase tracking-wide">DP Table (cap=8)</div>
      <div className="overflow-x-auto">
        <table className="text-xs font-mono border-collapse w-full">
          <thead><tr>
            <th className="text-zinc-400 text-left pb-1 pr-2">i\w</th>
            {[0,1,2,3,4,5,6,7,8].map(w=><th key={w} className="text-zinc-400 pb-1 px-1 text-center">{w}</th>)}
          </tr></thead>
          <tbody>
            {[{l:"0",r:[0,0,0,0,0,0,0,0,0]},{l:"1💎",r:[0,0,0,0,0,0,0,10,10]},{l:"2🥇",r:[0,0,0,0,0,8,8,10,10]},{l:"3🔋",r:[0,0,0,5,5,8,8,10,13]}].map(({l,r},ri)=>(
              <tr key={ri}>
                <td className="text-zinc-500 pr-2 py-0.5">{l}</td>
                {r.map((v,wi)=><td key={wi} className={`text-center px-1 py-0.5 rounded ${ri===3&&wi===8?"bg-emerald-100 text-emerald-700 font-bold":v>0?"text-zinc-700":"text-zinc-300"}`}>{v}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-zinc-500">dp[3][8]=<span className="text-emerald-600 font-bold">13</span> → Gold+Battery</div>
    </div>
  );
  if (stage === 4) return (
    <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-sm space-y-3">
      <div className="text-xs font-bold text-zinc-500 uppercase tracking-wide">1D DP: item (2kg,$3), W=5</div>
      <div className="text-xs font-mono space-y-2">
        <div>
          <div className="text-red-600 font-bold mb-0.5">Left→Right (wrong):</div>
          <div className="text-zinc-600 pl-2 space-y-0.5">
            <div>w=2: dp[2]=max(0,dp[0]+3)=<span className="font-bold">3</span></div>
            <div>w=4: dp[4]=max(0,<span className="text-red-500">dp[2]</span>+3)=<span className="text-red-600 font-bold">6</span> ← item used twice!</div>
          </div>
        </div>
        <div>
          <div className="text-emerald-600 font-bold mb-0.5">Right→Left (correct):</div>
          <div className="text-zinc-600 pl-2 space-y-0.5">
            <div>w=4: dp[4]=max(0,<span className="text-emerald-500">dp[2]</span>+3)=<span className="text-emerald-700 font-bold">3</span> ✓</div>
            <div>w=2: dp[2]=max(0,dp[0]+3)=<span className="text-emerald-700 font-bold">3</span> ✓</div>
          </div>
        </div>
      </div>
    </div>
  );
  if (stage === 5) return (
    <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-sm space-y-3">
      <div className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Pattern Map</div>
      <table className="w-full text-xs">
        <thead><tr>
          <th className="text-left text-zinc-500 font-medium pb-1.5">Problem</th>
          <th className="text-left text-zinc-500 font-medium pb-1.5">Loop</th>
        </tr></thead>
        <tbody>
          {[["0/1 Knapsack","R→L"],["Subset Sum","R→L"],["Unbounded Knapsack","L→R"],["Coin Change (min)","L→R"]].map(([p,d])=>(
            <tr key={p}>
              <td className="text-zinc-700 py-1 pr-2 text-[11px]">{p}</td>
              <td className={`py-1 font-mono font-bold text-[11px] ${d==="R→L"?"text-sky-600":"text-emerald-600"}`}>{d}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  return null;
}

// ── Assessment question cards ─────────────────────────────────────────────────

function MCQCard({ q, onDone }: { q: MCQQuestion; onDone: (correct: boolean) => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;
  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-800 leading-relaxed">{q.q}</p>
      <div className="space-y-2">
        {q.options.map((opt, i) => (
          <button key={i} disabled={answered}
            onClick={() => { setSelected(i); onDone(i === q.correct); }}
            className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-colors ${
              !answered ? "border-zinc-200 bg-white hover:border-sky-300 hover:bg-sky-50 text-zinc-700"
              : i === q.correct ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : i === selected ? "border-red-300 bg-red-50 text-red-700"
              : "border-zinc-100 bg-zinc-50 text-zinc-400"
            }`}>
            <span className="font-mono text-xs mr-2 text-zinc-400">{String.fromCharCode(65+i)}.</span>{opt}
          </button>
        ))}
      </div>
      {answered && (
        <div className={`p-3 rounded-xl text-sm border ${selected===q.correct?"bg-emerald-50 border-emerald-200 text-emerald-800":"bg-amber-50 border-amber-200 text-amber-800"}`}>
          <span className="font-semibold">{selected===q.correct?"✓ Correct! ":"Not quite — "}</span>{q.explanation}
        </div>
      )}
    </div>
  );
}

function DebugCard({ q, onDone }: { q: DebugQuestion; onDone: () => void }) {
  const [input, setInput] = useState("");
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-800">{q.q}</p>
      <pre className="text-[11px] font-mono bg-zinc-50 border border-zinc-200 rounded-xl p-4 overflow-x-auto text-zinc-700 leading-relaxed whitespace-pre">{q.code}</pre>
      {!revealed ? (
        <div className="space-y-2">
          <textarea value={input} onChange={e=>setInput(e.target.value)} rows={2}
            placeholder="Describe the bug in your own words..."
            className="w-full text-sm bg-white border border-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:border-sky-400 resize-none text-zinc-800 placeholder:text-zinc-400" />
          <button onClick={() => { setRevealed(true); onDone(); }}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition-colors">
            Reveal Answer
          </button>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sm text-sky-900">
          <span className="font-semibold">The bug: </span>{q.explanation}
        </div>
      )}
    </div>
  );
}

function TraceCard({ q, onDone }: { q: TraceQuestion; onDone: (correct: boolean) => void }) {
  const [input, setInput] = useState("");
  const [checked, setChecked] = useState(false);
  const isCorrect = input.trim() === q.answer.trim();
  function check() { if (input.trim()) { setChecked(true); onDone(isCorrect); } }
  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-800">{q.q}</p>
      <p className="text-xs text-zinc-500 italic">{q.hint}</p>
      <div className="flex gap-2">
        <input type="text" value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter"&&!checked) check(); }}
          disabled={checked} placeholder="Your answer..."
          className="flex-1 text-sm bg-white border border-zinc-200 rounded-xl px-3 py-2 focus:outline-none focus:border-sky-400 disabled:opacity-60 text-zinc-800" />
        {!checked && (
          <button onClick={check} disabled={!input.trim()}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-sm font-medium">
            Check
          </button>
        )}
      </div>
      {checked && (
        <div className={`p-3 rounded-xl text-sm border ${isCorrect?"bg-emerald-50 border-emerald-200 text-emerald-800":"bg-amber-50 border-amber-200 text-amber-800"}`}>
          {!isCorrect && <div className="font-semibold mb-1">Answer: {q.answer}</div>}
          {isCorrect && <div className="font-semibold mb-1">✓ Correct!</div>}
          {q.explanation}
        </div>
      )}
    </div>
  );
}

function AssessmentPhase({ cfg, onComplete }: { cfg: SubtopicCfg; onComplete: () => void }) {
  const [qIdx, setQIdx] = useState(0);
  const [answered, setAnswered] = useState(false);

  const q = cfg.assessment[qIdx];
  const isLast = qIdx === cfg.assessment.length - 1;

  function handleDone(correct?: boolean) { void correct; setAnswered(true); }
  function next() { if (isLast) onComplete(); else { setQIdx(i=>i+1); setAnswered(false); } }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{cfg.icon}</span>
        <div>
          <div className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Check Your Understanding</div>
          <div className="font-semibold text-zinc-800 text-sm">{cfg.title}</div>
        </div>
        <span className="ml-auto text-xs text-zinc-400">Q{qIdx+1} of {cfg.assessment.length}</span>
      </div>
      <div className="flex gap-1.5">
        {cfg.assessment.map((_,i)=>(
          <div key={i} className={`flex-1 h-1.5 rounded-full ${i<qIdx?"bg-emerald-400":i===qIdx?"bg-sky-400":"bg-zinc-200"}`} />
        ))}
      </div>
      <div className="p-5 rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="mb-4">
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
            q.type==="mcq"?"bg-sky-100 text-sky-700":q.type==="debug"?"bg-red-100 text-red-700":"bg-amber-100 text-amber-700"
          }`}>
            {q.type==="mcq"?"Multiple Choice":q.type==="debug"?"Find the Bug":"Trace the Code"}
          </span>
        </div>
        {q.type==="mcq"  && <MCQCard  q={q} onDone={(c)=>handleDone(c)} />}
        {q.type==="debug" && <DebugCard q={q} onDone={()=>handleDone()} />}
        {q.type==="trace" && <TraceCard q={q} onDone={(c)=>handleDone(c)} />}
      </div>
      {answered && (
        <div className="flex justify-end">
          <button onClick={next}
            className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm transition-colors">
            {isLast?"Continue →":"Next Question →"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Coding playground ────────────────────────────────────────────────────────

function renderCodeWithBlanks(code: string) {
  return code.split(/(\[\d+\])/).map((part, i) =>
    /^\[\d+\]$/.test(part)
      ? <span key={i} className="bg-sky-100 text-sky-700 font-bold rounded px-1 mx-0.5 text-[11px] border border-sky-200">{part}</span>
      : <span key={i}>{part}</span>
  );
}

function SubtopicNav({ subtopics, subtopicIdx, completedSubtopics, phase, onJump, onFinal }: {
  subtopics: SubtopicCfg[]; subtopicIdx: number; completedSubtopics: number[]; phase: string;
  onJump: (i: number) => void; onFinal: () => void;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {subtopics.map((s, i) => {
        const isDone = completedSubtopics.includes(i);
        const isCurrent = i === subtopicIdx && phase !== "final";
        return (
          <button key={i}
            onClick={() => onJump(i)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
              isCurrent ? "bg-sky-100 text-sky-700 border-sky-300"
              : isDone ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
              : "bg-zinc-50 text-zinc-500 border-zinc-200 hover:bg-zinc-100"
            }`}
          >
            <span>{isDone ? "✓" : s.icon}</span>
            <span className="hidden sm:inline">{s.title}</span>
          </button>
        );
      })}
      {completedSubtopics.length === subtopics.length && phase !== "final" && phase !== "done" && (
        <button onClick={onFinal}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors border bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100">
          🏆 <span className="hidden sm:inline ml-1">Final Challenge</span>
        </button>
      )}
    </div>
  );
}

function CodingPlayground({ problem, isHard, onComplete }: {
  problem: CodingProblem; isHard: boolean; onComplete: () => void;
}) {
  const [values, setValues] = useState<string[]>(Array(problem.blanks.length).fill(""));
  const [results, setResults] = useState<boolean[] | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const allCorrect = results?.every(Boolean) ?? false;

  function check() {
    const next = values.map((v, i) =>
      v.replace(/\s/g, "") === problem.blanks[i].answer.replace(/\s/g, "")
    );
    setResults(next);
    if (!next.every(Boolean)) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 1) setShowHint(true);
    }
  }

  function revealAnswers() {
    setValues(problem.blanks.map(b => b.answer));
    setResults(problem.blanks.map(() => true));
    setRevealed(true);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${isHard ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
          {isHard ? "Hard Challenge" : "Coding Exercise"}
        </span>
        <span className="font-semibold text-zinc-800">{problem.title}</span>
      </div>
      <p className="text-sm text-zinc-600 leading-relaxed">{problem.description}</p>
      <div className="rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
        <div className="px-4 py-2.5 border-b border-zinc-200 bg-white flex items-center justify-between">
          <span className="text-xs text-zinc-400 font-mono">Python — fill in the [N] blanks below</span>
          <button onClick={() => setShowHint(h => !h)}
            className="text-xs text-sky-600 hover:text-sky-500 transition-colors font-medium">
            {showHint ? "Hide hint" : "Show hint"}
          </button>
        </div>
        <pre className="p-4 text-[12px] font-mono leading-relaxed overflow-x-auto bg-zinc-50 text-zinc-700 whitespace-pre">
          {renderCodeWithBlanks(problem.code)}
        </pre>
      </div>
      {showHint && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800 leading-relaxed">
          💡 {problem.hint}
        </div>
      )}
      <div className="space-y-3">
        {problem.blanks.map((blank, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="mt-2 w-7 h-7 flex items-center justify-center rounded-full bg-sky-100 text-sky-700 text-xs font-bold flex-shrink-0">
              {i + 1}
            </span>
            <div className="flex-1 space-y-1">
              <div className="text-xs text-zinc-500 leading-snug">{blank.label}</div>
              <input type="text" value={values[i]}
                onChange={e => {
                  const next = [...values]; next[i] = e.target.value;
                  setValues(next);
                  if (results) setResults(null);
                }}
                disabled={allCorrect}
                placeholder="Your answer..."
                className={`w-full text-sm font-mono bg-white border rounded-lg px-3 py-2 focus:outline-none transition-colors ${
                  results === null ? "border-zinc-200 focus:border-sky-400"
                  : results[i] ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                  : "border-red-300 bg-red-50 text-red-700"
                }`}
              />
            </div>
          </div>
        ))}
      </div>

      {results && !allCorrect && (
        <div className="space-y-3">
          <p className="text-sm text-red-600">Some blanks are incorrect — red fields need fixing.</p>
          {attempts >= 2 && (
            <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 space-y-3">
              <p className="text-sm text-sky-800 font-medium">Stuck? No problem — here&apos;s the answer so you can keep moving.</p>
              <p className="text-xs text-sky-700 leading-relaxed">
                Understanding the <em>why</em> matters more than typing it from memory. Read the filled answers carefully before continuing.
              </p>
              <button onClick={revealAnswers}
                className="w-full py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition-colors">
                Show Answers &amp; Continue
              </button>
            </div>
          )}
        </div>
      )}

      {!allCorrect ? (
        <button onClick={check} disabled={values.some(v => !v.trim())}
          className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white font-semibold text-sm transition-colors">
          Check Answers
        </button>
      ) : (
        <div className="space-y-3">
          <div className={`p-4 rounded-xl text-sm text-center font-medium ${revealed ? "bg-sky-50 border border-sky-200 text-sky-800" : "bg-emerald-50 border border-emerald-200 text-emerald-800"}`}>
            {revealed
              ? "Answers revealed — read them carefully, then continue when ready."
              : `🎉 ${isHard ? "All correct! Full knapsack with backtracking solved." : "All correct! Ready for the next subtopic."}`}
          </div>
          <button onClick={onComplete}
            className={`w-full py-2.5 rounded-xl text-white font-semibold text-sm transition-colors ${isHard ? "bg-emerald-600 hover:bg-emerald-500" : "bg-sky-600 hover:bg-sky-500"}`}>
            {isHard ? "Complete Course →" : "Continue →"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Chat markdown renderer ────────────────────────────────────────────────────

type MarkdownProps = { className?: string; children?: React.ReactNode; [k: string]: unknown };
const ChatMarkdown = {
  p: ({ children }: MarkdownProps) => <p className="text-[15px] text-zinc-700 leading-[1.75] mb-2 last:mb-0">{children}</p>,
  strong: ({ children }: MarkdownProps) => <strong className="font-semibold text-zinc-900">{children}</strong>,
  em: ({ children }: MarkdownProps) => <em className="italic text-zinc-600">{children}</em>,
  ul: ({ children }: MarkdownProps) => <ul className="my-2 space-y-1 list-none pl-0">{children}</ul>,
  li: ({ children }: MarkdownProps) => (
    <li className="flex gap-2 text-[15px] text-zinc-700 leading-[1.75]">
      <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" /><span>{children}</span>
    </li>
  ),
  code: ({ className, children }: MarkdownProps) => {
    const isBlock = Boolean(className);
    const lang = (className as string | undefined)?.replace("language-", "") ?? "";
    if (isBlock) return (
      <div className="my-3 rounded-xl overflow-hidden border border-zinc-700 shadow-md">
        {lang && <div className="px-4 py-1.5 bg-zinc-800 border-b border-zinc-700 text-[11px] font-mono text-zinc-400 tracking-widest uppercase">{lang}</div>}
        <pre className="bg-zinc-900 px-4 py-3.5 overflow-x-auto m-0">
          <code className="text-[12.5px] font-mono leading-relaxed text-zinc-100">{children}</code>
        </pre>
      </div>
    );
    return <code className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[12.5px] font-mono border border-indigo-100">{children}</code>;
  },
  pre: ({ children }: MarkdownProps) => <>{children}</>,
};

// ── TutorTab ──────────────────────────────────────────────────────────────────

function TutorTab({ slug, subtopics, onSubtopicPassed }: { slug: string; subtopics: SubTopicDetail[]; onSubtopicPassed: () => void }) {
  const cfg = TOPIC_TUTOR_CONFIG[slug] ?? TOPIC_TUTOR_CONFIG["knapsack"];

  const [subtopicIdx, setSubtopicIdx] = useState(0);
  const [phase, setPhase] = useState<"learning" | "assessment" | "coding" | "final" | "done">("learning");
  const [completedSubtopics, setCompletedSubtopics] = useState<number[]>([]);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([
    { role: "assistant", content: cfg.subtopics[0].opener },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const current = cfg.subtopics[subtopicIdx];

  useEffect(() => {
    const topicCfg = TOPIC_TUTOR_CONFIG[slug] ?? TOPIC_TUTOR_CONFIG["knapsack"];
    getTutorProgress(slug).then(p => {
      const idx = Math.min(p.subtopic_idx, topicCfg.subtopics.length - 1);
      setSubtopicIdx(idx);
      setCompletedSubtopics(p.completed_subtopics || []);
      const validPhase = ["learning","assessment","coding","final","done"].includes(p.phase)
        ? p.phase as typeof phase : "learning";
      setPhase(validPhase);
      setMessages([{ role: "assistant", content: topicCfg.subtopics[idx].opener }]);
    }).catch(() => {}).finally(() => setProgressLoaded(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (!progressLoaded) return;
    saveTutorProgress(slug, { subtopic_idx: subtopicIdx, phase, completed_subtopics: completedSubtopics }).catch(() => {});
  }, [slug, subtopicIdx, phase, completedSubtopics, progressLoaded]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (!loading && !advancing) inputRef.current?.focus(); }, [loading, advancing]);

  function jumpToSubtopic(idx: number) {
    if (idx === subtopicIdx && phase === "learning") return;
    setSubtopicIdx(idx);
    setPhase("learning");
    setContextOpen(false);
    setMessages([{ role: "assistant", content: cfg.subtopics[idx].opener }]);
  }

  function handleAssessmentComplete() { setPhase("coding"); }

  function handleCodingComplete() {
    const newCompleted = completedSubtopics.includes(subtopicIdx)
      ? completedSubtopics : [...completedSubtopics, subtopicIdx];
    setCompletedSubtopics(newCompleted);
    completeSubtopic(slug, `stage-${subtopicIdx + 1}`, subtopicIdx).catch(() => {});
    const dbSubtopicId = subtopics[subtopicIdx]?.id;
    if (dbSubtopicId) markSubtopicPassed(dbSubtopicId).then(onSubtopicPassed).catch(() => {});
    const next = subtopicIdx + 1;
    if (next < cfg.subtopics.length) {
      setSubtopicIdx(next);
      setPhase("learning");
      setMessages([{ role: "assistant", content: cfg.subtopics[next].opener }]);
    } else {
      setPhase("final");
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading || advancing) return;
    const userMsg = input.trim();
    setInput("");
    inputRef.current?.focus();
    const history = messages;
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const { reply, advance } = await tutorChat(slug, current.stage, userMsg, history);
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      if (advance) {
        setAdvancing(true);
        setTimeout(() => { setAdvancing(false); setPhase("assessment"); }, 1800);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong — please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  const navProps = { subtopics: cfg.subtopics, subtopicIdx, completedSubtopics, phase, onJump: jumpToSubtopic, onFinal: () => setPhase("final") };

  if (phase === "done") {
    return (
      <div className="text-center py-14 space-y-6 max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-3xl mx-auto shadow-lg">🏆</div>
        <h2 className="text-2xl font-bold text-zinc-800 tracking-tight">Course Complete</h2>
        <p className="text-zinc-500 leading-relaxed">
          {cfg.subtopics.length} subtopics. {cfg.subtopics.length * 2} assessment questions. {cfg.subtopics.length} coding exercises. One final challenge.<br/>
          You built genuine intuition from scratch.
        </p>
        <div className={`grid gap-2 text-xs text-center`} style={{ gridTemplateColumns: `repeat(${cfg.subtopics.length}, minmax(0, 1fr))` }}>
          {cfg.subtopics.map(s => (
            <div key={s.stage} className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 leading-tight">
              <div className="text-2xl mb-1.5">{s.icon}</div>
              <div className="font-medium">{s.title}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (phase === "final") return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xl shadow-sm">🏆</div>
        <div>
          <div className="font-semibold text-amber-900">Final Challenge</div>
          <div className="text-xs text-amber-700 mt-0.5">All {cfg.subtopics.length} subtopics complete — one hard problem to cement everything.</div>
        </div>
      </div>
      <SubtopicNav {...navProps} />
      <CodingPlayground problem={cfg.finalProblem} isHard={true} onComplete={() => { completeFinal().catch(() => {}); setPhase("done"); }} />
    </div>
  );

  if (phase === "coding") return (
    <div className="space-y-5">
      <SubtopicNav {...navProps} />
      <CodingPlayground problem={cfg.codingProblems[subtopicIdx]} isHard={false} onComplete={handleCodingComplete} />
    </div>
  );

  if (phase === "assessment") return (
    <div className="space-y-5">
      <SubtopicNav {...navProps} />
      <AssessmentPhase cfg={current} onComplete={handleAssessmentComplete} />
    </div>
  );

  // ── Learning phase — full-width rich chat ─────────────────────────────────
  return (
    <div className="space-y-4">
      <SubtopicNav {...navProps} />

      {/* Collapsible visual context card */}
      <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
        <button
          onClick={() => setContextOpen(o => !o)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-zinc-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">{current.icon}</span>
            <div>
              <div className="text-sm font-semibold text-zinc-800">{current.title}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{current.concepts.join(" · ")}</div>
            </div>
          </div>
          <span className="text-xs text-zinc-400 font-medium select-none">
            {contextOpen ? "Hide visual ▲" : "Show visual ▼"}
          </span>
        </button>
        {contextOpen && (
          <div className="px-5 pb-5 border-t border-zinc-100 pt-4">
            <SubtopicVisual stage={current.stage} slug={slug} />
          </div>
        )}
      </div>

      {/* Chat window */}
      <div className="rounded-2xl border border-zinc-200 overflow-hidden shadow-sm bg-white">
        {/* Message list */}
        <div className="h-[520px] overflow-y-auto px-5 py-6 space-y-6 bg-[#fafafa]">
          {messages.map((msg, i) =>
            msg.role === "assistant" ? (
              <div key={i} className="flex gap-3.5 items-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md mt-0.5 select-none">
                  ✦
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-indigo-400 tracking-[0.12em] uppercase mb-2 select-none">Bodhix AI</div>
                  <ReactMarkdown components={ChatMarkdown as Parameters<typeof ReactMarkdown>[0]["components"]}>{msg.content}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <div key={i} className="flex justify-end items-end gap-2">
                <div className="max-w-[70%] bg-indigo-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5 text-[15px] leading-[1.65] shadow-sm">
                  {msg.content}
                </div>
                <div className="w-7 h-7 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-500 text-xs flex-shrink-0 select-none">
                  You
                </div>
              </div>
            )
          )}

          {/* Typing indicator */}
          {(loading || advancing) && (
            <div className="flex gap-3.5 items-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md mt-0.5">✦</div>
              <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                {advancing ? (
                  <span className="text-sm text-indigo-500 font-medium">Moving to assessment...</span>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "160ms" }} />
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "320ms" }} />
                  </>
                )}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="px-4 pb-4 pt-3 border-t border-zinc-100 bg-white">
          <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-50 transition-all">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Share your thinking…"
              disabled={loading || advancing}
              className="flex-1 bg-transparent text-[15px] text-zinc-800 placeholder:text-zinc-400 focus:outline-none disabled:opacity-50 py-0.5"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading || advancing}
              className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white flex items-center justify-center transition-colors flex-shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1.5 text-center select-none">Press Enter to send</p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// YouTube embed + Problems tab (unchanged logic, light theme)
// ─────────────────────────────────────────────────────────────────────────────

const VIDEO_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function YouTubeEmbed({ youtubeId, title }: { youtubeId: string; title: string }) {
  const isLocal = youtubeId.startsWith("local:");
  const localSrc = isLocal ? `${VIDEO_BASE}/static/videos/${encodeURIComponent(youtubeId.slice(6))}` : null;
  return (
    <div className="rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50 shadow-sm">
      <div className="aspect-video w-full bg-black">
        {isLocal ? (
          <video src={localSrc!} controls className="w-full h-full" />
        ) : (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="w-full h-full"
          />
        )}
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
      <div className="flex items-center gap-1.5 bg-bark-100 border border-bark-200 rounded-full px-3 py-1 shadow-sm">
        <span className="text-leaf-700 text-xs font-bold">Lv.{stats.level}</span>
        <div className="w-20 h-1.5 bg-bark-200 rounded-full overflow-hidden">
          <div className="h-full bg-saffron-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-bark-500 text-xs">{stats.xp} XP</span>
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
  const [tab, setTab] = useState<Tab>("explore");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/auth/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !slug) return;
    Promise.all([getTopic(slug), getUserStats()])
      .then(([t, s]) => { setTopic(t); setUserStats(s); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user, slug, refreshKey]);

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
    <div className="min-h-screen text-bark-900">
      <nav className="border-b border-bark-200 bg-bark-50/90 backdrop-blur-sm sticky top-0 z-10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/demo" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-leaf-700 flex items-center justify-center">
              <svg width="12" height="16" viewBox="0 0 24 30" fill="none"><path d="M12 2C12 2 3 9 3 17C3 22 7 26 12 26C17 26 21 22 21 17C21 9 12 2 12 2Z" fill="#fcd99a" opacity="0.9"/><path d="M12 26 L11 30" stroke="#fcd99a" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/></svg>
            </div>
            <span className="font-display font-bold text-bark-900">Bodhix</span>
          </Link>
          <Link href="/demo" className="text-bark-500 text-sm hover:text-bark-800 transition-colors">← Back</Link>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <NavXP stats={userStats} />
          <span className="text-bark-400 hidden sm:block">{user?.email}</span>
          <button onClick={logout} className="text-bark-500 hover:text-bark-900 transition-colors">Sign out</button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Topic header */}
        <div className="mb-6">
          <div className="w-full h-52 rounded-2xl overflow-hidden mb-5 bg-bark-100 border border-bark-200 shadow-sm">
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
              <h1 className="font-display text-2xl font-bold text-bark-900">{topic.title}</h1>
              <p className="text-bark-500 text-sm mt-1">{topic.description}</p>
              {totalSubtopics > 0 && (
                <div className="mt-3 max-w-xs">
                  <div className="flex justify-between text-xs text-bark-500 mb-1">
                    <span>{totalPassed}/{totalSubtopics} subtopics passed</span>
                    <span className="text-leaf-700 font-semibold">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-bark-100 rounded-full overflow-hidden">
                    <div className="h-full bg-leaf-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-bark-200 overflow-x-auto">
          <button
            onClick={() => setTab("explore")}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              tab === "explore" ? "border-saffron-500 text-saffron-700" : "border-transparent text-bark-500 hover:text-bark-800"
            }`}
          >
            ✨ Explore
          </button>

          <button
            onClick={() => setTab("tutor")}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              tab === "tutor" ? "border-leaf-600 text-leaf-700" : "border-transparent text-bark-500 hover:text-bark-800"
            }`}
          >
            🧠 Learn with AI
          </button>

          <button
            onClick={() => setTab("problems")}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              tab === "problems" ? "border-bark-600 text-bark-800" : "border-transparent text-bark-500 hover:text-bark-800"
            }`}
          >
            💻 Problems
          </button>

          <button onClick={() => setTab("videos")}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              tab === "videos" ? "border-bark-500 text-bark-700" : "border-transparent text-bark-500 hover:text-bark-800"
            }`}
          >
            Videos
            {topic.videos.length > 0 && <span className="ml-1.5 text-xs text-bark-400">({topic.videos.length})</span>}
          </button>
        </div>

        {/* Tab content */}
        {tab === "explore"   && <TopicExplorer slug={slug} />}
        {tab === "problems"  && <ProblemsTab topic={topic} />}
        {tab === "tutor" && <TutorTab slug={slug} subtopics={topic.subtopics} onSubtopicPassed={() => setRefreshKey(k => k + 1)} />}

        {tab === "videos" && (
          topic.videos.length === 0
            ? <div className="text-center py-16 text-zinc-500 text-sm">No videos have been added for this topic yet.</div>
            : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topic.videos.map((v) => <YouTubeEmbed key={v.id} youtubeId={v.youtube_id} title={v.title} />)}
              </div>
        )}

      </main>
    </div>
  );
}
