"""
app/api/v1/ — All route handlers

Each section is a separate module in production.
Combined here for clarity; split into individual files when deploying.

Files:
  repo.py       → POST /upload-repo
  analyze.py    → POST /analyze
  chat.py       → POST /chat
  hinglish.py   → POST /convert-hinglish
  voice.py      → POST /voice/transcribe, POST /voice/synthesize
  learning.py   → POST /guided-learning
  flow.py       → POST /generate-flow
  prototype.py  → POST /generate-prototype
"""

# ══════════════════════════════════════════════════════════════════════════════
# repo.py
# ══════════════════════════════════════════════════════════════════════════════
from fastapi import APIRouter, HTTPException, Request, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
import io, json, logging, asyncio, tempfile

logger = logging.getLogger(__name__)


# ─── POST /upload-repo ────────────────────────────────────────────────────────
repo_router = APIRouter()


class UploadRepoRequest(BaseModel):
    repo_url: str


@repo_router.post("")
async def upload_repo(request: Request, body: UploadRepoRequest):
    """
    Clone and parse a GitHub repository.

    Pipeline:
      1. Validate URL
      2. Clone via GitPython (async thread pool)
      3. Walk file tree → RepoSnapshot
      4. Index chunks in FAISS vector store
      5. Cache snapshot in app.state

    Returns repo_id for all downstream calls.
    """
    if "github.com" not in body.repo_url:
        raise HTTPException(400, "Only GitHub URLs are currently supported")

    from app.services.repo_service import RepoService
    service = RepoService()

    try:
        snapshot = await service.ingest(body.repo_url)
    except Exception as e:
        logger.error(f"Repo ingestion failed: {e}")
        raise HTTPException(422, f"Failed to clone repository: {str(e)}")

    # Store in app state (replace with Redis/DB in production)
    request.app.state.snapshots[snapshot.repo_id] = snapshot

    # Index in background to not block response
    asyncio.create_task(
        request.app.state.vector_store.index_repo(snapshot.repo_id, snapshot.files)
    )

    return {
        "repo_id": snapshot.repo_id,
        "status": "ready",
        "total_files": len(snapshot.files),
        "detected_frameworks": snapshot.detected_frameworks,
        "entry_points": snapshot.entry_points,
        "message": f"Repository parsed. {len(snapshot.files)} files ready for analysis.",
    }


# ─── POST /analyze ────────────────────────────────────────────────────────────
analyze_router = APIRouter()


class AnalyzeRequest(BaseModel):
    repo_id: str


@analyze_router.post("")
async def analyze(request: Request, body: AnalyzeRequest):
    """
    Run full AI analysis pipeline on a cloned repository.

    Concurrent LLM calls:
      - Summary + Framework detection
      - Architecture overview
      - Data flow description
      - File importance ranking
    """
    snapshot = request.app.state.snapshots.get(body.repo_id)
    if not snapshot:
        raise HTTPException(404, "Repository not found. Call /upload-repo first.")

    from app.services.analysis_service import AnalysisService
    service = AnalysisService()
    result = await service.analyze(snapshot)

    # Cache analysis
    request.app.state.analyses[body.repo_id] = result
    return result


# ─── POST /chat ───────────────────────────────────────────────────────────────
chat_router = APIRouter()


class ChatRequest(BaseModel):
    repo_id: str
    message: str
    history: List[dict] = []
    hinglish: bool = False


@chat_router.post("")
async def chat(request: Request, body: ChatRequest):
    """
    Context-aware AI chat over the indexed codebase.

    RAG Pipeline:
      1. Embed user question
      2. Vector search → top-5 relevant code chunks
      3. Inject chunks + project context into system prompt
      4. Stream LLM response
      5. Optionally run Hinglish post-processing
    """
    analysis = request.app.state.analyses.get(body.repo_id)
    if not analysis:
        raise HTTPException(404, "Repository not analyzed. Call /analyze first.")

    from app.services.chat_service import ChatService
    service = ChatService(vector_store=request.app.state.vector_store)

    result = await service.chat(
        repo_id=body.repo_id,
        question=body.message,
        history=body.history,
        analysis=analysis,
        hinglish=body.hinglish,
    )
    return result


# ─── POST /convert-hinglish ──────────────────────────────────────────────────
hinglish_router = APIRouter()


class HinglishRequest(BaseModel):
    text: str
    style: str = "casual"    # casual | formal | developer


@hinglish_router.post("")
async def convert_hinglish(body: HinglishRequest):
    """Standalone Hinglish conversion with style options."""
    from app.services.ai_service import convert_to_hinglish
    translated = await convert_to_hinglish(body.text, body.style)
    return {"original": body.text, "hinglish": translated, "style": body.style}


