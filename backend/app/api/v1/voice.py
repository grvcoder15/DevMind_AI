"""
app/api/v1/voice.py — POST /voice/transcribe, POST /voice/synthesize
Speech-to-text via Whisper and text-to-speech via gTTS.
Both libraries are optional — endpoints degrade gracefully to mock mode.
"""

import io
import logging
import tempfile

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

router = APIRouter()
logger = logging.getLogger(__name__)


# ─── Speech-to-Text ──────────────────────────────────────────────────────────

@router.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    """
    Accepts an audio file (mp3/wav/webm/ogg/m4a).
    Returns a transcript string via OpenAI Whisper.
    Falls back to a mock transcript if Whisper is not installed.
    """
    try:
        import whisper
        content  = await audio.read()
        with tempfile.NamedTemporaryFile(suffix=".audio", delete=False) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        model  = whisper.load_model("base")
        result = model.transcribe(tmp_path, language="en")
        return {"transcript": result["text"], "mock": False}

    except ImportError:
        return {
            "transcript": "Tell me about the authentication flow in this codebase",
            "mock": True,
            "message": "Install openai-whisper for real transcription.",
        }
    except Exception as e:
        raise HTTPException(500, f"Transcription failed: {str(e)}")


# ─── Text-to-Speech ──────────────────────────────────────────────────────────

class SynthRequest(BaseModel):
    text:  str
    lang:  str   = "en"    # "en" | "hi"
    speed: float = 1.0


@router.post("/synthesize")
async def synthesize(body: SynthRequest):
    """
    Converts text to MP3 audio stream via gTTS.
    Falls back to a JSON mock if gTTS is not installed.
    """
    try:
        from gtts import gTTS
        tts = gTTS(text=body.text[:500], lang=body.lang, slow=(body.speed < 0.8))
        buf = io.BytesIO()
        tts.write_to_fp(buf)
        buf.seek(0)
        return StreamingResponse(buf, media_type="audio/mpeg")

    except ImportError:
        return {"message": "Install gTTS for voice synthesis.", "mock": True}
    except Exception as e:
        raise HTTPException(500, f"Synthesis failed: {str(e)}")
