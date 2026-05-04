"""Seed the full DSA course. Run once: python seed_dsa.py"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from database import SessionLocal
import models

def _get_st(db, slug):
    return db.query(models.SubTopic).filter_by(slug=slug).first()


def _add_if_missing(db, slug, **kwargs):
    if not db.query(models.Problem).filter_by(slug=slug).first():
        db.add(models.Problem(slug=slug, **kwargs))


def _add_extra_problems(db):
    """Add topic-specific challenges that go beyond the starter problems.
    Safe to call repeatedly — skips slugs that already exist."""

    # ── Arrays & Hashing ─────────────────────────────────────────────────────
    st_hash = _get_st(db, "hash-maps")
    st_arr  = _get_st(db, "array-basics")
    st_2sum = _get_st(db, "two-sum-pattern")
    if st_hash:
        _add_if_missing(db, "group-anagrams",
            title="Group Anagrams", topic="arrays-hashing", subtopic_id=st_hash.id,
            difficulty="medium", order_index=3,
            concepts=["hash map", "string sorting", "grouping"],
            description=(
                "Given an array of strings `strs`, group the anagrams together and return them in any order.\n\n"
                "Two strings are anagrams if they contain the same characters in any order.\n\n"
                "**Example:** `['eat','tea','tan','ate','nat','bat']` → `[['eat','tea','ate'],['tan','nat'],['bat']]`"
            ),
            starter_code=(
                "def groupAnagrams(strs: list[str]) -> list[list[str]]:\n"
                "    # Your code here\n"
                "    pass"
            ),
            solution_code=(
                "def groupAnagrams(strs: list[str]) -> list[list[str]]:\n"
                "    groups = {}\n"
                "    for s in strs:\n"
                "        key = tuple(sorted(s))\n"
                "        groups.setdefault(key, []).append(s)\n"
                "    return list(groups.values())"
            ),
            test_cases=[
                {"input": {"strs": ["eat","tea","tan","ate","nat","bat"]},
                 "expected": [["eat","tea","ate"],["tan","nat"],["bat"]]},
                {"input": {"strs": [""]}, "expected": [[""]]},
                {"input": {"strs": ["a"]}, "expected": [["a"]]},
            ])
        _add_if_missing(db, "top-k-frequent-elements",
            title="Top K Frequent Elements", topic="arrays-hashing", subtopic_id=st_hash.id,
            difficulty="medium", order_index=4,
            concepts=["hash map", "bucket sort", "frequency"],
            description=(
                "Given an integer array `nums` and an integer `k`, return the `k` most frequent elements.\n\n"
                "You may return the answer in **any order**. Your algorithm must be better than O(n log n)."
            ),
            starter_code=(
                "def topKFrequent(nums: list[int], k: int) -> list[int]:\n"
                "    # Your code here\n"
                "    pass"
            ),
            solution_code=(
                "def topKFrequent(nums: list[int], k: int) -> list[int]:\n"
                "    count = {}\n"
                "    for n in nums:\n"
                "        count[n] = count.get(n, 0) + 1\n"
                "    buckets = [[] for _ in range(len(nums) + 1)]\n"
                "    for val, freq in count.items():\n"
                "        buckets[freq].append(val)\n"
                "    result = []\n"
                "    for i in range(len(buckets) - 1, 0, -1):\n"
                "        result.extend(buckets[i])\n"
                "        if len(result) >= k:\n"
                "            return result[:k]\n"
                "    return result"
            ),
            test_cases=[
                {"input": {"nums": [1,1,1,2,2,3], "k": 2}, "expected": [1,2]},
                {"input": {"nums": [1], "k": 1}, "expected": [1]},
            ])
    if st_arr:
        _add_if_missing(db, "product-of-array-except-self",
            title="Product of Array Except Self", topic="arrays-hashing", subtopic_id=st_arr.id,
            difficulty="medium", order_index=5,
            concepts=["prefix products", "arrays", "no division"],
            description=(
                "Given an integer array `nums`, return an array `answer` where `answer[i]` equals the product "
                "of all elements except `nums[i]`.\n\n"
                "You must write an O(n) algorithm **without using the division operator**."
            ),
            starter_code=(
                "def productExceptSelf(nums: list[int]) -> list[int]:\n"
                "    # Your code here\n"
                "    pass"
            ),
            solution_code=(
                "def productExceptSelf(nums: list[int]) -> list[int]:\n"
                "    n = len(nums)\n"
                "    result = [1] * n\n"
                "    prefix = 1\n"
                "    for i in range(n):\n"
                "        result[i] = prefix\n"
                "        prefix *= nums[i]\n"
                "    suffix = 1\n"
                "    for i in range(n - 1, -1, -1):\n"
                "        result[i] *= suffix\n"
                "        suffix *= nums[i]\n"
                "    return result"
            ),
            test_cases=[
                {"input": {"nums": [1,2,3,4]}, "expected": [24,12,8,6]},
                {"input": {"nums": [-1,1,0,-3,3]}, "expected": [0,0,9,0,0]},
            ])

    # ── Two Pointers ──────────────────────────────────────────────────────────
    st_opp  = _get_st(db, "opposite-ends")
    st_fast = _get_st(db, "same-direction")
    if st_opp:
        _add_if_missing(db, "three-sum",
            title="Three Sum", topic="two-pointers", subtopic_id=st_opp.id,
            difficulty="medium", order_index=2,
            concepts=["two pointers", "sorting", "deduplication"],
            description=(
                "Given an integer array `nums`, return all triplets `[nums[i], nums[j], nums[k]]` such that "
                "`i != j != k` and `nums[i] + nums[j] + nums[k] == 0`.\n\n"
                "The solution set must not contain duplicate triplets."
            ),
            starter_code=(
                "def threeSum(nums: list[int]) -> list[list[int]]:\n"
                "    # Your code here\n"
                "    pass"
            ),
            solution_code=(
                "def threeSum(nums: list[int]) -> list[list[int]]:\n"
                "    nums.sort()\n"
                "    result = []\n"
                "    for i in range(len(nums) - 2):\n"
                "        if i > 0 and nums[i] == nums[i-1]:\n"
                "            continue\n"
                "        l, r = i + 1, len(nums) - 1\n"
                "        while l < r:\n"
                "            s = nums[i] + nums[l] + nums[r]\n"
                "            if s == 0:\n"
                "                result.append([nums[i], nums[l], nums[r]])\n"
                "                while l < r and nums[l] == nums[l+1]: l += 1\n"
                "                while l < r and nums[r] == nums[r-1]: r -= 1\n"
                "                l += 1; r -= 1\n"
                "            elif s < 0: l += 1\n"
                "            else: r -= 1\n"
                "    return result"
            ),
            test_cases=[
                {"input": {"nums": [-1,0,1,2,-1,-4]}, "expected": [[-1,-1,2],[-1,0,1]]},
                {"input": {"nums": [0,1,1]}, "expected": []},
                {"input": {"nums": [0,0,0]}, "expected": [[0,0,0]]},
            ])
        _add_if_missing(db, "container-with-most-water",
            title="Container With Most Water", topic="two-pointers", subtopic_id=st_opp.id,
            difficulty="medium", order_index=3,
            concepts=["two pointers", "greedy", "area maximization"],
            description=(
                "Given an integer array `height` of length `n`, there are `n` vertical lines where "
                "`height[i]` is the height of the i-th line.\n\n"
                "Find two lines that together with the x-axis form a container that holds the most water. "
                "Return the maximum amount of water."
            ),
            starter_code=(
                "def maxArea(height: list[int]) -> int:\n"
                "    # Your code here\n"
                "    pass"
            ),
            solution_code=(
                "def maxArea(height: list[int]) -> int:\n"
                "    l, r = 0, len(height) - 1\n"
                "    best = 0\n"
                "    while l < r:\n"
                "        h = min(height[l], height[r])\n"
                "        best = max(best, h * (r - l))\n"
                "        if height[l] < height[r]:\n"
                "            l += 1\n"
                "        else:\n"
                "            r -= 1\n"
                "    return best"
            ),
            test_cases=[
                {"input": {"height": [1,8,6,2,5,4,8,3,7]}, "expected": 49},
                {"input": {"height": [1,1]}, "expected": 1},
            ])
        _add_if_missing(db, "trapping-rain-water",
            title="Trapping Rain Water", topic="two-pointers", subtopic_id=st_opp.id,
            difficulty="hard", order_index=4,
            concepts=["two pointers", "prefix max", "water trapping"],
            description=(
                "Given `n` non-negative integers `height` representing an elevation map where each bar has "
                "width 1, compute how much water it can trap after raining."
            ),
            starter_code=(
                "def trap(height: list[int]) -> int:\n"
                "    # Your code here\n"
                "    pass"
            ),
            solution_code=(
                "def trap(height: list[int]) -> int:\n"
                "    l, r = 0, len(height) - 1\n"
                "    left_max = right_max = 0\n"
                "    water = 0\n"
                "    while l < r:\n"
                "        if height[l] < height[r]:\n"
                "            if height[l] >= left_max:\n"
                "                left_max = height[l]\n"
                "            else:\n"
                "                water += left_max - height[l]\n"
                "            l += 1\n"
                "        else:\n"
                "            if height[r] >= right_max:\n"
                "                right_max = height[r]\n"
                "            else:\n"
                "                water += right_max - height[r]\n"
                "            r -= 1\n"
                "    return water"
            ),
            test_cases=[
                {"input": {"height": [0,1,0,2,1,0,1,3,2,1,2,1]}, "expected": 6},
                {"input": {"height": [4,2,0,3,2,5]}, "expected": 9},
            ])

    # ── Sliding Window ────────────────────────────────────────────────────────
    st_fixed = _get_st(db, "fixed-window")
    st_var   = _get_st(db, "variable-window")
    if st_var:
        _add_if_missing(db, "longest-repeating-character-replacement",
            title="Longest Repeating Character Replacement", topic="sliding-window",
            subtopic_id=st_var.id, difficulty="medium", order_index=2,
            concepts=["sliding window", "frequency", "string"],
            description=(
                "Given a string `s` and an integer `k`, you can replace any `k` characters to make the "
                "longest substring of the same letter.\n\n"
                "Return the length of the longest such substring after performing at most `k` replacements."
            ),
            starter_code=(
                "def characterReplacement(s: str, k: int) -> int:\n"
                "    # Your code here\n"
                "    pass"
            ),
            solution_code=(
                "def characterReplacement(s: str, k: int) -> int:\n"
                "    count = {}\n"
                "    left = best = max_freq = 0\n"
                "    for right in range(len(s)):\n"
                "        count[s[right]] = count.get(s[right], 0) + 1\n"
                "        max_freq = max(max_freq, count[s[right]])\n"
                "        if (right - left + 1) - max_freq > k:\n"
                "            count[s[left]] -= 1\n"
                "            left += 1\n"
                "        best = max(best, right - left + 1)\n"
                "    return best"
            ),
            test_cases=[
                {"input": {"s": "ABAB", "k": 2}, "expected": 4},
                {"input": {"s": "AABABBA", "k": 1}, "expected": 4},
            ])
        _add_if_missing(db, "minimum-window-substring",
            title="Minimum Window Substring", topic="sliding-window",
            subtopic_id=st_var.id, difficulty="hard", order_index=4,
            concepts=["sliding window", "hash map", "two pointers"],
            description=(
                "Given two strings `s` and `t`, return the minimum window substring of `s` "
                "such that every character in `t` (including duplicates) is included.\n\n"
                "Return `\"\"` if no such window exists."
            ),
            starter_code=(
                "def minWindow(s: str, t: str) -> str:\n"
                "    # Your code here\n"
                "    pass"
            ),
            solution_code=(
                "def minWindow(s: str, t: str) -> str:\n"
                "    if not t: return ''\n"
                "    need = {}\n"
                "    for c in t: need[c] = need.get(c, 0) + 1\n"
                "    have, required = 0, len(need)\n"
                "    window = {}\n"
                "    best = ''\n"
                "    left = 0\n"
                "    for right in range(len(s)):\n"
                "        c = s[right]\n"
                "        window[c] = window.get(c, 0) + 1\n"
                "        if c in need and window[c] == need[c]:\n"
                "            have += 1\n"
                "        while have == required:\n"
                "            if not best or right - left + 1 < len(best):\n"
                "                best = s[left:right+1]\n"
                "            window[s[left]] -= 1\n"
                "            if s[left] in need and window[s[left]] < need[s[left]]:\n"
                "                have -= 1\n"
                "            left += 1\n"
                "    return best"
            ),
            test_cases=[
                {"input": {"s": "ADOBECODEBANC", "t": "ABC"}, "expected": "BANC"},
                {"input": {"s": "a", "t": "a"}, "expected": "a"},
                {"input": {"s": "a", "t": "aa"}, "expected": ""},
            ])
    if st_fixed:
        _add_if_missing(db, "permutation-in-string",
            title="Permutation in String", topic="sliding-window",
            subtopic_id=st_fixed.id, difficulty="medium", order_index=3,
            concepts=["sliding window", "frequency count", "fixed window"],
            description=(
                "Given two strings `s1` and `s2`, return `true` if `s2` contains a permutation of `s1`.\n\n"
                "In other words, return `true` if one of `s1`'s permutations is a substring of `s2`."
            ),
            starter_code=(
                "def checkInclusion(s1: str, s2: str) -> bool:\n"
                "    # Your code here\n"
                "    pass"
            ),
            solution_code=(
                "def checkInclusion(s1: str, s2: str) -> bool:\n"
                "    if len(s1) > len(s2): return False\n"
                "    need = {}\n"
                "    for c in s1: need[c] = need.get(c, 0) + 1\n"
                "    window = {}\n"
                "    for c in s2[:len(s1)]: window[c] = window.get(c, 0) + 1\n"
                "    if window == need: return True\n"
                "    for i in range(len(s1), len(s2)):\n"
                "        c_in = s2[i]\n"
                "        window[c_in] = window.get(c_in, 0) + 1\n"
                "        c_out = s2[i - len(s1)]\n"
                "        window[c_out] -= 1\n"
                "        if window[c_out] == 0: del window[c_out]\n"
                "        if window == need: return True\n"
                "    return False"
            ),
            test_cases=[
                {"input": {"s1": "ab", "s2": "eidbaooo"}, "expected": True},
                {"input": {"s1": "ab", "s2": "eidboaoo"}, "expected": False},
            ])

    # ── Binary Search ─────────────────────────────────────────────────────────
    st_classic = _get_st(db, "classic-binary-search")
    st_answer  = _get_st(db, "search-on-answer")
    if st_classic:
        _add_if_missing(db, "find-minimum-rotated",
            title="Find Minimum in Rotated Sorted Array", topic="binary-search",
            subtopic_id=st_classic.id, difficulty="medium", order_index=2,
            concepts=["binary search", "rotated array"],
            description=(
                "Given a sorted array of unique integers that was rotated at an unknown pivot, "
                "find and return the minimum element.\n\nYou must write an O(log n) algorithm."
            ),
            starter_code=(
                "def findMin(nums: list[int]) -> int:\n"
                "    # Your code here\n"
                "    pass"
            ),
            solution_code=(
                "def findMin(nums: list[int]) -> int:\n"
                "    l, r = 0, len(nums) - 1\n"
                "    while l < r:\n"
                "        mid = (l + r) // 2\n"
                "        if nums[mid] > nums[r]:\n"
                "            l = mid + 1\n"
                "        else:\n"
                "            r = mid\n"
                "    return nums[l]"
            ),
            test_cases=[
                {"input": {"nums": [3,4,5,1,2]}, "expected": 1},
                {"input": {"nums": [4,5,6,7,0,1,2]}, "expected": 0},
                {"input": {"nums": [11,13,15,17]}, "expected": 11},
            ])
    if st_answer:
        _add_if_missing(db, "koko-eating-bananas",
            title="Koko Eating Bananas", topic="binary-search",
            subtopic_id=st_answer.id, difficulty="medium", order_index=3,
            concepts=["binary search on answer", "greedy"],
            description=(
                "Koko has `piles` of bananas and `h` hours. She eats at speed `k` bananas/hour "
                "(one pile per hour, leftovers don't carry). Find the minimum integer `k` such that "
                "she finishes all piles within `h` hours."
            ),
            starter_code=(
                "import math\n\n"
                "def minEatingSpeed(piles: list[int], h: int) -> int:\n"
                "    # Your code here\n"
                "    pass"
            ),
            solution_code=(
                "import math\n\n"
                "def minEatingSpeed(piles: list[int], h: int) -> int:\n"
                "    l, r = 1, max(piles)\n"
                "    while l < r:\n"
                "        mid = (l + r) // 2\n"
                "        hours = sum(math.ceil(p / mid) for p in piles)\n"
                "        if hours <= h:\n"
                "            r = mid\n"
                "        else:\n"
                "            l = mid + 1\n"
                "    return l"
            ),
            test_cases=[
                {"input": {"piles": [3,6,7,11], "h": 8}, "expected": 4},
                {"input": {"piles": [30,11,23,4,20], "h": 5}, "expected": 30},
                {"input": {"piles": [30,11,23,4,20], "h": 6}, "expected": 23},
            ])

    # ── Stack ─────────────────────────────────────────────────────────────────
    st_basics = _get_st(db, "stack-basics")
    st_mono   = _get_st(db, "monotonic-stack")
    if st_basics:
        _add_if_missing(db, "min-stack",
            title="Min Stack", topic="stack", subtopic_id=st_basics.id,
            difficulty="medium", order_index=1,
            concepts=["stack", "design", "O(1) minimum"],
            description=(
                "Design a stack that supports `push`, `pop`, `top`, and `getMin` — all in **O(1)** time.\n\n"
                "Implement `MinStack` with:\n"
                "- `push(val)`: Push val onto the stack.\n"
                "- `pop()`: Remove the top element.\n"
                "- `top()`: Get the top element.\n"
                "- `getMin()`: Retrieve the minimum element."
            ),
            starter_code=(
                "class MinStack:\n"
                "    def __init__(self):\n"
                "        # Your code here\n"
                "        pass\n\n"
                "    def push(self, val: int) -> None:\n"
                "        pass\n\n"
                "    def pop(self) -> None:\n"
                "        pass\n\n"
                "    def top(self) -> int:\n"
                "        pass\n\n"
                "    def getMin(self) -> int:\n"
                "        pass"
            ),
            solution_code=(
                "class MinStack:\n"
                "    def __init__(self):\n"
                "        self.stack = []\n"
                "        self.min_stack = []\n\n"
                "    def push(self, val: int) -> None:\n"
                "        self.stack.append(val)\n"
                "        m = min(val, self.min_stack[-1] if self.min_stack else val)\n"
                "        self.min_stack.append(m)\n\n"
                "    def pop(self) -> None:\n"
                "        self.stack.pop()\n"
                "        self.min_stack.pop()\n\n"
                "    def top(self) -> int:\n"
                "        return self.stack[-1]\n\n"
                "    def getMin(self) -> int:\n"
                "        return self.min_stack[-1]"
            ),
            test_cases=[
                {"input": {"ops": ["push","push","push","getMin","pop","top","getMin"],
                           "vals": [[-3],[0],[-2],[],[],[],[]]},
                 "expected": [None,None,None,-3,None,0,-2]},
            ])
        _add_if_missing(db, "evaluate-reverse-polish-notation",
            title="Evaluate Reverse Polish Notation", topic="stack",
            subtopic_id=st_basics.id, difficulty="medium", order_index=2,
            concepts=["stack", "expression evaluation"],
            description=(
                "Evaluate an arithmetic expression in Reverse Polish Notation (postfix).\n\n"
                "Valid operators: `+`, `-`, `*`, `/`. Each operand may be an integer or another expression. "
                "Division truncates toward zero.\n\n"
                "**Example:** `['2','1','+','3','*']` → `(2+1)*3 = 9`"
            ),
            starter_code=(
                "def evalRPN(tokens: list[str]) -> int:\n"
                "    # Your code here\n"
                "    pass"
            ),
            solution_code=(
                "def evalRPN(tokens: list[str]) -> int:\n"
                "    stack = []\n"
                "    for t in tokens:\n"
                "        if t in '+-*/':\n"
                "            b, a = stack.pop(), stack.pop()\n"
                "            if t == '+': stack.append(a + b)\n"
                "            elif t == '-': stack.append(a - b)\n"
                "            elif t == '*': stack.append(a * b)\n"
                "            else: stack.append(int(a / b))\n"
                "        else:\n"
                "            stack.append(int(t))\n"
                "    return stack[0]"
            ),
            test_cases=[
                {"input": {"tokens": ["2","1","+","3","*"]}, "expected": 9},
                {"input": {"tokens": ["4","13","5","/","+"]}, "expected": 6},
                {"input": {"tokens": ["10","6","9","3","+","-11","*","/","*","17","+","5","+"]}, "expected": 22},
            ])
    if st_mono:
        _add_if_missing(db, "daily-temperatures",
            title="Daily Temperatures", topic="stack", subtopic_id=st_mono.id,
            difficulty="medium", order_index=3,
            concepts=["monotonic stack", "next greater element"],
            description=(
                "Given an array of integers `temperatures` representing daily temperatures, return an array "
                "`answer` where `answer[i]` is the number of days you have to wait after day `i` to get a "
                "warmer temperature. If no future day is warmer, `answer[i] = 0`."
            ),
            starter_code=(
                "def dailyTemperatures(temperatures: list[int]) -> list[int]:\n"
                "    # Your code here\n"
                "    pass"
            ),
            solution_code=(
                "def dailyTemperatures(temperatures: list[int]) -> list[int]:\n"
                "    result = [0] * len(temperatures)\n"
                "    stack = []  # stores indices\n"
                "    for i, temp in enumerate(temperatures):\n"
                "        while stack and temperatures[stack[-1]] < temp:\n"
                "            idx = stack.pop()\n"
                "            result[idx] = i - idx\n"
                "        stack.append(i)\n"
                "    return result"
            ),
            test_cases=[
                {"input": {"temperatures": [73,74,75,71,69,72,76,73]}, "expected": [1,1,4,2,1,1,0,0]},
                {"input": {"temperatures": [30,40,50,60]}, "expected": [1,1,1,0]},
                {"input": {"temperatures": [30,60,90]}, "expected": [1,1,0]},
            ])

    # ── Linked List ───────────────────────────────────────────────────────────
    st_ll = _get_st(db, "ll-traversal-reversal")
    if st_ll:
        _add_if_missing(db, "merge-two-sorted-lists",
            title="Merge Two Sorted Lists", topic="linked-list", subtopic_id=st_ll.id,
            difficulty="easy", order_index=1,
            concepts=["linked list", "merge", "two pointers"],
            description=(
                "Given the heads of two sorted linked lists `list1` and `list2`, merge them into "
                "one sorted list and return its head."
            ),
            starter_code=(
                "class ListNode:\n"
                "    def __init__(self, val=0, next=None):\n"
                "        self.val = val\n"
                "        self.next = next\n\n"
                "def mergeTwoLists(list1, list2):\n"
                "    # Your code here\n"
                "    pass"
            ),
            solution_code=(
                "def mergeTwoLists(list1, list2):\n"
                "    dummy = ListNode()\n"
                "    curr = dummy\n"
                "    while list1 and list2:\n"
                "        if list1.val <= list2.val:\n"
                "            curr.next = list1\n"
                "            list1 = list1.next\n"
                "        else:\n"
                "            curr.next = list2\n"
                "            list2 = list2.next\n"
                "        curr = curr.next\n"
                "    curr.next = list1 or list2\n"
                "    return dummy.next"
            ),
            test_cases=[
                {"input": {"l1": [1,2,4], "l2": [1,3,4]}, "expected": [1,1,2,3,4,4]},
                {"input": {"l1": [], "l2": []}, "expected": []},
                {"input": {"l1": [], "l2": [0]}, "expected": [0]},
            ])
        _add_if_missing(db, "linked-list-cycle",
            title="Linked List Cycle", topic="linked-list", subtopic_id=st_ll.id,
            difficulty="easy", order_index=2,
            concepts=["fast & slow pointers", "cycle detection", "Floyd's algorithm"],
            description=(
                "Given the head of a linked list, determine if it contains a cycle.\n\n"
                "A cycle exists if a node can be reached again by following `next` pointers. "
                "Return `true` if there is a cycle, `false` otherwise.\n\n"
                "Use **O(1) memory** (no hash set)."
            ),
            starter_code=(
                "class ListNode:\n"
                "    def __init__(self, val=0, next=None):\n"
                "        self.val = val\n"
                "        self.next = next\n\n"
                "def hasCycle(head) -> bool:\n"
                "    # Your code here\n"
                "    pass"
            ),
            solution_code=(
                "def hasCycle(head) -> bool:\n"
                "    slow = fast = head\n"
                "    while fast and fast.next:\n"
                "        slow = slow.next\n"
                "        fast = fast.next.next\n"
                "        if slow is fast:\n"
                "            return True\n"
                "    return False"
            ),
            test_cases=[
                {"input": {"vals": [3,2,0,-4], "pos": 1}, "expected": True},
                {"input": {"vals": [1,2], "pos": 0}, "expected": True},
                {"input": {"vals": [1], "pos": -1}, "expected": False},
            ])
        _add_if_missing(db, "remove-nth-node-from-end",
            title="Remove Nth Node From End of List", topic="linked-list",
            subtopic_id=st_ll.id, difficulty="medium", order_index=3,
            concepts=["two pointers", "linked list", "one pass"],
            description=(
                "Given the head of a linked list, remove the `n`-th node from the end of the list "
                "and return its head.\n\nSolve it in **one pass**."
            ),
            starter_code=(
                "class ListNode:\n"
                "    def __init__(self, val=0, next=None):\n"
                "        self.val = val\n"
                "        self.next = next\n\n"
                "def removeNthFromEnd(head, n: int):\n"
                "    # Your code here\n"
                "    pass"
            ),
            solution_code=(
                "def removeNthFromEnd(head, n: int):\n"
                "    dummy = ListNode(0, head)\n"
                "    fast = slow = dummy\n"
                "    for _ in range(n + 1):\n"
                "        fast = fast.next\n"
                "    while fast:\n"
                "        fast = fast.next\n"
                "        slow = slow.next\n"
                "    slow.next = slow.next.next\n"
                "    return dummy.next"
            ),
            test_cases=[
                {"input": {"vals": [1,2,3,4,5], "n": 2}, "expected": [1,2,3,5]},
                {"input": {"vals": [1], "n": 1}, "expected": []},
                {"input": {"vals": [1,2], "n": 1}, "expected": [1]},
            ])

    # ── Trees ─────────────────────────────────────────────────────────────────
    st_dfs = _get_st(db, "tree-dfs")
    st_bfs = _get_st(db, "tree-bfs")
    if st_dfs:
        _add_if_missing(db, "same-tree",
            title="Same Tree", topic="trees", subtopic_id=st_dfs.id,
            difficulty="easy", order_index=2,
            concepts=["tree", "recursion", "DFS"],
            description=(
                "Given the roots of two binary trees `p` and `q`, write a function to check if they are "
                "the same tree.\n\nTwo trees are the same if they are structurally identical and all nodes "
                "have the same value."
            ),
            starter_code=(
                "def isSameTree(p, q) -> bool:\n"
                "    # Your code here\n"
                "    pass"
            ),
            solution_code=(
                "def isSameTree(p, q) -> bool:\n"
                "    if not p and not q: return True\n"
                "    if not p or not q: return False\n"
                "    if p.val != q.val: return False\n"
                "    return isSameTree(p.left, q.left) and isSameTree(p.right, q.right)"
            ),
            test_cases=[
                {"input": {"p": [1,2,3], "q": [1,2,3]}, "expected": True},
                {"input": {"p": [1,2], "q": [1,None,2]}, "expected": False},
                {"input": {"p": [1,2,1], "q": [1,1,2]}, "expected": False},
            ])
        _add_if_missing(db, "diameter-of-binary-tree",
            title="Diameter of Binary Tree", topic="trees", subtopic_id=st_dfs.id,
            difficulty="easy", order_index=3,
            concepts=["tree", "DFS", "postorder", "path through root"],
            description=(
                "Given the root of a binary tree, return the length of the **diameter** — the longest path "
                "between any two nodes.\n\nThe path may or may not pass through the root. "
                "Length = number of edges."
            ),
            starter_code=(
                "def diameterOfBinaryTree(root) -> int:\n"
                "    # Your code here\n"
                "    pass"
            ),
            solution_code=(
                "def diameterOfBinaryTree(root) -> int:\n"
                "    best = [0]\n"
                "    def depth(node):\n"
                "        if not node: return 0\n"
                "        l, r = depth(node.left), depth(node.right)\n"
                "        best[0] = max(best[0], l + r)\n"
                "        return 1 + max(l, r)\n"
                "    depth(root)\n"
                "    return best[0]"
            ),
            test_cases=[
                {"input": {"vals": [1,2,3,4,5]}, "expected": 3},
                {"input": {"vals": [1,2]}, "expected": 1},
            ])
        _add_if_missing(db, "lowest-common-ancestor-bst",
            title="Lowest Common Ancestor of a BST", topic="trees", subtopic_id=st_dfs.id,
            difficulty="medium", order_index=5,
            concepts=["BST", "DFS", "LCA"],
            description=(
                "Given a Binary Search Tree, find the lowest common ancestor (LCA) of two nodes `p` and `q`.\n\n"
                "The LCA is the lowest node that has both `p` and `q` as descendants "
                "(a node can be a descendant of itself).\n\n"
                "Use BST properties to find it in O(h) without visiting every node."
            ),
            starter_code=(
                "def lowestCommonAncestor(root, p, q):\n"
                "    # Your code here\n"
                "    pass"
            ),
            solution_code=(
                "def lowestCommonAncestor(root, p, q):\n"
                "    while root:\n"
                "        if p.val < root.val and q.val < root.val:\n"
                "            root = root.left\n"
                "        elif p.val > root.val and q.val > root.val:\n"
                "            root = root.right\n"
                "        else:\n"
                "            return root"
            ),
            test_cases=[
                {"input": {"vals": [6,2,8,0,4,7,9,None,None,3,5], "p": 2, "q": 8}, "expected": 6},
                {"input": {"vals": [6,2,8,0,4,7,9,None,None,3,5], "p": 2, "q": 4}, "expected": 2},
            ])
    if st_bfs:
        _add_if_missing(db, "binary-tree-level-order-traversal",
            title="Binary Tree Level Order Traversal", topic="trees", subtopic_id=st_bfs.id,
            difficulty="medium", order_index=4,
            concepts=["BFS", "level order", "queue"],
            description=(
                "Given the root of a binary tree, return the level order traversal of its nodes' values "
                "(i.e., from left to right, level by level)."
            ),
            starter_code=(
                "from collections import deque\n\n"
                "def levelOrder(root) -> list[list[int]]:\n"
                "    # Your code here\n"
                "    pass"
            ),
            solution_code=(
                "from collections import deque\n\n"
                "def levelOrder(root) -> list[list[int]]:\n"
                "    if not root: return []\n"
                "    result = []\n"
                "    queue = deque([root])\n"
                "    while queue:\n"
                "        level = []\n"
                "        for _ in range(len(queue)):\n"
                "            node = queue.popleft()\n"
                "            level.append(node.val)\n"
                "            if node.left: queue.append(node.left)\n"
                "            if node.right: queue.append(node.right)\n"
                "        result.append(level)\n"
                "    return result"
            ),
            test_cases=[
                {"input": {"vals": [3,9,20,None,None,15,7]}, "expected": [[3],[9,20],[15,7]]},
                {"input": {"vals": [1]}, "expected": [[1]]},
                {"input": {"vals": []}, "expected": []},
            ])

    # ── Dynamic Programming ───────────────────────────────────────────────────
    st_1d = _get_st(db, "dp-1d")
    st_2d = _get_st(db, "dp-2d")
    if st_1d:
        _add_if_missing(db, "coin-change",
            title="Coin Change", topic="dynamic-programming", subtopic_id=st_1d.id,
            difficulty="medium", order_index=2,
            concepts=["dynamic programming", "unbounded knapsack", "BFS"],
            description=(
                "Given an array of coin denominations `coins` and an amount `amount`, return the **fewest "
                "number of coins** needed to make up that amount.\n\n"
                "Return `-1` if the amount cannot be made with the given coins. You may use each coin "
                "unlimited times."
            ),
            starter_code=(
                "def coinChange(coins: list[int], amount: int) -> int:\n"
                "    # Your code here\n"
                "    pass"
            ),
            solution_code=(
                "def coinChange(coins: list[int], amount: int) -> int:\n"
                "    dp = [float('inf')] * (amount + 1)\n"
                "    dp[0] = 0\n"
                "    for a in range(1, amount + 1):\n"
                "        for c in coins:\n"
                "            if a - c >= 0:\n"
                "                dp[a] = min(dp[a], 1 + dp[a - c])\n"
                "    return dp[amount] if dp[amount] != float('inf') else -1"
            ),
            test_cases=[
                {"input": {"coins": [1,5,10,25], "amount": 41}, "expected": 4},
                {"input": {"coins": [2], "amount": 3}, "expected": -1},
                {"input": {"coins": [1], "amount": 0}, "expected": 0},
            ])
        _add_if_missing(db, "word-break",
            title="Word Break", topic="dynamic-programming", subtopic_id=st_1d.id,
            difficulty="medium", order_index=5,
            concepts=["dynamic programming", "hash set", "string DP"],
            description=(
                "Given a string `s` and a dictionary of strings `wordDict`, return `true` if `s` can be "
                "segmented into a space-separated sequence of one or more dictionary words."
            ),
            starter_code=(
                "def wordBreak(s: str, wordDict: list[str]) -> bool:\n"
                "    # Your code here\n"
                "    pass"
            ),
            solution_code=(
                "def wordBreak(s: str, wordDict: list[str]) -> bool:\n"
                "    words = set(wordDict)\n"
                "    dp = [False] * (len(s) + 1)\n"
                "    dp[0] = True\n"
                "    for i in range(1, len(s) + 1):\n"
                "        for j in range(i):\n"
                "            if dp[j] and s[j:i] in words:\n"
                "                dp[i] = True\n"
                "                break\n"
                "    return dp[len(s)]"
            ),
            test_cases=[
                {"input": {"s": "leetcode", "wordDict": ["leet","code"]}, "expected": True},
                {"input": {"s": "applepenapple", "wordDict": ["apple","pen"]}, "expected": True},
                {"input": {"s": "catsandog", "wordDict": ["cats","dog","sand","and","cat"]}, "expected": False},
            ])
    if st_2d:
        _add_if_missing(db, "unique-paths",
            title="Unique Paths", topic="dynamic-programming", subtopic_id=st_2d.id,
            difficulty="medium", order_index=3,
            concepts=["2D DP", "grid", "counting paths"],
            description=(
                "A robot is on an `m x n` grid at the top-left. It can only move right or down. "
                "How many unique paths are there to reach the bottom-right corner?"
            ),
            starter_code=(
                "def uniquePaths(m: int, n: int) -> int:\n"
                "    # Your code here\n"
                "    pass"
            ),
            solution_code=(
                "def uniquePaths(m: int, n: int) -> int:\n"
                "    dp = [[1] * n for _ in range(m)]\n"
                "    for i in range(1, m):\n"
                "        for j in range(1, n):\n"
                "            dp[i][j] = dp[i-1][j] + dp[i][j-1]\n"
                "    return dp[m-1][n-1]"
            ),
            test_cases=[
                {"input": {"m": 3, "n": 7}, "expected": 28},
                {"input": {"m": 3, "n": 2}, "expected": 3},
                {"input": {"m": 1, "n": 1}, "expected": 1},
            ])
        _add_if_missing(db, "longest-common-subsequence",
            title="Longest Common Subsequence", topic="dynamic-programming", subtopic_id=st_2d.id,
            difficulty="medium", order_index=4,
            concepts=["2D DP", "string DP", "subsequence"],
            description=(
                "Given two strings `text1` and `text2`, return the length of their longest common subsequence.\n\n"
                "A subsequence is derived by deleting some (or no) characters without changing the order "
                "of the remaining characters."
            ),
            starter_code=(
                "def longestCommonSubsequence(text1: str, text2: str) -> int:\n"
                "    # Your code here\n"
                "    pass"
            ),
            solution_code=(
                "def longestCommonSubsequence(text1: str, text2: str) -> int:\n"
                "    m, n = len(text1), len(text2)\n"
                "    dp = [[0] * (n + 1) for _ in range(m + 1)]\n"
                "    for i in range(1, m + 1):\n"
                "        for j in range(1, n + 1):\n"
                "            if text1[i-1] == text2[j-1]:\n"
                "                dp[i][j] = 1 + dp[i-1][j-1]\n"
                "            else:\n"
                "                dp[i][j] = max(dp[i-1][j], dp[i][j-1])\n"
                "    return dp[m][n]"
            ),
            test_cases=[
                {"input": {"text1": "abcde", "text2": "ace"}, "expected": 3},
                {"input": {"text1": "abc", "text2": "abc"}, "expected": 3},
                {"input": {"text1": "abc", "text2": "def"}, "expected": 0},
            ])

    db.commit()
    print("Extra DSA problems added (or already present).")


def seed():
    db = SessionLocal()
    try:
        if db.query(models.Topic).filter_by(slug="arrays-hashing").first():
            print("DSA course already seeded.")
            _add_extra_problems(db)
            return

        # ─────────────────────────────────────────────────────────────────────
        # TOPIC 1 — Arrays & Hashing  (level 0)
        # ─────────────────────────────────────────────────────────────────────
        t1 = models.Topic(slug="arrays-hashing", title="Arrays & Hashing",
            description="The bedrock of DSA. Learn how to store, access, and look up data in O(1) with hash maps.",
            icon="🗂️", color="sky", level=0, position_in_level=0,
            prerequisites=[], course="main")
        db.add(t1); db.flush()

        st1a = models.SubTopic(topic_id=t1.id, slug="array-basics", title="Array Fundamentals", order_index=0,
            description="How arrays work in memory, index access, and common traversal patterns.")
        st1b = models.SubTopic(topic_id=t1.id, slug="hash-maps", title="Hash Maps & Sets", order_index=1,
            description="O(1) lookup with hash maps. Frequency counting, existence checks, grouping.")
        st1c = models.SubTopic(topic_id=t1.id, slug="two-sum-pattern", title="The Two-Sum Pattern", order_index=2,
            description="Complement lookup — the pattern behind hundreds of interview problems.")
        db.add_all([st1a, st1b, st1c]); db.flush()

        db.add_all([
            models.PlayCard(subtopic_id=st1a.id, order_index=0, title="Arrays in Memory",
                content="## Arrays in Memory\n\nAn array stores elements **contiguously** in memory.\n\n```\nindex:  0    1    2    3\nvalue: [10] [20] [30] [40]\naddr:  100  104  108  112\n```\n\nBecause each element is the same size, accessing `arr[i]` is instant:\n```\naddress = base_address + i × element_size\n```\n\nThis is why **array access is O(1)** regardless of size.\n\n**Key operations:**\n- Access: O(1)\n- Search: O(n)\n- Insert at end: O(1) amortized\n- Insert at middle: O(n) — must shift elements"),
            models.PlayCard(subtopic_id=st1a.id, order_index=1, title="Traversal Patterns",
                content="## Traversal Patterns\n\n**Forward traversal** — most common:\n```python\nfor i in range(len(arr)):\n    print(arr[i])\n```\n\n**Reverse traversal:**\n```python\nfor i in range(len(arr)-1, -1, -1):\n    print(arr[i])\n```\n\n**Track both index and value** (use enumerate):\n```python\nfor i, val in enumerate(arr):\n    print(f'index {i} = {val}')\n```\n\n**When to use index vs value:**\n- Need to compare neighbors → use index (`arr[i]` vs `arr[i+1]`)\n- Just processing values → use `for val in arr`"),
            models.PlayCard(subtopic_id=st1b.id, order_index=0, title="How Hash Maps Work",
                content="## How Hash Maps Work\n\nA hash map converts a **key** into an **index** using a hash function.\n\n```\nhash('apple') → 3  →  store at bucket 3\nhash('banana') → 7 →  store at bucket 7\n```\n\nLookup, insert, delete are all **O(1) average**.\n\n```python\n# Python dict is a hash map\ncount = {}\ncount['a'] = 1       # insert\ncount['a'] += 1      # update\nval = count.get('a', 0)  # lookup with default\n'a' in count         # existence check O(1)\n```\n\n**Hash set** = hash map with no values, just keys. Use for fast existence checks:\n```python\nseen = set()\nseen.add(5)\n5 in seen   # O(1)\n```"),
            models.PlayCard(subtopic_id=st1b.id, order_index=1, title="Frequency Counting",
                content="## Frequency Counting\n\nCount occurrences of each element in O(n):\n\n```python\ndef count_freq(arr):\n    freq = {}\n    for x in arr:\n        freq[x] = freq.get(x, 0) + 1\n    return freq\n\ncount_freq([1,2,2,3,3,3])\n# → {1: 1, 2: 2, 3: 3}\n```\n\n**Shortcut with Counter:**\n```python\nfrom collections import Counter\nCounter([1,2,2,3,3,3])\n# → Counter({3: 3, 2: 2, 1: 1})\n```\n\n**Common use cases:**\n- Check if two strings are anagrams (same char frequencies)\n- Find the most common element\n- Check if array has duplicates"),
            models.PlayCard(subtopic_id=st1c.id, order_index=0, title="The Complement Trick",
                content="## The Complement Trick\n\n**Problem:** Find two numbers in an array that sum to a target.\n\n**Brute force** — O(n²):\n```python\nfor i in range(len(arr)):\n    for j in range(i+1, len(arr)):\n        if arr[i] + arr[j] == target:\n            return [i, j]\n```\n\n**Hash map approach** — O(n):\n```python\ndef two_sum(nums, target):\n    seen = {}  # value → index\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n        seen[num] = i\n```\n\n**The insight:** Instead of asking *\"does any other number pair with me?\"*, ask *\"has my complement already been seen?\"* — one pass, O(1) lookup each time."),
        ])

        db.add_all([
            models.Problem(slug="contains-duplicate", title="Contains Duplicate",
                topic="arrays-hashing", subtopic_id=st1b.id, difficulty="easy", order_index=0,
                concepts=["hash set", "deduplication"],
                description="Given an integer array `nums`, return `true` if any value appears **at least twice**, and `false` if every element is distinct.",
                starter_code="def containsDuplicate(nums: list[int]) -> bool:\n    # Your code here\n    pass",
                solution_code="def containsDuplicate(nums: list[int]) -> bool:\n    seen = set()\n    for n in nums:\n        if n in seen:\n            return True\n        seen.add(n)\n    return False",
                test_cases=[
                    {"input": {"nums": [1,2,3,1]}, "expected": True},
                    {"input": {"nums": [1,2,3,4]}, "expected": False},
                    {"input": {"nums": [1,1,1,3,3,4,3,2,4,2]}, "expected": True},
                ]),
            models.Problem(slug="two-sum", title="Two Sum",
                topic="arrays-hashing", subtopic_id=st1c.id, difficulty="easy", order_index=1,
                concepts=["hash map", "complement lookup"],
                description="Given an array of integers `nums` and an integer `target`, return the **indices** of the two numbers that add up to `target`. You may assume exactly one solution exists.",
                starter_code="def twoSum(nums: list[int], target: int) -> list[int]:\n    # Your code here\n    pass",
                solution_code="def twoSum(nums: list[int], target: int) -> list[int]:\n    seen = {}\n    for i, num in enumerate(nums):\n        comp = target - num\n        if comp in seen:\n            return [seen[comp], i]\n        seen[num] = i",
                test_cases=[
                    {"input": {"nums": [2,7,11,15], "target": 9}, "expected": [0,1]},
                    {"input": {"nums": [3,2,4], "target": 6}, "expected": [1,2]},
                    {"input": {"nums": [3,3], "target": 6}, "expected": [0,1]},
                ]),
            models.Problem(slug="valid-anagram", title="Valid Anagram",
                topic="arrays-hashing", subtopic_id=st1b.id, difficulty="easy", order_index=2,
                concepts=["frequency count", "hash map"],
                description="Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.",
                starter_code="def isAnagram(s: str, t: str) -> bool:\n    # Your code here\n    pass",
                solution_code="def isAnagram(s: str, t: str) -> bool:\n    if len(s) != len(t): return False\n    count = {}\n    for c in s: count[c] = count.get(c,0) + 1\n    for c in t:\n        if c not in count or count[c] == 0: return False\n        count[c] -= 1\n    return True",
                test_cases=[
                    {"input": {"s": "anagram", "t": "nagaram"}, "expected": True},
                    {"input": {"s": "rat", "t": "car"}, "expected": False},
                    {"input": {"s": "a", "t": "a"}, "expected": True},
                ]),
        ])

        # ─────────────────────────────────────────────────────────────────────
        # TOPIC 2 — Two Pointers  (level 1)
        # ─────────────────────────────────────────────────────────────────────
        t2 = models.Topic(slug="two-pointers", title="Two Pointers",
            description="Eliminate nested loops by moving two indices strategically. Cuts O(n²) down to O(n).",
            icon="👆", color="emerald", level=1, position_in_level=0,
            prerequisites=["arrays-hashing"], course="main")
        db.add(t2); db.flush()

        st2a = models.SubTopic(topic_id=t2.id, slug="opposite-ends", title="Opposite Ends", order_index=0,
            description="Left and right pointers moving toward each other. Used on sorted arrays.")
        st2b = models.SubTopic(topic_id=t2.id, slug="same-direction", title="Same Direction (Fast & Slow)", order_index=1,
            description="Both pointers move forward but at different speeds.")
        db.add_all([st2a, st2b]); db.flush()

        db.add_all([
            models.PlayCard(subtopic_id=st2a.id, order_index=0, title="The Opposite Ends Pattern",
                content="## The Opposite Ends Pattern\n\nStart one pointer at the beginning, one at the end. Move them inward based on a condition.\n\n```python\nleft, right = 0, len(arr) - 1\nwhile left < right:\n    current_sum = arr[left] + arr[right]\n    if current_sum == target:\n        return [left, right]\n    elif current_sum < target:\n        left += 1   # need bigger sum\n    else:\n        right -= 1  # need smaller sum\n```\n\n**Why it works on sorted arrays:** When the sum is too small, moving left pointer right *guarantees* a larger sum. When too large, moving right pointer left *guarantees* a smaller sum — no guessing.\n\n**Time:** O(n) — each pointer moves at most n times total."),
            models.PlayCard(subtopic_id=st2b.id, order_index=0, title="Fast & Slow Pointers",
                content="## Fast & Slow Pointers\n\nOne pointer moves 1 step, another moves 2 steps. Used to detect cycles or find midpoints.\n\n**Find middle of linked list:**\n```python\nslow = fast = head\nwhile fast and fast.next:\n    slow = slow.next\n    fast = fast.next.next\n# slow is now at the middle\n```\n\n**Detect cycle:**\n```python\nslow = fast = head\nwhile fast and fast.next:\n    slow = slow.next\n    fast = fast.next.next\n    if slow == fast:\n        return True  # cycle detected\nreturn False\n```\n\n**Why:** If there's a cycle, fast will lap slow and they'll meet. If no cycle, fast hits null first."),
        ])

        db.add_all([
            models.Problem(slug="valid-palindrome", title="Valid Palindrome",
                topic="two-pointers", subtopic_id=st2a.id, difficulty="easy", order_index=0,
                concepts=["two pointers", "string"],
                description="A phrase is a palindrome if it reads the same forward and backward after converting uppercase to lowercase and removing non-alphanumeric characters. Given a string `s`, return `true` if it is a palindrome.",
                starter_code="def isPalindrome(s: str) -> bool:\n    # Your code here\n    pass",
                solution_code="def isPalindrome(s: str) -> bool:\n    s = [c.lower() for c in s if c.isalnum()]\n    l, r = 0, len(s)-1\n    while l < r:\n        if s[l] != s[r]: return False\n        l += 1; r -= 1\n    return True",
                test_cases=[
                    {"input": {"s": "A man, a plan, a canal: Panama"}, "expected": True},
                    {"input": {"s": "race a car"}, "expected": False},
                    {"input": {"s": " "}, "expected": True},
                ]),
            models.Problem(slug="two-sum-ii", title="Two Sum II — Sorted Array",
                topic="two-pointers", subtopic_id=st2a.id, difficulty="medium", order_index=1,
                concepts=["two pointers", "sorted array"],
                description="Given a **1-indexed** sorted array `numbers`, find two numbers that add up to `target`. Return their indices. You must use O(1) extra space.",
                starter_code="def twoSum(numbers: list[int], target: int) -> list[int]:\n    # Your code here\n    pass",
                solution_code="def twoSum(numbers: list[int], target: int) -> list[int]:\n    l, r = 0, len(numbers)-1\n    while l < r:\n        s = numbers[l] + numbers[r]\n        if s == target: return [l+1, r+1]\n        elif s < target: l += 1\n        else: r -= 1",
                test_cases=[
                    {"input": {"numbers": [2,7,11,15], "target": 9}, "expected": [1,2]},
                    {"input": {"numbers": [2,3,4], "target": 6}, "expected": [1,3]},
                    {"input": {"numbers": [-1,0], "target": -1}, "expected": [1,2]},
                ]),
        ])

        # ─────────────────────────────────────────────────────────────────────
        # TOPIC 3 — Sliding Window  (level 1)
        # ─────────────────────────────────────────────────────────────────────
        t3 = models.Topic(slug="sliding-window", title="Sliding Window",
            description="Process subarrays/substrings in O(n) by maintaining a window that expands and shrinks.",
            icon="🪟", color="violet", level=1, position_in_level=1,
            prerequisites=["arrays-hashing"], course="main")
        db.add(t3); db.flush()

        st3a = models.SubTopic(topic_id=t3.id, slug="fixed-window", title="Fixed-Size Window", order_index=0,
            description="Window size stays constant. Slide it across the array in one pass.")
        st3b = models.SubTopic(topic_id=t3.id, slug="variable-window", title="Variable-Size Window", order_index=1,
            description="Expand right, shrink left when a constraint is violated.")
        db.add_all([st3a, st3b]); db.flush()

        db.add_all([
            models.PlayCard(subtopic_id=st3a.id, order_index=0, title="Fixed Window Template",
                content="## Fixed Window Template\n\n**Goal:** process every subarray of size k in O(n).\n\n```python\ndef max_sum_subarray(arr, k):\n    # Build first window\n    window_sum = sum(arr[:k])\n    max_sum = window_sum\n\n    # Slide: add new element, remove old\n    for i in range(k, len(arr)):\n        window_sum += arr[i]       # expand right\n        window_sum -= arr[i - k]   # shrink left\n        max_sum = max(max_sum, window_sum)\n\n    return max_sum\n```\n\n**Key insight:** Rather than recomputing the sum from scratch each time (O(n·k)), we *slide* the window by adding one element and removing one — keeping it O(n).\n\n**When to use:** Fixed window size is given in the problem."),
            models.PlayCard(subtopic_id=st3b.id, order_index=0, title="Variable Window Template",
                content="## Variable Window Template\n\n**Goal:** find the longest/shortest subarray satisfying a condition.\n\n```python\ndef longest_subarray_without_repeats(s):\n    seen = {}\n    left = 0\n    best = 0\n\n    for right in range(len(s)):\n        # If constraint violated, shrink from left\n        if s[right] in seen and seen[s[right]] >= left:\n            left = seen[s[right]] + 1\n\n        seen[s[right]] = right\n        best = max(best, right - left + 1)\n\n    return best\n```\n\n**Pattern:**\n1. Expand `right` every iteration\n2. When constraint violated → move `left` forward until valid again\n3. Record answer at each step\n\n**Window size** = `right - left + 1`"),
        ])

        db.add_all([
            models.Problem(slug="best-time-to-buy-sell-stock", title="Best Time to Buy and Sell Stock",
                topic="sliding-window", subtopic_id=st3a.id, difficulty="easy", order_index=0,
                concepts=["sliding window", "greedy"],
                description="Given an array `prices` where `prices[i]` is the price of a stock on day `i`, return the maximum profit you can achieve from one buy and one sell. Return `0` if no profit is possible.",
                starter_code="def maxProfit(prices: list[int]) -> int:\n    # Your code here\n    pass",
                solution_code="def maxProfit(prices: list[int]) -> int:\n    min_price = float('inf')\n    max_profit = 0\n    for p in prices:\n        min_price = min(min_price, p)\n        max_profit = max(max_profit, p - min_price)\n    return max_profit",
                test_cases=[
                    {"input": {"prices": [7,1,5,3,6,4]}, "expected": 5},
                    {"input": {"prices": [7,6,4,3,1]}, "expected": 0},
                    {"input": {"prices": [1,2]}, "expected": 1},
                ]),
            models.Problem(slug="longest-substring-without-repeating", title="Longest Substring Without Repeating Characters",
                topic="sliding-window", subtopic_id=st3b.id, difficulty="medium", order_index=1,
                concepts=["sliding window", "hash map"],
                description="Given a string `s`, find the length of the longest substring without repeating characters.",
                starter_code="def lengthOfLongestSubstring(s: str) -> int:\n    # Your code here\n    pass",
                solution_code="def lengthOfLongestSubstring(s: str) -> int:\n    seen = {}\n    left = best = 0\n    for right, c in enumerate(s):\n        if c in seen and seen[c] >= left:\n            left = seen[c] + 1\n        seen[c] = right\n        best = max(best, right - left + 1)\n    return best",
                test_cases=[
                    {"input": {"s": "abcabcbb"}, "expected": 3},
                    {"input": {"s": "bbbbb"}, "expected": 1},
                    {"input": {"s": "pwwkew"}, "expected": 3},
                ]),
        ])

        # ─────────────────────────────────────────────────────────────────────
        # TOPIC 4 — Binary Search  (level 2)
        # ─────────────────────────────────────────────────────────────────────
        t4 = models.Topic(slug="binary-search", title="Binary Search",
            description="Halve the search space every step. Turns O(n) lookups into O(log n).",
            icon="🔍", color="amber", level=2, position_in_level=0,
            prerequisites=["two-pointers"], course="main")
        db.add(t4); db.flush()

        st4a = models.SubTopic(topic_id=t4.id, slug="classic-binary-search", title="Classic Binary Search", order_index=0,
            description="The template, the off-by-one traps, and why mid is calculated the way it is.")
        st4b = models.SubTopic(topic_id=t4.id, slug="search-on-answer", title="Search on Answer Space", order_index=1,
            description="Apply binary search to a range of answers, not just an array.")
        db.add_all([st4a, st4b]); db.flush()

        db.add_all([
            models.PlayCard(subtopic_id=st4a.id, order_index=0, title="The Binary Search Template",
                content="## The Binary Search Template\n\n```python\ndef binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n\n    while left <= right:\n        mid = left + (right - left) // 2  # avoid overflow\n\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1   # target is in right half\n        else:\n            right = mid - 1  # target is in left half\n\n    return -1  # not found\n```\n\n**Why `left + (right - left) // 2`?**\nIn languages with integer overflow (Java, C++), `(left + right) // 2` can overflow. This form is always safe.\n\n**Why `left <= right`?**\nWe stop when the search space is empty (left > right). Using `<` would miss the case where one element remains."),
            models.PlayCard(subtopic_id=st4b.id, order_index=0, title="Bisecting the Answer",
                content="## Bisecting the Answer\n\nWhen a problem asks *\"find the minimum X such that condition(X) is true\"*, binary search the answer range.\n\n**Template:**\n```python\ndef solve(data):\n    left, right = min_possible_answer, max_possible_answer\n\n    while left < right:\n        mid = (left + right) // 2\n        if condition(mid, data):\n            right = mid      # mid works, try smaller\n        else:\n            left = mid + 1   # mid doesn't work, go bigger\n\n    return left\n```\n\n**Example:** *Koko eats bananas — find minimum eating speed.*\n- Answer range: [1, max(piles)]\n- Condition: can finish all piles in h hours at speed mid?\n- Binary search that range instead of trying every speed."),
        ])

        db.add_all([
            models.Problem(slug="binary-search-basic", title="Binary Search",
                topic="binary-search", subtopic_id=st4a.id, difficulty="easy", order_index=0,
                concepts=["binary search"],
                description="Given a sorted array of distinct integers `nums` and a target, return the index of `target` or `-1` if not found. You must write an O(log n) algorithm.",
                starter_code="def search(nums: list[int], target: int) -> int:\n    # Your code here\n    pass",
                solution_code="def search(nums: list[int], target: int) -> int:\n    l, r = 0, len(nums)-1\n    while l <= r:\n        mid = l + (r-l)//2\n        if nums[mid] == target: return mid\n        elif nums[mid] < target: l = mid+1\n        else: r = mid-1\n    return -1",
                test_cases=[
                    {"input": {"nums": [-1,0,3,5,9,12], "target": 9}, "expected": 4},
                    {"input": {"nums": [-1,0,3,5,9,12], "target": 2}, "expected": -1},
                    {"input": {"nums": [5], "target": 5}, "expected": 0},
                ]),
            models.Problem(slug="search-rotated-array", title="Search in Rotated Sorted Array",
                topic="binary-search", subtopic_id=st4a.id, difficulty="medium", order_index=1,
                concepts=["binary search", "rotated array"],
                description="An integer array `nums` was sorted then rotated at some pivot. Given `nums` and a `target`, return its index or `-1` if not found. You must achieve O(log n).",
                starter_code="def search(nums: list[int], target: int) -> int:\n    # Your code here\n    pass",
                solution_code="def search(nums: list[int], target: int) -> int:\n    l, r = 0, len(nums)-1\n    while l <= r:\n        mid = (l+r)//2\n        if nums[mid] == target: return mid\n        if nums[l] <= nums[mid]:\n            if nums[l] <= target < nums[mid]: r = mid-1\n            else: l = mid+1\n        else:\n            if nums[mid] < target <= nums[r]: l = mid+1\n            else: r = mid-1\n    return -1",
                test_cases=[
                    {"input": {"nums": [4,5,6,7,0,1,2], "target": 0}, "expected": 4},
                    {"input": {"nums": [4,5,6,7,0,1,2], "target": 3}, "expected": -1},
                    {"input": {"nums": [1], "target": 0}, "expected": -1},
                ]),
        ])

        # ─────────────────────────────────────────────────────────────────────
        # TOPIC 5 — Stack  (level 2)
        # ─────────────────────────────────────────────────────────────────────
        t5 = models.Topic(slug="stack", title="Stack",
            description="LIFO data structure that powers undo systems, expression parsing, and monotonic patterns.",
            icon="📚", color="rose", level=2, position_in_level=1,
            prerequisites=["arrays-hashing"], course="main")
        db.add(t5); db.flush()

        st5a = models.SubTopic(topic_id=t5.id, slug="stack-basics", title="Stack Fundamentals", order_index=0,
            description="Push, pop, peek and when to reach for a stack.")
        st5b = models.SubTopic(topic_id=t5.id, slug="monotonic-stack", title="Monotonic Stack", order_index=1,
            description="Maintaining a sorted stack to find next greater/smaller elements in O(n).")
        db.add_all([st5a, st5b]); db.flush()

        db.add_all([
            models.PlayCard(subtopic_id=st5a.id, order_index=0, title="Stack Fundamentals",
                content="## Stack Fundamentals\n\nA stack is **Last In, First Out (LIFO)**. The last element pushed is the first popped.\n\n```python\nstack = []\nstack.append(1)   # push  → [1]\nstack.append(2)   # push  → [1, 2]\nstack.append(3)   # push  → [1, 2, 3]\nstack.pop()       # pop   → returns 3, stack = [1, 2]\nstack[-1]         # peek  → 2 (no remove)\n```\n\n**When to use a stack:**\n- Need to reverse something\n- Need to match opening/closing pairs (brackets, tags)\n- Undo/redo operations\n- Tracking \"previous\" state while going forward\n- Parsing expressions\n\n**All operations are O(1).**"),
            models.PlayCard(subtopic_id=st5b.id, order_index=0, title="Monotonic Stack Pattern",
                content="## Monotonic Stack\n\nMaintain a stack where elements are always in sorted order (either all increasing or all decreasing).\n\n**Next Greater Element** — O(n):\n```python\ndef next_greater(arr):\n    result = [-1] * len(arr)\n    stack = []  # stores indices\n\n    for i, val in enumerate(arr):\n        # Pop everything smaller than current\n        while stack and arr[stack[-1]] < val:\n            idx = stack.pop()\n            result[idx] = val  # current is the next greater\n        stack.append(i)\n\n    return result\n```\n\n**Key insight:** When we see a new element, it *resolves* all previous smaller elements — they've found their \"next greater\". We process each element at most twice (push + pop) → O(n)."),
        ])

        db.add_all([
            models.Problem(slug="valid-parentheses", title="Valid Parentheses",
                topic="stack", subtopic_id=st5a.id, difficulty="easy", order_index=0,
                concepts=["stack", "matching pairs"],
                description="Given a string `s` containing just `(`, `)`, `{`, `}`, `[`, `]`, determine if the input string is valid. Every opening bracket must be closed by the same type in the correct order.",
                starter_code="def isValid(s: str) -> bool:\n    # Your code here\n    pass",
                solution_code="def isValid(s: str) -> bool:\n    stack = []\n    pairs = {')':'(', '}':'{', ']':'['}\n    for c in s:\n        if c in '([{':\n            stack.append(c)\n        elif not stack or stack[-1] != pairs[c]:\n            return False\n        else:\n            stack.pop()\n    return len(stack) == 0",
                test_cases=[
                    {"input": {"s": "()"}, "expected": True},
                    {"input": {"s": "()[]{}"}, "expected": True},
                    {"input": {"s": "(]"}, "expected": False},
                    {"input": {"s": "([)]"}, "expected": False},
                ]),
        ])

        # ─────────────────────────────────────────────────────────────────────
        # TOPIC 6 — Linked List  (level 3)
        # ─────────────────────────────────────────────────────────────────────
        t6 = models.Topic(slug="linked-list", title="Linked List",
            description="Nodes connected by pointers. Master reversal, merging, and cycle detection.",
            icon="🔗", color="indigo", level=3, position_in_level=0,
            prerequisites=["two-pointers"], course="main")
        db.add(t6); db.flush()

        st6a = models.SubTopic(topic_id=t6.id, slug="ll-traversal-reversal", title="Traversal & Reversal", order_index=0,
            description="Iterating a linked list and reversing it in place — the most tested patterns.")
        db.add(st6a); db.flush()

        db.add_all([
            models.PlayCard(subtopic_id=st6a.id, order_index=0, title="Reversing a Linked List",
                content="## Reversing a Linked List\n\nThe classic O(n) in-place reversal:\n\n```python\ndef reverse_list(head):\n    prev = None\n    curr = head\n\n    while curr:\n        next_node = curr.next  # save next\n        curr.next = prev       # reverse pointer\n        prev = curr            # advance prev\n        curr = next_node       # advance curr\n\n    return prev  # new head\n```\n\n**Step by step on `1 → 2 → 3 → None`:**\n```\nprev=None, curr=1:  1→None,  prev=1, curr=2\nprev=1,    curr=2:  2→1,     prev=2, curr=3\nprev=2,    curr=3:  3→2,     prev=3, curr=None\nreturn 3  (new head)\n```\n\n**Three variables, one pass.** This pattern appears in merge, palindrome check, and reorder list problems."),
        ])

        db.add(models.Problem(slug="reverse-linked-list", title="Reverse Linked List",
            topic="linked-list", subtopic_id=st6a.id, difficulty="easy", order_index=0,
            concepts=["linked list", "in-place reversal"],
            description="Given the head of a singly linked list, reverse the list and return the reversed list.",
            starter_code="class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\ndef reverseList(head):\n    # Your code here\n    pass",
            solution_code="def reverseList(head):\n    prev = None\n    curr = head\n    while curr:\n        nxt = curr.next\n        curr.next = prev\n        prev = curr\n        curr = nxt\n    return prev",
            test_cases=[
                {"input": {"vals": [1,2,3,4,5]}, "expected": [5,4,3,2,1]},
                {"input": {"vals": [1,2]}, "expected": [2,1]},
                {"input": {"vals": []}, "expected": []},
            ]))

        # ─────────────────────────────────────────────────────────────────────
        # TOPIC 7 — Trees  (level 3)
        # ─────────────────────────────────────────────────────────────────────
        t7 = models.Topic(slug="trees", title="Trees",
            description="Hierarchical data structures. DFS, BFS, BST properties, and recursive thinking.",
            icon="🌳", color="green", level=3, position_in_level=1,
            prerequisites=["stack", "linked-list"], course="main")
        db.add(t7); db.flush()

        st7a = models.SubTopic(topic_id=t7.id, slug="tree-dfs", title="Tree DFS", order_index=0,
            description="Preorder, inorder, postorder traversals and recursive problem solving.")
        st7b = models.SubTopic(topic_id=t7.id, slug="tree-bfs", title="Tree BFS (Level Order)", order_index=1,
            description="Process a tree level by level using a queue.")
        db.add_all([st7a, st7b]); db.flush()

        db.add_all([
            models.PlayCard(subtopic_id=st7a.id, order_index=0, title="DFS Traversal Orders",
                content="## DFS Traversal Orders\n\nAll three use the same recursive structure — only the *order of the print* changes.\n\n```python\ndef preorder(node):   # Root → Left → Right\n    if not node: return\n    visit(node)\n    preorder(node.left)\n    preorder(node.right)\n\ndef inorder(node):    # Left → Root → Right (gives sorted order for BST)\n    if not node: return\n    inorder(node.left)\n    visit(node)\n    inorder(node.right)\n\ndef postorder(node):  # Left → Right → Root (children before parent)\n    if not node: return\n    postorder(node.left)\n    postorder(node.right)\n    visit(node)\n```\n\n**Rule of thumb:**\n- Preorder → copy/serialize a tree\n- Inorder → get sorted values from BST\n- Postorder → delete a tree, compute subtree properties"),
            models.PlayCard(subtopic_id=st7b.id, order_index=0, title="BFS Level Order",
                content="## BFS Level Order Traversal\n\nUse a queue to process nodes level by level:\n\n```python\nfrom collections import deque\n\ndef level_order(root):\n    if not root: return []\n    result = []\n    queue = deque([root])\n\n    while queue:\n        level_size = len(queue)\n        level = []\n\n        for _ in range(level_size):\n            node = queue.popleft()\n            level.append(node.val)\n            if node.left:  queue.append(node.left)\n            if node.right: queue.append(node.right)\n\n        result.append(level)\n\n    return result\n```\n\n**Key:** snapshot `len(queue)` at the start of each level — that's how many nodes belong to this level. Process exactly that many before moving on."),
        ])

        db.add_all([
            models.Problem(slug="invert-binary-tree", title="Invert Binary Tree",
                topic="trees", subtopic_id=st7a.id, difficulty="easy", order_index=0,
                concepts=["tree", "recursion", "DFS"],
                description="Given the root of a binary tree, invert it (mirror it), and return its root.",
                starter_code="class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\ndef invertTree(root):\n    # Your code here\n    pass",
                solution_code="def invertTree(root):\n    if not root: return None\n    root.left, root.right = invertTree(root.right), invertTree(root.left)\n    return root",
                test_cases=[
                    {"input": {"vals": [4,2,7,1,3,6,9]}, "expected": [4,7,2,9,6,3,1]},
                    {"input": {"vals": [2,1,3]}, "expected": [2,3,1]},
                    {"input": {"vals": []}, "expected": []},
                ]),
            models.Problem(slug="max-depth-binary-tree", title="Maximum Depth of Binary Tree",
                topic="trees", subtopic_id=st7a.id, difficulty="easy", order_index=1,
                concepts=["tree", "recursion", "DFS"],
                description="Given the root of a binary tree, return its maximum depth — the number of nodes along the longest path from root to the farthest leaf.",
                starter_code="def maxDepth(root) -> int:\n    # Your code here\n    pass",
                solution_code="def maxDepth(root) -> int:\n    if not root: return 0\n    return 1 + max(maxDepth(root.left), maxDepth(root.right))",
                test_cases=[
                    {"input": {"vals": [3,9,20,None,None,15,7]}, "expected": 3},
                    {"input": {"vals": [1,None,2]}, "expected": 2},
                    {"input": {"vals": []}, "expected": 0},
                ]),
        ])

        # ─────────────────────────────────────────────────────────────────────
        # TOPIC 8 — Dynamic Programming  (level 4)
        # ─────────────────────────────────────────────────────────────────────
        t8 = models.Topic(slug="dynamic-programming", title="Dynamic Programming",
            description="Break problems into overlapping subproblems. Memoize results, eliminate redundant work.",
            icon="⚡", color="orange", level=4, position_in_level=0,
            prerequisites=["trees", "binary-search"], course="main")
        db.add(t8); db.flush()

        st8a = models.SubTopic(topic_id=t8.id, slug="dp-1d", title="1D Dynamic Programming", order_index=0,
            description="Fibonacci-style DP where each state depends on a few previous states.")
        st8b = models.SubTopic(topic_id=t8.id, slug="dp-2d", title="2D Dynamic Programming", order_index=1,
            description="Grid and string DP where state depends on two dimensions.")
        db.add_all([st8a, st8b]); db.flush()

        db.add_all([
            models.PlayCard(subtopic_id=st8a.id, order_index=0, title="Memoization vs Tabulation",
                content="## Memoization vs Tabulation\n\nBoth avoid recomputing subproblems — they just go in opposite directions.\n\n**Memoization (top-down):** Start from the original problem, recurse, cache results.\n```python\ndef fib(n, memo={}):\n    if n <= 1: return n\n    if n in memo: return memo[n]\n    memo[n] = fib(n-1, memo) + fib(n-2, memo)\n    return memo[n]\n```\n\n**Tabulation (bottom-up):** Start from base cases, build up to answer.\n```python\ndef fib(n):\n    if n <= 1: return n\n    dp = [0] * (n+1)\n    dp[1] = 1\n    for i in range(2, n+1):\n        dp[i] = dp[i-1] + dp[i-2]\n    return dp[n]\n```\n\n**Space optimized** (only need last 2):\n```python\ndef fib(n):\n    a, b = 0, 1\n    for _ in range(n-1):\n        a, b = b, a+b\n    return b\n```"),
            models.PlayCard(subtopic_id=st8b.id, order_index=0, title="2D DP on Grids",
                content="## 2D DP on Grids\n\n**Unique Paths** — how many ways to reach bottom-right of an m×n grid moving only right or down?\n\n```python\ndef unique_paths(m, n):\n    dp = [[1]*n for _ in range(m)]\n\n    for i in range(1, m):\n        for j in range(1, n):\n            dp[i][j] = dp[i-1][j] + dp[i][j-1]\n\n    return dp[m-1][n-1]\n```\n\n**Why:** `dp[i][j]` = paths to reach cell (i,j) = paths from above + paths from left.\n\n**Base case:** Top row and left column are all 1 (only one way to reach them — go straight).\n\n**Pattern:** Define what `dp[i][j]` represents, establish base cases, fill in order such that dependencies are always computed first."),
        ])

        db.add_all([
            models.Problem(slug="climbing-stairs", title="Climbing Stairs",
                topic="dynamic-programming", subtopic_id=st8a.id, difficulty="easy", order_index=0,
                concepts=["dynamic programming", "fibonacci"],
                description="You are climbing a staircase with `n` steps. Each time you can climb 1 or 2 steps. How many distinct ways can you climb to the top?",
                starter_code="def climbStairs(n: int) -> int:\n    # Your code here\n    pass",
                solution_code="def climbStairs(n: int) -> int:\n    if n <= 2: return n\n    a, b = 1, 2\n    for _ in range(n-2):\n        a, b = b, a+b\n    return b",
                test_cases=[
                    {"input": {"n": 2}, "expected": 2},
                    {"input": {"n": 3}, "expected": 3},
                    {"input": {"n": 5}, "expected": 8},
                ]),
            models.Problem(slug="house-robber", title="House Robber",
                topic="dynamic-programming", subtopic_id=st8a.id, difficulty="medium", order_index=1,
                concepts=["dynamic programming", "1D DP"],
                description="You are a robber. Adjacent houses have alarms — you can't rob two adjacent houses. Given an array `nums` of money in each house, return the maximum amount you can rob.",
                starter_code="def rob(nums: list[int]) -> int:\n    # Your code here\n    pass",
                solution_code="def rob(nums: list[int]) -> int:\n    prev2, prev1 = 0, 0\n    for n in nums:\n        prev2, prev1 = prev1, max(prev1, prev2 + n)\n    return prev1",
                test_cases=[
                    {"input": {"nums": [1,2,3,1]}, "expected": 4},
                    {"input": {"nums": [2,7,9,3,1]}, "expected": 12},
                    {"input": {"nums": [2,1]}, "expected": 2},
                ]),
        ])

        db.commit()
        print("DSA course seeded: 8 topics, subtopics, playcards, and problems.")

    finally:
        db.close()

if __name__ == "__main__":
    seed()
