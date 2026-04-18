"""
Pre-generates AI spoken summaries and MP3 audio for all PlayCards.

Run once (or re-run to fill any gaps):
    ./venv/bin/python3 generate_playcard_audio.py

What it does:
  1. For each PlayCard without an ai_summary → calls Claude Haiku to write
     a 2-3 sentence conversational spoken summary (no markdown/code).
  2. For each PlayCard without audio → calls gTTS to produce an MP3
     saved in audio/playcards/playcard_{id}.mp3
"""
import os
import time
from pathlib import Path

from anthropic import Anthropic
from gtts import gTTS

from database import SessionLocal, engine, Base
import models

Base.metadata.create_all(bind=engine)

AUDIO_DIR = Path(__file__).parent / "audio" / "playcards"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

SUMMARY_SYSTEM = """You are writing a short spoken introduction for a coding concept card on an education platform.

Rules:
- 2 to 3 sentences, max 60 words total.
- Plain English only — no code snippets, no markdown, no bullet points.
- Conversational and friendly, like a teacher previewing the topic.
- Should make sense when heard out loud, not read.
- Start with the concept name naturally (e.g. "Binary search is...").
"""


def _get_api_key() -> str:
    key = os.environ.get("ANTHROPIC_API_KEY", "")
    if key:
        return key
    env_path = Path(__file__).parent / ".env"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if line.startswith("ANTHROPIC_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    return ""


def generate_summary(client: Anthropic, title: str, content: str) -> str:
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=150,
        system=SUMMARY_SYSTEM,
        messages=[
            {
                "role": "user",
                "content": (
                    f"Card title: {title}\n\n"
                    f"Card content:\n{content}\n\n"
                    "Write the spoken summary now."
                ),
            }
        ],
    )
    return response.content[0].text.strip()


def generate_audio(text: str, filepath: Path) -> None:
    tts = gTTS(text=text, lang="en", slow=False)
    tts.save(str(filepath))


def main():
    api_key = _get_api_key()
    if not api_key:
        print("ERROR: ANTHROPIC_API_KEY not found. Set it in .env or as an env var.")
        return

    client = Anthropic(api_key=api_key)
    db = SessionLocal()

    try:
        cards = db.query(models.PlayCard).order_by(models.PlayCard.id).all()
        total = len(cards)
        print(f"Found {total} playcards.\n")

        for i, card in enumerate(cards, 1):
            prefix = f"[{i}/{total}] {card.title!r}"
            changed = False

            # ── Step 1: Generate summary ────────────────────────────────────
            if not card.ai_summary:
                print(f"{prefix} → generating summary...", flush=True)
                try:
                    card.ai_summary = generate_summary(client, card.title, card.content)
                    changed = True
                    time.sleep(0.3)  # stay under rate limit
                except Exception as e:
                    print(f"  ERROR (summary): {e}")
                    continue
            else:
                print(f"{prefix} → summary exists, skipping.")

            # ── Step 2: Generate audio ──────────────────────────────────────
            audio_filename = f"playcard_{card.id}.mp3"
            audio_path = AUDIO_DIR / audio_filename

            if not card.audio_file or not audio_path.exists():
                print(f"  → generating audio...", flush=True)
                try:
                    generate_audio(card.ai_summary, audio_path)
                    card.audio_file = audio_filename
                    changed = True
                except Exception as e:
                    print(f"  ERROR (audio): {e}")
                    continue
            else:
                print(f"  → audio exists, skipping.")

            if changed:
                db.commit()

        print("\nAll playcards processed.")

    finally:
        db.close()


if __name__ == "__main__":
    main()
