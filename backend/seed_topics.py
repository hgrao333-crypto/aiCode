"""
Seeds the full algorithm curriculum:
  Topics → SubTopics → PlayCards + YoutubeVideos
  Also links existing Problems to their SubTopics.
"""
from database import SessionLocal, engine, Base
import models

Base.metadata.create_all(bind=engine)

# ─── Topic definitions ────────────────────────────────────────────────────────
# level = column in flowchart, position_in_level = row within that column

TOPICS = [
    {
        "slug": "arrays-hashing",
        "title": "Arrays & Hashing",
        "description": "The foundation of DSA. Learn to use hash maps for O(1) lookups and master array manipulation patterns.",
        "icon": "🗂️",
        "color": "violet",
        "level": 0,
        "position_in_level": 0,
        "prerequisites": [],
    },
    {
        "slug": "two-pointers",
        "title": "Two Pointers",
        "description": "Eliminate the inner loop by maintaining two indices that move toward each other or in the same direction.",
        "icon": "👉",
        "color": "blue",
        "level": 1,
        "position_in_level": 0,
        "prerequisites": ["arrays-hashing"],
    },
    {
        "slug": "stack",
        "title": "Stack",
        "description": "Master LIFO order and the monotonic stack pattern for problems involving nearest greater/smaller elements.",
        "icon": "📚",
        "color": "orange",
        "level": 1,
        "position_in_level": 1,
        "prerequisites": ["arrays-hashing"],
    },
    {
        "slug": "binary-search",
        "title": "Binary Search",
        "description": "Halve the search space every iteration. Apply to sorted arrays, rotated arrays, and abstract search spaces.",
        "icon": "🔍",
        "color": "indigo",
        "level": 1,
        "position_in_level": 2,
        "prerequisites": ["arrays-hashing"],
    },
    {
        "slug": "linked-list",
        "title": "Linked List",
        "description": "Pointer manipulation, fast & slow pointers, and in-place reversal — without extra memory.",
        "icon": "🔗",
        "color": "teal",
        "level": 1,
        "position_in_level": 3,
        "prerequisites": ["arrays-hashing"],
    },
    {
        "slug": "sliding-window",
        "title": "Sliding Window",
        "description": "Maintain a window of elements and shrink or expand it to find optimal subarrays/substrings.",
        "icon": "🪟",
        "color": "cyan",
        "level": 2,
        "position_in_level": 0,
        "prerequisites": ["two-pointers"],
    },
    {
        "slug": "trees",
        "title": "Trees",
        "description": "DFS, BFS, and BST properties. The building block for heaps, tries, and graphs.",
        "icon": "🌳",
        "color": "green",
        "level": 2,
        "position_in_level": 1,
        "prerequisites": ["linked-list", "stack"],
    },
    {
        "slug": "dynamic-programming-1d",
        "title": "1D Dynamic Programming",
        "description": "Break hard problems into overlapping subproblems. Master memoization and tabulation.",
        "icon": "📊",
        "color": "pink",
        "level": 2,
        "position_in_level": 2,
        "prerequisites": ["arrays-hashing"],
    },
    {
        "slug": "tries",
        "title": "Tries",
        "description": "Prefix trees for fast string lookups and autocomplete. Built on tree node pointers.",
        "icon": "🌿",
        "color": "emerald",
        "level": 3,
        "position_in_level": 0,
        "prerequisites": ["trees"],
    },
    {
        "slug": "heap",
        "title": "Heap / Priority Queue",
        "description": "Always-sorted structure for top-K problems and streaming median. O(log n) insert and extract-min.",
        "icon": "⛰️",
        "color": "amber",
        "level": 3,
        "position_in_level": 1,
        "prerequisites": ["trees"],
    },
    {
        "slug": "backtracking",
        "title": "Backtracking",
        "description": "Explore all possibilities by building candidates and pruning dead ends. DFS with undo.",
        "icon": "🔄",
        "color": "rose",
        "level": 3,
        "position_in_level": 2,
        "prerequisites": ["trees"],
    },
    {
        "slug": "graphs",
        "title": "Graphs",
        "description": "BFS/DFS on adjacency lists, cycle detection, topological sort, and union-find.",
        "icon": "🕸️",
        "color": "slate",
        "level": 3,
        "position_in_level": 3,
        "prerequisites": ["trees"],
    },
    {
        "slug": "dynamic-programming-2d",
        "title": "2D Dynamic Programming",
        "description": "Grid and string DP — LCS, edit distance, knapsack. Build the 2D table bottom-up.",
        "icon": "🔢",
        "color": "fuchsia",
        "level": 3,
        "position_in_level": 4,
        "prerequisites": ["dynamic-programming-1d"],
    },
]

