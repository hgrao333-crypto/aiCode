"""
Seed the Knapsack demo course.

Usage:
    cd backend
    ./venv/bin/python3 seed_knapsack.py

Idempotent: re-running skips the topic if the slug already exists.
"""
import sys
from database import SessionLocal
import models

db = SessionLocal()


def seed():
    if db.query(models.Topic).filter_by(slug="knapsack").first():
        print("Topic 'knapsack' already exists — skipping.")
        return

    # ── Topic ──────────────────────────────────────────────────────────────────
    topic = models.Topic(
        slug="knapsack",
        title="The Knapsack Problem",
        description=(
            "Master dynamic programming through one of its most famous applications. "
            "From brute force to space-optimised DP — every concept taught, tested, and made yours."
        ),
        icon="🎒",
        color="emerald",
        level=0,
        position_in_level=0,
        prerequisites=[],
        course="demo",
    )
    db.add(topic)
    db.flush()

    # ── Helper ─────────────────────────────────────────────────────────────────
    def add_subtopic(title, slug, description, order):
        st = models.SubTopic(
            topic_id=topic.id,
            slug=slug,
            title=title,
            description=description,
            order_index=order,
        )
        db.add(st)
        db.flush()
        return st

    def add_card(subtopic, title, content, order):
        pc = models.PlayCard(
            subtopic_id=subtopic.id,
            title=title,
            content=content,
            order_index=order,
        )
        db.add(pc)
        db.flush()
        return pc

    def add_exercise(playcard, ex_type, question, **kwargs):
        ex = models.CheckpointExercise(
            playcard_id=playcard.id,
            exercise_type=ex_type,
            question=question,
            options=kwargs.get("options"),
            correct_index=kwargs.get("correct_index"),
            buggy_code=kwargs.get("buggy_code"),
            grading_hints=kwargs.get("grading_hints", ""),
            explanation=kwargs.get("explanation"),
            order_index=kwargs.get("order_index", 0),
        )
        db.add(ex)
        db.flush()
        return ex

    def add_problem(subtopic, slug, title, description, difficulty, starter, solution, test_cases, concepts, order):
        p = models.Problem(
            slug=slug,
            title=title,
            description=description,
            topic="knapsack",
            subtopic_id=subtopic.id,
            difficulty=difficulty,
            starter_code=starter,
            solution_code=solution,
            test_cases=test_cases,
            concepts=concepts,
            order_index=order,
        )
        db.add(p)
        db.flush()
        return p

    # ══════════════════════════════════════════════════════════════════════════
    # SUBTOPIC 1 — The Thief's Choice
    # ══════════════════════════════════════════════════════════════════════════
    st1 = add_subtopic(
        "The Thief's Choice",
        "thiefs-choice",
        "Understand the problem before writing a single line of code.",
        1,
    )

    c1_1 = add_card(st1, "The Setup", """
## The Setup

A thief breaks into a store with a bag that can hold **W kg** of goods.

There are **n items**, each with:
- A **weight** `w[i]` — how much space it takes
- A **value** `v[i]` — how much it's worth

**The rule:** Each item can be taken at most once (0 or 1 times — that's the "0/1" in 0/1 knapsack).

**The goal:** Fill the bag to maximise total value without exceeding W.

```
Items:          weight  value
  Laptop           3      4
  Phone            1      3
  Camera           4      5
  Headphones       2      3

Bag capacity: W = 5

Best choice: Phone (1, 3) + Laptop (3, 4) = weight 4, value 7
```

Notice: taking Camera + Phone = weight 5, value 8 is even better!
The right answer isn't obvious — you have to consider all combinations.
""".strip(), 1)

    add_exercise(c1_1, "recognition",
        "Which of these is a 0/1 knapsack problem?",
        options=[
            "Minimise the number of coins to make change (coins can be reused)",
            "Select non-adjacent houses to rob for maximum money",
            "Pick at most one item per category to maximise satisfaction within a budget",
            "Fractional water pouring between jugs",
        ],
        correct_index=2,
        explanation="0/1 knapsack: binary choice per item, capacity constraint, maximise value. Option C matches exactly. Coin change allows item reuse (unbounded). House robber has no capacity constraint. Pouring is a BFS/state-space problem.",
        order_index=0,
    )

    c1_2 = add_card(st1, "Why Greedy Fails", """
## Why Greedy Fails

The obvious idea: always grab the item with the best value-per-kg ratio first.

```
Items:          weight  value  ratio
  Gold bar         1      6     6.0
  Painting         4      9     2.25
  Sculpture        3      5     1.67

W = 5
```

**Greedy by ratio:** Take Gold bar (1 kg, 6 val) → 4 kg left → Take Sculpture (3 kg, 5 val) → done.
Total: **11 value, 4 kg used.**

**Optimal:** Gold bar (1 kg) + Painting (4 kg) = **15 value, 5 kg used.**

Greedy got 11. Optimal is 15. Greedy is wrong by 36%.

**Why?** Greedy commits to a local best without considering what fits in the remaining space. The choice of one item destroys the possibility of a better combination.

This is the core insight: **0/1 knapsack requires considering combinations, not just rankings.**
""".strip(), 2)

    add_exercise(c1_2, "variation",
        "Greedy works perfectly for the fractional knapsack (where you can take 0.5 of an item). Why does it work there but not here?",
        grading_hints="Student should mention: in fractional knapsack you can always fill remaining space exactly, so value/weight ratio is always optimal. In 0/1 you can't split items, so leftover space may go unused if you follow greedy.",
        explanation="Fractional knapsack: if you take the best-ratio item and have leftover space, you can take a fraction of the next-best item to fill it exactly. No wasted space. 0/1: you either take the full item or nothing. Leftover space may be wasted, making a slightly lower-ratio item that fills the bag more efficiently the better choice.",
        order_index=0,
    )

    c1_3 = add_card(st1, "The Decision Tree", """
## The Decision Tree

For each item, we have exactly two choices: **take it** or **leave it**.

With n items, that's 2ⁿ possible combinations.

```
n=3 items: A (2kg,3val), B (3kg,4val), C (1kg,2val), W=4

                     start
                    /     \\
              take A      skip A
             (2kg,3)      (0kg,0)
             /    \\        /    \\
         take B  skip B  take B  skip B
          OVER    /  \\    OVER    /  \\
               take C skip C   take C skip C
               (3,5) (3,3)    (4,6)  (0,0)
```

(`OVER` = exceeds capacity W=4)

Reading the leaves:
- A+C = 3kg, 5 val
- A only = 2kg, 3 val
- B+C = 4kg, 6 val ← **optimal**
- empty = 0

**The brute force algorithm** explores this entire tree.
Time complexity: **O(2ⁿ)** — doubles with each item added.
""".strip(), 3)

    add_exercise(c1_3, "teach_back",
        "Explain to a beginner why the decision tree has exactly 2ⁿ leaves.",
        grading_hints="Should explain: each item creates a fork (take/skip). n independent binary decisions. Each path through the tree is a unique combination. Total leaves = 2 × 2 × ... × 2 (n times) = 2ⁿ.",
        explanation="At each level of the tree, every existing node splits into 2 children (take or skip). After n levels (one per item), the number of leaves has doubled n times: 1 → 2 → 4 → 8 → ... → 2ⁿ. Each leaf represents one distinct subset of items.",
        order_index=0,
    )

    # Problems for st1
    add_problem(st1,
        "knapsack-brute-force",
        "0/1 Knapsack — Brute Force",
        """
Implement the brute-force recursive solution for the 0/1 knapsack problem.

**Input:** `weights` (list of ints), `values` (list of ints), `W` (int capacity)
**Output:** Maximum value achievable without exceeding W

Each item can be used at most once. Focus on correctness — no optimisation needed.

```python
knapsack([2, 3, 1], [3, 4, 2], 4)  # → 6  (items 1 and 2 by index)
knapsack([1, 2, 3], [1, 6, 10], 5)  # → 16  (items 1 and 2)
```
""".strip(),
        "easy",
        "def knapsack(weights, values, W):\n    # Your recursive brute force here\n    pass\n",
        """
def knapsack(weights, values, W):
    def helper(i, remaining):
        if i == len(weights) or remaining == 0:
            return 0
        if weights[i] > remaining:
            return helper(i + 1, remaining)
        take = values[i] + helper(i + 1, remaining - weights[i])
        skip = helper(i + 1, remaining)
        return max(take, skip)
    return helper(0, W)
""".strip(),
        [
            {"input": [[2, 3, 1], [3, 4, 2], 4], "expected": 6},
            {"input": [[1, 2, 3], [1, 6, 10], 5], "expected": 16},
            {"input": [[5], [10], 3], "expected": 0},
            {"input": [[1, 1, 1], [1, 2, 3], 2], "expected": 5},
        ],
        ["recursion", "brute_force", "knapsack"],
        1,
    )

    add_problem(st1,
        "knapsack-brute-count",
        "Count Optimal Solutions",
        """
Given the same knapsack setup, return **how many distinct subsets of items achieve the maximum value** without exceeding W.

```python
count_optimal([2, 3, 1], [3, 4, 2], 4)  # → 1  (only {item0, item2} gives value 6? check)
count_optimal([1, 1, 1], [2, 2, 2], 2)  # → 3  (any 2 of 3 items)
```
""".strip(),
        "medium",
        "def count_optimal(weights, values, W):\n    pass\n",
        """
def count_optimal(weights, values, W):
    def helper(i, remaining):
        if i == len(weights) or remaining == 0:
            return 0, (1 if i == len(weights) or remaining == 0 else 0)
        best_val, best_count = 0, 0
        # Skip
        sv, sc = helper(i + 1, remaining)
        if sv > best_val:
            best_val, best_count = sv, sc
        elif sv == best_val:
            best_count += sc
        # Take
        if weights[i] <= remaining:
            tv, tc = helper(i + 1, remaining - weights[i])
            tv += values[i]
            if tv > best_val:
                best_val, best_count = tv, tc
            elif tv == best_val:
                best_count += tc
        return best_val, best_count

    def solve(i, remaining):
        if i == len(weights):
            return 0, 1
        skip_v, skip_c = solve(i + 1, remaining)
        if weights[i] > remaining:
            return skip_v, skip_c
        take_v, take_c = solve(i + 1, remaining - weights[i])
        take_v += values[i]
        if take_v > skip_v:
            return take_v, take_c
        elif take_v < skip_v:
            return skip_v, skip_c
        else:
            return skip_v, skip_c + take_c

    _, count = solve(0, W)
    return count
""".strip(),
        [
            {"input": [[1, 1, 1], [2, 2, 2], 2], "expected": 3},
            {"input": [[2, 3, 1], [3, 4, 2], 4], "expected": 1},
            {"input": [[1], [5], 1], "expected": 1},
        ],
        ["recursion", "counting", "knapsack"],
        2,
    )

    add_problem(st1,
        "knapsack-with-quantities",
        "Knapsack with Item Quantities",
        """
Each item now has a **quantity** `q[i]` — you can take 0 to q[i] copies of it.

Return the maximum value.

```python
knapsack_qty([2, 3], [3, 4], [1, 2], 6)
# Can take item0 once and item1 twice: 2+6=8, weight=2+6=8 > 6
# Best: item0 once + item1 once = 7, weight 5
# → 7
```
""".strip(),
        "hard",
        "def knapsack_qty(weights, values, quantities, W):\n    pass\n",
        """
def knapsack_qty(weights, values, quantities, W):
    def helper(i, remaining):
        if i == len(weights) or remaining == 0:
            return 0
        best = helper(i + 1, remaining)
        for k in range(1, quantities[i] + 1):
            if k * weights[i] > remaining:
                break
            val = k * values[i] + helper(i + 1, remaining - k * weights[i])
            best = max(best, val)
        return best
    return helper(0, W)
""".strip(),
        [
            {"input": [[2, 3], [3, 4], [1, 2], 6], "expected": 7},
            {"input": [[1, 2], [2, 3], [3, 2], 4], "expected": 8},
            {"input": [[5], [10], [2], 3], "expected": 0},
        ],
        ["recursion", "bounded_knapsack"],
        3,
    )

    # ══════════════════════════════════════════════════════════════════════════
    # SUBTOPIC 2 — Overlapping Subproblems
    # ══════════════════════════════════════════════════════════════════════════
    st2 = add_subtopic(
        "Overlapping Subproblems",
        "overlapping-subproblems",
        "Discover why DP is needed — don't just be told to use it.",
        2,
    )

    c2_1 = add_card(st2, "The Repeated Work", """
## The Repeated Work

Look at the decision tree again — but this time notice the duplicates.

```
State = (item_index, remaining_capacity)

helper(0, 4)
├── take item0 → helper(1, 2)
│   ├── take item1 → OVER
│   └── skip item1 → helper(2, 2)  ← appears here
└── skip item0 → helper(1, 4)
    ├── take item1 → helper(2, 1)
    └── skip item1 → helper(2, 4)
        ... eventually calls helper(2, 2) again ←
```

`helper(2, 2)` is computed at least twice.
With n=20 items, the same subproblem can be computed **thousands of times**.

**Observation:** The entire state is captured by just two numbers: `(i, remaining_capacity)`.
There are at most `n × W` distinct states.
That means at most `n × W` unique computations — not 2ⁿ.
""".strip(), 1)

    add_exercise(c2_1, "recognition",
        "Which property of the decision tree tells us memoisation will help?",
        options=[
            "The tree is balanced — left and right subtrees have the same height",
            "The same (i, remaining_capacity) pair appears in multiple branches",
            "The values array contains duplicate numbers",
            "The capacity W is always a power of 2",
        ],
        correct_index=1,
        explanation="Memoisation helps when the same subproblem recurs. The key observation is that two different paths through the tree can reach the same (item_index, remaining_capacity) state — and will do identical work from there. Caching that result avoids the repeated computation.",
        order_index=0,
    )

    c2_2 = add_card(st2, "Adding the Memo Table", """
## Adding the Memo Table

The fix is one dictionary. Before computing a state, check if we've seen it.

```python
def knapsack_memo(weights, values, W):
    memo = {}

    def helper(i, remaining):
        if i == len(weights) or remaining == 0:
            return 0
        if (i, remaining) in memo:        # ← check first
            return memo[(i, remaining)]

        if weights[i] > remaining:
            result = helper(i + 1, remaining)
        else:
            take = values[i] + helper(i + 1, remaining - weights[i])
            skip = helper(i + 1, remaining)
            result = max(take, skip)

        memo[(i, remaining)] = result     # ← store before returning
        return result

    return helper(0, W)
```

**Complexity flip:**
- Before memo: O(2ⁿ) time
- After memo: O(n × W) time, O(n × W) space

For n=20, W=100: 2²⁰ ≈ 1,000,000 vs 20×100 = 2,000. **500× faster.**
""".strip(), 2)

    add_exercise(c2_2, "debugging",
        "This memoised knapsack sometimes returns wrong answers. Find the bug.",
        buggy_code="""def knapsack_memo(weights, values, W):
    memo = {}

    def helper(i, remaining):
        if i == len(weights) or remaining == 0:
            return 0
        if (i, remaining) in memo:
            return memo[(i, remaining)]

        take = values[i] + helper(i + 1, remaining - weights[i])
        skip = helper(i + 1, remaining)
        result = max(take, skip)

        memo[(i, remaining)] = result
        return result

    return helper(0, W)""",
        grading_hints="Bug: the code tries to 'take' the item even when weights[i] > remaining, which passes a negative remaining to the next call. The check 'if weights[i] > remaining' is missing before computing 'take'.",
        explanation="Before computing the 'take' branch, you must check that the item fits: `if weights[i] <= remaining`. Without this guard, you pass a negative capacity to recursive calls, leading to incorrect results (and possibly infinite recursion in some implementations).",
        order_index=0,
    )

    c2_3 = add_card(st2, "Why O(n × W)", """
## Why O(n × W)

The memo table has one entry per unique `(i, remaining_capacity)` pair.

- `i` ranges from 0 to n-1: **n possible values**
- `remaining_capacity` ranges from 0 to W: **W+1 possible values**
- Total unique states: **n × (W+1)** ≈ **O(n × W)**

Each state is computed exactly once (after that, it's a cache hit).
Each computation does O(1) work (two recursive calls that immediately return from cache).

So total time = number of states × work per state = **O(n × W)**.

This is called **pseudo-polynomial** time — it's polynomial in the *value* of W, not its bit-length.
For W = 1,000,000 with n = 100: still just 100 million operations.
""".strip(), 3)

    add_exercise(c2_3, "teach_back",
        "Explain to a beginner: why is O(n × W) called 'pseudo-polynomial' instead of just 'polynomial'?",
        grading_hints="Should mention: polynomial complexity is measured in input size (number of bits). W requires log(W) bits to represent. In terms of bit-length, the algorithm is O(n × 2^log(W)) which is exponential in the bit-length. It's only polynomial in the numeric value of W.",
        explanation="True polynomial complexity is measured in terms of input SIZE (number of bits). W takes log₂(W) bits to represent. If we call b = log₂(W), then W = 2^b, and our O(n×W) algorithm is O(n × 2^b) — exponential in the bit-length of W. It's only 'polynomial' if we measure W by its numeric value, not its representation size — hence 'pseudo-polynomial'.",
        order_index=0,
    )

    # Problems for st2
    add_problem(st2,
        "knapsack-memo-skeleton",
        "Add Memoisation to the Skeleton",
        """
The recursive brute force is given. Add memoisation to make it efficient.

Do **not** change the algorithm — only add a cache.

```python
# Given skeleton:
def knapsack(weights, values, W):
    def helper(i, remaining):
        if i == len(weights) or remaining == 0:
            return 0
        if weights[i] > remaining:
            return helper(i + 1, remaining)
        return max(
            values[i] + helper(i + 1, remaining - weights[i]),
            helper(i + 1, remaining)
        )
    return helper(0, W)
```
""".strip(),
        "easy",
        """def knapsack(weights, values, W):
    def helper(i, remaining):
        if i == len(weights) or remaining == 0:
            return 0
        if weights[i] > remaining:
            return helper(i + 1, remaining)
        return max(
            values[i] + helper(i + 1, remaining - weights[i]),
            helper(i + 1, remaining)
        )
    return helper(0, W)
""",
        """def knapsack(weights, values, W):
    memo = {}
    def helper(i, remaining):
        if i == len(weights) or remaining == 0:
            return 0
        if (i, remaining) in memo:
            return memo[(i, remaining)]
        if weights[i] > remaining:
            result = helper(i + 1, remaining)
        else:
            result = max(
                values[i] + helper(i + 1, remaining - weights[i]),
                helper(i + 1, remaining)
            )
        memo[(i, remaining)] = result
        return result
    return helper(0, W)
""",
        [
            {"input": [[2, 3, 1], [3, 4, 2], 4], "expected": 6},
            {"input": [[1, 2, 3, 4], [1, 6, 10, 16], 7], "expected": 22},
            {"input": [[5, 4, 3], [2, 3, 1], 3], "expected": 1},
            {"input": [list(range(1, 16)), list(range(1, 16)), 30], "expected": 74},
        ],
        ["memoisation", "top_down_dp", "knapsack"],
        1,
    )

    add_problem(st2,
        "knapsack-memo-full",
        "Memoised Knapsack From Scratch",
        """
Implement the memoised (top-down DP) knapsack from scratch — no skeleton provided.

Handle n up to 100, W up to 500.
""".strip(),
        "medium",
        "def knapsack(weights, values, W):\n    pass\n",
        """def knapsack(weights, values, W):
    memo = {}
    def helper(i, remaining):
        if i == len(weights) or remaining == 0:
            return 0
        if (i, remaining) in memo:
            return memo[(i, remaining)]
        if weights[i] > remaining:
            result = helper(i + 1, remaining)
        else:
            result = max(
                values[i] + helper(i + 1, remaining - weights[i]),
                helper(i + 1, remaining)
            )
        memo[(i, remaining)] = result
        return result
    return helper(0, W)
""",
        [
            {"input": [[2, 3, 1], [3, 4, 2], 4], "expected": 6},
            {"input": [[1, 2, 3, 4, 5], [1, 6, 10, 16, 2], 8], "expected": 28},
            {"input": [list(range(1, 21)), list(range(10, 30)), 50], "expected": 279},
        ],
        ["memoisation", "top_down_dp", "knapsack"],
        2,
    )

    add_problem(st2,
        "knapsack-memo-reconstruct",
        "Memoised Knapsack + Item Reconstruction",
        """
Implement memoised knapsack AND return the list of item indices that achieve the maximum value.

If multiple optimal subsets exist, return any one.

```python
result, items = knapsack([2, 3, 1], [3, 4, 2], 4)
# result = 6, items = [0, 2]  (or equivalent)
```
""".strip(),
        "hard",
        "def knapsack(weights, values, W):\n    # Return (max_value, list_of_item_indices)\n    pass\n",
        """def knapsack(weights, values, W):
    memo = {}
    def helper(i, remaining):
        if i == len(weights) or remaining == 0:
            return 0
        if (i, remaining) in memo:
            return memo[(i, remaining)]
        if weights[i] > remaining:
            result = helper(i + 1, remaining)
        else:
            result = max(
                values[i] + helper(i + 1, remaining - weights[i]),
                helper(i + 1, remaining)
            )
        memo[(i, remaining)] = result
        return result

    max_val = helper(0, W)

    # Reconstruct
    chosen = []
    remaining = W
    for i in range(len(weights)):
        if i == len(weights) - 1:
            if weights[i] <= remaining and values[i] + helper(i + 1, remaining - weights[i]) == helper(i, remaining):
                chosen.append(i)
        else:
            skip_val = helper(i + 1, remaining)
            if weights[i] <= remaining:
                take_val = values[i] + helper(i + 1, remaining - weights[i])
                if take_val >= skip_val:
                    chosen.append(i)
                    remaining -= weights[i]
    return max_val, chosen
""",
        [
            {"input": [[2, 3, 1], [3, 4, 2], 4], "expected": [6, [0, 2]]},
        ],
        ["memoisation", "reconstruction", "knapsack"],
        3,
    )

    # ══════════════════════════════════════════════════════════════════════════
    # SUBTOPIC 3 — Building the Table
    # ══════════════════════════════════════════════════════════════════════════
    st3 = add_subtopic(
        "Building the Table",
        "building-the-table",
        "Learn bottom-up DP: fill a 2D table iteratively.",
        3,
    )

    c3_1 = add_card(st3, "Flipping the Direction", """
## Flipping the Direction

Top-down DP computes states *on demand* (recursion + cache).
Bottom-up DP computes *all* states upfront in a systematic order.

**Key idea:** If `dp[i][w]` = best value using items 0..i with capacity w, then:

```
dp[i][w] = max(
    dp[i-1][w],               # skip item i
    values[i] + dp[i-1][w - weights[i]]   # take item i (if it fits)
)
```

We build the table row by row. Each row depends only on the row above.

**Base case:**
- `dp[0][w]` = `values[0]` if `w >= weights[0]` else `0`  (only item 0 available)

**Answer:** `dp[n-1][W]`

Both approaches give identical answers. Bottom-up avoids recursion overhead
and is often preferred in interviews.
""".strip(), 1)

    c3_2 = add_card(st3, "Filling the Table Step by Step", """
## Filling the Table Step by Step

Items: A(w=2,v=3), B(w=3,v=4), C(w=1,v=2) — Capacity W=4

```
       w=0  w=1  w=2  w=3  w=4
item A:  0    0    3    3    3
item B:  0    0    3    4    4     ← max(above, 4 + dp[A][w-3])
item C:  0    2    3    5    6     ← max(above, 2 + dp[B][w-1])
```

Reading row by row:
- Row A: can only use item A. No value until w≥2, then value=3.
- Row B: at w=3, taking B alone = 4 > keeping just A = 3. Take B.
  At w=4, taking B + checking dp[A][1] = 0 → B alone = 4. Same as before.
- Row C: at w=3, take C + dp[B][2] = 2+3 = 5 > skip C and keep 4.
  At w=4, take C + dp[B][3] = 2+4 = 6. New best!

**Answer: dp[C][4] = 6.**
""".strip(), 2)

    add_exercise(c3_2, "recognition",
        "In the DP table, what does dp[i][w] represent?",
        options=[
            "The weight of item i when capacity is w",
            "The maximum value using items 0 through i with capacity exactly w",
            "The maximum value using items 0 through i with capacity at most w",
            "The number of ways to fill exactly w capacity using items 0 through i",
        ],
        correct_index=2,
        explanation="dp[i][w] is the maximum value achievable using the first i+1 items with a bag capacity of AT MOST w (not exactly w). This 'at most' is crucial — the bag doesn't have to be filled completely.",
        order_index=0,
    )

    c3_3 = add_card(st3, "Reading the Traceback", """
## Reading the Traceback

To find *which items* were chosen, walk backwards through the table.

```python
# After filling dp[n][W+1]:
chosen = []
w = W
for i in range(n - 1, -1, -1):
    if dp[i][w] != (dp[i-1][w] if i > 0 else 0):
        # Item i was taken
        chosen.append(i)
        w -= weights[i]
```

**Logic:** At each row i, if `dp[i][w]` equals `dp[i-1][w]`, item i was skipped.
Otherwise, item i was taken — subtract its weight from remaining capacity.

This runs in O(n) after the O(n×W) table fill.

**Note:** For this course, the gate only checks the maximum value — not the traceback.
But understanding reconstruction separates good candidates from great ones.
""".strip(), 3)

    add_exercise(c3_3, "debugging",
        "This traceback is off by one and sometimes includes wrong items. Find the bug.",
        buggy_code="""def traceback(dp, weights, W):
    chosen = []
    w = W
    n = len(weights)
    for i in range(n - 1, -1, -1):
        prev = dp[i - 1][w] if i > 0 else 0
        if dp[i][w] > prev:
            chosen.append(i)
            w -= weights[i]
    return chosen""",
        grading_hints="Bug: the condition 'dp[i][w] > prev' should be 'dp[i][w] != prev'. Using '>' instead of '!=' fails when taking an item doesn't improve value compared to skipping (e.g., item has value 0 or the prev row already had the same value from another path). The correct check is inequality — if they differ, the item was taken.",
        explanation="The condition should be `dp[i][w] != prev` (not `>`). When item i is taken, `dp[i][w]` equals `values[i] + dp[i-1][w - weights[i]]`, which could equal `dp[i-1][w]` in edge cases (e.g., zero-value item). The safe check is: if the value changed from the previous row, the item was taken.",
        order_index=0,
    )

    # Problems for st3
    add_problem(st3,
        "knapsack-2d-recurrence",
        "Fill In the Missing Recurrence",
        """
The table setup is given. Fill in the missing recurrence line to complete the solution.

```python
def knapsack(weights, values, W):
    n = len(weights)
    dp = [[0] * (W + 1) for _ in range(n)]
    for w in range(weights[0], W + 1):
        dp[0][w] = values[0]
    for i in range(1, n):
        for w in range(W + 1):
            dp[i][w] = dp[i-1][w]  # skip item i
            if weights[i] <= w:
                dp[i][w] = ___  # YOUR CODE HERE
    return dp[n-1][W]
```

Replace the `___` with the correct expression.
""".strip(),
        "easy",
        """def knapsack(weights, values, W):
    n = len(weights)
    dp = [[0] * (W + 1) for _ in range(n)]
    for w in range(weights[0], W + 1):
        dp[0][w] = values[0]
    for i in range(1, n):
        for w in range(W + 1):
            dp[i][w] = dp[i-1][w]
            if weights[i] <= w:
                dp[i][w] = ___  # replace this
    return dp[n-1][W]
""",
        """def knapsack(weights, values, W):
    n = len(weights)
    dp = [[0] * (W + 1) for _ in range(n)]
    for w in range(weights[0], W + 1):
        dp[0][w] = values[0]
    for i in range(1, n):
        for w in range(W + 1):
            dp[i][w] = dp[i-1][w]
            if weights[i] <= w:
                dp[i][w] = max(dp[i-1][w], values[i] + dp[i-1][w - weights[i]])
    return dp[n-1][W]
""",
        [
            {"input": [[2, 3, 1], [3, 4, 2], 4], "expected": 6},
            {"input": [[1, 2, 3], [1, 6, 10], 5], "expected": 16},
            {"input": [[5, 4, 3], [2, 3, 1], 3], "expected": 1},
        ],
        ["bottom_up_dp", "tabulation", "knapsack"],
        1,
    )

    add_problem(st3,
        "knapsack-2d-full",
        "Full 2D DP Knapsack",
        """
Implement the bottom-up 2D DP knapsack from scratch.

No recursion allowed. Use a 2D table.

Handle n up to 200, W up to 1000.
""".strip(),
        "medium",
        "def knapsack(weights, values, W):\n    pass\n",
        """def knapsack(weights, values, W):
    n = len(weights)
    if n == 0:
        return 0
    dp = [[0] * (W + 1) for _ in range(n)]
    for w in range(weights[0], W + 1):
        dp[0][w] = values[0]
    for i in range(1, n):
        for w in range(W + 1):
            dp[i][w] = dp[i-1][w]
            if weights[i] <= w:
                dp[i][w] = max(dp[i-1][w], values[i] + dp[i-1][w - weights[i]])
    return dp[n-1][W]
""",
        [
            {"input": [[2, 3, 1], [3, 4, 2], 4], "expected": 6},
            {"input": [list(range(1, 21)), list(range(10, 30)), 50], "expected": 279},
            {"input": [[1] * 50, list(range(1, 51)), 25], "expected": 1175},
        ],
        ["bottom_up_dp", "tabulation", "knapsack"],
        2,
    )

    add_problem(st3,
        "knapsack-2d-print-items",
        "2D DP + Print Chosen Items",
        """
Implement bottom-up 2D DP knapsack. Return a tuple `(max_value, chosen_items)` where `chosen_items` is the sorted list of indices of items selected.

```python
knapsack([2, 3, 1], [3, 4, 2], 4)  # → (6, [0, 2])
```
""".strip(),
        "hard",
        "def knapsack(weights, values, W):\n    # Return (max_value, sorted list of item indices)\n    pass\n",
        """def knapsack(weights, values, W):
    n = len(weights)
    if n == 0:
        return 0, []
    dp = [[0] * (W + 1) for _ in range(n)]
    for w in range(weights[0], W + 1):
        dp[0][w] = values[0]
    for i in range(1, n):
        for w in range(W + 1):
            dp[i][w] = dp[i-1][w]
            if weights[i] <= w:
                dp[i][w] = max(dp[i-1][w], values[i] + dp[i-1][w - weights[i]])
    chosen = []
    w = W
    for i in range(n - 1, -1, -1):
        prev = dp[i-1][w] if i > 0 else 0
        if dp[i][w] != prev:
            chosen.append(i)
            w -= weights[i]
    return dp[n-1][W], sorted(chosen)
""",
        [
            {"input": [[2, 3, 1], [3, 4, 2], 4], "expected": [6, [0, 2]]},
            {"input": [[1, 2, 3], [1, 6, 10], 5], "expected": [16, [1, 2]]},
        ],
        ["bottom_up_dp", "reconstruction", "knapsack"],
        3,
    )

    # ══════════════════════════════════════════════════════════════════════════
    # SUBTOPIC 4 — One Row is Enough
    # ══════════════════════════════════════════════════════════════════════════
    st4 = add_subtopic(
        "One Row is Enough",
        "one-row-enough",
        "Cut memory from O(n·W) to O(W) — and understand exactly why.",
        4,
    )

    c4_1 = add_card(st4, "What Do You Actually Need?", """
## What Do You Actually Need?

When filling row `i` of the DP table:

```
dp[i][w] = max(dp[i-1][w],  values[i] + dp[i-1][w - weights[i]])
```

Row `i` depends **only on row `i-1`** — not on any earlier row.

Once row `i` is filled, row `i-1` is never needed again.

So we only ever need **two rows** in memory at a time: current and previous.

We can go further: with a clever iteration order, we can do it in **one row**.
""".strip(), 1)

    c4_2 = add_card(st4, "The 1D Array Trick", """
## The 1D Array Trick

Replace the 2D table with a single array `dp[0..W]`.

```python
dp = [0] * (W + 1)

for i in range(n):
    for w in range(W, weights[i] - 1, -1):  # ← RIGHT TO LEFT
        dp[w] = max(dp[w], values[i] + dp[w - weights[i]])
```

**Why right-to-left?**

When computing `dp[w]`, we use `dp[w - weights[i]]`.
`w - weights[i] < w`, so it's to the *left*.

If we iterated left-to-right, by the time we compute `dp[w]`,
`dp[w - weights[i]]` would already reflect item `i` being available —
meaning we could "take" item i multiple times (unbounded knapsack).

Right-to-left guarantees `dp[w - weights[i]]` still reflects the state
**before** item `i` was considered — enforcing the 0/1 constraint.
""".strip(), 2)

    add_exercise(c4_2, "debugging",
        "This space-optimised knapsack produces wrong results. Find the single-line bug.",
        buggy_code="""def knapsack(weights, values, W):
    dp = [0] * (W + 1)
    for i in range(len(weights)):
        for w in range(weights[i], W + 1):  # left to right
            dp[w] = max(dp[w], values[i] + dp[w - weights[i]])
    return dp[W]""",
        grading_hints="Bug: the inner loop iterates left-to-right (range(weights[i], W+1)), which allows item i to be taken multiple times (unbounded knapsack). Should be right-to-left: range(W, weights[i]-1, -1). Left-to-right means when we compute dp[w], dp[w - weights[i]] has already been updated for item i in this same iteration.",
        explanation="The loop `range(weights[i], W+1)` goes left to right. When computing dp[w], dp[w - weights[i]] was already updated earlier in this same item-i pass — meaning item i could contribute to dp[w - weights[i]] AND dp[w], effectively taking it twice. Fix: `range(W, weights[i]-1, -1)` — right to left — so dp[w - weights[i]] always reflects the state before item i.",
        order_index=0,
    )

    c4_3 = add_card(st4, "Space Comparison", """
## Space Comparison

| Approach     | Time      | Space    |
|--------------|-----------|----------|
| Brute force  | O(2ⁿ)    | O(n)     |
| Top-down DP  | O(n·W)   | O(n·W)   |
| Bottom-up 2D | O(n·W)   | O(n·W)   |
| Bottom-up 1D | O(n·W)   | **O(W)** |

For n=1000, W=10000: 2D uses ~80MB, 1D uses ~80KB.

**When does it matter?**
- Competitive programming: memory limits are tight
- Embedded systems: RAM is scarce
- Very large W: 2D table may exceed memory budget

**Trade-off:** 1D loses the ability to reconstruct which items were chosen
(you can't traceback without the full 2D table — unless you save select rows).
""".strip(), 3)

    add_exercise(c4_3, "variation",
        "You need to both minimise memory AND reconstruct which items were chosen. You can't keep the full 2D table. What strategy could work?",
        grading_hints="Looking for: save every k-th row (checkpoint rows) to reconstruct in segments. Or use Hirschberg-style divide-and-conquer: solve left half, right half, find the split point at the middle row, recurse. The key insight is you can't have both O(W) space AND reconstruction without some algorithmic trick.",
        explanation="One approach: save checkpoint rows every √n rows. Reconstruction replays each segment using two saved rows. Space: O(√n × W). Another: divide-and-conquer (like Hirschberg's algorithm for LCS) — solve the problem on the first n/2 items, find the optimal split capacity, then recurse on each half. This achieves O(W) space with full reconstruction in O(n·W log n) time.",
        order_index=0,
    )

    # Problems for st4
    add_problem(st4,
        "knapsack-1d-easy",
        "Convert 2D to 1D",
        """
A working 2D DP solution is given. Convert it to use only a 1D array.

```python
# Given 2D solution:
def knapsack_2d(weights, values, W):
    n = len(weights)
    dp = [[0] * (W + 1) for _ in range(n)]
    for w in range(weights[0], W + 1):
        dp[0][w] = values[0]
    for i in range(1, n):
        for w in range(W + 1):
            dp[i][w] = dp[i-1][w]
            if weights[i] <= w:
                dp[i][w] = max(dp[i-1][w], values[i] + dp[i-1][w - weights[i]])
    return dp[n-1][W]
```

Write `knapsack(weights, values, W)` using a single 1D array.
""".strip(),
        "easy",
        "def knapsack(weights, values, W):\n    pass\n",
        """def knapsack(weights, values, W):
    dp = [0] * (W + 1)
    for i in range(len(weights)):
        for w in range(W, weights[i] - 1, -1):
            dp[w] = max(dp[w], values[i] + dp[w - weights[i]])
    return dp[W]
""",
        [
            {"input": [[2, 3, 1], [3, 4, 2], 4], "expected": 6},
            {"input": [[1, 2, 3], [1, 6, 10], 5], "expected": 16},
            {"input": [[5, 4, 3], [2, 3, 1], 3], "expected": 1},
        ],
        ["space_optimised_dp", "1d_dp", "knapsack"],
        1,
    )

    add_problem(st4,
        "knapsack-1d-scratch",
        "1D Knapsack From Scratch",
        """
Implement the space-optimised 1D knapsack from scratch.

No 2D array allowed. O(W) memory only. Handle n up to 500, W up to 2000.
""".strip(),
        "medium",
        "def knapsack(weights, values, W):\n    pass\n",
        """def knapsack(weights, values, W):
    dp = [0] * (W + 1)
    for i in range(len(weights)):
        for w in range(W, weights[i] - 1, -1):
            dp[w] = max(dp[w], values[i] + dp[w - weights[i]])
    return dp[W]
""",
        [
            {"input": [[2, 3, 1], [3, 4, 2], 4], "expected": 6},
            {"input": [list(range(1, 21)), list(range(10, 30)), 50], "expected": 279},
            {"input": [[1] * 100, list(range(1, 101)), 50], "expected": 3775},
        ],
        ["space_optimised_dp", "1d_dp", "knapsack"],
        2,
    )

    add_problem(st4,
        "knapsack-duplicate-weights",
        "1D Knapsack with Duplicate Weights",
        """
Some items share the same weight. Confirm your 1D solution handles this correctly.

Also: what is the minimum number of distinct capacities w where dp[w] changes after processing all items?

Return `(max_value, changed_count)` where `changed_count` is how many entries in dp changed from the initial all-zeros.
""".strip(),
        "hard",
        "def knapsack(weights, values, W):\n    # Return (max_value, number of dp entries that changed)\n    pass\n",
        """def knapsack(weights, values, W):
    dp = [0] * (W + 1)
    for i in range(len(weights)):
        for w in range(W, weights[i] - 1, -1):
            dp[w] = max(dp[w], values[i] + dp[w - weights[i]])
    changed = sum(1 for v in dp if v > 0)
    return dp[W], changed
""",
        [
            {"input": [[2, 2, 2], [3, 3, 3], 4], "expected": [6, 1]},
            {"input": [[1, 1, 1], [1, 2, 3], 3], "expected": [6, 3]},
            {"input": [[3, 3], [5, 5], 5], "expected": [5, 1]},
        ],
        ["space_optimised_dp", "1d_dp", "knapsack"],
        3,
    )

    # ══════════════════════════════════════════════════════════════════════════
    # SUBTOPIC 5 — Variations
    # ══════════════════════════════════════════════════════════════════════════
    st5 = add_subtopic(
        "Variations",
        "knapsack-variations",
        "Recognise knapsack disguised as other problems.",
        5,
    )

    c5_1 = add_card(st5, "Unbounded Knapsack", """
## Unbounded Knapsack

What if each item has **unlimited copies**?

The only change: when we take item i, we stay at item i (don't advance).

**1D DP — iterate LEFT to RIGHT:**

```python
dp = [0] * (W + 1)
for i in range(n):
    for w in range(weights[i], W + 1):  # ← left to right now!
        dp[w] = max(dp[w], values[i] + dp[w - weights[i]])
return dp[W]
```

This is the opposite of 0/1 knapsack.
- 0/1: right-to-left (can't reuse item)
- Unbounded: left-to-right (can reuse item)

**One direction change. That's it.**

Classic unbounded knapsack problems in disguise:
- Coin change (minimise coins to make amount)
- Rod cutting (cut rod into pieces to maximise value)
- Integer break (split integer to maximise product)
""".strip(), 1)

    add_exercise(c5_1, "recognition",
        "Which of these problems maps to unbounded knapsack?",
        options=[
            "Partition a set into two equal-sum subsets",
            "Select one item from each of k categories to maximise value within budget",
            "Cut a rod of length n into pieces to maximise total value, pieces can be reused",
            "Assign n tasks to n workers one-to-one to minimise total cost",
        ],
        correct_index=2,
        explanation="Rod cutting: you can cut the rod into pieces of any length, and each length has a value. Pieces can repeat — a rod of length 4 could be cut into four length-1 pieces. This is exactly unbounded knapsack: item weight = piece length, item value = piece value, unlimited copies. The other options are assignment (B, D) and subset sum (A).",
        order_index=0,
    )

    c5_2 = add_card(st5, "Subset Sum", """
## Subset Sum

**Problem:** Given a set of integers, can any subset sum to exactly T?

This is 0/1 knapsack in disguise:
- Capacity W = T
- Each item's weight = value = its number
- Goal: can we reach exactly value T? (feasibility, not maximisation)

```python
def subset_sum(nums, T):
    dp = [False] * (T + 1)
    dp[0] = True  # empty subset sums to 0

    for num in nums:
        for w in range(T, num - 1, -1):  # right to left (0/1)
            dp[w] = dp[w] or dp[w - num]

    return dp[T]
```

**Recognising it:** Any problem asking "can we pick a subset to hit a target exactly?" is subset sum → 0/1 knapsack with boolean DP.

**Partition equal subset:** Split array into two equal-sum halves?
Check if any subset sums to `total // 2`.
""".strip(), 2)

    add_exercise(c5_2, "recognition",
        "Which of these is NOT a knapsack variant?",
        options=[
            "Given coins of fixed denominations, can you make exact change for amount X?",
            "Given n jobs each with deadline and profit, maximise profit without missing deadlines",
            "Given a string, find the longest palindromic subsequence",
            "Given items with weights and values, pick a subset worth at least V within weight W",
        ],
        correct_index=2,
        explanation="Longest palindromic subsequence is a string DP problem (like LCS of the string and its reverse) — it has no notion of capacity constraint or binary item selection. All others are knapsack variants: coin change (unbounded), job scheduling (deadline = capacity), and the last is literally knapsack.",
        order_index=0,
    )

    c5_3 = add_card(st5, "Pattern Recognition Checklist", """
## Pattern Recognition Checklist

When you see a new problem, run through these 5 questions:

| # | Question | Knapsack signal |
|---|----------|-----------------|
| 1 | Is there a constraint (weight, budget, time)? | ✓ |
| 2 | Is each item a binary choice (take or skip)? | 0/1 knapsack |
| 3 | Can items repeat? | Unbounded knapsack |
| 4 | Is the goal feasibility (yes/no) rather than maximisation? | Subset sum variant |
| 5 | Are there multiple constraint dimensions? | Multi-dimensional knapsack |

**Quick table:**

| Problem | Variant |
|---------|---------|
| Classic items, one each | 0/1 knapsack |
| Coin change, rod cut | Unbounded knapsack |
| Subset sum, partition | Boolean 0/1 knapsack |
| Fractional knapsack | Greedy (value/weight ratio) |
| Items with quantities | Bounded knapsack |
""".strip(), 3)

    add_exercise(c5_3, "teach_back",
        "Explain to someone who just learned 0/1 knapsack: how do you recognise a NEW problem as a knapsack problem, and what is the first question you should ask?",
        grading_hints="Should mention: look for a capacity/budget constraint, binary or bounded choices per item, and an optimisation or feasibility goal. First question: 'Is there a limit I can't exceed?' If yes, knapsack family. Second: 'Can I reuse items?' to distinguish 0/1 vs unbounded.",
        explanation="The key pattern: some resource is limited (weight, budget, time), you make a choice about each item (take/skip, possibly with quantity), and you want to optimise or test feasibility. First question to ask: 'Is there a constraint I need to satisfy?' If yes, you're probably in DP territory. Then: 'Are choices binary or can items repeat?' to narrow to 0/1 vs unbounded.",
        order_index=0,
    )

    # Problems for st5
    add_problem(st5,
        "unbounded-knapsack",
        "Unbounded Knapsack",
        """
Implement unbounded knapsack — each item can be taken any number of times.

```python
knapsack([2, 3, 4], [3, 4, 5], 5)
# Take item0 twice: weight=4, value=6 — doesn't use all capacity
# Take item0 + item1: weight=5, value=7 ✓
# → 7
```
""".strip(),
        "easy",
        "def knapsack(weights, values, W):\n    pass\n",
        """def knapsack(weights, values, W):
    dp = [0] * (W + 1)
    for i in range(len(weights)):
        for w in range(weights[i], W + 1):
            dp[w] = max(dp[w], values[i] + dp[w - weights[i]])
    return dp[W]
""",
        [
            {"input": [[2, 3, 4], [3, 4, 5], 5], "expected": 7},
            {"input": [[1, 3, 4, 5], [1, 4, 5, 7], 7], "expected": 9},
            {"input": [[2], [3], 5], "expected": 6},
        ],
        ["unbounded_knapsack", "dp"],
        1,
    )

    add_problem(st5,
        "subset-sum",
        "Subset Sum",
        """
Given a list of positive integers and a target T, return `True` if any subset sums to exactly T.

```python
subset_sum([3, 1, 5, 9, 12], 13)  # True  (1 + 12 or 4+9?)
subset_sum([1, 2, 5], 4)          # True  (1+2+... no, 1+2=3, 2+2 not available)
# Check: 1+2=3, 1+5=6, 2+5=7, 1+2+5=8, 5=5, 2=2, 1=1 — no 4. → False
```
""".strip(),
        "medium",
        "def subset_sum(nums, T):\n    pass\n",
        """def subset_sum(nums, T):
    dp = [False] * (T + 1)
    dp[0] = True
    for num in nums:
        for w in range(T, num - 1, -1):
            dp[w] = dp[w] or dp[w - num]
    return dp[T]
""",
        [
            {"input": [[3, 1, 5, 9, 12], 13], "expected": True},
            {"input": [[1, 2, 5], 4], "expected": False},
            {"input": [[1, 5, 11, 5], 11], "expected": True},
            {"input": [[1, 2, 3, 7], 6], "expected": True},
        ],
        ["subset_sum", "boolean_dp", "knapsack"],
        2,
    )

    add_problem(st5,
        "partition-equal-subset",
        "Partition Equal Subset Sum",
        """
Given a list of positive integers, determine if it can be partitioned into two subsets with equal sum.

```python
can_partition([1, 5, 11, 5])  # True  ([1,5,5] and [11])
can_partition([1, 2, 3, 5])   # False
```
""".strip(),
        "hard",
        "def can_partition(nums):\n    pass\n",
        """def can_partition(nums):
    total = sum(nums)
    if total % 2 != 0:
        return False
    target = total // 2
    dp = [False] * (target + 1)
    dp[0] = True
    for num in nums:
        for w in range(target, num - 1, -1):
            dp[w] = dp[w] or dp[w - num]
    return dp[target]
""",
        [
            {"input": [[1, 5, 11, 5]], "expected": True},
            {"input": [[1, 2, 3, 5]], "expected": False},
            {"input": [[1, 1]], "expected": True},
            {"input": [[3, 3, 3, 4, 5]], "expected": True},
        ],
        ["subset_sum", "partition", "boolean_dp", "knapsack"],
        3,
    )

    db.commit()
    print("✓ Knapsack course seeded successfully.")
    print(f"  Topic: {topic.slug} (id={topic.id})")
    print(f"  Subtopics: {db.query(models.SubTopic).filter_by(topic_id=topic.id).count()}")
    print(f"  PlayCards: {sum(len(st.play_cards) for st in topic.subtopics)}")
    print(f"  Exercises: {db.query(models.CheckpointExercise).count()}")
    print(f"  Problems:  {db.query(models.Problem).filter_by(topic='knapsack').count()}")


if __name__ == "__main__":
    try:
        seed()
    except Exception as e:
        db.rollback()
        print(f"✗ Error: {e}")
        import traceback; traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()
