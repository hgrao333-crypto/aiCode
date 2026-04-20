"""
Migration: add image_url column to play_cards and set values for knapsack cards.

Usage:
    cd backend
    ./venv/bin/python3 migrate_playcard_image.py
"""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "logos.db"
conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# Add column (idempotent — fails silently if already exists)
try:
    cur.execute("ALTER TABLE play_cards ADD COLUMN image_url TEXT")
    print("✓ Added image_url column")
except sqlite3.OperationalError:
    print("→ image_url column already exists, skipping")

# Map card title → illustration filename
CARD_IMAGES = {
    "The Setup":           "/images/card_setup.png",
    "Why Greedy Fails":    "/images/card_greedy_fails.png",
    "The Decision Tree":   "/images/card_decision_tree.png",
    "Adding the Memo Table": "/images/card_memo_table.png",
    "The 1D Array Trick":  "/images/card_1d_trick.png",
}

for title, url in CARD_IMAGES.items():
    cur.execute("UPDATE play_cards SET image_url = ? WHERE title = ?", (url, title))
    print(f"  → {cur.rowcount} row(s) updated for '{title}'")

conn.commit()
conn.close()
print("\nDone.")