# ─── SubTopics + PlayCards ─────────────────────────────────────────────────────

SUBTOPICS = {
    # ── Arrays & Hashing ──────────────────────────────────────────────────────
    "arrays-hashing": [
        {
            "slug": "hash-map-basics",
            "title": "Hash Maps for O(1) Lookup",
            "description": "Why hash maps eliminate inner loops",
            "order_index": 1,
            "cards": [
                {
                    "title": "The Problem with Nested Loops",
                    "content": """## Why O(n²) hurts

If you check every pair of elements to find a match, you write a nested loop:

```python
for i in range(len(nums)):
    for j in range(i+1, len(nums)):
        if nums[i] + nums[j] == target:
            return [i, j]
```

For 10,000 elements that's **100 million comparisons**.

The pattern to break out of this: *store what you've seen so you can look it up in O(1).*""",
                    "order_index": 1,
                },
                {
                    "title": "Hash Map = Instant Lookup",
                    "content": """## The core idea

A hash map (`dict` in Python) stores key → value pairs. **Any key lookup is O(1)** — constant time regardless of how many items are in the map.

```python
seen = {}
seen[5] = 0       # store: value 5 was at index 0
5 in seen         # True  — O(1)
seen[5]           # 0     — O(1)
```

**Trade-off:** You use O(n) extra memory to gain O(n) time. Usually a great deal.""",
                    "order_index": 2,
                },
                {
                    "title": "Two Sum: the Classic Example",
                    "content": """## Turning O(n²) into O(n)

For each number `x`, you need to know if `target - x` exists in the array.

```python
def two_sum(nums, target):
    seen = {}  # value → index
    for i, x in enumerate(nums):
        complement = target - x
        if complement in seen:
            return [seen[complement], i]
        seen[x] = i
```

One pass. For each element, check the map (O(1)), then insert (O(1)).
Total: **O(n)** time, **O(n)** space.""",
                    "order_index": 3,
                },
            ],
        },
        {
            "slug": "frequency-counting",
            "title": "Frequency Counting",
            "description": "Counting occurrences with hash maps",
            "order_index": 2,
            "cards": [
                {
                    "title": "Counting with a Dict",
                    "content": """## When order doesn't matter, count frequencies

Many problems reduce to: *do two arrays have the same character distribution?*

```python
from collections import Counter

s = "anagram"
t = "nagaram"

Counter(s) == Counter(t)  # True
```

`Counter` is a dict subclass. Under the hood:
```python
freq = {}
for ch in s:
    freq[ch] = freq.get(ch, 0) + 1
```

**Pattern:** Group by some property, count how many fall in each group.""",
                    "order_index": 1,
                },
                {
                    "title": "The Group-By Pattern",
                    "content": """## Grouping instead of sorting

To group anagrams together, you could sort each word — same letters sort the same way:

```python
def group_anagrams(strs):
    groups = {}
    for word in strs:
        key = tuple(sorted(word))   # "eat" → ('a','e','t')
        groups.setdefault(key, []).append(word)
    return list(groups.values())
```

The key insight: **the hash map key doesn't have to be the value itself** — it can be any canonical form that groups equivalent items.""",
                    "order_index": 2,
                },
            ],
        },
    ],

    # ── Binary Search ─────────────────────────────────────────────────────────
    "binary-search": [
        {
            "slug": "the-halving-idea",
            "title": "The Halving Idea",
            "description": "Why cutting the search space in half gives O(log n)",
            "order_index": 1,
            "cards": [
                {
                    "title": "What is Binary Search?",
                    "content": """## The core idea

Binary search finds a target in a **sorted** array by repeatedly cutting the search space in half.

Instead of checking every element one by one (O(n)), you check the **middle element** and immediately eliminate half the array.

- If `nums[mid] == target` → found it ✓
- If `nums[mid] < target` → target must be in the **right** half
- If `nums[mid] > target` → target must be in the **left** half

Each step eliminates half the remaining elements → **O(log n)** comparisons.""",
                    "order_index": 1,
                },
                {
                    "title": "The Search Window",
                    "content": """## Tracking the active search space

You track two pointers that define the current window:

```python
left, right = 0, len(nums) - 1

while left <= right:
    mid = (left + right) // 2

    if nums[mid] == target:
        return mid
    elif nums[mid] < target:
        left = mid + 1   # eliminate left half
    else:
        right = mid - 1  # eliminate right half

return -1  # not found
```

`left` and `right` always mark the **boundaries of where the target could still be**.""",
                    "order_index": 2,
                },
                {
                    "title": "Why O(log n)?",
                    "content": """## The math behind it

Each iteration, the search space halves:

| Iteration | Elements remaining |
|---|---|
| Start | n |
| After 1 | n/2 |
| After 2 | n/4 |
| After k | n/2ᵏ |

We stop when 1 element remains: n/2ᵏ = 1 → **k = log₂(n)**

For 1 billion elements: only **30 comparisons** needed. That's the power of halving.""",
                    "order_index": 3,
                },
            ],
        },
        {
            "slug": "loop-invariant",
            "title": "Loop Invariants",
            "description": "What left and right guarantee throughout every iteration",
            "order_index": 2,
            "cards": [
                {
                    "title": "What's a Loop Invariant?",
                    "content": """## A property that never breaks

A loop invariant is something that stays **always true** — before the loop, during every iteration, and after.

For binary search:

> **If the target exists in `nums`, it is always somewhere between `left` and `right` (inclusive).**

This is what makes binary search *correct*. Every time you move `left` or `right`, you must ensure you're not accidentally excluding the target.""",
                    "order_index": 1,
                },
                {
                    "title": "Why `left = mid + 1` is Safe",
                    "content": """## Proving the invariant holds

When `nums[mid] < target`:
- The target **cannot** be at index `mid` (it's too small)
- The target **cannot** be anywhere to the left of `mid`
- So setting `left = mid + 1` **never excludes the target**

When `nums[mid] > target`:
- The target cannot be at `mid` or to its right
- So setting `right = mid - 1` is safe

Each update shrinks the window **without skipping the target**. This is the invariant being maintained.""",
                    "order_index": 2,
                },
            ],
        },
        {
            "slug": "boundary-conditions",
            "title": "Boundary Conditions",
            "description": "When to use left <= right vs left < right, and the midpoint formula",
            "order_index": 3,
            "cards": [
                {
                    "title": "`<=` vs `<` — Two Patterns",
                    "content": """## Choosing your termination condition

**Pattern 1: `while left <= right`** — exact match search
```python
# Loop ends when window is empty (left > right)
# Return -1 if not found after the loop
while left <= right:
    mid = (left + right) // 2
    if nums[mid] == target: return mid
    ...
return -1
```

**Pattern 2: `while left < right`** — boundary search
```python
# Loop ends when left == right (both point to the answer)
# Return left at the end
while left < right:
    mid = (left + right) // 2
    if feasible(mid): right = mid
    else: left = mid + 1
return left
```

**Rule of thumb:** Use `<=` for "find the exact value". Use `<` for "find the first position that satisfies a condition".""",
                    "order_index": 1,
                },
                {
                    "title": "The Midpoint Formula",
                    "content": """## Always use integer division

```python
mid = (left + right) // 2   # ✓ correct in Python
```

**Why not `(left + right) / 2`?**
- In Python, `/` returns a float. `nums[2.5]` is an error.
- In other languages (C++, Java), `(left + right)` can **integer overflow** if both are large.

**Safe alternative (works everywhere):**
```python
mid = left + (right - left) // 2
```

This avoids overflow by never adding two large numbers together.""",
                    "order_index": 2,
                },
            ],
        },
        {
            "slug": "search-space-reduction",
            "title": "Search Space Reduction",
            "description": "Applying binary search beyond sorted arrays",
            "order_index": 4,
            "cards": [
                {
                    "title": "Binary Search on the Answer",
                    "content": """## The bigger idea

Binary search works on **any monotonic search space** — not just sorted arrays.

If you can define:
1. A range of possible answers `[lo, hi]`
2. A `feasible(x)` function that returns True/False monotonically

Then you can binary search for the **smallest x where feasible(x) is True**.

**Example:** "Find the minimum eating speed such that all bananas are eaten in h hours."

The answer is in `[1, max(piles)]`. `feasible(speed)` = can eat everything at this speed?""",
                    "order_index": 1,
                },
                {
                    "title": "Koko's Template",
                    "content": """## The binary-search-on-answer template

```python
def solve(piles, h):
    left, right = 1, max(piles)   # search space for the answer

    while left < right:
        mid = (left + right) // 2
        if feasible(mid, piles, h):
            right = mid          # mid works, try smaller
        else:
            left = mid + 1       # mid too small, go bigger

    return left   # smallest feasible value

def feasible(speed, piles, h):
    import math
    return sum(math.ceil(p / speed) for p in piles) <= h
```

Notice `while left < right` and returning `left` — classic boundary pattern.""",
                    "order_index": 2,
                },
            ],
        },
    ],

    # ── Two Pointers ──────────────────────────────────────────────────────────
    "two-pointers": [
        {
            "slug": "opposite-direction",
            "title": "Opposite Direction Pointers",
            "description": "Left and right move toward each other",
            "order_index": 1,
            "cards": [
                {
                    "title": "The Core Idea",
                    "content": """## Replace the inner loop

The two-pointer pattern often removes a nested loop.

**Classic:** Is a string a palindrome?

```python
def is_palindrome(s):
    left, right = 0, len(s) - 1
    while left < right:
        if s[left] != s[right]:
            return False
        left += 1
        right -= 1
    return True
```

`left` starts at the beginning, `right` at the end. They move **toward each other**. When they meet, every pair has been checked. O(n) time, O(1) space.""",
                    "order_index": 1,
                },
                {
                    "title": "Two Sum II (Sorted Array)",
                    "content": """## Using sortedness as information

If the array is sorted, two pointers give you a direction to move:

```python
def two_sum_sorted(nums, target):
    left, right = 0, len(nums) - 1
    while left < right:
        s = nums[left] + nums[right]
        if s == target:
            return [left + 1, right + 1]
        elif s < target:
            left += 1   # need a bigger sum → move left right
        else:
            right -= 1  # need a smaller sum → move right left
```

Key insight: **each step eliminates at least one element** because of sorted order.""",
                    "order_index": 2,
                },
            ],
        },
        {
            "slug": "same-direction",
            "title": "Same Direction Pointers",
            "description": "Fast and slow pointers moving together",
            "order_index": 2,
            "cards": [
                {
                    "title": "Fast & Slow — Remove Duplicates",
                    "content": """## Two pointers, same direction

`slow` marks the last valid position, `fast` scans ahead:

```python
def remove_duplicates(nums):
    slow = 0
    for fast in range(1, len(nums)):
        if nums[fast] != nums[slow]:
            slow += 1
            nums[slow] = nums[fast]
    return slow + 1
```

Think of `slow` as the "write head" and `fast` as the "read head". The write head only advances when it finds something new to write.""",
                    "order_index": 1,
                },
            ],
        },
    ],

    # ── Sliding Window ────────────────────────────────────────────────────────
    "sliding-window": [
        {
            "slug": "fixed-window",
            "title": "Fixed Size Window",
            "description": "Window of constant size slides across the array",
            "order_index": 1,
            "cards": [
                {
                    "title": "The Sliding Window Idea",
                    "content": """## Don't recompute — slide!

**Problem:** Max sum of any subarray of length k.

Naïve: recompute sum for every window — O(nk).

**Sliding window:** Add the new element entering, remove the one leaving:

```python
def max_sum_subarray(nums, k):
    window_sum = sum(nums[:k])
    max_sum = window_sum

    for i in range(k, len(nums)):
        window_sum += nums[i]        # add incoming
        window_sum -= nums[i - k]    # remove outgoing
        max_sum = max(max_sum, window_sum)

    return max_sum
```

O(n) — each element is added and removed exactly once.""",
                    "order_index": 1,
                },
            ],
        },
        {
            "slug": "variable-window",
            "title": "Variable Size Window",
            "description": "Window shrinks and grows based on a condition",
            "order_index": 2,
            "cards": [
                {
                    "title": "Grow and Shrink",
                    "content": """## The variable-window template

```python
left = 0
window = {}  # or counter, or sum

for right in range(len(s)):
    # 1. Expand: add s[right] to window
    window[s[right]] = window.get(s[right], 0) + 1

    # 2. Shrink: while window is invalid, remove s[left]
    while len(window) > k:
        window[s[left]] -= 1
        if window[s[left]] == 0:
            del window[s[left]]
        left += 1

    # 3. Window is now valid — update answer
    result = max(result, right - left + 1)
```

**Key:** define what "valid" means for your problem. Shrink until valid.""",
                    "order_index": 1,
                },
            ],
        },
    ],

    # ── Stack ─────────────────────────────────────────────────────────────────
    "stack": [
        {
            "slug": "lifo-pattern",
            "title": "LIFO and When to Use It",
            "description": "Last-in first-out and matching bracket problems",
            "order_index": 1,
            "cards": [
                {
                    "title": "Stack = Last In, First Out",
                    "content": """## The stack abstraction

A stack supports two operations:
- `push(x)` — add x to the top
- `pop()` — remove and return the top element

In Python, a list works as a stack:
```python
stack = []
stack.append(x)   # push
stack.pop()       # pop from top
stack[-1]         # peek
```

**When to reach for a stack:** Any time you need to process something *after* seeing what comes next, or match opening/closing pairs.""",
                    "order_index": 1,
                },
                {
                    "title": "Valid Parentheses",
                    "content": """## The canonical stack problem

```python
def is_valid(s):
    stack = []
    matching = {')': '(', '}': '{', ']': '['}

    for ch in s:
        if ch in '([{':
            stack.append(ch)
        else:
            if not stack or stack[-1] != matching[ch]:
                return False
            stack.pop()

    return len(stack) == 0
```

Every time you see an opening bracket, push it. Every closing bracket must match the most recent unmatched opening. The stack gives you that "most recent" in O(1).""",
                    "order_index": 2,
                },
            ],
        },
        {
            "slug": "monotonic-stack",
            "title": "Monotonic Stack",
            "description": "Maintain a stack that's always increasing or decreasing",
            "order_index": 2,
            "cards": [
                {
                    "title": "Next Greater Element",
                    "content": """## The monotonic stack pattern

**Problem:** For each element, find the next element that's greater than it.

```python
def next_greater(nums):
    result = [-1] * len(nums)
    stack = []  # stores indices, maintained decreasing

    for i, x in enumerate(nums):
        while stack and nums[stack[-1]] < x:
            idx = stack.pop()
            result[idx] = x   # x is the next greater for idx
        stack.append(i)

    return result
```

The stack stays **monotonically decreasing**. When a larger element arrives, it's the answer for everything it pops. O(n) — each element pushed and popped once.""",
                    "order_index": 1,
                },
            ],
        },
    ],

    # ── Linked List ───────────────────────────────────────────────────────────
    "linked-list": [
        {
            "slug": "pointer-manipulation",
            "title": "Traversal and Pointer Manipulation",
            "description": "Navigating and rewiring nodes",
            "order_index": 1,
            "cards": [
                {
                    "title": "The Node and Pointer Model",
                    "content": """## Thinking in pointers

A linked list node holds a value and a pointer to the next node:

```python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next
```

**Never lose your reference.** Before rewiring `curr.next`, save it:

```python
next_node = curr.next   # save
curr.next = prev        # rewire
prev = curr             # advance prev
curr = next_node        # advance curr
```

This 4-line pattern reverses a linked list in-place.""",
                    "order_index": 1,
                },
            ],
        },
        {
            "slug": "fast-slow-pointers",
            "title": "Fast & Slow Pointers",
            "description": "Detecting cycles and finding midpoints",
            "order_index": 2,
            "cards": [
                {
                    "title": "Floyd's Cycle Detection",
                    "content": """## Two runners, one track

`slow` moves 1 step at a time. `fast` moves 2 steps.

- If there's **no cycle**: fast reaches `None` → no cycle ✓
- If there's a **cycle**: fast laps slow → they meet ✓

```python
def has_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow == fast:
            return True
    return False
```

**Why they meet:** In a cycle of length L, fast gains 1 step per iteration, so they meet within L steps after fast enters the cycle.""",
                    "order_index": 1,
                },
            ],
        },
    ],

    # ── Trees ─────────────────────────────────────────────────────────────────
    "trees": [
        {
            "slug": "dfs-traversal",
            "title": "Tree Traversal — DFS",
            "description": "Pre-order, in-order, post-order with recursion and stack",
            "order_index": 1,
            "cards": [
                {
                    "title": "The Three DFS Orders",
                    "content": """## When to visit the root

```python
def dfs(node):
    if not node:
        return

    # Pre-order: process NOW (before children)
    visit(node)
    dfs(node.left)
    dfs(node.right)

    # In-order: process BETWEEN children (BST → sorted)
    dfs(node.left)
    visit(node)
    dfs(node.right)

    # Post-order: process AFTER children (compute from leaves up)
    dfs(node.left)
    dfs(node.right)
    visit(node)
```

**Rule of thumb:** Use post-order when a node's answer depends on its children's answers (e.g. tree height, diameter).""",
                    "order_index": 1,
                },
            ],
        },
        {
            "slug": "bfs-traversal",
            "title": "Tree Traversal — BFS",
            "description": "Level-order traversal with a queue",
            "order_index": 2,
            "cards": [
                {
                    "title": "Level-Order with a Queue",
                    "content": """## Process level by level

```python
from collections import deque

def level_order(root):
    if not root:
        return []

    result = []
    queue = deque([root])

    while queue:
        level_size = len(queue)     # snapshot: nodes at this level
        level = []

        for _ in range(level_size):
            node = queue.popleft()
            level.append(node.val)
            if node.left:  queue.append(node.left)
            if node.right: queue.append(node.right)

        result.append(level)

    return result
```

`level_size` snapshot is the key — it separates one level from the next.""",
                    "order_index": 1,
                },
            ],
        },
    ],

    # ── 1D DP ─────────────────────────────────────────────────────────────────
    "dynamic-programming-1d": [
        {
            "slug": "recognizing-dp",
            "title": "Recognizing DP Problems",
            "description": "Optimal substructure and overlapping subproblems",
            "order_index": 1,
            "cards": [
                {
                    "title": "Two Signs You Need DP",
                    "content": """## When brute force explodes

A problem is a DP candidate when it has:

1. **Optimal substructure** — the optimal solution to the whole problem is built from optimal solutions to smaller subproblems.
2. **Overlapping subproblems** — the same subproblem is solved multiple times in the recursion tree.

**Classic signal in the problem statement:**
- "minimum/maximum number of..."
- "number of ways to..."
- "is it possible to..."

If your recursive brute force has exponential time because it recomputes the same inputs, DP is the fix.""",
                    "order_index": 1,
                },
                {
                    "title": "Fibonacci: from O(2ⁿ) to O(n)",
                    "content": """## Memoization in one step

```python
# Brute force: O(2ⁿ)
def fib(n):
    if n <= 1: return n
    return fib(n-1) + fib(n-2)

# Memoized: O(n) — cache results
from functools import lru_cache

@lru_cache(maxsize=None)
def fib(n):
    if n <= 1: return n
    return fib(n-1) + fib(n-2)
```

`@lru_cache` stores the result of every call. If `fib(3)` is called twice, the second call returns instantly from the cache. The recursion tree collapses to a single path.""",
                    "order_index": 2,
                },
            ],
        },
        {
            "slug": "tabulation",
            "title": "Tabulation (Bottom-Up DP)",
            "description": "Build the answer iteratively from base cases",
            "order_index": 2,
            "cards": [
                {
                    "title": "Bottom-Up vs Top-Down",
                    "content": """## Two ways to fill the same table

**Top-down (memoization):** Start at the answer, recurse down, cache results.

**Bottom-up (tabulation):** Start at base cases, fill a table forward to the answer.

```python
# Climbing Stairs: ways to reach step n (1 or 2 steps at a time)
def climb_stairs(n):
    dp = [0] * (n + 1)
    dp[0] = 1   # base case: 1 way to stay at ground
    dp[1] = 1   # 1 way to reach step 1

    for i in range(2, n + 1):
        dp[i] = dp[i-1] + dp[i-2]   # from step below or 2 below

    return dp[n]
```

**Advantage of bottom-up:** No recursion stack, easier to optimize space.""",
                    "order_index": 1,
                },
            ],
        },
    ],

    # ── Graphs ────────────────────────────────────────────────────────────────
    "graphs": [
        {
            "slug": "graph-representation",
            "title": "Graph Representation",
            "description": "Adjacency list vs matrix",
            "order_index": 1,
            "cards": [
                {
                    "title": "Adjacency List (Default Choice)",
                    "content": """## How to store a graph

For a graph with n nodes and e edges:

```python
# Build adjacency list from edge list
n = 5
edges = [[0,1],[0,2],[1,3],[2,4]]

adj = [[] for _ in range(n)]
for u, v in edges:
    adj[u].append(v)
    adj[v].append(u)   # undirected
```

`adj[node]` gives all neighbors of `node` in O(degree) time.

**Space:** O(n + e) — ideal for sparse graphs.
**Use adjacency matrix** only when you need to check `edge(u,v)` in O(1) and the graph is dense.""",
                    "order_index": 1,
                },
            ],
        },
        {
            "slug": "graph-bfs-dfs",
            "title": "BFS and DFS on Graphs",
            "description": "Traversing with a visited set",
            "order_index": 2,
            "cards": [
                {
                    "title": "The visited Set — Avoiding Infinite Loops",
                    "content": """## Trees vs Graphs

Trees have no cycles, so DFS/BFS always terminate. Graphs can have cycles, so you **must track visited nodes**.

```python
def bfs(graph, start):
    from collections import deque
    visited = {start}
    queue = deque([start])

    while queue:
        node = queue.popleft()
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
```

**Critical:** Add to `visited` when you **enqueue**, not when you dequeue. Otherwise the same node gets enqueued multiple times.""",
                    "order_index": 1,
                },
            ],
        },
    ],

    # ── Other topics — minimal cards (expand later) ────────────────────────────
    "tries": [
        {
            "slug": "trie-structure",
            "title": "Trie Node Structure",
            "description": "Building a prefix tree",
            "order_index": 1,
            "cards": [
                {
                    "title": "What is a Trie?",
                    "content": """## A tree where each edge is a character

```python
class TrieNode:
    def __init__(self):
        self.children = {}   # char → TrieNode
        self.is_end = False  # marks end of a word

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word):
        node = self.root
        for ch in word:
            if ch not in node.children:
                node.children[ch] = TrieNode()
            node = node.children[ch]
        node.is_end = True
```

Each path from root to a node marked `is_end=True` spells out a word. Insert: O(m). Search: O(m). m = word length.""",
                    "order_index": 1,
                },
            ],
        },
    ],
    "heap": [
        {
            "slug": "heap-basics",
            "title": "Heap Basics",
            "description": "Min-heap and top-K patterns",
            "order_index": 1,
            "cards": [
                {
                    "title": "Python's Min-Heap",
                    "content": """## heapq — always gives the minimum

```python
import heapq

nums = [3, 1, 4, 1, 5, 9]
heapq.heapify(nums)       # O(n) — turn list into a heap

heapq.heappush(nums, 2)   # O(log n)
smallest = heapq.heappop(nums)  # O(log n)
```

**For a max-heap**, negate all values: `heapq.heappush(h, -x)`

**Top-K pattern:** Push every element; once size > k, pop. The heap maintains the k largest.""",
                    "order_index": 1,
                },
            ],
        },
    ],
    "backtracking": [
        {
            "slug": "backtracking-template",
            "title": "Backtracking Template",
            "description": "Build, recurse, undo",
            "order_index": 1,
            "cards": [
                {
                    "title": "The Build-Recurse-Undo Pattern",
                    "content": """## Explore all possibilities, prune dead ends

```python
def backtrack(candidates, path, result):
    if is_complete(path):
        result.append(path[:])   # copy current path
        return

    for choice in candidates:
        if is_valid(choice, path):
            path.append(choice)      # make choice
            backtrack(..., path, result)  # recurse
            path.pop()               # UNDO choice
```

The `path.pop()` is what makes it backtracking — you undo the choice after exploring its subtree, then try the next option.""",
                    "order_index": 1,
                },
            ],
        },
    ],
    "dynamic-programming-2d": [
        {
            "slug": "2d-dp-basics",
            "title": "2D DP Table",
            "description": "Setting up and filling a 2D DP grid",
            "order_index": 1,
            "cards": [
                {
                    "title": "Longest Common Subsequence",
                    "content": """## The classic 2D DP problem

```python
def lcs(s1, s2):
    m, n = len(s1), len(s2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]

    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if s1[i-1] == s2[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1   # extend match
            else:
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])  # skip one

    return dp[m][n]
```

`dp[i][j]` = LCS of `s1[:i]` and `s2[:j]`. Build from smaller subproblems up to the full strings.""",
                    "order_index": 1,
                },
            ],
        },
    ],
}

