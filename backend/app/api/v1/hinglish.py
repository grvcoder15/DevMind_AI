"""
app/api/v1/hinglish.py — POST /convert-hinglish
Standalone Hinglish conversion with 3 style modes.
"""

from fastapi import APIRouter
from app.models.models import HinglishRequest
from app.services.ai_service import convert_to_hinglish

router = APIRouter()


@router.post("")
async def convert_hinglish(body: HinglishRequest):
    """
    Convert any English technical text to Hinglish.
    Styles: casual | formal | developer
    """
    translated = await convert_to_hinglish(body.text, body.style)
    return {"original": body.text, "hinglish": translated, "style": body.style}
