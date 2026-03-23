"""
app/db/session.py — SQLAlchemy async engine + session factory.
Defaults to SQLite for local dev; swap DATABASE_URL for PostgreSQL.
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import settings

# Connection arguments for better compatibility (especially IPv6 on Windows)
connect_args = {}
if "postgresql" in settings.DATABASE_URL:
    connect_args = {
        "ssl": "prefer",  # Supabase requires SSL
        "server_settings": {
            "application_name": "devmind_ai"
        }
    }

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
    connect_args=connect_args,
    pool_pre_ping=True,  # Test connections before using them
    pool_size=5,
    max_overflow=10,
)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()


async def get_db():
    """FastAPI dependency — yields an async DB session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