# ─── YouTube Videos ───────────────────────────────────────────────────────────
# Replace these IDs with verified videos. Format: youtube.com/watch?v=<ID>

VIDEOS = {
    "arrays-hashing": [
        {"title": "Arrays & Hashing — NeetCode", "youtube_id": "Yyui_P-GBqA", "order_index": 1},
        {"title": "Hash Tables Explained — CS Dojo", "youtube_id": "sfWyugl4JWA", "order_index": 2},
    ],
    "binary-search": [
        {"title": "Binary Search — NeetCode", "youtube_id": "s4DPM8ct1pI", "order_index": 1},
        {"title": "Binary Search Algorithm — Abdul Bari", "youtube_id": "C2apEw9pgtw", "order_index": 2},
    ],
    "two-pointers": [
        {"title": "Two Pointers — NeetCode", "youtube_id": "On03HWe2tZM", "order_index": 1},
    ],
    "sliding-window": [
        {"title": "Sliding Window — NeetCode", "youtube_id": "p-ss2JNygmA", "order_index": 1},
    ],
    "stack": [
        {"title": "Stack — NeetCode", "youtube_id": "KInG04mAjO0", "order_index": 1},
    ],
    "linked-list": [
        {"title": "Linked List — NeetCode", "youtube_id": "G0_I-ZF0S38", "order_index": 1},
    ],
    "trees": [
        {"title": "Trees — NeetCode", "youtube_id": "OnSn2XEQ4MY", "order_index": 1},
        {"title": "Tree Traversal — William Fiset", "youtube_id": "1WxLM2hwL-U", "order_index": 2},
    ],
    "dynamic-programming-1d": [
        {"title": "1D DP — NeetCode", "youtube_id": "73r3KWiEvyk", "order_index": 1},
    ],
    "graphs": [
        {"title": "Graphs — NeetCode", "youtube_id": "EgI5nU9etnU", "order_index": 1},
    ],
    "backtracking": [
        {"title": "Backtracking — NeetCode", "youtube_id": "s9fokUqJ76A", "order_index": 1},
    ],
    "heap": [
        {"title": "Heap / Priority Queue — NeetCode", "youtube_id": "pLh-Q1bejRw", "order_index": 1},
    ],
    "tries": [
        {"title": "Trie — NeetCode", "youtube_id": "oobqoCJlHA0", "order_index": 1},
    ],
    "dynamic-programming-2d": [
        {"title": "2D DP — NeetCode", "youtube_id": "6i6or3yUBQY", "order_index": 1},
    ],
}

