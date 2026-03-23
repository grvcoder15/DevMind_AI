import asyncio
import os
from dotenv import load_dotenv
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models.models import RepositoryFile

# Load environment variables from .env file
load_dotenv()

async def main():
    # Get database URL from environment variable
    # Defaults to local if not set
    db_url = os.getenv(
        'DATABASE_URL',
        'postgresql+asyncpg://postgres:Welcome%40123@localhost:5432/Devmind_ai'
    )
    
    print(f"🔗 Connecting to: {db_url.split('@')[0]}@***")  # Hide password in output
    
    engine = create_async_engine(db_url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        result = await session.execute(
            select(RepositoryFile.file_path, RepositoryFile.content)
            .where(RepositoryFile.repo_id == '28573d8f')
            .order_by(RepositoryFile.file_path)
        )
        files = result.all()
        
        print('\n=== Voermon Repository Files ===')
        for i, (path, _) in enumerate(files, 1):
            print(f'{i}. {path}')
        
        # Find Sidebar component
        print('\n=== Checking Sidebar Content ===')
        for path, content in files:
            if 'Sidebar' in path or 'sidebar' in path:
                print(f'\n📁 {path}')
                print(content[:2000])  # First 2000 chars

asyncio.run(main())
