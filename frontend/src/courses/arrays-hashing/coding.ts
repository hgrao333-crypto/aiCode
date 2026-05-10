import type { CodingProblem } from "../types";

export const CODING_PROBLEMS: CodingProblem[] = [
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

export const FINAL_PROBLEM: CodingProblem = {
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