# ─── Problem → SubTopic mapping ───────────────────────────────────────────────
# Maps problem slug to (topic_slug, subtopic_slug)

PROBLEM_SUBTOPIC_MAP = {
    "binary-search-classic":         ("binary-search", "the-halving-idea"),
    "binary-search-first-bad-version":("binary-search", "boundary-conditions"),
    "binary-search-find-peak":        ("binary-search", "boundary-conditions"),
    "binary-search-search-rotated":   ("binary-search", "loop-invariant"),
    "binary-search-koko-eating":      ("binary-search", "search-space-reduction"),
}


# ─── Seeder ───────────────────────────────────────────────────────────────────

def seed():
    db = SessionLocal()
    try:
        topic_objs = {}
        subtopic_objs = {}

        # Topics
        for t in TOPICS:
            existing = db.query(models.Topic).filter_by(slug=t["slug"]).first()
            if not existing:
                obj = models.Topic(**t)
                db.add(obj)
                db.flush()
                topic_objs[t["slug"]] = obj
            else:
                topic_objs[t["slug"]] = existing

        db.commit()

        # SubTopics + PlayCards
        for topic_slug, subtopics in SUBTOPICS.items():
            topic = topic_objs[topic_slug]
            for st_data in subtopics:
                cards = st_data.pop("cards", [])
                existing_st = db.query(models.SubTopic).filter_by(
                    topic_id=topic.id, slug=st_data["slug"]
                ).first()
                if not existing_st:
                    st_obj = models.SubTopic(topic_id=topic.id, **st_data)
                    db.add(st_obj)
                    db.flush()
                else:
                    st_obj = existing_st
                subtopic_objs[(topic_slug, st_data["slug"])] = st_obj

                for card in cards:
                    existing_card = db.query(models.PlayCard).filter_by(
                        subtopic_id=st_obj.id, order_index=card["order_index"]
                    ).first()
                    if not existing_card:
                        db.add(models.PlayCard(subtopic_id=st_obj.id, **card))

                # re-add slug back for loop safety
                st_data["cards"] = cards

        db.commit()

        # YouTube Videos
        for topic_slug, videos in VIDEOS.items():
            topic = topic_objs.get(topic_slug)
            if not topic:
                continue
            for v in videos:
                existing = db.query(models.YoutubeVideo).filter_by(
                    topic_id=topic.id, youtube_id=v["youtube_id"]
                ).first()
                if not existing:
                    db.add(models.YoutubeVideo(topic_id=topic.id, **v))

        db.commit()

        # Link Problems → SubTopics
        for prob_slug, (topic_slug, st_slug) in PROBLEM_SUBTOPIC_MAP.items():
            prob = db.query(models.Problem).filter_by(slug=prob_slug).first()
            st = subtopic_objs.get((topic_slug, st_slug))
            if prob and st and prob.subtopic_id != st.id:
                prob.subtopic_id = st.id

        db.commit()
        print(f"Seeded {len(TOPICS)} topics, subtopics, playcards, and videos.")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
