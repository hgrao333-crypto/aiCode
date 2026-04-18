# Logos — Learn by Thinking

A Socratic coding platform where you must **explain your own code** before it runs. No copy-paste answers. The AI asks focused questions; you pass the gate by demonstrating genuine understanding.

---

## How it works

```
Student writes code
       ↓
  Clicks "Run" (locked)
       ↓
  AI asks a Socratic question specific to their code
       ↓
  Student answers
       ↓
  AI evaluates: PASS / FAIL / STUCK
       ↓
FAIL → narrower follow-up (max 4 turns)
STUCK → teaching: concept + walkthrough + verification question
PASS → mastery recorded, next problem unlocked
```

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript + Tailwind CSS |
| Code editor | Monaco Editor (`@monaco-editor/react`) |
| Backend | FastAPI + SQLAlchemy |
| Database | SQLite (local) → PostgreSQL (production) |
| Auth | JWT (python-jose + bcrypt) |
| AI | Anthropic API — `claude-haiku-4-5-20251001` |
| Code sandbox | Local Python subprocess (local) → Judge0 (production) |

---

## Local development

### Prerequisites
- Node.js 18+
- Python 3.11+
- An [Anthropic API key](https://console.anthropic.com/)

### 1. Clone and set up

```bash
git clone <your-repo-url>
cd AiCourse
```

### 2. Backend setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

python seed.py                    # Creates DB + seeds 5 Binary Search problems
```

### 3. Frontend setup

```bash
cd ../frontend
npm install
```

### 4. Run both servers

```bash
# From project root
bash start.sh

# Or manually in two terminals:
# Terminal 1 — backend
cd backend && ./venv/bin/uvicorn main:app --reload --port 8000

# Terminal 2 — frontend
cd frontend && npm run dev
```

Open **http://localhost:3000**

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key |
| `SECRET_KEY` | Yes | JWT signing secret (any random string) |
| `DATABASE_URL` | No | Default: `sqlite:///./logos.db` |

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend URL |

---

## Deployment

### Option A — Vercel (frontend) + Railway (backend) — Recommended

**1. Deploy the backend on Railway**

1. Create a new project at [railway.app](https://railway.app)
2. Add a **PostgreSQL** database — copy the `DATABASE_URL`
3. Deploy from GitHub, set the root directory to `backend/`
4. Add environment variables:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   SECRET_KEY=<random 32-char string>
   DATABASE_URL=<railway postgres URL>
   ```
5. Set the start command:
   ```
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
6. Note the Railway public URL, e.g. `https://logos-backend.up.railway.app`

**Switch from SQLite to PostgreSQL** — install the driver and update requirements.txt:
```bash
pip install psycopg2-binary
```
No code changes needed — SQLAlchemy handles both dialects automatically.

**2. Deploy the frontend on Vercel**

1. Push your repo to GitHub
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. Set root directory to `frontend/`
4. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://logos-backend.up.railway.app
   ```
5. Deploy — Vercel auto-builds on every push

**3. Update CORS on the backend**

In `backend/main.py`, add your Vercel URL:
```python
allow_origins=["https://your-app.vercel.app"]
```

---

### Option B — Single VPS (DigitalOcean / Linode / Hetzner)

Good for full control. Approximate cost: **$6/month** (1 GB RAM droplet).

**1. Provision the server**

```bash
# On the server (Ubuntu 22.04)
apt update && apt install -y python3-pip python3-venv nodejs npm nginx certbot python3-certbot-nginx
```

**2. Deploy the backend**

```bash
git clone <your-repo> /opt/logos
cd /opt/logos/backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python seed.py

# Create systemd service
cat > /etc/systemd/system/logos-backend.service << 'EOF'
[Unit]
Description=Logos FastAPI backend
After=network.target

[Service]
User=www-data
WorkingDirectory=/opt/logos/backend
EnvironmentFile=/opt/logos/backend/.env
ExecStart=/opt/logos/backend/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl enable logos-backend && systemctl start logos-backend
```

**3. Build the frontend**

```bash
cd /opt/logos/frontend
npm install && npm run build
```

**4. Configure Nginx**

```nginx
# /etc/nginx/sites-available/logos
server {
    server_name yourdomain.com;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/logos /etc/nginx/sites-enabled/
certbot --nginx -d yourdomain.com   # free HTTPS
systemctl restart nginx
```

---

## Project structure

```
AiCourse/
├── backend/
│   ├── main.py                # FastAPI app + CORS + error handler
│   ├── models.py              # SQLAlchemy models (User, Problem, GateSession, TurnLog, MasteryRecord)
│   ├── auth.py                # JWT helpers (bcrypt hash/verify, token create/decode)
│   ├── database.py            # DB session factory
│   ├── config.py              # pydantic-settings (.env loader)
│   ├── sandbox.py             # Local Python subprocess code runner
│   ├── socratic_engine.py     # All Anthropic API calls (question gen, eval, teaching)
│   ├── seed.py                # Seeds 5 Binary Search problems
│   ├── requirements.txt
│   ├── .env.example
│   └── routers/
│       ├── auth.py            # POST /api/auth/register, /login, GET /me
│       ├── problems.py        # GET /api/problems/, /api/problems/{slug}
│       ├── sessions.py        # POST /api/sessions/run, /answer, GET /{id}
│       └── progress.py        # GET /api/progress/mastery, /sessions
│
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── page.tsx               # Landing page
│       │   ├── auth/login/page.tsx    # Login
│       │   ├── auth/register/page.tsx # Register
│       │   ├── problems/page.tsx      # Problem list
│       │   └── problems/[slug]/page.tsx  # Problem editor + Socratic chat
│       ├── context/
│       │   └── AuthContext.tsx        # JWT auth state
│       └── lib/
│           └── api.ts                 # All backend API calls
│
├── start.sh          # Starts both servers locally
└── README.md
```

---

## Roadmap

- [ ] C++ track with cache-locality gates (Phase 4)
- [ ] Visual memory map / stack-heap debugger
- [ ] Learner profile with mistake patterns + velocity tracking
- [ ] Judge0 / E2B code sandbox for production
- [ ] Multi-course structure (Graphs, DP, Trees)
- [ ] Learning telemetry dashboard
