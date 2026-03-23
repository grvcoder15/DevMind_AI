"""
app/api/v1/analyze.py — POST /analyze
Run the full AI analysis pipeline on a cloned repository.
"""

import asyncio
import logging
from fastapi import APIRouter, HTTPException, Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import AnalyzeRequest, Analysis
from app.services.analysis_service import AnalysisService
from app.db.session import get_db

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("")
async def analyze(request: Request, body: AnalyzeRequest, db: AsyncSession = Depends(get_db)):
    """
    Run full AI analysis pipeline on a cloned repository.
    Saves results to Supabase DB and loads from DB if already analyzed.

    Concurrent LLM calls:
      - Summary + Framework detection
      - Architecture overview
      - Data flow description
      - File importance ranking
      
    Auto-retry with exponential backoff on rate limit errors.
    """
    snapshot = request.app.state.snapshots.get(body.repo_id)
    if not snapshot:
        raise HTTPException(404, "Repository not found. Call /upload-repo first.")

    # Check if we have a cached analysis in memory
    cached_analysis = request.app.state.analyses.get(body.repo_id)
    if cached_analysis:
        logger.info(f"✅ Returning cached analysis from memory for {body.repo_id}")
        return cached_analysis
    
    # Check if analysis exists in database
    from sqlalchemy import select
    db_analysis = await db.execute(
        select(Analysis).where(Analysis.repo_id == body.repo_id)
    )
    db_analysis = db_analysis.scalar_one_or_none()
    
    if db_analysis:
        logger.info(f"✅ Loading existing analysis from database for {body.repo_id}")
        analysis_dict = {
            "repo_id": db_analysis.repo_id,
            "summary": db_analysis.summary,
            "architecture_overview": db_analysis.architecture_overview,
            "data_flow": db_analysis.data_flow,
            "dependencies": db_analysis.dependencies or [],
            "entry_points": db_analysis.entry_points or [],
            "file_ranking": db_analysis.file_ranking or []
        }
        # Cache in memory
        request.app.state.analyses[body.repo_id] = analysis_dict
        return analysis_dict

    # Retry logic: 3 attempts with longer backoff
    max_retries = 3
    base_delay = 10  # Increased from 5 to 10 seconds
    
    for attempt in range(max_retries):
        try:
            logger.info(f"Analysis attempt {attempt + 1}/{max_retries} for {body.repo_id}")
            
            service = AnalysisService()
            result  = await service.analyze(snapshot)

            # Save Analysis to Supabase DB
            try:
                analysis_record = Analysis(
                    id=body.repo_id,
                    repo_id=body.repo_id,
                    summary=result.get("summary", ""),
                    architecture_overview=result.get("architecture_overview", ""),
                    data_flow=result.get("data_flow", ""),
                    dependencies=result.get("dependencies", []),
                    entry_points=result.get("entry_points", []),
                    file_ranking=result.get("file_ranking", [])
                )
                db.add(analysis_record)
                await db.commit()
                logger.info(f"✅ Saved analysis to database for {body.repo_id}")
            except Exception as e:
                logger.warning(f"Failed to save analysis to DB: {e}")
                await db.rollback()

            # Cache result for future requests and chat/learning/flow calls
            request.app.state.analyses[body.repo_id] = result
            logger.info(f"✅ Analysis successful on attempt {attempt + 1}")
            return result
            
        except Exception as e:
            error_msg = str(e)
            is_rate_limit = any(keyword in error_msg.lower() for keyword in ['rate', 'quota', 'limit', '429', '403'])
            
            if is_rate_limit and attempt < max_retries - 1:
                wait_time = base_delay * (2 ** attempt)  # Exponential backoff: 10s, 20s, 40s
                logger.warning(f"⏳ Rate limit hit. Waiting {wait_time}s before retry {attempt + 2}/{max_retries}...")
                await asyncio.sleep(wait_time)
                continue
            else:
                logger.error(f"❌ Analysis failed for {body.repo_id}: {error_msg}")
                
                if is_rate_limit:
                    # Calculate suggested wait time based on Google's typical reset
                    minutes_to_wait = 5  # Google Gemini free tier typically resets in 5-10 minutes
                    raise HTTPException(
                        429,
                        f"⏰ All 7 AI models are rate-limited right now. Google's free tier has strict limits. Please wait {minutes_to_wait} minutes and try again. The analysis will be cached once successful."
                    )
                else:
                    raise HTTPException(500, f"Analysis failed: {error_msg[:200]}")
    
    # Should never reach here
    raise HTTPException(429, "⏰ All models exhausted. Please wait 5-10 minutes for quota reset.")
