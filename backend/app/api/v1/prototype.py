"""
app/api/v1/prototype.py — POST /generate-prototype
Detect possible UI screens from the codebase (reads from Supabase DB).
"""

import logging
from fastapi import APIRouter, HTTPException, Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import PrototypeRequest
from app.services.ai_service import generate_prototype
from app.db.session import get_db

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("")
async def gen_prototype(request: Request, body: PrototypeRequest, db: AsyncSession = Depends(get_db)):
    """
    Detect possible UI screens from the codebase (reads files from Supabase DB),
    then generate React placeholder component metadata.
    """
    snapshot = request.app.state.snapshots.get(body.repo_id)
    analysis = request.app.state.analyses.get(body.repo_id)

    if not snapshot or not analysis:
        raise HTTPException(404, "Upload and analyze the repository first.")

    # Get file paths from snapshot (lightweight)
    file_paths = [f.path for f in snapshot.files]
    
    # Generate prototype (will read actual code from DB, not filesystem)
    proto_data = await generate_prototype(analysis, file_paths, body.repo_id, db)

    return {
        "repo_id":              body.repo_id,
        "screens":              proto_data.get("screens", []),  # Frontend expects "screens"
        "navigation_structure": proto_data.get("navigation_structure", ""),
        "framework_detected":   proto_data.get("framework_detected", "React"),
    }
