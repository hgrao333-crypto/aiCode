import type { SubtopicCfg } from "../types";

export const SUBTOPICS: SubtopicCfg[] = [
  {
    stage: 1, title: "The Thief's Choice", icon: "🎒",
    concepts: ["Problem framing", "Why greedy fails", "2ⁿ decision tree"],
    teachingCards: [
      {
        text: "**Greedy always picks the locally best item — but local best can block a better global combination.**\n\nWith items A(3kg,$5), B(2kg,$3), C(2kg,$3) and a 4kg bag, greedy picks A first (ratio 5/3 ≈ 1.67). That uses 3kg, leaving only 1kg — neither B nor C fits. Total: **$5**.\n\nBut B+C together = 4kg, $6. Greedy missed it because taking A locked out this combination.\n\nThe only way to guarantee the best pick: check **every possible subset** — that's 2ⁿ options.",
        imageUrl: "/images/card_greedy_fails.png",
        imageCaption: "Greedy commits to one path and misses the optimal combination.",
      },
      {
        text: "**Every item has exactly two choices: take it or skip it. That gives a binary decision tree.**\n\nAt each node you branch: take the item (and reduce remaining capacity) or skip it. With n items you get 2ⁿ leaves — one for each possible subset.\n\nFor 3 items: 8 combinations. For 30 items: over a billion. Brute force explodes quickly.",
        imageUrl: "/images/card_decision_tree.png",
        imageCaption: "Each item forks the tree — take or skip. n items → 2ⁿ leaves.",
      },
    ],
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
    teachingCards: [
      {
        text: "**The brute-force recursion recomputes the same sub-problem many times — that's the overlapping subproblems property.**\n\nA sub-problem is defined by two things: *which item* you're deciding on, and *how much capacity* remains. The call `knapsack(items 1-2, capacity 3kg)` can appear on dozens of branches of the tree — each time solving from scratch.\n\nThe fix: **memoization**. Store the answer in a dict `memo[(i, w)]` the first time you compute it. Every subsequent call with the same `(i, w)` just returns the cached value.\n\nWith n items and capacity W, there are at most **n × W** unique `(i, w)` pairs. Time drops from O(2ⁿ) to **O(n × W)**.",
        imageUrl: "/images/card_memo_table.png",
        imageCaption: "A cache (memo) stores each solved sub-problem so it's never recomputed.",
      },
    ],
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
    teachingCards: [
      {
        text: "**Bottom-up DP flips the recursion: instead of solving top-down and caching, we fill a 2D table from the simplest sub-problems up.**\n\nThe table has `dp[i][w]` = best value using the first `i` items with capacity `w`. Row 0 (no items) is all zeros — the base case.\n\nFor each subsequent row i, and each capacity w, we choose the better of two options:\n- **Skip item i**: `dp[i][w] = dp[i-1][w]`\n- **Take item i** (if it fits): `dp[i][w] = dp[i-1][w - wᵢ] + vᵢ`\n\nWe look at row i-1 when taking — that's the key: we use the best we could do *without* item i as the foundation.",
        imageUrl: "/images/subtopic_building-the-table.png",
        imageCaption: "Build dp[i][w] row by row — each cell is the better of skip or take.",
      },
    ],
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
    teachingCards: [
      {
        text: "**The 2D table uses O(n × W) space, but each row only reads from the row directly above it. We can compress to a single array.**\n\nWhen filling `dp[w]` for item i, we only need `dp[w]` and `dp[w - wᵢ]` from *before this item was processed*. If we update in place, we have to be careful not to overwrite values we still need.\n\n**Left-to-right is wrong**: updating `dp[2]` before computing `dp[4]` means `dp[4-2]=dp[2]` already reflects item i — the item gets counted twice (unbounded knapsack behavior).\n\n**Right-to-left is correct**: when we compute `dp[w]`, `dp[w - wᵢ]` hasn't been updated yet — it still holds the 'before this item' value, so each item is counted at most once.",
        imageUrl: "/images/card_1d_trick.png",
        imageCaption: "Right-to-left ensures dp[w−wᵢ] still holds the pre-item value when we read it.",
      },
    ],
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
    teachingCards: [
      {
        text: "**Once you know 0/1 Knapsack, many other problems are just a re-labelling.**\n\n**Subset Sum**: Can some subset of `[3,1,5,9,12]` sum to 14? Map it: weight = value = the number, capacity = 14. If `dp[n][14] = 14`, a valid subset exists. Same DP, different labels.\n\n**Unbounded Knapsack**: Items can be reused unlimited times. The only change: iterate the inner loop **left-to-right** instead of right-to-left. Left-to-right lets `dp[w - wᵢ]` already reflect the current item, meaning it can be added again.\n\n| Problem | Loop direction |\n|---|---|\n| 0/1 Knapsack | Right → Left |\n| Unbounded Knapsack | Left → Right |\n| Subset Sum | Right → Left |",
        imageUrl: "/images/subtopic_knapsack-variations.png",
        imageCaption: "One template, three problems — the only difference is loop direction and how you map the problem.",
      },
    ],
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
