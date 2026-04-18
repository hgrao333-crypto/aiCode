"""Run once to seed the database with Binary Search problems."""
from database import SessionLocal, engine, Base
import models

Base.metadata.create_all(bind=engine)

PROBLEMS = [
    {
        "slug": "binary-search-classic",
        "title": "Binary Search — Classic",
        "description": (
            "Given a sorted array of integers `nums` and a `target`, return the index of `target` "
            "in `nums`. If not found, return -1.\n\n"
            "**Example:**\n```\nnums = [-1, 0, 3, 5, 9, 12], target = 9  →  4\nnums = [-1, 0, 3, 5, 9, 12], target = 2  →  -1\n```\n\n"
            "**Constraints:** 1 ≤ nums.length ≤ 10⁴. All values are unique. Array is sorted ascending."
        ),
        "topic": "binary_search",
        "difficulty": "easy",
        "starter_code": (
            "def search(nums: list[int], target: int) -> int:\n"
            "    # Your code here\n"
            "    pass\n"
        ),
        "solution_code": (
            "def search(nums, target):\n"
            "    left, right = 0, len(nums) - 1\n"
            "    while left <= right:\n"
            "        mid = (left + right) // 2\n"
            "        if nums[mid] == target:\n"
            "            return mid\n"
            "        elif nums[mid] < target:\n"
            "            left = mid + 1\n"
            "        else:\n"
            "            right = mid - 1\n"
            "    return -1\n"
        ),
        "test_cases": [
            {"input": [[-1, 0, 3, 5, 9, 12], 9], "expected": 4},
            {"input": [[-1, 0, 3, 5, 9, 12], 2], "expected": -1},
            {"input": [[5], 5], "expected": 0},
            {"input": [[5], 3], "expected": -1},
            {"input": [[1, 3, 5, 7, 9, 11], 7], "expected": 3},
        ],
        "concepts": ["binary_search", "loop_invariant", "midpoint_calculation"],
        "order_index": 1,
    },
    {
        "slug": "binary-search-first-bad-version",
        "title": "First Bad Version",
        "description": (
            "You are a product manager and n versions `[1, 2, ..., n]` exist. "
            "You want to find the first bad version. A function `is_bad(version)` returns True/False. "
            "All versions after the first bad one are also bad.\n\n"
            "Implement `first_bad_version(n)` that returns the first bad version using the fewest API calls.\n\n"
            "**Example:**\n```\nn = 5, first bad = 4  →  return 4\n```\n\n"
            "**Note:** In this problem, `is_bad` is pre-defined for you."
        ),
        "topic": "binary_search",
        "difficulty": "easy",
        "starter_code": (
            "def first_bad_version(n: int) -> int:\n"
            "    # is_bad(version) is available — returns True if version is bad\n"
            "    # Your code here\n"
            "    pass\n"
        ),
        "solution_code": (
            "def first_bad_version(n):\n"
            "    left, right = 1, n\n"
            "    while left < right:\n"
            "        mid = (left + right) // 2\n"
            "        if is_bad(mid):\n"
            "            right = mid\n"
            "        else:\n"
            "            left = mid + 1\n"
            "    return left\n"
        ),
        "test_cases": [
            {"input": [5], "expected": 4},   # is_bad injected at runtime for this problem
            {"input": [1], "expected": 1},
        ],
        "concepts": ["binary_search", "search_space_reduction", "boundary_conditions"],
        "order_index": 2,
    },
    {
        "slug": "binary-search-find-peak",
        "title": "Find Peak Element",
        "description": (
            "A peak element is one that is strictly greater than its neighbors. "
            "Given an integer array `nums`, find a peak element and return its index. "
            "If multiple peaks exist, return any.\n\n"
            "**Example:**\n```\nnums = [1, 2, 3, 1]  →  2\nnums = [1, 2, 1, 3, 5, 6, 4]  →  5 (or 1)\n```\n\n"
            "**Constraint:** Solve in O(log n) time."
        ),
        "topic": "binary_search",
        "difficulty": "medium",
        "starter_code": (
            "def find_peak_element(nums: list[int]) -> int:\n"
            "    # Your code here\n"
            "    pass\n"
        ),
        "solution_code": (
            "def find_peak_element(nums):\n"
            "    left, right = 0, len(nums) - 1\n"
            "    while left < right:\n"
            "        mid = (left + right) // 2\n"
            "        if nums[mid] > nums[mid + 1]:\n"
            "            right = mid\n"
            "        else:\n"
            "            left = mid + 1\n"
            "    return left\n"
        ),
        "test_cases": [
            {"input": [[1, 2, 3, 1]], "expected": 2},
            {"input": [[1, 2, 1, 3, 5, 6, 4]], "expected": 5},
            {"input": [[1]], "expected": 0},
            {"input": [[3, 2, 1]], "expected": 0},
        ],
        "concepts": ["binary_search", "search_space_reduction", "boundary_conditions"],
        "order_index": 3,
    },
    {
        "slug": "binary-search-search-rotated",
        "title": "Search in Rotated Sorted Array",
        "description": (
            "An integer array `nums` was sorted ascending and then rotated at some pivot. "
            "Given `nums` and `target`, return the index of `target` or -1.\n\n"
            "**Example:**\n```\nnums = [4, 5, 6, 7, 0, 1, 2], target = 0  →  4\nnums = [4, 5, 6, 7, 0, 1, 2], target = 3  →  -1\n```\n\n"
            "**Constraint:** O(log n) time. All values are unique."
        ),
        "topic": "binary_search",
        "difficulty": "medium",
        "starter_code": (
            "def search_rotated(nums: list[int], target: int) -> int:\n"
            "    # Your code here\n"
            "    pass\n"
        ),
        "solution_code": (
            "def search_rotated(nums, target):\n"
            "    left, right = 0, len(nums) - 1\n"
            "    while left <= right:\n"
            "        mid = (left + right) // 2\n"
            "        if nums[mid] == target:\n"
            "            return mid\n"
            "        if nums[left] <= nums[mid]:\n"
            "            if nums[left] <= target < nums[mid]:\n"
            "                right = mid - 1\n"
            "            else:\n"
            "                left = mid + 1\n"
            "        else:\n"
            "            if nums[mid] < target <= nums[right]:\n"
            "                left = mid + 1\n"
            "            else:\n"
            "                right = mid - 1\n"
            "    return -1\n"
        ),
        "test_cases": [
            {"input": [[4, 5, 6, 7, 0, 1, 2], 0], "expected": 4},
            {"input": [[4, 5, 6, 7, 0, 1, 2], 3], "expected": -1},
            {"input": [[1], 0], "expected": -1},
            {"input": [[1, 3], 3], "expected": 1},
        ],
        "concepts": ["binary_search", "loop_invariant", "rotated_array", "boundary_conditions"],
        "order_index": 4,
    },
    {
        "slug": "binary-search-koko-eating",
        "title": "Koko Eating Bananas",
        "description": (
            "Koko has `piles` of bananas and `h` hours. She eats at speed `k` bananas/hour "
            "(one pile per hour, any leftovers carry over). Find the minimum `k` such that she can eat all bananas in `h` hours.\n\n"
            "**Example:**\n```\npiles = [3, 6, 7, 11], h = 8  →  4\npiles = [30, 11, 23, 4, 20], h = 5  →  30\n```"
        ),
        "topic": "binary_search",
        "difficulty": "medium",
        "starter_code": (
            "import math\n\n"
            "def min_eating_speed(piles: list[int], h: int) -> int:\n"
            "    # Your code here\n"
            "    pass\n"
        ),
        "solution_code": (
            "import math\n\n"
            "def min_eating_speed(piles, h):\n"
            "    left, right = 1, max(piles)\n"
            "    while left < right:\n"
            "        mid = (left + right) // 2\n"
            "        hours = sum(math.ceil(p / mid) for p in piles)\n"
            "        if hours <= h:\n"
            "            right = mid\n"
            "        else:\n"
            "            left = mid + 1\n"
            "    return left\n"
        ),
        "test_cases": [
            {"input": [[3, 6, 7, 11], 8], "expected": 4},
            {"input": [[30, 11, 23, 4, 20], 5], "expected": 30},
            {"input": [[1, 1, 1, 1], 4], "expected": 1},
        ],
        "concepts": ["binary_search", "search_space_reduction", "feasibility_check"],
        "order_index": 5,
    },
]


def seed():
    db = SessionLocal()
    try:
        for p in PROBLEMS:
            existing = db.query(models.Problem).filter(models.Problem.slug == p["slug"]).first()
            if not existing:
                prob = models.Problem(**p)
                db.add(prob)
        db.commit()
        print(f"Seeded {len(PROBLEMS)} problems.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
