"""
app/api/v1/learning.py — POST /guided-learning
Generate a step-by-step learning curriculum for the analyzed repository.
"""

import logging
from fastapi import APIRouter, HTTPException, Request
from app.models.models import LearningRequest
from app.services.ai_service import generate_learning_plan

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("")
async def guided_learning(request: Request, body: LearningRequest):
    """
    Generate a structured learning curriculum for the codebase.

    Output includes:
      - Prerequisite knowledge
      - 6-8 progressive steps
      - Files to read per step
      - Estimated time per step
    """
    analysis = request.app.state.analyses.get(body.repo_id)
    if not analysis:
        raise HTTPException(404, "Analyze the repository first via /analyze.")

    # Return cached plan unless force_refresh
    cached = request.app.state.learning_plans.get(body.repo_id)
    if cached and not body.force_refresh:
        logger.info(f"Returning cached learning plan for {body.repo_id}")
        return cached

    logger.info(f"Generating learning plan for {analysis.get('project_name')}")
    plan_data = await generate_learning_plan(analysis)
    
    logger.info(f"Learning steps generated: {len(plan_data.get('steps', []))}")

    result = {
        "repo_id":                body.repo_id,
        "project_name":           analysis.get("project_name", "Unknown"),
        "total_steps":            len(plan_data.get("steps", [])),
        "estimated_total_time":   plan_data.get("estimated_total_time", "Unknown"),
        "prerequisite_knowledge": plan_data.get("prerequisite_knowledge", []),
        "steps":                  plan_data.get("steps", []),
    }

    request.app.state.learning_plans[body.repo_id] = result
    return result
