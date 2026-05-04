"use client";
import { useState, useEffect, useCallback } from "react";
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
// Arrays & Hashing — "Find the Duplicate"
// Click through the array to find a duplicate. Feel the O(n²) pain, then watch
// a hash set do it instantly.
// ─────────────────────────────────────────────────────────────────────────────
const AH_ARRAY = [4, 7, 2, 9, 1, 8, 3, 4, 5, 6];
const AH_DUPLICATE = 4;

function ArraysHashingExplorer() {
  const [checked, setChecked] = useState<number[]>([]);
  const [found, setFound] = useState<number | null>(null);
  const [phase, setPhase] = useState<"manual" | "hash" | "done">("manual");
  const [hashIdx, setHashIdx] = useState(-1);
  const [hashSet, setHashSet] = useState<number[]>([]);
  const [hashFound, setHashFound] = useState(false);

  function handleClick(idx: number) {
    if (phase !== "manual" || found !== null) return;
    if (checked.includes(idx)) return;
    const next = [...checked, idx];
    setChecked(next);
    const seen = new Set<number>();
    for (const i of next) {
      if (seen.has(AH_ARRAY[i])) { setFound(AH_ARRAY[i]); return; }
      seen.add(AH_ARRAY[i]);
    }
  }

  function runHash() {
    setPhase("hash");
    setHashIdx(0);
    setHashSet([]);
    setHashFound(false);
  }

  useEffect(() => {
    if (phase !== "hash" || hashFound) return;
    if (hashIdx >= AH_ARRAY.length) return;
    const val = AH_ARRAY[hashIdx];
    const timer = setTimeout(() => {
      if (hashSet.includes(val)) {
        setHashFound(true);
        setPhase("done");
      } else {
        setHashSet(s => [...s, val]);
        setHashIdx(i => i + 1);
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [phase, hashIdx, hashSet, hashFound]);

  function reset() {
    setChecked([]); setFound(null); setPhase("manual");
    setHashIdx(-1); setHashSet([]); setHashFound(false);
  }

  const clicks = checked.length;

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-lg font-bold text-zinc-800 mb-1">Find the duplicate</h2>
      <p className="text-zinc-500 text-sm mb-5">
        Click cards to check them. Find the number that appears twice.
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {AH_ARRAY.map((n, i) => {
          const isChecked = checked.includes(i);
          const isFound = found !== null && n === found;
          const isHashCurrent = phase === "hash" && i === hashIdx;
          const isHashSeen = phase !== "manual" && hashSet.includes(n) && !isHashCurrent;
          const isHashFoundItem = hashFound && n === AH_DUPLICATE;
          return (
            <motion.button
              key={i}
              onClick={() => handleClick(i)}
              whileHover={phase === "manual" && !found ? { scale: 1.08 } : {}}
              whileTap={phase === "manual" && !found ? { scale: 0.95 } : {}}
              className={`w-12 h-12 rounded-xl text-sm font-bold border-2 transition-all ${
                isHashFoundItem ? "bg-red-500 border-red-400 text-white scale-110 shadow-lg" :
                isHashCurrent  ? "bg-sky-400 border-sky-300 text-white animate-pulse" :
                isHashSeen     ? "bg-sky-100 border-sky-300 text-sky-700" :
                isFound        ? "bg-red-100 border-red-400 text-red-700 scale-110" :
                isChecked      ? "bg-zinc-200 border-zinc-300 text-zinc-500" :
                                 "bg-white border-zinc-200 text-zinc-700 hover:border-sky-300 cursor-pointer"
              }`}
            >
              {n}
            </motion.button>
          );
        })}
      </div>

      <div className="text-xs text-zinc-400 mb-3">Clicks used: <span className="font-mono font-bold text-zinc-600">{clicks}</span></div>

      <AnimatePresence>
        {found && phase === "manual" && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm mb-4"
          >
            ✓ Found <strong>{found}</strong> in <strong>{clicks}</strong> clicks.{" "}
            Now watch how a hash set does it in one linear sweep:
          </motion.div>
        )}
      </AnimatePresence>

      {found && phase === "manual" && (
        <button onClick={runHash}
          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition-colors mb-4"
        >
          ⚡ Run Hash Set →
        </button>
      )}

      {phase === "hash" && !hashFound && (
        <div className="text-sm text-zinc-500 mb-3 animate-pulse">
          Scanning... checking if <strong className="text-sky-700">{AH_ARRAY[hashIdx]}</strong> is already in the set
        </div>
      )}

      {phase !== "manual" && (
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs text-zinc-400 mr-2 self-center">Hash set:</span>
          {hashSet.map((v, i) => (
            <span key={i} className="px-2 py-0.5 rounded-lg bg-sky-100 border border-sky-200 text-sky-700 text-xs font-mono">{v}</span>
          ))}
        </div>
      )}

      {phase === "done" && (
        <InsightBox text={`You needed ${clicks} manual clicks. The hash set found it in ${hashIdx + 1} steps — without ever comparing pairs. That's the difference between O(n²) and O(n).`} />
      )}

      <ResetButton onClick={reset} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Two Pointers — "Sum Hunt"
// Find two numbers that add to the target. Feel the brute force, then watch
// two pointers converge in a fraction of the checks.
// ─────────────────────────────────────────────────────────────────────────────
const TP_NUMS = [1, 4, 6, 8, 10, 13, 15, 18];
const TP_TARGET = 22;

function TwoPointersExplorer() {
  const [sel, setSel] = useState<number[]>([]);
  const [bruteChecks, setBruteChecks] = useState<[number,number][]>([]);
  const [bruteRunning, setBruteRunning] = useState(false);
  const [tpStep, setTpStep] = useState(-1);
  const [phase, setPhase] = useState<"pick" | "brute" | "twoptr" | "done">("pick");

  function select(i: number) {
    if (phase !== "pick") return;
    if (sel.includes(i)) { setSel(sel.filter(x => x !== i)); return; }
    if (sel.length === 2) return;
    const next = [...sel, i];
    setSel(next);
    if (next.length === 2) {
      const sum = TP_NUMS[next[0]] + TP_NUMS[next[1]];
      if (sum === TP_TARGET) setPhase("brute");
    }
  }

  function runBrute() {
    setBruteRunning(true);
    const checks: [number,number][] = [];
    for (let i = 0; i < TP_NUMS.length; i++)
      for (let j = i+1; j < TP_NUMS.length; j++)
        checks.push([i,j]);
    setBruteChecks([]);
    let idx = 0;
    const interval = setInterval(() => {
      if (idx >= checks.length) { clearInterval(interval); setBruteRunning(false); setPhase("twoptr"); return; }
      setBruteChecks(c => [...c, checks[idx]]);
      idx++;
    }, 80);
  }

  useEffect(() => {
    if (phase !== "twoptr") return;
    setTpStep(0);
  }, [phase]);

  useEffect(() => {
    if (tpStep < 0) return;
    let l = 0, r = TP_NUMS.length - 1, step = 0;
    // find which step we're at
    let ll = 0, rr = TP_NUMS.length - 1;
    for (let s = 0; s <= tpStep; s++) {
      const sum = TP_NUMS[ll] + TP_NUMS[rr];
      if (sum === TP_TARGET || ll >= rr) break;
      if (sum < TP_TARGET) ll++; else rr--;
    }
    if (TP_NUMS[ll] + TP_NUMS[rr] === TP_TARGET) { setPhase("done"); return; }
    const timer = setTimeout(() => setTpStep(s => s + 1), 500);
    return () => clearTimeout(timer);
  }, [tpStep]);

  // compute current tp pointers
  let tpL = 0, tpR = TP_NUMS.length - 1;
  for (let s = 0; s < tpStep && tpL < tpR; s++) {
    const sum = TP_NUMS[tpL] + TP_NUMS[tpR];
    if (sum === TP_TARGET) break;
    if (sum < TP_TARGET) tpL++; else tpR--;
  }

  const totalBrutePairs = (TP_NUMS.length * (TP_NUMS.length - 1)) / 2;
  const answerIndices = TP_NUMS.map((_, i) =>
    TP_NUMS.findIndex((n, j) => j > i && n + TP_NUMS[i] === TP_TARGET) !== -1 ? i : -1
  ).filter(i => i !== -1);

  function reset() { setSel([]); setBruteChecks([]); setBruteRunning(false); setTpStep(-1); setPhase("pick"); }

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-lg font-bold text-zinc-800 mb-1">Hit the target</h2>
      <p className="text-zinc-500 text-sm mb-2">
        This sorted array hides a pair that sums to <span className="font-bold text-sky-600">{TP_TARGET}</span>. Click two numbers.
      </p>
      <div className="flex gap-2 mb-5">
        {TP_NUMS.map((n, i) => {
          const isSel = sel.includes(i);
          const isBruteActive = bruteChecks.length > 0 && bruteChecks[bruteChecks.length-1][0] === i || bruteChecks.length > 0 && bruteChecks[bruteChecks.length-1][1] === i;
          const isAnswer = phase === "done" && (i === tpL || i === tpR);
          const isTpL = (phase === "twoptr" || phase === "done") && i === tpL;
          const isTpR = (phase === "twoptr" || phase === "done") && i === tpR;
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <motion.button onClick={() => select(i)} whileHover={phase === "pick" ? { scale: 1.1 } : {}}
                className={`w-11 h-11 rounded-xl text-sm font-bold border-2 transition-all ${
                  isAnswer    ? "bg-emerald-500 border-emerald-400 text-white scale-110 shadow-md" :
                  isTpL       ? "bg-sky-400 border-sky-300 text-white" :
                  isTpR       ? "bg-violet-400 border-violet-300 text-white" :
                  isBruteActive ? "bg-amber-200 border-amber-400 text-amber-800" :
                  isSel       ? "bg-sky-100 border-sky-400 text-sky-800" :
                                "bg-white border-zinc-200 text-zinc-700 hover:border-sky-300"
                }`}
              >{n}</motion.button>
              {isTpL && <span className="text-xs text-sky-500 font-bold">L</span>}
              {isTpR && <span className="text-xs text-violet-500 font-bold">R</span>}
            </div>
          );
        })}
      </div>

      {sel.length === 2 && TP_NUMS[sel[0]] + TP_NUMS[sel[1]] !== TP_TARGET && (
        <p className="text-sm text-red-500 mb-3">
          {TP_NUMS[sel[0]]} + {TP_NUMS[sel[1]]} = {TP_NUMS[sel[0]] + TP_NUMS[sel[1]]} — not {TP_TARGET}. Try again.
        </p>
      )}

      {phase === "brute" && !bruteRunning && bruteChecks.length === 0 && (
        <div className="mb-3">
          <p className="text-sm text-zinc-600 mb-2">Nice! Now watch brute force check <strong>every pair</strong>:</p>
          <button onClick={runBrute}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold transition-colors"
          >
            Run brute force ({totalBrutePairs} checks)
          </button>
        </div>
      )}

      {bruteRunning && (
        <div className="text-sm text-zinc-500 animate-pulse mb-3">
          Checking pair {bruteChecks.length}/{totalBrutePairs}…
        </div>
      )}

      {phase === "twoptr" && (
        <div className="text-sm text-zinc-600 mb-3">
          <span className="font-semibold text-sky-600">L</span> + <span className="font-semibold text-violet-600">R</span> ={" "}
          <span className="font-mono">{TP_NUMS[tpL] + TP_NUMS[tpR]}</span>{" "}
          {TP_NUMS[tpL] + TP_NUMS[tpR] < TP_TARGET ? "→ too small, move L right" : "→ too big, move R left"}
        </div>
      )}

      {phase === "done" && (
        <InsightBox text={`Brute force needed ${totalBrutePairs} pair comparisons. Two pointers found it in ${tpStep + 1} steps — by exploiting the sorted order. O(n) instead of O(n²).`} />
      )}

      <ResetButton onClick={reset} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sliding Window — "Ride the Wave"
// Find the max-sum window of size 3. Try clicking manually, then watch the
// window slide across adding/removing one element at a time.
// ─────────────────────────────────────────────────────────────────────────────
const SW_VALS = [3, 1, 4, 1, 5, 9, 2, 6];
const SW_K = 3;

function SlidingWindowExplorer() {
  const [windowStart, setWindowStart] = useState(0);
  const [sliding, setSliding] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);
  const [phase, setPhase] = useState<"manual" | "slide" | "done">("manual");

  const maxStart = SW_VALS.length - SW_K;
  const currentSum = SW_VALS.slice(windowStart, windowStart + SW_K).reduce((a, b) => a + b, 0);
  const maxSum = Math.max(...Array.from({ length: maxStart + 1 }, (_, i) => SW_VALS.slice(i, i + SW_K).reduce((a, b) => a + b, 0)));
  const maxSumStart = Array.from({ length: maxStart + 1 }, (_, i) => SW_VALS.slice(i, i + SW_K).reduce((a, b) => a + b, 0)).indexOf(maxSum);

  function startSlide() {
    setPhase("slide");
    setSlideIdx(0);
    setWindowStart(0);
  }

  useEffect(() => {
    if (phase !== "slide") return;
    if (slideIdx > maxStart) { setPhase("done"); setWindowStart(maxSumStart); return; }
    const timer = setTimeout(() => {
      setWindowStart(slideIdx);
      setSlideIdx(s => s + 1);
    }, 500);
    return () => clearTimeout(timer);
  }, [phase, slideIdx, maxStart, maxSumStart]);

  function reset() { setWindowStart(0); setSliding(false); setSlideIdx(0); setPhase("manual"); }

  const maxBarHeight = Math.max(...SW_VALS);

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-lg font-bold text-zinc-800 mb-1">Ride the wave</h2>
      <p className="text-zinc-500 text-sm mb-5">
        Which <strong>{SW_K} consecutive bars</strong> have the highest total? Move the window manually, then watch the sliding window algorithm.
      </p>

      {/* Bar chart */}
      <div className="flex items-end gap-1 h-28 mb-1">
        {SW_VALS.map((v, i) => {
          const inWindow = i >= windowStart && i < windowStart + SW_K;
          const isMax = phase === "done" && i >= maxSumStart && i < maxSumStart + SW_K;
          return (
            <motion.div key={i} layout
              className={`flex-1 rounded-t-lg transition-colors ${
                isMax    ? "bg-emerald-500" :
                inWindow ? "bg-sky-400" : "bg-zinc-200"
              }`}
              style={{ height: `${(v / maxBarHeight) * 100}%` }}
            />
          );
        })}
      </div>
      <div className="flex gap-1 mb-4">
        {SW_VALS.map((v, i) => (
          <div key={i} className="flex-1 text-center text-xs text-zinc-400">{v}</div>
        ))}
      </div>

      {phase === "manual" && (
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setWindowStart(s => Math.max(0, s - 1))} disabled={windowStart === 0}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 text-sm disabled:opacity-30 hover:border-sky-300 transition-colors">
            ← Slide left
          </button>
          <div className="flex-1 text-center text-sm text-zinc-600">
            Window sum: <span className="font-bold text-sky-600 font-mono">{currentSum}</span>
            <span className="text-zinc-400 ml-2">(position {windowStart})</span>
          </div>
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
          ⚡ Watch sliding window algorithm →
        </button>
      )}

      {phase === "slide" && (
        <div className="text-sm text-zinc-500 animate-pulse mb-4">
          Sum = {currentSum} — sliding from left to right, adding one, removing one…
        </div>
      )}

      {phase === "done" && (
        <InsightBox text={`Max sum is ${maxSum} starting at index ${maxSumStart}. The window never recomputes from scratch — it adds the new right element and subtracts the old left one. That's why it's O(n), not O(n·k).`} />
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

  const mid = Math.floor((lo + hi) / 2);

  function guess(pick: "lo" | "mid" | "hi") {
    const val = pick === "lo" ? lo : pick === "hi" ? hi : mid;
    setLastGuess(val);
    setGuesses(g => g + 1);
    if (val === target) { setWon(true); return; }
    if (val < target) { setLo(val + 1); setHint("Too low — go higher"); }
    else { setHi(val - 1); setHint("Too high — go lower"); }
  }

  function reset() {
    setLo(1); setHi(100); setGuesses(0);
    setLastGuess(null); setHint(""); setWon(false);
  }

  const rangeWidth = hi - lo + 1;

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-lg font-bold text-zinc-800 mb-1">Guess my number</h2>
      <p className="text-zinc-500 text-sm mb-5">
        I'm thinking of a number between 1 and 100. Use binary search — always guess the midpoint.
        Watch the remaining possibilities shrink.
      </p>

      {/* Range visualizer */}
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

      {!won && (
        <div className="flex gap-3 mb-4">
          {lo !== hi && (
            <button onClick={() => guess("mid")}
              className="flex-1 px-4 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition-colors">
              Guess {mid}
            </button>
          )}
          {lo === hi && (
            <button onClick={() => guess("mid")}
              className="flex-1 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors">
              It must be {mid}!
            </button>
          )}
        </div>
      )}

      <AnimatePresence>
        {hint && !won && (
          <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            className="text-sm text-zinc-600 mb-3 flex items-center gap-2"
          >
            <span>{lastGuess}</span>
            <span className={`font-semibold ${hint.includes("low") ? "text-sky-600" : "text-red-500"}`}>
              {hint.includes("low") ? "↑ Too low" : "↓ Too high"}
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
          <InsightBox text={`100 numbers, at most 7 guesses. Because you halve the range each time: 100 → 50 → 25 → 13 → 7 → 4 → 2 → 1. That's log₂(100) ≈ 7. This is why binary search is O(log n).`} />
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
  const [started, setStarted] = useState(false);
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
    setStep(-1); setStack([]); setStarted(false);
    setGuess(null); setDone(false); setMismatch(false);
  }

  const isCorrectGuess = guess !== null && (guess === "valid") === (seq.valid && stack.length === 0 && !mismatch);

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-lg font-bold text-zinc-800 mb-1">Balance check</h2>
      <p className="text-zinc-500 text-sm mb-5">
        Step through the brackets one at a time. The stack keeps track.
        At the end — is it valid?
      </p>

      {/* Sequence display */}
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

      {/* Stack visualization */}
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

  // State after each step of: prev=null,curr=0 → prev=0,curr=1 → ...
  const totalSteps = LL_VALS.length;
  const prevIdx = step - 1; // index of "prev" (the already-reversed portion end)
  const currIdx = step;      // index of "curr"

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

      {/* Node chain */}
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
// Click to watch both and feel the difference.
// ─────────────────────────────────────────────────────────────────────────────
//       1
//      / \
//     2   3
//    / \ / \
//   4  5 6  7
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

      {/* SVG tree */}
      <div className="relative bg-zinc-50 rounded-2xl border border-zinc-200 p-4 mb-5" style={{ height: 180 }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Edges */}
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
        {TREE_NODES.map((n, order) => {
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
// Dynamic Programming — "Greedy Gets It Wrong"
// Coins [1, 6, 10], target 12.
// Watch greedy fail, then see DP find the true optimum.
// ─────────────────────────────────────────────────────────────────────────────
const DP_COINS = [10, 6, 1];
const DP_TARGET = 12;

function DPExplorer() {
  const [phase, setPhase] = useState<"intro" | "greedy" | "dp" | "done">("intro");
  const [greedyCoins, setGreedyCoins] = useState<number[]>([]);
  const [dpCoins, setDpCoins] = useState<number[]>([]);
  const [greedyStep, setGreedyStep] = useState(0);
  const [dpStep, setDpStep] = useState(0);

  function runGreedy() {
    setPhase("greedy");
    let rem = DP_TARGET;
    const coins: number[] = [];
    for (const c of DP_COINS) { while (rem >= c) { coins.push(c); rem -= c; } }
    let idx = 0;
    const iv = setInterval(() => {
      if (idx >= coins.length) { clearInterval(iv); setGreedyCoins(coins); setPhase("dp"); return; }
      setGreedyCoins(c => [...c, coins[idx++]]);
    }, 400);
  }

  function runDP() {
    // Optimal: 6+6=2 coins
    const optimal = [6, 6];
    let idx = 0;
    const iv = setInterval(() => {
      if (idx >= optimal.length) { clearInterval(iv); setDpCoins(optimal); setPhase("done"); return; }
      setDpCoins(c => [...c, optimal[idx++]]);
    }, 400);
  }

  useEffect(() => { if (phase === "dp" && dpCoins.length === 0) runDP(); }, [phase]);

  function reset() {
    setPhase("intro"); setGreedyCoins([]); setDpCoins([]);
    setGreedyStep(0); setDpStep(0);
  }

  const COIN_COLORS: Record<number, string> = {
    10: "bg-amber-100 border-amber-400 text-amber-800",
    6:  "bg-emerald-100 border-emerald-400 text-emerald-800",
    1:  "bg-zinc-100 border-zinc-400 text-zinc-600",
  };

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-lg font-bold text-zinc-800 mb-1">Greedy gets it wrong</h2>
      <p className="text-zinc-500 text-sm mb-2">
        Make <strong className="text-zinc-800">{DP_TARGET}¢</strong> using coins {DP_COINS.join("¢, ")}¢.
        Use as few coins as possible.
      </p>
      <p className="text-xs text-zinc-400 mb-5">Greedy always picks the largest coin first. Does it find the best answer?</p>

      {phase === "intro" && (
        <button onClick={runGreedy}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold transition-colors"
        >
          Run greedy →
        </button>
      )}

      {(phase === "greedy" || phase === "dp" || phase === "done") && (
        <div className="space-y-4">
          <div>
            <div className="text-xs text-zinc-500 mb-2 font-semibold uppercase tracking-wider">
              Greedy — always picks largest coin
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              {greedyCoins.map((c, i) => (
                <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 ${COIN_COLORS[c]}`}
                >{c}¢</motion.div>
              ))}
              {greedyCoins.length > 0 && (
                <span className="text-sm text-zinc-500">
                  = {greedyCoins.reduce((a,b)=>a+b,0)}¢ in <strong>{greedyCoins.length}</strong> coins
                  {phase !== "greedy" && <span className="text-amber-600 ml-1">(not optimal!)</span>}
                </span>
              )}
            </div>
          </div>

          {(phase === "dp" || phase === "done") && (
            <div>
              <div className="text-xs text-zinc-500 mb-2 font-semibold uppercase tracking-wider">
                DP — finds true optimum
              </div>
              <div className="flex gap-2 items-center flex-wrap">
                {dpCoins.map((c, i) => (
                  <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 ${COIN_COLORS[c]}`}
                  >{c}¢</motion.div>
                ))}
                {dpCoins.length > 0 && (
                  <span className="text-sm text-zinc-500">
                    = {dpCoins.reduce((a,b)=>a+b,0)}¢ in <strong className="text-emerald-600">{dpCoins.length}</strong> coins ✓
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {phase === "done" && (
        <InsightBox text={`Greedy used ${greedyCoins.length} coins (10+1+1). DP found ${dpCoins.length} coins (6+6). Greedy commits early and can't backtrack. DP tries every subproblem — "what's the min coins for 1¢, 2¢... 12¢?" — and builds the answer from the ground up.`} />
      )}

      <ResetButton onClick={reset} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Knapsack (demo course) — keep existing feel, simpler version
// ─────────────────────────────────────────────────────────────────────────────
const KS_ITEMS = [
  { name: "💎 Diamond",  weight: 7, value: 10 },
  { name: "🥇 Gold Bar", weight: 5, value: 8  },
  { name: "🔋 Battery",  weight: 3, value: 5  },
];
const KS_CAP = 8;

function KnapsackExplorer() {
  const [selected, setSelected] = useState<number[]>([]);

  function toggle(i: number) {
    setSelected(s => s.includes(i) ? s.filter(x => x !== i) : [...s, i]);
  }

  const totalWeight = selected.reduce((s, i) => s + KS_ITEMS[i].weight, 0);
  const totalValue  = selected.reduce((s, i) => s + KS_ITEMS[i].value,  0);
  const overCapacity = totalWeight > KS_CAP;
  const optimal = !overCapacity && totalValue === 13; // Gold + Battery

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-lg font-bold text-zinc-800 mb-1">The thief's dilemma</h2>
      <p className="text-zinc-500 text-sm mb-2">
        Your bag holds <strong>{KS_CAP} kg</strong>. Pick the combination with the highest value.
      </p>
      <p className="text-xs text-zinc-400 mb-5">Hint: the most valuable item isn't always the best choice.</p>

      <div className="space-y-2 mb-5">
        {KS_ITEMS.map((item, i) => {
          const isSel = selected.includes(i);
          return (
            <motion.button key={i} onClick={() => toggle(i)} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-colors ${
                isSel ? "border-sky-400 bg-sky-50" : "border-zinc-200 bg-white hover:border-sky-200"
              }`}
            >
              <div className="text-2xl">{item.name.split(" ")[0]}</div>
              <div className="flex-1">
                <div className="font-semibold text-zinc-800 text-sm">{item.name.slice(3)}</div>
                <div className="text-xs text-zinc-400">{item.weight} kg · ${item.value} value</div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 transition-colors ${isSel ? "bg-sky-500 border-sky-500" : "border-zinc-300"}`} />
            </motion.button>
          );
        })}
      </div>

      <div className={`p-3 rounded-xl border text-sm font-mono transition-colors ${
        overCapacity ? "bg-red-50 border-red-200 text-red-700" :
        optimal      ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                       "bg-zinc-50 border-zinc-200 text-zinc-600"
      }`}>
        Weight: {totalWeight}/{KS_CAP} kg &nbsp;|&nbsp; Value: ${totalValue}
        {overCapacity && " — over capacity!"}
        {optimal && " — optimal! 🎉"}
      </div>

      {optimal && (
        <InsightBox text="Gold Bar + Battery Pack fits in 8 kg for $13 — more than the Diamond alone ($10). Greedy (pick highest value first) fails here. That's exactly why we need Dynamic Programming." />
      )}
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
