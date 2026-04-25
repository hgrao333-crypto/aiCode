#!/usr/bin/env bash
# Start Logos locally — runs backend + frontend in separate terminal tabs/panes.
# Usage: bash start.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== Logos local dev ==="

# Backend
echo "[1/2] Starting FastAPI backend on http://localhost:8000 ..."
cd "$SCRIPT_DIR/backend"
if [ ! -f .env ]; then
  cp .env.example .env
  echo "  !! Created backend/.env — add your ANTHROPIC_API_KEY before using the Socratic gate."
fi

# Load backend env vars (export all variables defined in the file)
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi
./venv/bin/uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

# Frontend
echo "[2/2] Starting Next.js frontend on http://localhost:3000 ..."
cd "$SCRIPT_DIR/frontend"

# Load frontend env vars (Next.js reads env vars at process start)
if [ -f .env.local ]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Open http://localhost:3000"
echo "Press Ctrl+C to stop both."

wait $BACKEND_PID $FRONTEND_PID
