import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models.models import RepositoryFile

async def main():
    engine = create_async_engine('postgresql+asyncpg://postgres:Welcome%40123@localhost:5432/Devmind_ai')
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