# ─── POST /voice/transcribe & /voice/synthesize ───────────────────────────────
voice_router = APIRouter()


@voice_router.post("/transcribe")
async def transcribe_voice(audio: UploadFile = File(...)):
    """
    Speech-to-Text via OpenAI Whisper.
    Accepts: mp3, wav, webm, ogg, m4a
    Returns: transcript string
    """
    try:
        import whisper
        model = whisper.load_model("base")
        content = await audio.read()
        with tempfile.NamedTemporaryFile(suffix=".audio", delete=False) as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        result = model.transcribe(tmp_path, language="en")
        return {"transcript": result["text"], "mock": False}
    except ImportError:
        # Mock mode — Whisper not installed
        return {
            "transcript": "Tell me about the authentication flow in this codebase",
            "mock": True,
            "message": "Install openai-whisper for real transcription",
        }
    except Exception as e:
        raise HTTPException(500, f"Transcription failed: {str(e)}")


class SynthRequest(BaseModel):
    text: str
    lang: str = "en"
    speed: float = 1.0


@voice_router.post("/synthesize")
async def synthesize_voice(body: SynthRequest):
    """
    Text-to-Speech via gTTS.
    Returns: MP3 audio stream
    """
    try:
        from gtts import gTTS
        tts = gTTS(text=body.text[:500], lang=body.lang, slow=(body.speed < 0.8))
        buf = io.BytesIO()
        tts.write_to_fp(buf)
        buf.seek(0)
        return StreamingResponse(buf, media_type="audio/mpeg")
    except ImportError:
        return {"message": "Install gTTS for voice synthesis", "mock": True}
    except Exception as e:
        raise HTTPException(500, f"Synthesis failed: {str(e)}")


# ─── POST /guided-learning ────────────────────────────────────────────────────
learning_router = APIRouter()


class LearningRequest(BaseModel):
    repo_id: str
    force_refresh: bool = False


@learning_router.post("")
async def guided_learning(request: Request, body: LearningRequest):
    """
    Generate a structured learning curriculum for the codebase.

    Output:
      - Prerequisites
      - 6-8 progressive steps
      - Files to read per step
      - Estimated time per step
    """
    analysis = request.app.state.analyses.get(body.repo_id)
    if not analysis:
        raise HTTPException(404, "Analyze the repository first.")

    # Use cached plan unless forced refresh
    cached = request.app.state.learning_plans.get(body.repo_id)
    if cached and not body.force_refresh:
        return cached

    from app.services.ai_service import generate_learning_plan
    plan_data = await generate_learning_plan(analysis)

    result = {
        "repo_id": body.repo_id,
        "project_name": analysis.get("project_name", "Unknown"),
        "total_steps": len(plan_data.get("steps", [])),
        "estimated_total_time": plan_data.get("estimated_total_time", "Unknown"),
        "prerequisite_knowledge": plan_data.get("prerequisite_knowledge", []),
        "steps": plan_data.get("steps", []),
    }

    request.app.state.learning_plans[body.repo_id] = result
    return result


# ─── POST /generate-flow ──────────────────────────────────────────────────────
flow_router = APIRouter()


class FlowRequest(BaseModel):
    repo_id: str


@flow_router.post("")
async def generate_flow(request: Request, body: FlowRequest):
    """
    Generate system flow diagrams (request flow, auth flow, data flow, etc.)
    Returns structured node-edge graphs + text representations.
    """
    analysis = request.app.state.analyses.get(body.repo_id)
    if not analysis:
        raise HTTPException(404, "Analyze the repository first.")

    from app.services.ai_service import generate_flows
    flow_data = await generate_flows(analysis)

    return {"repo_id": body.repo_id, "flows": flow_data.get("flows", [])}


# ─── POST /generate-prototype ─────────────────────────────────────────────────
prototype_router = APIRouter()


class PrototypeRequest(BaseModel):
    repo_id: str


@prototype_router.post("")
async def generate_prototype(request: Request, body: PrototypeRequest):
    """
    Detect possible UI screens from the codebase and generate
    React placeholder components with navigation.
    """
    snapshot = request.app.state.snapshots.get(body.repo_id)
    analysis = request.app.state.analyses.get(body.repo_id)

    if not analysis or not snapshot:
        raise HTTPException(404, "Upload and analyze repository first.")

    file_paths = [f.path for f in snapshot.files]

    from app.services.ai_service import generate_prototype as gen_proto
    proto_data = await gen_proto(analysis, file_paths)

    return {
        "repo_id": body.repo_id,
        "detected_screens": proto_data.get("screens", []),
        "navigation_structure": proto_data.get("navigation_structure", ""),
        "framework_detected": proto_data.get("framework_detected", "React"),
    }
