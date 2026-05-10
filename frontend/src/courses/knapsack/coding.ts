import type { CodingProblem } from "../types";

export const CODING_PROBLEMS: CodingProblem[] = [
  {
    difficulty: "easy",
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
    difficulty: "easy",
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
    difficulty: "medium",
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
    difficulty: "medium",
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
    difficulty: "hard",
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

export const FINAL_PROBLEM: CodingProblem = {
  difficulty: "hard",
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
