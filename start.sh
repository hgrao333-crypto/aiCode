#!/usr/bin/env bash
# Logos — kill everything, rebuild if needed, launch all services
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== Stopping any running services ==="
pkill -f "uvicorn main:app" 2>/dev/null || true
pkill -f "next-server"      2>/dev/null || true
pkill -f "next start"       2>/dev/null || true
pkill -f "cloudflared tunnel run" 2>/dev/null || true
sleep 2

# Force-kill anything still on the ports
fuser -k 8000/tcp 2>/dev/null || true
fuser -k 3000/tcp 2>/dev/null || true
sleep 1
echo "Ports clear."

# ── Backend ────────────────────────────────────────────────────────────────────
echo ""
echo "=== Starting backend (port 8000) ==="
cd "$SCRIPT_DIR/backend"
if [ -f .env ]; then set -a; source .env; set +a; fi
nohup ./venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 > /tmp/logos-backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to be ready
for i in {1..15}; do
  if curl -s http://localhost:8000/api/topics > /dev/null 2>&1; then
    echo "Backend ready."
    break
  fi
  sleep 1
done

# ── Frontend ──────────────────────────────────────────────────────────────────
echo ""
echo "=== Starting frontend (port 3000) ==="
cd "$SCRIPT_DIR/frontend"
if [ -f .env.local ]; then set -a; source .env.local; set +a; fi

echo "Building frontend..."
npm run build

nohup npm start > /tmp/logos-frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Wait for frontend to be ready
for i in {1..15}; do
  if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "Frontend ready."
    break
  fi
  sleep 1
done

# ── Cloudflare Tunnel ─────────────────────────────────────────────────────────
echo ""
echo "=== Starting Cloudflare tunnel ==="
nohup cloudflared tunnel run logos > /tmp/logos-tunnel.log 2>&1 &
TUNNEL_PID=$!
echo "Tunnel PID: $TUNNEL_PID"
sleep 3

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "============================================"
echo "  Logos is live at https://sparktuner.online"
echo "============================================"
echo "  Backend  → http://localhost:8000"
echo "  Frontend → http://localhost:3000"
echo ""
echo "  Logs:"
echo "    tail -f /tmp/logos-backend.log"
echo "    tail -f /tmp/logos-frontend.log"
echo "    tail -f /tmp/logos-tunnel.log"
echo ""
echo "  Press Ctrl+C to stop all."
echo "============================================"

trap "echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID $TUNNEL_PID 2>/dev/null; exit 0" INT TERM
wait $BACKEND_PID $FRONTEND_PID $TUNNEL_PID
