import traceback
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from database import engine
import models
from routers import auth, problems, sessions, progress, topics, admin

# Create all tables on startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Logos API", version="0.1.0")

# CORS must be added before any other middleware / exception handlers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Return JSON (with CORS headers) for unhandled 500s instead of crashing."""
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc) or "Internal server error"},
    )

app.include_router(auth.router)
app.include_router(problems.router)
app.include_router(sessions.router)
app.include_router(progress.router)
app.include_router(topics.router)
app.include_router(admin.router)

# Serve pre-generated playcard audio files
AUDIO_DIR = Path(__file__).parent / "audio"
AUDIO_DIR.mkdir(exist_ok=True)
app.mount("/audio", StaticFiles(directory=str(AUDIO_DIR)), name="audio")


@app.get("/health")
def health():
    return {"status": "ok"}
