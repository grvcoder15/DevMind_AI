"""
app/core/config.py — Centralized settings via Pydantic BaseSettings
"""
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    APP_NAME: str = "DevMind AI"
    DEBUG: bool = False
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    # LLM
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    LLM_PROVIDER: str = "anthropic"          # "anthropic" | "openai"
    LLM_MODEL: str = "claude-3-5-sonnet-20241022"
    TEMPERATURE: float = 0.25
    MAX_TOKENS: int = 2048

    # DB (PostgreSQL — optional)
    DATABASE_URL: str = "sqlite+aiosqlite:///./devmind.db"   # swap for postgres URL
    # DATABASE_URL: str = "postgresql+asyncpg://user:pass@localhost/devmind"

    # Repository
    REPO_CLONE_DIR: str = "/tmp/devmind_repos"
    MAX_FILE_SIZE_KB: int = 400
    MAX_FILES_TO_EMBED: int = 250
    IGNORED_DIRS: List[str] = [
        ".git","node_modules","__pycache__",".venv","dist","build",
        ".next","vendor",".idea",".mypy_cache","coverage",
    ]
    IGNORED_EXTENSIONS: List[str] = [
        ".png",".jpg",".jpeg",".gif",".svg",".ico",".pdf",
        ".zip",".tar",".gz",".lock",".min.js",".woff",".ttf",
    ]

    # Embeddings / Vector Store
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_DIM: int = 1536
    VECTOR_STORE_DIR: str = "/tmp/devmind_vectors"
    CHUNK_SIZE_LINES: int = 60
    CHUNK_OVERLAP_LINES: int = 15

    # Voice
    WHISPER_MODEL_SIZE: str = "base"         # tiny|base|small|medium
    TTS_ENGINE: str = "gtts"                 # gtts|elevenlabs

    # Redis (optional caching)
    REDIS_URL: str = "redis://localhost:6379"
    CACHE_TTL: int = 3600

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
