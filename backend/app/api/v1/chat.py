"""
app/api/v1/chat.py — POST /chat
Context-aware RAG chat over the indexed codebase. Saves chat history to Supabase.
"""

import logging
import uuid
from fastapi import APIRouter, HTTPException, Request, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import ChatRequest, ChatSession, ChatMessage
from app.services.chat_service import ChatService
from app.db.session import get_db

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("")
async def chat(request: Request, body: ChatRequest, db: AsyncSession = Depends(get_db)):
    """
    Answer a question about the codebase using vector search + LLM.
    Saves chat session and messages to Supabase DB.

    RAG Pipeline:
      1. Embed user question via OpenAI
      2. FAISS search → top-5 relevant code chunks
      3. Inject chunks + full project context into system prompt
      4. LLM call (Claude or GPT-4o) → answer
      5. Optional Hinglish post-processing
      6. Save chat session + messages to DB
    """
    analysis = request.app.state.analyses.get(body.repo_id)
    if not analysis:
        raise HTTPException(404, "Repository not analyzed. Call /analyze first.")

    service = ChatService(vector_store=request.app.state.vector_store)
    result  = await service.chat(
        repo_id=body.repo_id,
        question=body.message,
        history=[m.dict() for m in body.history],
        analysis=analysis,
        hinglish=body.hinglish,
    )
    
    # Save chat session and messages to Supabase DB
    try:
        # Create or get session (use repo_id as session_id for simplicity)
        session_id = str(uuid.uuid4())[:8]
        
        # Check if session exists for this repo
        # For now, create new session for each chat (can optimize later)
        session = ChatSession(
            id=session_id,
            repo_id=body.repo_id
        )
        db.add(session)
        
        # Save user message
        user_msg = ChatMessage(
            session_id=session_id,
            role="user",
            content=body.message
        )
        db.add(user_msg)
        
        # Save assistant message
        assistant_msg = ChatMessage(
            session_id=session_id,
            role="assistant",
            content=result.get("answer", ""),
            hinglish_content=result.get("hinglish", None) if body.hinglish else None,
            sources=result.get("sources", [])
        )
        db.add(assistant_msg)
        
        await db.commit()
        logger.info(f"✅ Saved chat session {session_id} to database")
        
    except Exception as e:
        logger.warning(f"Failed to save chat to DB: {e}")
        await db.rollback()
    
    return result
