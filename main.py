"""
DevMind AI – Codebase Companion System
FastAPI Application Entry Point

Run:
    uvicorn main:app --reload --port 8000

Swagger UI: http://localhost:8000/docs
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import (
    repo,
    analyze,
    chat,
    hinglish,
    voice,
    learning,
    flow,
    prototype,
)
from app.core.config import settings
from app.db.vector_store import VectorStore
from app.db.session import engine, Base

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup & shutdown lifecycle."""
    logger.info("🚀 DevMind AI starting up...")

    # Create DB tables (SQLAlchemy — no-op if DB not configured)
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("✅ Database tables ready")
    except Exception as e:
        logger.warning(f"DB not available (non-fatal): {e}")

    # Initialize global vector store
    app.state.vector_store = VectorStore()
    app.state.snapshots: dict = {}       # repo_id → RepoSnapshot
    app.state.analyses: dict = {}        # repo_id → AnalysisResult
    app.state.learning_plans: dict = {}  # repo_id → LearningPlan

    logger.info("✅ Vector store initialized")
    yield
    logger.info("🛑 DevMind AI shutting down")


app = FastAPI(
    title="DevMind AI – Codebase Companion",
    description="AI-powered codebase analysis, chat, learning paths, and Hinglish explanations.",
    version="2.0.0",
    lifespan=lifespan,
)

# ─── CORS ────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ─────────────────────────────────────────────────────────────────
app.include_router(repo.router,       prefix="/upload-repo",       tags=["Repository"])
app.include_router(analyze.router,    prefix="/analyze",           tags=["Analysis"])
app.include_router(chat.router,       prefix="/chat",              tags=["Chat"])
app.include_router(hinglish.router,   prefix="/convert-hinglish",  tags=["Hinglish"])
app.include_router(voice.router,      prefix="/voice",             tags=["Voice"])
app.include_router(learning.router,   prefix="/guided-learning",   tags=["Learning"])
app.include_router(flow.router,       prefix="/generate-flow",     tags=["Flow"])
app.include_router(prototype.router,  prefix="/generate-prototype",tags=["Prototype"])


@app.get("/health", tags=["System"])
async def health():
    return {"status": "healthy", "version": "2.0.0"}
