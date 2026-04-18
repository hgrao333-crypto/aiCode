"""
Local code sandbox — runs user Python code in a subprocess with a timeout.
Safe enough for local dev; replace with Judge0/E2B for production.
"""
import subprocess
import sys
import json
import textwrap


TIMEOUT_SECONDS = 5
MAX_OUTPUT_CHARS = 2000


def run_code(student_code: str, test_cases: list[dict]) -> dict:
    """
    Runs student_code against test_cases.
    Each test case: {"input": <args>, "expected": <value>}
    Returns: {"passed": bool, "results": [...], "error": str|None}
    """
    runner = textwrap.dedent(f"""
import json, sys, types

# Execute student code into an explicit namespace so we can find the function
ns = {{}}
try:
    exec({json.dumps(student_code)}, ns)
except Exception as e:
    print(json.dumps({{"passed": False, "results": [], "error": str(e)}}))
    sys.exit(0)

# Pick the last callable defined in the namespace (skip dunders and imports)
fns = [
    v for k, v in ns.items()
    if isinstance(v, types.FunctionType) and not k.startswith("_")
]
if not fns:
    print(json.dumps({{"passed": False, "results": [], "error": "No function found. Make sure you define a function in your code."}}))
    sys.exit(0)

fn = fns[-1]

test_cases = {json.dumps(test_cases)}
results = []
all_passed = True

for tc in test_cases:
    inp = tc["input"]
    expected = tc["expected"]
    try:
        if isinstance(inp, list):
            actual = fn(*inp)
        elif isinstance(inp, dict):
            actual = fn(**inp)
        else:
            actual = fn(inp)
        passed = actual == expected
        results.append({{"input": inp, "expected": expected, "actual": actual, "passed": passed}})
        if not passed:
            all_passed = False
    except Exception as e:
        results.append({{"input": inp, "expected": expected, "actual": None, "passed": False, "error": str(e)}})
        all_passed = False

print(json.dumps({{"passed": all_passed, "results": results, "error": None}}))
""")

    try:
        proc = subprocess.run(
            [sys.executable, "-c", runner],
            capture_output=True,
            text=True,
            timeout=TIMEOUT_SECONDS,
        )
        stdout = proc.stdout.strip()[:MAX_OUTPUT_CHARS]
        stderr = proc.stderr.strip()[:MAX_OUTPUT_CHARS]

        if proc.returncode != 0 or not stdout:
            return {"passed": False, "results": [], "error": stderr or "Runtime error"}

        return json.loads(stdout)

    except subprocess.TimeoutExpired:
        return {"passed": False, "results": [], "error": f"Time limit exceeded ({TIMEOUT_SECONDS}s)"}
    except Exception as e:
        return {"passed": False, "results": [], "error": str(e)}
