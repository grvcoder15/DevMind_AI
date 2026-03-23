"""
DevMind AI – Codebase Companion System v2.0
FastAPI Application Entry Point

Run:
    cd backend
    uvicorn main:app --reload --port 8000

Swagger UI: http://localhost:8000/docs
"""

import logging
import sys
import asyncio
from contextlib import asynccontextmanager

# Fix for Windows + asyncpg + IPv6 DNS resolution issue
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    logging.info("🪟 Windows detected: Using ProactorEventLoopPolicy for better async DNS resolution")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.repo      import router as repo_router
from app.api.v1.analyze   import router as analyze_router
from app.api.v1.chat      import router as chat_router
from app.api.v1.hinglish  import router as hinglish_router
from app.api.v1.voice     import router as voice_router
from app.api.v1.learning  import router as learning_router
from app.api.v1.flow      import router as flow_router
from app.api.v1.prototype import router as prototype_router
from app.api.v1.github    import router as github_router

from app.core.config      import settings
from app.db.vector_store  import VectorStore
from app.db.session       import engine, Base

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup & shutdown lifecycle."""
    logger.info("🚀 DevMind AI starting up...")

    # Create DB tables (SQLAlchemy — no-op if DB not reachable)
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("✅ Database tables ready")
    except Exception as e:
        logger.warning(f"DB not available (non-fatal): {e}")

    # Shared in-memory state (replace with Redis in production)
    app.state.vector_store    = VectorStore()
    app.state.snapshots:  dict = {}   # repo_id → RepoSnapshot
    app.state.analyses:   dict = {}   # repo_id → AnalysisResult dict
    app.state.learning_plans: dict = {}  # repo_id → LearningPlan dict

    logger.info("✅ Vector store initialized")
    yield
    logger.info("🛑 DevMind AI shutting down")


app = FastAPI(
    title="DevMind AI – Codebase Companion",
    description="AI-powered codebase analysis, chat, guided learning, flow diagrams, and UI prototypes.",
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
app.include_router(github_router,    prefix="/github",           tags=["GitHub"])
app.include_router(repo_router,      prefix="/upload-repo",      tags=["Repository"])
app.include_router(analyze_router,   prefix="/analyze",          tags=["Analysis"])
app.include_router(chat_router,      prefix="/chat",             tags=["Chat"])
app.include_router(hinglish_router,  prefix="/convert-hinglish", tags=["Hinglish"])
app.include_router(voice_router,     prefix="/voice",            tags=["Voice"])
app.include_router(learning_router,  prefix="/guided-learning",  tags=["Learning"])
app.include_router(flow_router,      prefix="/generate-flow",    tags=["Flow"])
app.include_router(prototype_router, prefix="/generate-prototype", tags=["Prototype"])


@app.get("/health", tags=["System"])
async def health():
    return {"status": "healthy", "version": "2.0.0"}
