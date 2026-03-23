"""
app/api/v1/flow.py — POST /generate-flow
Generate system flow diagrams (request flow, auth flow, data flow, etc.).
"""

import logging
from fastapi import APIRouter, HTTPException, Request
from app.models.models import FlowRequest
from app.services.ai_service import generate_flows

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("")
async def generate_flow(request: Request, body: FlowRequest):
    """
    Analyze the codebase and generate 3-4 system flow diagrams.
    Returns structured node-edge graphs + text representations.
    """
    analysis = request.app.state.analyses.get(body.repo_id)
    if not analysis:
        raise HTTPException(404, "Analyze the repository first via /analyze.")

    flow_data = await generate_flows(analysis)
    return {"repo_id": body.repo_id, "flows": flow_data.get("flows", [])}
