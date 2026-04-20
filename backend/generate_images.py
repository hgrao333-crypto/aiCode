"""
Generate cover images for topics and subtopics using Gemini image generation.

Usage:
    cd backend
    ./venv/bin/python3 generate_images.py

Reads GEMINI_API_KEY from ../frontend/.env.local
Saves PNG files to ../frontend/public/images/
Idempotent: skips files that already exist.
"""
import os
import re
import base64
import sys
from pathlib import Path

# ── Read Gemini API key from frontend .env.local ───────────────────────────────
env_path = Path(__file__).parent.parent / "frontend" / ".env.local"
gemini_key = None
if env_path.exists():
    for line in env_path.read_text().splitlines():
        if line.startswith("GEMINI_API_KEY="):
            gemini_key = line.split("=", 1)[1].strip()
            break

if not gemini_key:
    print("✗ GEMINI_API_KEY not found in frontend/.env.local")
    sys.exit(1)

from google import genai
from google.genai import types

client = genai.Client(api_key=gemini_key)
MODEL = "imagen-4.0-generate-001"

OUT_DIR = Path(__file__).parent.parent / "frontend" / "public" / "images"
OUT_DIR.mkdir(parents=True, exist_ok=True)

STYLE = (
    "minimalist flat digital illustration, "
    "soft muted palette with emerald green and slate blue accents, "
    "clean geometric shapes, abundant white space, "
    "modern editorial style, no text, no labels, no letters, "
    "subtle shadows, calm and elegant"
)

IMAGES = [
    # ── Topic cover ─────────────────────────────────────────────────────────
    {
        "file": "topic_knapsack.png",
        "prompt": (
            f"A thief's open canvas bag with five floating geometric items around it — "
            f"a golden bar, a small camera, a laptop, a phone, a gem — each a simple flat shape. "
            f"The bag and items are arranged in an elegant composition suggesting choice and selection. {STYLE}"
        ),
    },
    # ── Subtopic covers ──────────────────────────────────────────────────────
    {
        "file": "subtopic_thiefs-choice.png",
        "prompt": (
            f"A single fork in a clean road splitting into two paths, each path leading to a different item — "
            f"one path to a glowing gem, another to an empty silhouette. "
            f"Suggests decision and trade-off. {STYLE}"
        ),
    },
    {
        "file": "subtopic_overlapping-subproblems.png",
        "prompt": (
            f"A tree of overlapping circles connected by arrows, several nodes glowing identically "
            f"to show repeated computation. A memo cache represented as a small grid off to the side. "
            f"Suggests redundancy and caching. {STYLE}"
        ),
    },
    {
        "file": "subtopic_building-the-table.png",
        "prompt": (
            f"A clean 5x5 grid partially filled with soft colored tiles, being filled row by row "
            f"from top-left to bottom-right. A gentle animation-like composition showing progress. "
            f"Suggests systematic tabulation. {STYLE}"
        ),
    },
    {
        "file": "subtopic_one-row-enough.png",
        "prompt": (
            f"A tall stack of horizontal bars collapsing and simplifying into a single glowing bar "
            f"at the bottom. The single bar is highlighted in emerald. "
            f"Suggests space reduction from many to one. {STYLE}"
        ),
    },
    {
        "file": "subtopic_knapsack-variations.png",
        "prompt": (
            f"A central knapsack shape with three branching variations radiating outward — "
            f"one branch shows infinite copies of an item, another shows a boolean yes/no gate, "
            f"another shows fractional splitting. "
            f"Suggests problem variants and pattern recognition. {STYLE}"
        ),
    },
    # ── Playcard illustrations ───────────────────────────────────────────────
    {
        "file": "card_setup.png",
        "prompt": (
            f"A simple scale with a bag on one side and floating items on the other, "
            f"suggesting weight and value trade-off. {STYLE}"
        ),
    },
    {
        "file": "card_greedy_fails.png",
        "prompt": (
            f"A path that looks optimal at first but leads to a dead end, "
            f"while a longer winding path reaches a treasure chest. "
            f"Suggests that local optimum ≠ global optimum. {STYLE}"
        ),
    },
    {
        "file": "card_decision_tree.png",
        "prompt": (
            f"An elegant binary tree with three levels, left branches labeled 'take' and right branches 'skip'. "
            f"Leaves show different values, one leaf highlighted as optimal. {STYLE}"
        ),
    },
    {
        "file": "card_memo_table.png",
        "prompt": (
            f"A small dictionary/cache icon glowing beside a tree where several "
            f"identical nodes are crossed out, replaced by a single cached value. "
            f"Suggests memoisation eliminating duplicate work. {STYLE}"
        ),
    },
    {
        "file": "card_1d_trick.png",
        "prompt": (
            f"A single horizontal array of cells with arrows pointing right-to-left "
            f"above it, showing the iteration direction. "
            f"Suggests the space-optimised DP with careful traversal direction. {STYLE}"
        ),
    },
]


def generate_image(prompt: str, out_path: Path) -> bool:
    if out_path.exists():
        print(f"  → exists, skipping: {out_path.name}")
        return True
    try:
        response = client.models.generate_images(
            model=MODEL,
            prompt=prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                output_mime_type="image/png",
                aspect_ratio="16:9",
            ),
        )
        img_bytes = response.generated_images[0].image.image_bytes
        out_path.write_bytes(img_bytes)
        print(f"  ✓ saved: {out_path.name}")
        return True
    except Exception as e:
        print(f"  ✗ error generating {out_path.name}: {e}")
        return False


def main():
    print(f"Generating {len(IMAGES)} images → {OUT_DIR}\n")
    ok = 0
    for img in IMAGES:
        path = OUT_DIR / img["file"]
        print(f"[{img['file']}]")
        if generate_image(img["prompt"], path):
            ok += 1
    print(f"\nDone: {ok}/{len(IMAGES)} images ready.")


if __name__ == "__main__":
    main()
