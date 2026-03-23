"""
app/core/config.py — Centralized settings via Pydantic BaseSettings.
All values can be overridden via environment variables or a .env file.
"""

from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── App ──────────────────────────────────────────────────────────────────
    APP_NAME: str = "DevMind AI"
    DEBUG: bool = False
    
    # Frontend URL for CORS (Railway auto-fills this)
    FRONTEND_URL: str = "http://localhost:5174"
    
    # CORS origins (automatically includes FRONTEND_URL)
    @property
    def ALLOWED_ORIGINS(self) -> List[str]:
        origins = [
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:5174",
            self.FRONTEND_URL,  # Dynamically add from env
        ]
        # Remove duplicates
        return list(set(origins))

    # ── GitHub OAuth ─────────────────────────────────────────────────────────
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""
    GITHUB_REDIRECT_URI: str = "http://localhost:5174/auth/callback"

    # ── LLM ──────────────────────────────────────────────────────────────────
    # Provider: "gemini" (FREE) | "ollama" (FREE/Local) | "huggingface" (FREE) | "openrouter" (FREE) | "anthropic" | "openai"
    LLM_PROVIDER: str = "ollama"
    
    # Google Gemini (FREE - RECOMMENDED for cloud)
    # Get API key: https://makersuite.google.com/app/apikey
    # Free tier: 15 requests/min, 1 million tokens/day
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"  # Latest Flash model (fast + reliable)
    
    # All FREE Gemini models (auto-fallback on rate limits)
    # UPDATED: Using actual available models from API
    GEMINI_FALLBACK_MODELS: list = [
        "gemini-2.5-flash",             # PRIMARY: Latest Flash (fast)
        "gemini-2.5-pro",               # Backup 1: Latest Pro (high quality)
        "gemini-3-flash-preview",       # Backup 2: Next-gen Flash
        "gemini-3-pro-preview",         # Backup 3: Next-gen Pro
        "gemini-2.0-flash",             # Backup 4: Stable 2.0
        "gemini-flash-latest",          # Backup 5: Generic latest
        "gemini-pro-latest",            # Backup 6: Generic pro
    ]
    
    # Ollama (Local LLM - FREE & RECOMMENDED for offline)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3"               # llama3 | mistral | codellama | phi3
    
    # HuggingFace Inference API (FREE tier available)
    HUGGINGFACE_API_KEY: str = ""
    HUGGINGFACE_MODEL: str = "mistralai/Mistral-7B-Instruct-v0.2"
    
    # OpenRouter (FREE models available)
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_MODEL: str = "meta-llama/llama-3-8b-instruct:free"
    
    # Paid Providers (Optional)
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    LLM_MODEL: str = "claude-3-5-sonnet-20241022"
    
    # LLM Parameters
    TEMPERATURE: float = 0.25
    MAX_TOKENS: int = 2048

    # ── Database (Supabase PostgreSQL) ───────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://postgres:pass@db.xyz.supabase.co:5432/postgres"
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_PUBLISHABLE_KEY: str = ""

    # ── Repository ───────────────────────────────────────────────────────────
    REPO_CLONE_DIR: str = "./temp/repos"  # Use relative path (works on Windows + Linux)
    MAX_FILE_SIZE_KB: int = 400
    MAX_FILES_TO_EMBED: int = 250
    IGNORED_DIRS: List[str] = [
        ".git", "node_modules", "__pycache__", ".venv",
        "dist", "build", ".next", "vendor", ".idea",
        ".mypy_cache", "coverage",
    ]
    IGNORED_EXTENSIONS: List[str] = [
        ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico",
        ".pdf", ".zip", ".tar", ".gz", ".lock", ".min.js",
        ".woff", ".ttf",
    ]

    # ── Embeddings / Vector Store ────────────────────────────────────────────
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_DIM: int = 1536
    VECTOR_STORE_DIR: str = "/tmp/devmind_vectors"
    CHUNK_SIZE_LINES: int = 60
    CHUNK_OVERLAP_LINES: int = 15

    # ── Voice ────────────────────────────────────────────────────────────────
    WHISPER_MODEL_SIZE: str = "base"           # tiny | base | small | medium
    TTS_ENGINE: str = "gtts"                   # gtts | elevenlabs

    # ── Redis (optional caching) ─────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379"
    CACHE_TTL: int = 3600

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
