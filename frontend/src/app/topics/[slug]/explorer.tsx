"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

function InsightBox({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm leading-relaxed"
    >
      💡 {text}
    </motion.div>
  );
}

function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-xs text-zinc-400 hover:text-zinc-600 underline mt-4 transition-colors"
    >
      Reset
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Arrays & Hashing — "Two Sum: Guide the Algorithm"
// User walks through the complement trick step by step:
// for each element, check complement → if miss, store → repeat.
// ─────────────────────────────────────────────────────────────────────────────
const TS_NUMS = [3, 5, 2, 8, 1, 7];
const TS_TARGET = 10;
// Trace: 3→miss, 5→miss, 2→miss, 8→comp=2 found at idx 2 → answer [2,3]

function ArraysHashingExplorer() {
  const [step, setStep]             = useState(0);
  const [phase, setPhase]           = useState<"check" | "store" | "done">("check");
  const [map, setMap]               = useState<Record<number, number>>({});
  const [checkResult, setCheckResult] = useState<"hit" | "miss" | null>(null);
  const [found, setFound]           = useState<{ idxA: number; idxB: number } | null>(null);
  const [wrongOrder, setWrongOrder] = useState(false);

  const cur  = TS_NUMS[step];
  const comp = TS_TARGET - cur;

  function handleCheck() {
    if (phase !== "check") return;
    setWrongOrder(false);
    if (comp in map) {
      setCheckResult("hit");
      setFound({ idxA: map[comp], idxB: step });
      setPhase("done");
    } else {
      setCheckResult("miss");
      setPhase("store");
    }
  }

  function handleStore() {
    if (phase === "check") { setWrongOrder(true); return; }
    if (phase !== "store") return;
    setMap(m => ({ ...m, [cur]: step }));
    setStep(s => s + 1);
    setPhase("check");
    setCheckResult(null);
    setWrongOrder(false);
  }

  function reset() {
    setStep(0); setPhase("check"); setMap({});
    setCheckResult(null); setFound(null); setWrongOrder(false);
  }

  const mapEntries = Object.entries(map) as [string, number][];

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-lg font-bold text-zinc-800 mb-1">Two Sum — guide the algorithm</h2>
      <p className="text-zinc-500 text-sm mb-5">
        Target: <strong className="text-zinc-700">{TS_TARGET}</strong>.
        For each element: check if its complement is in the map, then store it.
        Find the pair that sums to {TS_TARGET}.
      </p>

      {/* Array cards */}
      <div className="flex gap-2 mb-5">
        {TS_NUMS.map((n, i) => {
          const isCurrent = i === step && phase !== "done";
          const isFoundPair = found && (i === found.idxA || i === found.idxB);
          const isPast = i < step && !isFoundPair;
          return (
            <div key={i} className={`w-12 h-14 rounded-xl flex flex-col items-center justify-center border-2 transition-all duration-200 ${
              isFoundPair ? "bg-emerald-100 border-emerald-400 text-emerald-800 scale-110 shadow-md" :
              isCurrent   ? "bg-sky-100 border-sky-400 text-sky-800 scale-105 shadow-sm" :
              isPast      ? "bg-zinc-100 border-zinc-200 text-zinc-400" :
                            "bg-white border-zinc-200 text-zinc-600"
            }`}>
              <span className="text-sm font-bold">{n}</span>
              <span className="text-[9px] text-zinc-400">[{i}]</span>
            </div>
          );
        })}
      </div>

      {/* Hash map display */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 mb-4">
        <div className="text-xs font-semibold text-zinc-500 mb-2">
          Hash map <span className="font-normal text-zinc-400">value → index</span>
        </div>
        <div className="flex flex-wrap gap-2 min-h-[28px] items-center">
          {mapEntries.length === 0
            ? <span className="text-xs text-zinc-300 italic">empty {"{}"}</span>
            : mapEntries.map(([val, idx]) => (
              <motion.span
                key={val}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`px-2 py-1 rounded-lg text-xs font-mono border ${
                  found && Number(val) === TS_NUMS[found.idxA]
                    ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                    : "bg-sky-50 border-sky-200 text-sky-700"
                }`}
              >
                {val} → [{idx}]
              </motion.span>
            ))
          }
        </div>
      </div>

      {/* Step instructions */}
      {phase !== "done" && (
        <div className="bg-white border border-zinc-200 rounded-xl p-4 mb-4">
          <div className="text-sm text-zinc-600 mb-3">
            Current: <strong className="text-sky-700">{cur}</strong> at [{step}]
            {"  ·  "}
            Complement: {TS_TARGET} − {cur} = <strong className="text-amber-600">{comp}</strong>
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleCheck}
              disabled={phase !== "check"}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                phase === "check"
                  ? "bg-sky-600 hover:bg-sky-500 text-white"
                  : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
              }`}
            >
              Is {comp} in the map?
            </button>

            <button
              onClick={handleStore}
              disabled={phase !== "store"}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                phase === "store"
                  ? "bg-amber-500 hover:bg-amber-400 text-white"
                  : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
              }`}
            >
              Store {cur} → [{step}]
            </button>
          </div>

          {wrongOrder && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-xs text-red-500 mt-2"
            >
              Check the complement first — always check before storing, or you might pair an element with itself.
            </motion.p>
          )}

          <AnimatePresence>
            {checkResult === "miss" && (
              <motion.p key="miss" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="text-sm text-zinc-500 mt-2"
              >
                ✗ <strong>{comp}</strong> is not in the map. Store <strong>{cur}</strong> for future elements to find.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Found */}
      <AnimatePresence>
        {phase === "done" && found && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4"
          >
            <div className="text-emerald-800 font-bold mb-1">Pair found!</div>
            <div className="text-sm text-emerald-700 mb-2">
              <strong>{TS_NUMS[found.idxA]}</strong> [idx {found.idxA}] + <strong>{TS_NUMS[found.idxB]}</strong> [idx {found.idxB}] = {TS_TARGET}
            </div>
            <div className="text-xs text-emerald-600 leading-relaxed">
              One pass, {step + 1} hash-map lookups — each O(1). We checked complement <em>before</em> storing,
              so no element could pair with itself. Brute force would need up to{" "}
              {(TS_NUMS.length * (TS_NUMS.length - 1)) / 2} pair checks for this array.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ResetButton onClick={reset} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Two Pointers — "Guide the Pointers"
// User controls L and R pointers step by step. Feel why sorted + two pointers
// is always more efficient than brute force.
// ─────────────────────────────────────────────────────────────────────────────
const TP_NUMS = [1, 4, 6, 8, 10, 13, 15, 18];
const TP_TARGET = 22;

function TwoPointersExplorer() {
  const [l, setL] = useState(0);
  const [r, setR] = useState(TP_NUMS.length - 1);
  const [steps, setSteps] = useState(0);
  const [found, setFound] = useState(false);
  const [lastHint, setLastHint] = useState("");
  const [phase, setPhase] = useState<"play" | "done">("play");

  const sum = TP_NUMS[l] + TP_NUMS[r];
  const totalBrutePairs = (TP_NUMS.length * (TP_NUMS.length - 1)) / 2;

  function moveL() {
    if (found || l >= r - 1) return;
    const newL = l + 1;
    const newSum = TP_NUMS[newL] + TP_NUMS[r];
    setL(newL);
    setSteps(s => s + 1);
    if (newSum === TP_TARGET) { setFound(true); setPhase("done"); }
    else setLastHint(newSum < TP_TARGET ? "Sum increased but still low — move L again" : "Sum is now too high — try moving R ←");
  }

  function moveR() {
    if (found || r <= l + 1) return;
    const newR = r - 1;
    const newSum = TP_NUMS[l] + TP_NUMS[newR];
    setR(newR);
    setSteps(s => s + 1);
    if (newSum === TP_TARGET) { setFound(true); setPhase("done"); }
    else setLastHint(newSum > TP_TARGET ? "Sum decreased but still high — move R again" : "Sum is now too low — try moving L →");
  }

  function reset() { setL(0); setR(TP_NUMS.length - 1); setSteps(0); setFound(false); setLastHint(""); setPhase("play"); }

  const tooLow = sum < TP_TARGET;
  const tooHigh = sum > TP_TARGET;

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-lg font-bold text-zinc-800 mb-1">Guide the pointers</h2>
      <p className="text-zinc-500 text-sm mb-1">
        Find two numbers in this <strong>sorted</strong> array that sum to <span className="font-bold text-sky-600">{TP_TARGET}</span>.
      </p>
      <p className="text-xs text-zinc-400 mb-5">
        Move L → when the sum is too low. Move ← R when the sum is too high. Why does this always work?
      </p>

      {/* Array with L/R labels */}
      <div className="flex gap-1.5 mb-2">
        {TP_NUMS.map((n, i) => {
          const isL = i === l;
          const isR = i === r;
          const isBetween = i > l && i < r;
          return (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <motion.div
                animate={{ scale: (isL || isR) ? 1.12 : 1 }}
                className={`w-full h-11 rounded-xl text-sm font-bold border-2 flex items-center justify-center transition-colors ${
                  found && (isL || isR) ? "bg-emerald-500 border-emerald-400 text-white shadow-md" :
                  isL   ? "bg-sky-400 border-sky-300 text-white" :
                  isR   ? "bg-violet-400 border-violet-300 text-white" :
                  isBetween ? "bg-zinc-50 border-zinc-200 text-zinc-500" :
                              "bg-zinc-200 border-zinc-300 text-zinc-400"
                }`}
              >{n}</motion.div>
              <div className="text-[10px] font-bold h-4">
                {isL && <span className="text-sky-500">L</span>}
                {isR && <span className="text-violet-500">R</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sum display */}
      <div className={`mb-4 p-3 rounded-xl border text-sm font-mono text-center transition-colors ${
        found       ? "bg-emerald-50 border-emerald-300 text-emerald-800" :
        tooLow      ? "bg-sky-50 border-sky-200 text-sky-800" :
        tooHigh     ? "bg-violet-50 border-violet-200 text-violet-800" :
                      "bg-zinc-50 border-zinc-200 text-zinc-600"
      }`}>
        {found
          ? `🎉 ${TP_NUMS[l]} + ${TP_NUMS[r]} = ${TP_TARGET} — found in ${steps} steps!`
          : `${TP_NUMS[l]} + ${TP_NUMS[r]} = ${sum} ${tooLow ? `→ too low, need +${TP_TARGET - sum}` : `→ too high, need −${sum - TP_TARGET}`}`
        }
      </div>

      {!found && (
        <div className="flex gap-3 mb-3">
          <button onClick={moveL} disabled={l >= r - 1}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors ${
              tooLow
                ? "bg-sky-600 hover:bg-sky-500 text-white border-sky-600"
                : "bg-white hover:bg-zinc-50 text-zinc-600 border-zinc-200"
            }`}
          >
            Move L → <span className="text-xs opacity-70">(increases sum)</span>
          </button>
          <button onClick={moveR} disabled={r <= l + 1}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors ${
              tooHigh
                ? "bg-violet-600 hover:bg-violet-500 text-white border-violet-600"
                : "bg-white hover:bg-zinc-50 text-zinc-600 border-zinc-200"
            }`}
          >
            ← Move R <span className="text-xs opacity-70">(decreases sum)</span>
          </button>
        </div>
      )}

      {lastHint && !found && (
        <p className="text-xs text-zinc-400 italic mb-3">{lastHint}</p>
      )}

      {phase === "done" && (
        <InsightBox text={`You found it in ${steps} pointer moves. Brute force would check ${totalBrutePairs} pairs. Two pointers works because the array is sorted — if the sum is too low, the only way to increase it is to advance L (smaller values to the right). If too high, retreat R. Each pointer moves at most n times → O(n) total.`} />
      )}

      <div className="mt-3 text-xs text-zinc-400">Steps: {steps} / max ~{TP_NUMS.length} &nbsp;·&nbsp; Brute force: {totalBrutePairs} checks</div>
      <ResetButton onClick={reset} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sliding Window — "Ride the Wave"
// Find the max-sum window of size 3. Move the window manually, then watch the
// algorithm add one and subtract one at each step.
// ─────────────────────────────────────────────────────────────────────────────
const SW_VALS = [3, 1, 4, 1, 5, 9, 2, 6];
const SW_K = 3;

function SlidingWindowExplorer() {
  const [windowStart, setWindowStart] = useState(0);
  const [slideIdx, setSlideIdx] = useState(0);
  const [phase, setPhase] = useState<"manual" | "slide" | "done">("manual");
  const [addRemoveAnim, setAddRemoveAnim] = useState<{remove: number; add: number} | null>(null);

  const maxStart = SW_VALS.length - SW_K;
  const currentSum = SW_VALS.slice(windowStart, windowStart + SW_K).reduce((a, b) => a + b, 0);
  const allSums = Array.from({ length: maxStart + 1 }, (_, i) => SW_VALS.slice(i, i + SW_K).reduce((a, b) => a + b, 0));
  const maxSum = Math.max(...allSums);
  const maxSumStart = allSums.indexOf(maxSum);
  const maxBarHeight = Math.max(...SW_VALS);

  function startSlide() {
    setPhase("slide");
    setSlideIdx(0);
    setWindowStart(0);
    setAddRemoveAnim(null);
  }

  useEffect(() => {
    if (phase !== "slide") return;
    if (slideIdx > maxStart) { setPhase("done"); setWindowStart(maxSumStart); setAddRemoveAnim(null); return; }
    const timer = setTimeout(() => {
      if (slideIdx > 0) {
        // Show what was removed and added
        setAddRemoveAnim({
          remove: SW_VALS[slideIdx - 1],
          add: SW_VALS[slideIdx + SW_K - 1],
        });
      }
      setWindowStart(slideIdx);
      setSlideIdx(s => s + 1);
    }, 700);
    return () => clearTimeout(timer);
  }, [phase, slideIdx, maxStart, maxSumStart]);

  function reset() { setWindowStart(0); setSlideIdx(0); setPhase("manual"); setAddRemoveAnim(null); }

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-lg font-bold text-zinc-800 mb-1">Ride the wave</h2>
      <p className="text-zinc-500 text-sm mb-5">
        Which <strong>{SW_K} consecutive bars</strong> have the highest total? Move the window manually, then watch the algorithm&apos;s secret: it never recomputes the full sum.
      </p>

      {/* Bar chart */}
      <div className="flex items-end gap-1 h-28 mb-1">
        {SW_VALS.map((v, i) => {
          const inWindow = i >= windowStart && i < windowStart + SW_K;
          const isMax = phase === "done" && i >= maxSumStart && i < maxSumStart + SW_K;
          const isRemoved = phase === "slide" && slideIdx > 1 && i === slideIdx - 2;
          const isAdded = phase === "slide" && slideIdx > 1 && i === slideIdx + SW_K - 2;
          return (
            <motion.div key={i} layout
              className={`flex-1 rounded-t-lg transition-colors relative ${
                isMax    ? "bg-emerald-500" :
                isAdded  ? "bg-sky-400" :
                isRemoved ? "bg-red-300" :
                inWindow ? "bg-sky-300" :
                           "bg-zinc-200"
              }`}
              style={{ height: `${(v / maxBarHeight) * 100}%` }}
            />
          );
        })}
      </div>
      <div className="flex gap-1 mb-1">
        {SW_VALS.map((v, i) => (
          <div key={i} className="flex-1 text-center text-xs text-zinc-500 font-mono">{v}</div>
        ))}
      </div>

      {/* Add/remove annotation */}
      <div className="h-8 mb-3 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {addRemoveAnim && phase === "slide" && (
            <motion.div key={slideIdx} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-sm font-mono text-zinc-600"
            >
              <span className="text-red-500">−{addRemoveAnim.remove}</span>
              <span className="text-zinc-400 mx-2">+</span>
              <span className="text-sky-600">+{addRemoveAnim.add}</span>
              <span className="text-zinc-400 mx-2">=</span>
              <span className="font-bold text-zinc-700">{currentSum}</span>
              <span className="text-zinc-400 text-xs ml-2">(one addition, one subtraction)</span>
            </motion.div>
          )}
          {phase === "manual" && (
            <span className="text-sm text-zinc-500">
              Window sum: <span className="font-bold text-sky-600 font-mono">{currentSum}</span>
            </span>
          )}
        </AnimatePresence>
      </div>

      {phase === "manual" && (
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setWindowStart(s => Math.max(0, s - 1))} disabled={windowStart === 0}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 text-sm disabled:opacity-30 hover:border-sky-300 transition-colors">
            ← Slide left
          </button>
          <div className="flex-1 text-center text-xs text-zinc-400">position {windowStart}</div>
          <button onClick={() => setWindowStart(s => Math.min(maxStart, s + 1))} disabled={windowStart === maxStart}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 text-sm disabled:opacity-30 hover:border-sky-300 transition-colors">
            Slide right →
          </button>
        </div>
      )}

      {phase === "manual" && (
        <button onClick={startSlide}
          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition-colors mb-4"
        >
          ⚡ Watch O(1) updates →
        </button>
      )}

      {phase === "slide" && (
        <div className="text-xs text-zinc-400 mb-4 animate-pulse">
          Each step: subtract left element, add right element — O(1), not O(k)…
        </div>
      )}

      {phase === "done" && (
        <InsightBox text={`Max sum is ${maxSum} at position ${maxSumStart}. The key insight: when the window moves right, subtract the element leaving the left and add the element entering the right. One subtraction + one addition = O(1) per step → O(n) total. Recomputing the full sum each time would be O(n·k).`} />
      )}

      <ResetButton onClick={reset} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Binary Search — "Guess My Number"
// Classic hi-lo game. See the search space halve with every guess.
// ─────────────────────────────────────────────────────────────────────────────
function BinarySearchExplorer() {
  const [target] = useState(() => Math.floor(Math.random() * 100) + 1);
  const [lo, setLo] = useState(1);
  const [hi, setHi] = useState(100);
  const [guesses, setGuesses] = useState(0);
  const [lastGuess, setLastGuess] = useState<number | null>(null);
  const [hint, setHint] = useState("");
  const [won, setWon] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const mid = Math.floor((lo + hi) / 2);

  function guess() {
    setLastGuess(mid);
    setGuesses(g => g + 1);
    if (mid === target) { setWon(true); return; }
    if (mid < target) {
      setHistory(h => [...h, `${mid} → too low (halve: ${mid+1}–${hi})`]);
      setLo(mid + 1);
      setHint("Too low");
    } else {
      setHistory(h => [...h, `${mid} → too high (halve: ${lo}–${mid-1})`]);
      setHi(mid - 1);
      setHint("Too high");
    }
  }

  function reset() {
    setLo(1); setHi(100); setGuesses(0);
    setLastGuess(null); setHint(""); setWon(false); setHistory([]);
  }

  const rangeWidth = hi - lo + 1;

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-lg font-bold text-zinc-800 mb-1">Guess my number</h2>
      <p className="text-zinc-500 text-sm mb-5">
        I&apos;m thinking of a number between 1 and 100. Always guess the midpoint — watch the search space halve each time.
      </p>

      <div className="mb-5">
        <div className="flex justify-between text-xs text-zinc-500 mb-1">
          <span>{lo}</span>
          <span className="text-zinc-400">{rangeWidth} possibilities left</span>
          <span>{hi}</span>
        </div>
        <div className="h-4 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
          <motion.div
            className="h-full bg-sky-400 rounded-full"
            animate={{ width: `${(rangeWidth / 100) * 100}%`, marginLeft: `${((lo - 1) / 100) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <div className="text-center mt-1">
          <span className="text-xs text-zinc-400">Midpoint: </span>
          <span className="text-sm font-bold text-sky-600">{mid}</span>
        </div>
      </div>

      {history.length > 0 && (
        <div className="mb-4 space-y-1 max-h-28 overflow-y-auto">
          {history.map((h, i) => (
            <div key={i} className="text-xs font-mono text-zinc-500 bg-zinc-50 px-2 py-1 rounded-lg border border-zinc-100">
              {i + 1}. {h}
            </div>
          ))}
        </div>
      )}

      {!won && (
        <button onClick={guess}
          className="w-full px-4 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition-colors mb-3"
        >
          {lo === hi ? `It must be ${mid}!` : `Guess ${mid}`}
        </button>
      )}

      <AnimatePresence>
        {hint && !won && (
          <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            className="text-sm text-zinc-600 mb-3 flex items-center gap-2"
          >
            <span className={`font-semibold ${hint === "Too low" ? "text-sky-600" : "text-red-500"}`}>
              {hint === "Too low" ? "↑ Too low" : "↓ Too high"}
            </span>
            <span className="text-zinc-400 ml-auto">Guesses: {guesses}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {won && (
        <>
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-center mb-3"
          >
            <div className="text-2xl mb-1">🎯</div>
            <div className="font-bold text-emerald-800">Got it in {guesses} {guesses === 1 ? "guess" : "guesses"}!</div>
            <div className="text-emerald-600 text-sm">The number was {target}.</div>
          </motion.div>
          <InsightBox text={`100 numbers, at most 7 guesses. Each guess halves the range: 100→50→25→13→7→4→2→1. That's log₂(100) ≈ 7. Linear search would need up to 100 guesses. Binary search is O(log n) — an exponentially better guarantee.`} />
        </>
      )}

      <ResetButton onClick={reset} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stack — "Balance Check"
// Watch brackets get pushed and popped character by character. Predict: valid?
// ─────────────────────────────────────────────────────────────────────────────
const STACK_SEQUENCES = [
  { chars: ["(", "[", "{", "}", "]", ")"], valid: true },
  { chars: ["(", "[", ")", "]"], valid: false },
  { chars: ["{", "(", "}", ")"], valid: false },
  { chars: ["(", "(", ")", ")"], valid: true },
];

function StackExplorer() {
  const [seqIdx] = useState(() => Math.floor(Math.random() * STACK_SEQUENCES.length));
  const seq = STACK_SEQUENCES[seqIdx];
  const [step, setStep] = useState(-1);
  const [stack, setStack] = useState<string[]>([]);
  const [guess, setGuess] = useState<"valid" | "invalid" | null>(null);
  const [done, setDone] = useState(false);
  const [mismatch, setMismatch] = useState(false);

  const PAIRS: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
  const OPENERS = new Set(["(", "[", "{"]);

  function advance() {
    if (step >= seq.chars.length - 1) { setDone(true); return; }
    const nextStep = step + 1;
    setStep(nextStep);
    const c = seq.chars[nextStep];
    if (OPENERS.has(c)) {
      setStack(s => [...s, c]);
    } else {
      if (stack.length === 0 || stack[stack.length - 1] !== PAIRS[c]) {
        setMismatch(true);
        setDone(true);
      } else {
        setStack(s => s.slice(0, -1));
      }
    }
  }

  function reset() {
    setStep(-1); setStack([]);
    setGuess(null); setDone(false); setMismatch(false);
  }

  const isCorrectGuess = guess !== null && (guess === "valid") === (seq.valid && stack.length === 0 && !mismatch);

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-lg font-bold text-zinc-800 mb-1">Balance check</h2>
      <p className="text-zinc-500 text-sm mb-5">
        Step through the brackets one at a time. The stack keeps track. At the end — is it valid?
      </p>

      <div className="flex gap-2 mb-6">
        {seq.chars.map((c, i) => (
          <motion.div key={i}
            animate={{ scale: i === step ? 1.2 : 1 }}
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold border-2 transition-colors ${
              i < step  ? "bg-zinc-100 border-zinc-200 text-zinc-400" :
              i === step ? (mismatch ? "bg-red-100 border-red-400 text-red-700" : "bg-sky-100 border-sky-400 text-sky-700") :
                          "bg-white border-zinc-200 text-zinc-600"
            }`}
          >{c}</motion.div>
        ))}
      </div>

      <div className="mb-5">
        <div className="text-xs text-zinc-400 mb-2 uppercase tracking-widest">Stack</div>
        <div className="flex flex-col-reverse gap-1 min-h-[80px] p-3 bg-zinc-50 rounded-xl border border-zinc-200">
          <AnimatePresence>
            {stack.map((c, i) => (
              <motion.div key={`${i}-${c}`}
                initial={{ opacity: 0, y: -10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.8 }}
                className="px-3 py-1 rounded-lg bg-sky-100 border border-sky-300 text-sky-700 font-bold text-center text-sm w-14"
              >{c}</motion.div>
            ))}
          </AnimatePresence>
          {stack.length === 0 && <div className="text-xs text-zinc-400 text-center self-center">empty</div>}
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        {!done && (
          <button onClick={advance}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition-colors"
          >
            Step →
          </button>
        )}
        {done && !guess && (
          <div className="flex gap-2 items-center">
            <span className="text-sm text-zinc-600 mr-2">Your verdict:</span>
            <button onClick={() => setGuess("valid")}
              className="px-3 py-1.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-700 text-sm font-semibold hover:bg-emerald-200 transition-colors">
              ✓ Valid
            </button>
            <button onClick={() => setGuess("invalid")}
              className="px-3 py-1.5 rounded-xl bg-red-100 border border-red-300 text-red-700 text-sm font-semibold hover:bg-red-200 transition-colors">
              ✗ Invalid
            </button>
          </div>
        )}
      </div>

      {guess && (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-xl border text-sm mb-3 ${isCorrectGuess ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"}`}
          >
            {isCorrectGuess ? "✓ Correct!" : "✗ Not quite."}{" "}
            {seq.valid ? "All brackets matched correctly." : mismatch ? "A closing bracket didn't match the top of the stack." : "The stack wasn't empty at the end."}
          </motion.div>
        </AnimatePresence>
      )}

      {guess && (
        <InsightBox text="A stack is the perfect tool for matching pairs — whatever opened last must close first. That's LIFO, and it's why stacks power bracket validators, undo systems, and expression parsers." />
      )}

      <ResetButton onClick={reset} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Linked List — "Flip the Chain"
// Watch a linked list reverse itself, one pointer reassignment at a time.
// ─────────────────────────────────────────────────────────────────────────────
const LL_VALS = [1, 2, 3, 4, 5];

function LinkedListExplorer() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  const totalSteps = LL_VALS.length;
  const prevIdx = step - 1;
  const currIdx = step;

  function advance() {
    if (step >= totalSteps) { setDone(true); return; }
    setStep(s => s + 1);
    if (step + 1 >= totalSteps) setDone(true);
  }

  function reset() { setStep(0); setDone(false); }

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-lg font-bold text-zinc-800 mb-1">Flip the chain</h2>
      <p className="text-zinc-500 text-sm mb-5">
        Reversing a linked list in-place. Step through to see how three pointers
        (<code className="bg-zinc-100 px-1 rounded">prev</code>,{" "}
        <code className="bg-zinc-100 px-1 rounded">curr</code>,{" "}
        <code className="bg-zinc-100 px-1 rounded">next</code>) do it without extra memory.
      </p>

      <div className="flex items-center gap-1 mb-6 flex-wrap">
        {LL_VALS.map((v, i) => {
          const isPrev = i === prevIdx;
          const isCurr = i === currIdx && !done;
          const isReversed = i < step;
          return (
            <div key={i} className="flex items-center">
              <motion.div layout
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm border-2 transition-colors relative ${
                  done       ? "bg-emerald-100 border-emerald-400 text-emerald-700" :
                  isPrev     ? "bg-violet-100 border-violet-400 text-violet-700" :
                  isCurr     ? "bg-sky-100 border-sky-400 text-sky-700" :
                  isReversed ? "bg-zinc-100 border-zinc-300 text-zinc-500" :
                               "bg-white border-zinc-200 text-zinc-700"
                }`}
              >
                {v}
                {isPrev && !done && <span className="absolute -bottom-5 text-xs text-violet-500 font-semibold">prev</span>}
                {isCurr && !done && <span className="absolute -bottom-5 text-xs text-sky-500 font-semibold">curr</span>}
              </motion.div>
              {i < LL_VALS.length - 1 && (
                <motion.div
                  animate={{ scaleX: isReversed ? -1 : 1 }}
                  className="text-zinc-400 text-xl mx-0.5 origin-center"
                >→</motion.div>
              )}
            </div>
          );
        })}
        <span className="text-zinc-400 text-sm ml-1">→ null</span>
      </div>

      <div className="h-6 mb-3" />

      {!done && (
        <div className="text-sm text-zinc-600 mb-4 bg-zinc-50 rounded-xl p-3 border border-zinc-200 font-mono text-xs">
          {step === 0 ? (
            <><span className="text-violet-600">prev</span> = None &nbsp;&nbsp; <span className="text-sky-600">curr</span> = node({LL_VALS[0]})</>
          ) : step < totalSteps ? (
            <><span className="text-zinc-400">next = curr.next</span><br />
            <span className="text-sky-600">curr</span>.next = <span className="text-violet-600">prev</span> &nbsp; <span className="text-zinc-400">← flip the arrow</span><br />
            <span className="text-violet-600">prev</span> = <span className="text-sky-600">curr</span> &nbsp; <span className="text-zinc-400">← advance</span></>
          ) : null}
        </div>
      )}

      {!done && (
        <button onClick={advance}
          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition-colors"
        >
          {step === 0 ? "Start →" : step >= totalSteps - 1 ? "Finish →" : "Next step →"}
        </button>
      )}

      {done && (
        <InsightBox text="Three pointers, one pass, zero extra memory. Each node's arrow flips in-place. This same pattern — prev, curr, next — shows up in merge, reorder list, and palindrome checks." />
      )}

      <ResetButton onClick={reset} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Trees — "Deep or Wide?"
// Same tree, two traversal orders: DFS goes deep first, BFS goes level by level.
// ─────────────────────────────────────────────────────────────────────────────
const TREE_NODES = [
  { id: 1, x: 50,  y: 10, left: 2, right: 3 },
  { id: 2, x: 25,  y: 40, left: 4, right: 5 },
  { id: 3, x: 75,  y: 40, left: 6, right: 7 },
  { id: 4, x: 12,  y: 75, left: null, right: null },
  { id: 5, x: 38,  y: 75, left: null, right: null },
  { id: 6, x: 62,  y: 75, left: null, right: null },
  { id: 7, x: 88,  y: 75, left: null, right: null },
];
const DFS_ORDER = [1, 2, 4, 5, 3, 6, 7];
const BFS_ORDER = [1, 2, 3, 4, 5, 6, 7];

function TreesExplorer() {
  const [highlighted, setHighlighted] = useState<number[]>([]);
  const [mode, setMode] = useState<"none" | "dfs" | "bfs">("none");
  const [running, setRunning] = useState(false);

  function runTraversal(order: number[], m: "dfs" | "bfs") {
    setHighlighted([]); setMode(m); setRunning(true);
    order.forEach((id, i) => {
      setTimeout(() => {
        setHighlighted(h => [...h, id]);
        if (i === order.length - 1) setRunning(false);
      }, i * 450);
    });
  }

  function reset() { setHighlighted([]); setMode("none"); setRunning(false); }

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-lg font-bold text-zinc-800 mb-1">Deep or wide?</h2>
      <p className="text-zinc-500 text-sm mb-5">
        Two ways to visit every node. DFS dives deep before backtracking.
        BFS sweeps level by level. Watch both — same tree, totally different paths.
      </p>

      <div className="relative bg-zinc-50 rounded-2xl border border-zinc-200 p-4 mb-5" style={{ height: 180 }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {TREE_NODES.filter(n => n.left || n.right).map(n => {
            const lc = TREE_NODES.find(c => c.id === n.left);
            const rc = TREE_NODES.find(c => c.id === n.right);
            return (
              <g key={n.id}>
                {lc && <line x1={n.x} y1={n.y + 4} x2={lc.x} y2={lc.y - 4} stroke="#d4d4d8" strokeWidth="0.8" />}
                {rc && <line x1={n.x} y1={n.y + 4} x2={rc.x} y2={rc.y - 4} stroke="#d4d4d8" strokeWidth="0.8" />}
              </g>
            );
          })}
        </svg>
        {TREE_NODES.map(n => {
          const hIdx = highlighted.indexOf(n.id);
          const isHighlighted = hIdx !== -1;
          const isDfs = mode === "dfs";
          return (
            <motion.div key={n.id}
              animate={{ scale: isHighlighted ? 1.15 : 1 }}
              transition={{ duration: 0.2 }}
              className={`absolute w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                isHighlighted
                  ? isDfs ? "bg-violet-500 border-violet-400 text-white shadow-md"
                          : "bg-sky-500 border-sky-400 text-white shadow-md"
                  : "bg-white border-zinc-200 text-zinc-700"
              }`}
              style={{ left: `calc(${n.x}% - 18px)`, top: `calc(${n.y}% - 18px)` }}
            >
              {isHighlighted ? hIdx + 1 : n.id}
            </motion.div>
          );
        })}
      </div>

      <div className="flex gap-3 mb-4">
        <button onClick={() => !running && runTraversal(DFS_ORDER, "dfs")} disabled={running}
          className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
          🔽 DFS (preorder)
        </button>
        <button onClick={() => !running && runTraversal(BFS_ORDER, "bfs")} disabled={running}
          className="flex-1 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
          ↔ BFS (level order)
        </button>
      </div>

      {mode !== "none" && !running && (
        <InsightBox text={
          mode === "dfs"
            ? "DFS visits 1→2→4→5→3→6→7. It goes as deep as possible before backtracking. Use a stack (or recursion). Best for: path finding, tree structure problems."
            : "BFS visits 1→2→3→4→5→6→7. It finishes each level before going deeper. Use a queue. Best for: shortest paths, level-by-level processing."
        } />
      )}

      <ResetButton onClick={reset} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Programming — "Beat the Greedy"
// User picks coins first, then watches greedy fail, then sees DP optimal.
// ─────────────────────────────────────────────────────────────────────────────
const DP_COINS_AVAILABLE = [10, 6, 1];
const DP_TARGET = 12;

function DPExplorer() {
  const [phase, setPhase] = useState<"user" | "greedy" | "dp" | "done">("user");
  const [userCoins, setUserCoins] = useState<number[]>([]);
  const [greedyCoins, setGreedyCoins] = useState<number[]>([]);
  const [dpCoins, setDpCoins] = useState<number[]>([]);

  const userTotal = userCoins.reduce((a, b) => a + b, 0);
  const userOver = userTotal > DP_TARGET;
  const userExact = userTotal === DP_TARGET;

  function addCoin(c: number) {
    if (phase !== "user" || userTotal + c > DP_TARGET) return;
    setUserCoins(prev => [...prev, c]);
  }

  function removeCoin(i: number) {
    if (phase !== "user") return;
    setUserCoins(prev => prev.filter((_, idx) => idx !== i));
  }

  function submitUserAnswer() {
    if (!userExact) return;
    setPhase("greedy");
    // Run greedy animated
    const coins: number[] = [];
    let rem = DP_TARGET;
    for (const c of DP_COINS_AVAILABLE) { while (rem >= c) { coins.push(c); rem -= c; } }
    let idx = 0;
    const iv = setInterval(() => {
      if (idx >= coins.length) { clearInterval(iv); setGreedyCoins(coins); setPhase("dp"); return; }
      setGreedyCoins(c => [...c, coins[idx++]]);
    }, 400);
  }

  useEffect(() => {
    if (phase !== "dp" || dpCoins.length > 0) return;
    const optimal = [6, 6];
    let idx = 0;
    const iv = setInterval(() => {
      if (idx >= optimal.length) { clearInterval(iv); setDpCoins(optimal); setPhase("done"); return; }
      setDpCoins(c => [...c, optimal[idx++]]);
    }, 400);
    return () => clearInterval(iv);
  }, [phase, dpCoins.length]);

  function reset() {
    setPhase("user"); setUserCoins([]); setGreedyCoins([]); setDpCoins([]);
  }

  const COIN_COLORS: Record<number, string> = {
    10: "bg-amber-100 border-amber-400 text-amber-800",
    6:  "bg-emerald-100 border-emerald-400 text-emerald-800",
    1:  "bg-zinc-100 border-zinc-400 text-zinc-600",
  };

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-lg font-bold text-zinc-800 mb-1">Beat the greedy</h2>
      <p className="text-zinc-500 text-sm mb-1">
        Make exactly <strong className="text-zinc-800">{DP_TARGET}¢</strong> using coins {DP_COINS_AVAILABLE.join("¢, ")}¢.
        Use as <strong>few coins</strong> as possible.
      </p>
      <p className="text-xs text-zinc-400 mb-5">Try to find the optimal solution, then see how greedy does it — and whether DP can do better.</p>

      {/* Your coins */}
      <div className="mb-4">
        <div className="text-xs text-zinc-500 mb-2 font-semibold uppercase tracking-wider flex items-center justify-between">
          <span>Your pick {phase === "user" ? `(${userTotal}/${DP_TARGET}¢)` : ""}</span>
          {phase === "user" && userCoins.length > 0 && (
            <span className="text-zinc-400 font-normal">{userCoins.length} coin{userCoins.length !== 1 ? "s" : ""}</span>
          )}
        </div>
        {phase === "user" && (
          <div className="flex gap-2 mb-3">
            {DP_COINS_AVAILABLE.map(c => (
              <button key={c} onClick={() => addCoin(c)} disabled={userTotal + c > DP_TARGET}
                className={`flex-1 py-2 rounded-xl border-2 text-sm font-bold transition-colors disabled:opacity-30 ${COIN_COLORS[c]} hover:opacity-80`}
              >+{c}¢</button>
            ))}
          </div>
        )}
        <div className="flex gap-2 flex-wrap min-h-[48px] items-center">
          {userCoins.map((c, i) => (
            <motion.button key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
              onClick={() => removeCoin(i)} disabled={phase !== "user"}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 ${COIN_COLORS[c]} ${phase === "user" ? "hover:opacity-70 cursor-pointer" : "cursor-default"}`}
              title="Click to remove"
            >{c}¢</motion.button>
          ))}
          {userCoins.length === 0 && <span className="text-xs text-zinc-300 italic">Click coins above to add them</span>}
        </div>
        {userExact && phase === "user" && (
          <button onClick={submitUserAnswer}
            className="mt-3 w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold transition-colors"
          >
            Submit my answer ({userCoins.length} coins) →
          </button>
        )}
        {userOver && <p className="text-xs text-red-500 mt-2">Over {DP_TARGET}¢! Remove a coin.</p>}
      </div>

      {/* Greedy */}
      {(phase === "greedy" || phase === "dp" || phase === "done") && (
        <div className="mb-4">
          <div className="text-xs text-zinc-500 mb-2 font-semibold uppercase tracking-wider">
            Greedy (always picks largest coin first)
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            {greedyCoins.map((c, i) => (
              <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 ${COIN_COLORS[c]}`}
              >{c}¢</motion.div>
            ))}
            {greedyCoins.length > 0 && phase !== "greedy" && (
              <span className="text-sm text-zinc-500 ml-1">
                <strong>{greedyCoins.length}</strong> coins
                {greedyCoins.length > 2 && <span className="text-amber-600 ml-1">— not optimal!</span>}
              </span>
            )}
          </div>
        </div>
      )}

      {/* DP optimal */}
      {(phase === "dp" || phase === "done") && (
        <div className="mb-4">
          <div className="text-xs text-zinc-500 mb-2 font-semibold uppercase tracking-wider">
            DP (explores all subproblems)
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            {dpCoins.map((c, i) => (
              <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 ${COIN_COLORS[c]}`}
              >{c}¢</motion.div>
            ))}
            {dpCoins.length > 0 && phase === "done" && (
              <span className="text-sm text-emerald-600 font-semibold ml-1">✓ {dpCoins.length} coins (optimal)</span>
            )}
          </div>
        </div>
      )}

      {phase === "done" && (
        <>
          <div className={`p-3 rounded-xl border text-sm mb-4 ${
            userCoins.length <= 2 ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-amber-50 border-amber-200 text-amber-800"
          }`}>
            <strong>You:</strong> {userCoins.length} coins &nbsp;·&nbsp;
            <strong>Greedy:</strong> {greedyCoins.length} coins (10+1+1) &nbsp;·&nbsp;
            <strong>DP:</strong> 2 coins (6+6)
            {userCoins.length <= 2 ? " 🎉 You found optimal!" : " — DP beat you both!"}
          </div>
          <InsightBox text={`Greedy picks 10 first (largest), leaving 2 — needs two 1¢ coins. Total: 3 coins. DP asks: "what's the minimum coins for 1¢, 2¢, 3¢... 12¢?" and builds up: dp[6]=1, dp[12]=dp[6]+1=2. It found that 6+6 beats 10+1+1. Greedy commits early; DP considers every sub-amount.`} />
        </>
      )}

      <ResetButton onClick={reset} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Knapsack — "Outsmart Greedy"
// Items where greedy (by value/kg ratio) fails. User picks first, then sees
// what greedy picks, then sees the true optimal — with why.
// ─────────────────────────────────────────────────────────────────────────────
const KS_ITEMS = [
  { id: 0, name: "Ruby",    emoji: "💎", weight: 3, value: 5 },  // ratio 1.67 — greedy picks this
  { id: 1, name: "Silver",  emoji: "🪙", weight: 2, value: 3 },
  { id: 2, name: "Crystal", emoji: "🔮", weight: 2, value: 3 },
];
const KS_CAP = 4;

function KnapsackExplorer() {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [phase, setPhase] = useState<"pick" | "greedy" | "reveal">("pick");
  const [greedyPicked, setGreedyPicked] = useState<number[]>([]);
  const [greedyStep, setGreedyStep] = useState(0);

  const weight = [...selected].reduce((s, i) => s + KS_ITEMS[i].weight, 0);
  const value  = [...selected].reduce((s, i) => s + KS_ITEMS[i].value, 0);
  const over   = weight > KS_CAP;
  const userOptimal = !over && value === 6; // Ruby = $5, Silver+Crystal = $6

  function toggle(id: number) {
    if (phase !== "pick") return;
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function submitAndRunGreedy() {
    setPhase("greedy");
    // Greedy by value/weight ratio: Ruby=1.67 (pick), Silver=1.5, Crystal=1.5
    // Ruby uses 3kg, leaves 1kg — neither Silver(2) nor Crystal(2) fit
    const steps = [0]; // greedy picks Ruby (id=0) then gets stuck
    let idx = 0;
    const iv = setInterval(() => {
      if (idx >= steps.length) { clearInterval(iv); setGreedyPicked(steps); setPhase("reveal"); return; }
      setGreedyPicked(p => [...p, steps[idx++]]);
    }, 600);
  }

  function reset() {
    setSelected(new Set()); setPhase("pick");
    setGreedyPicked([]); setGreedyStep(0);
  }

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-lg font-bold text-zinc-800 mb-1">Outsmart the greedy</h2>
      <p className="text-zinc-500 text-sm mb-1">
        Bag capacity: <strong>{KS_CAP} kg</strong>. Pick items to maximise value.
      </p>
      <p className="text-xs text-zinc-400 mb-5">The item with the best value/kg ratio isn't always the right choice.</p>

      {/* Items */}
      <div className="space-y-2 mb-5">
        {KS_ITEMS.map(item => {
          const isSel = selected.has(item.id);
          const isGreedy = greedyPicked.includes(item.id);
          const isOptimal = phase === "reveal" && (item.id === 1 || item.id === 2);
          const ratio = (item.value / item.weight).toFixed(2);
          return (
            <motion.button key={item.id} onClick={() => toggle(item.id)}
              whileHover={phase === "pick" ? { scale: 1.01 } : {}}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-colors ${
                phase === "reveal" && isOptimal ? "border-emerald-400 bg-emerald-50" :
                phase === "reveal" && isGreedy  ? "border-amber-300 bg-amber-50" :
                isSel   ? "border-sky-400 bg-sky-50" :
                          "border-zinc-200 bg-white hover:border-sky-200"
              }`}
            >
              <div className="text-2xl">{item.emoji}</div>
              <div className="flex-1">
                <div className="font-semibold text-zinc-800 text-sm">{item.name}</div>
                <div className="text-xs text-zinc-400">{item.weight}kg · ${item.value} · ratio {ratio}</div>
              </div>
              {phase === "pick" && (
                <div className={`w-5 h-5 rounded-full border-2 ${isSel ? "bg-sky-500 border-sky-500" : "border-zinc-300"}`} />
              )}
              {phase === "reveal" && isOptimal && <span className="text-xs text-emerald-600 font-semibold">✓ optimal</span>}
              {phase === "reveal" && isGreedy && !isOptimal && <span className="text-xs text-amber-600 font-semibold">greedy picked</span>}
            </motion.button>
          );
        })}
      </div>

      {/* Status bar */}
      {phase === "pick" && (
        <div className={`p-3 rounded-xl border text-sm font-mono mb-4 transition-colors ${
          over ? "bg-red-50 border-red-200 text-red-700" : "bg-zinc-50 border-zinc-200 text-zinc-600"
        }`}>
          {weight}/{KS_CAP} kg · ${value}
          {over && " — over capacity!"}
        </div>
      )}

      {phase === "pick" && !over && selected.size > 0 && (
        <button onClick={submitAndRunGreedy}
          className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold transition-colors mb-4"
        >
          Lock in my answer ({selected.size} item{selected.size > 1 ? "s" : ""}, ${value}) — then see greedy
        </button>
      )}

      {phase === "greedy" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm mb-4 animate-pulse"
        >
          Greedy runs: Ruby has best ratio (1.67) → picks Ruby (3kg, $5). Remaining: 1kg. Silver needs 2kg — doesn&apos;t fit. Crystal needs 2kg — doesn&apos;t fit. Stuck at $5.
        </motion.div>
      )}

      {phase === "reveal" && (
        <>
          <div className={`p-3 rounded-xl border text-sm mb-4 ${
            userOptimal ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-sky-50 border-sky-200 text-sky-800"
          }`}>
            <div className="font-semibold mb-1">
              {userOptimal ? "🎉 You found optimal!" : "Here's the breakdown:"}
            </div>
            <div className="space-y-0.5 text-xs">
              <div>Your pick: {[...selected].map(i => KS_ITEMS[i].name).join(" + ") || "nothing"} → ${value}</div>
              <div>Greedy: Ruby → ${5} (3kg used, 1kg left — wasted)</div>
              <div className="text-emerald-700 font-semibold">Optimal: Silver + Crystal → 2+2=4kg, $6</div>
            </div>
          </div>
          <InsightBox text="Greedy picks Ruby (ratio 1.67 — highest value per kg), but 3kg leaves only 1kg — not enough for Silver or Crystal (2kg each). Silver+Crystal together fill the bag exactly (4kg) for $6. Greedy can't backtrack once it commits. Dynamic Programming tries every combination and guarantees the global optimum." />
        </>
      )}

      <ResetButton onClick={reset} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Default fallback
// ─────────────────────────────────────────────────────────────────────────────
function DefaultExplorer({ slug }: { slug: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4">🔍</div>
      <h2 className="text-lg font-bold text-zinc-700 mb-2">Interactive exploration coming soon</h2>
      <p className="text-zinc-400 text-sm max-w-xs">
        A hands-on intro experience for <strong className="text-zinc-600">{slug}</strong> is in the works.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Router
// ─────────────────────────────────────────────────────────────────────────────
export function TopicExplorer({ slug }: { slug: string }) {
  switch (slug) {
    case "arrays-hashing":      return <ArraysHashingExplorer />;
    case "two-pointers":        return <TwoPointersExplorer />;
    case "sliding-window":      return <SlidingWindowExplorer />;
    case "binary-search":       return <BinarySearchExplorer />;
    case "stack":               return <StackExplorer />;
    case "linked-list":         return <LinkedListExplorer />;
    case "trees":               return <TreesExplorer />;
    case "dynamic-programming": return <DPExplorer />;
    case "knapsack":            return <KnapsackExplorer />;
    default:                    return <DefaultExplorer slug={slug} />;
  }
}
