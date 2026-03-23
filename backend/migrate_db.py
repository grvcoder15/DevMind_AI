"""
Database Migration Script
Run this to create the repository_files table in Supabase
"""

import asyncio
from sqlalchemy import text
from app.db.session import engine

async def migrate():
    """Create repository_files table"""
    
    migration_sql = """
    -- Create repository_files table if not exists
    CREATE TABLE IF NOT EXISTS repository_files (
        id SERIAL PRIMARY KEY,
        repo_id VARCHAR(8) NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
        file_path VARCHAR(512) NOT NULL,
        content TEXT,
        language VARCHAR(64),
        lines INTEGER DEFAULT 0,
        size_bytes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_repository_files_repo_id ON repository_files(repo_id);
    CREATE INDEX IF NOT EXISTS idx_repository_files_path ON repository_files(repo_id, file_path);
    CREATE INDEX IF NOT EXISTS idx_repository_files_language ON repository_files(repo_id, language);
    """
    
    async with engine.begin() as conn:
        await conn.execute(text(migration_sql))
        print("✅ Migration successful! repository_files table created.")
        print("✅ All indexes created.")

if __name__ == "__main__":
    print("🚀 Running database migration...")
    asyncio.run(migrate())
