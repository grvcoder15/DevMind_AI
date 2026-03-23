"""
app/api/v1/repo.py — POST /upload-repo
Clone and parse a GitHub repository, store files in Supabase DB.
"""

import asyncio
import logging

from fastapi import APIRouter, HTTPException, Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models  import UploadRepoRequest, Repository
from app.services.repo_service import RepoService
from app.db.session import get_db

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("")
async def upload_repo(request: Request, body: UploadRepoRequest, db: AsyncSession = Depends(get_db)):
    """
    Clone and parse a GitHub repository, store files in Supabase DB.

    Pipeline:
      1. Validate GitHub URL
      2. Clone via GitPython (async thread pool)
      3. Walk file tree → RepoSnapshot
      4. Store all files in Supabase DB for persistence
      5. Cache snapshot in app.state
      6. Kick off FAISS indexing in background

    Returns repo_id for all downstream calls.
    """
    if "github.com" not in body.repo_url:
        raise HTTPException(400, "Only GitHub URLs are currently supported.")

    service = RepoService()
    try:
        # Step 1: Clone and parse (but don't store files yet)
        snapshot = await service.ingest(body.repo_url, db=None)
    except Exception as e:
        logger.error(f"Repo ingestion failed: {e}")
        raise HTTPException(422, f"Failed to clone repository: {str(e)}")

    # Step 2: Check if repository already exists
    from sqlalchemy import select
    existing_repo = await db.execute(
        select(Repository).where(Repository.id == snapshot.repo_id)
    )
    existing_repo = existing_repo.scalar_one_or_none()
    
    if existing_repo:
        logger.info(f"⚠️ Repository {snapshot.repo_id} already exists. Skipping DB insert, using existing data.")
        # Update snapshot in memory for this session
        request.app.state.snapshots[snapshot.repo_id] = snapshot
        
        return {
            "repo_id":             snapshot.repo_id,
            "status":              "ready",
            "total_files":         len(snapshot.files),
            "detected_frameworks": snapshot.detected_frameworks,
            "entry_points":        snapshot.entry_points,
            "message":             f"Repository already exists. Using existing data with {len(snapshot.files)} files.",
        }
    
    # Step 2: Create Repository record FIRST (for foreign key)
    try:
        repo_name = body.repo_url.split('/')[-1].replace('.git', '')
        repo_record = Repository(
            id=snapshot.repo_id,
            url=body.repo_url,
            name=repo_name,
            language=snapshot.files[0].language if snapshot.files else "Unknown",
            framework=snapshot.detected_frameworks[0] if snapshot.detected_frameworks else "Unknown",
            total_files=len(snapshot.files),
            total_lines=sum(f.lines for f in snapshot.files),
            status="ready"
        )
        db.add(repo_record)
        await db.commit()
        logger.info(f"✅ Saved repository {snapshot.repo_id} to database")
    except Exception as e:
        logger.error(f"Failed to save repository to DB: {e}")
        await db.rollback()
        raise HTTPException(500, f"Database error: {str(e)}")
    
    # Step 3: NOW store files (foreign key exists)
    try:
        await service.store_files_in_db(snapshot.repo_id, snapshot.files, db)
        logger.info(f"✅ Stored {len(snapshot.files)} files in database")
    except Exception as e:
        logger.error(f"Failed to store files: {e}")
        # Repository already created, so don't fail - files can be re-uploaded
        logger.warning("⚠️ Repository created but files not stored. Upload again to retry.")

    # Store snapshot in shared state (for fast access)
    request.app.state.snapshots[snapshot.repo_id] = snapshot

    # Index embeddings in the background so we return immediately
    asyncio.create_task(
        request.app.state.vector_store.index_repo(snapshot.repo_id, snapshot.files)
    )

    return {
        "repo_id":             snapshot.repo_id,
        "status":              "ready",
        "total_files":         len(snapshot.files),
        "detected_frameworks": snapshot.detected_frameworks,
        "entry_points":        snapshot.entry_points,
        "message":             f"Repository parsed. {len(snapshot.files)} files ready for analysis.",
    }
