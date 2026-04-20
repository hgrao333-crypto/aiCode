"""
One-time migration: add `course` column to topics table.
Run once if the DB already exists:
    ./venv/bin/python3 migrate_course_field.py
"""
from database import engine

with engine.connect() as conn:
    try:
        conn.execute(__import__("sqlalchemy").text("ALTER TABLE topics ADD COLUMN course TEXT DEFAULT 'main'"))
        conn.execute(__import__("sqlalchemy").text("UPDATE topics SET course = 'main' WHERE course IS NULL"))
        conn.execute(__import__("sqlalchemy").text("UPDATE topics SET course = 'demo' WHERE slug = 'knapsack'"))
        conn.commit()
        print("✓ Migration complete. Knapsack topic set to course='demo'.")
    except Exception as e:
        if "duplicate column" in str(e).lower():
            conn.execute(__import__("sqlalchemy").text("UPDATE topics SET course = 'demo' WHERE slug = 'knapsack'"))
            conn.commit()
            print("✓ Column already existed. Knapsack topic set to course='demo'.")
        else:
            raise
