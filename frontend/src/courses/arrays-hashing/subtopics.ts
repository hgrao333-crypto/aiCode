import type { SubtopicCfg } from "../types";

export const SUBTOPICS: SubtopicCfg[] = [
  {
    stage: 1, title: "Memory & Indexing", icon: "🧱",
    concepts: ["Contiguous memory", "Base + offset formula", "O(1) random access"],
    teachingCards: [
      {
        text: "**Arrays store elements in consecutive (contiguous) memory addresses.**\n\nWhen Python creates `arr = [10, 20, 30, 40]`, the runtime allocates a block of memory and places each element back-to-back. If the array starts at address 1000 and each element takes 4 bytes:\n- `arr[0]` → address 1000\n- `arr[1]` → address 1004\n- `arr[i]` → address **`1000 + i × 4`**\n\nThis formula means Python can jump directly to any element with one multiplication and one addition — **O(1) regardless of array size**. A linked list, by contrast, must follow pointers from node to node — O(n).",
        dbImageKey: "memory-layout",
        imageUrl: "/images/tutor/arrays-hashing/stage1-memory.svg",
        imageCaption: "Every arr[i] sits at a calculable address — direct access, no scanning.",
      },
    ],
    opener: "Here's an array [10, 20, 30, 40] stored in memory starting at address 1000, each element taking 4 bytes. You want arr[2]. How does Python find it instantly — without scanning index 0 and 1 first?",
    assessment: [
      {
        type: "mcq",
        q: "arr.insert(0, x) is O(n), but arr.append(x) is amortized O(1). Why is inserting at index 0 so much slower?",
        options: [
          "Python must re-sort the array to maintain order after every insert(0, x)",
          "Every existing element must shift one position right to make room — n writes instead of 1",
          "Python allocates a completely new array for insert() but reuses the buffer for append()",
          "insert() validates all elements for type consistency; append() skips the check",
        ],
        correct: 1,
        explanation: "Contiguous memory is the cause. Element i lives at base + i×size, so inserting at position 0 forces every element to move one slot right — n memory writes. append() adds to the end of a pre-allocated buffer — 1 write, O(1) amortized. Same memory layout, very different implications.",
      },
      {
        type: "debug",
        q: "This function removes duplicates correctly but is O(n²). What's the expensive operation, and how would you fix it?",
        code: `def remove_duplicates(arr):
    result = []
    for x in arr:
        if x not in result:   # is this O(1)?
            result.append(x)
    return result`,
        explanation: "`x not in result` scans the list from the beginning every iteration — O(n) per element, O(n²) total. Fix: maintain a `seen = set()` alongside result. `x not in seen` is O(1) (backed by a hash table). Add `seen.add(x)` after each append. Total becomes O(n).",
      },
    ],
  },
  {
    stage: 2, title: "How Hashing Works", icon: "🗝️",
    concepts: ["Hash function", "Buckets", "Collisions", "O(1) average lookup"],
    teachingCards: [
      {
        text: "**A hash map converts keys to array indices using a hash function — enabling O(1) average lookups.**\n\nWhen you write `d['apple'] = 5`, Python computes `hash('apple')` (an integer), then takes `hash % num_buckets` to get a bucket index, and stores `5` at that position in a backing array.\n\nLooking up `d['apple']` repeats the same math — compute the hash, find the bucket, read the value. **No loop through all keys**.\n\nCollisions (two keys hashing to the same bucket) are handled by open addressing. As long as the hash function distributes keys evenly, each bucket has ~1 entry on average — O(1) get and set.",
        dbImageKey: "hash-buckets",
        imageUrl: "/images/tutor/arrays-hashing/stage2-hashmap.svg",
        imageCaption: "hash(key) → bucket index → value.  One arithmetic step, not a search.",
      },
    ],
    opener: "A Python dict stores 'apple': 5. When you write d['apple'], Python returns 5 in O(1) — without looping through every key. How?",
    assessment: [
      {
        type: "mcq",
        q: "Python dict lookup is O(1) average, but O(n) worst-case. What causes the worst case?",
        options: [
          "Dicts with more than 2/3 capacity trigger a rehash, which is O(n)",
          "A bad hash function maps all keys to the same bucket — lookup degenerates into a linear scan of the collision chain",
          "Python switches from open addressing to a binary search tree when n > 128 keys",
          "Looking up a missing key always falls through to a full scan of the backing array",
        ],
        correct: 1,
        explanation: "If every key hashes to the same bucket, lookup must probe through all n stored entries — O(n). Python's built-in hash functions are carefully designed to spread keys uniformly. But custom __hash__ implementations can inadvertently create this worst case.",
      },
      {
        type: "trace",
        q: "Trace these dict operations step by step. What is d['b'] at the end?\n\nd = {'a': 2, 'b': 3}\nd['c'] = d.get('a', 0) + d.get('x', 4)\nd['b'] = d['b'] + d['c']",
        hint: "Step 1: d.get('a',0) — key 'a' exists, returns 2. d.get('x',4) — key 'x' absent, returns default 4. Step 2: d['c'] = 2+4 = 6. Step 3: d['b'] = 3 + d['c'].",
        answer: "9",
        explanation: "d.get('a',0)=2 (key exists). d.get('x',4)=4 (key absent → default 4). So d['c']=6. Then d['b']=3+6=9. The key insight: .get(key, default) returns the default only when the key is absent — it does NOT modify the dict.",
      },
    ],
  },
  {
    stage: 3, title: "The Complement Trick", icon: "🎯",
    concepts: ["Single-pass hash map", "Complement lookup", "Store-then-check vs check-then-store"],
    teachingCards: [
      {
        text: "**The complement trick replaces a nested loop with a single pass + O(1) hash map lookup.**\n\nBrute force Two Sum: for every pair (i, j) check `nums[i] + nums[j] == target` — that's O(n²).\n\nThe insight: if `nums[i] + nums[j] == target`, then `nums[j] = target - nums[i]`. For each element `n`, we need its **complement** `target - n`.\n\nInstead of scanning ahead for the complement, use a hash map `seen = {value: index}`. As you walk the array:\n1. Check if `target - n` is already in `seen`.\n2. If yes → you found the pair. Return both indices.\n3. If no → store `seen[n] = i` and continue.\n\nOne pass, O(n) time, O(n) space.",
        dbImageKey: "two-sum-trace",
        imageUrl: "/images/tutor/arrays-hashing/stage3-twosum.svg",
        imageCaption: "Scan once: check complement in seen dict, or store current value and move on.",
      },
    ],
    opener: "Array [2, 7, 11, 15], target = 9. Brute force: for every pair (i, j) check if they sum to 9 — that's O(n²). Can you do it in a single pass? What would you need to keep track of?",
    assessment: [
      {
        type: "mcq",
        q: "nums = [3, 3], target = 6. A student stores n in `seen` BEFORE checking for the complement. What wrong answer do they get and why?",
        options: [
          "A KeyError — overwriting the same key raises an exception in Python dicts",
          "[0, 0] — nums[0] finds its own complement because 3 is already in seen when it checks",
          "[] — the condition `seen[comp] != i` correctly prevents self-pairing",
          "[0, 1] — the correct answer, because both values are 3 and both indices are stored",
        ],
        correct: 1,
        explanation: "If you store before checking: at i=0, seen={3:0}. Then comp=6-3=3, found in seen → return [seen[3], 0] = [0, 0]. Element 0 is paired with itself. Always check for the complement BEFORE storing the current element — that guarantees the match is a different element.",
      },
      {
        type: "debug",
        q: "This Two Sum finds the right pair but returns wrong indices on some inputs. What's the bug?",
        code: `def two_sum(nums, target):
    seen = set()          # stores values only
    for i, n in enumerate(nums):
        comp = target - n
        if comp in seen:
            return [nums.index(comp), i]   # ← retrieve the index
        seen.add(n)
    return []`,
        explanation: "`nums.index(comp)` does a linear scan of the original list to find the index of comp — O(n) per call, and always returns the FIRST occurrence. If comp appears multiple times, it may return the wrong index. Fix: use `seen = {}` mapping value → index, then `seen[comp]` gives the exact index in O(1).",
      },
    ],
  },
];
