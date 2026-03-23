"""
app/models/models.py — SQLAlchemy ORM models (PostgreSQL-ready, SQLite fallback)
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, DateTime, JSON, ForeignKey, Float
from sqlalchemy.orm import relationship

from app.db.session import Base


def gen_uuid():
    return str(uuid.uuid4())[:8]


class Repository(Base):
    __tablename__ = "repositories"

    id = Column(String(8), primary_key=True, default=gen_uuid)
    url = Column(String(512), nullable=False, index=True)
    name = Column(String(256))
    language = Column(String(64))
    framework = Column(String(64))
    total_files = Column(Integer, default=0)
    total_lines = Column(Integer, default=0)
    status = Column(String(32), default="pending")   # pending|analyzing|ready|error
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    analyses = relationship("Analysis", back_populates="repository", cascade="all, delete")
    chat_sessions = relationship("ChatSession", back_populates="repository", cascade="all, delete")


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(String(8), primary_key=True, default=gen_uuid)
    repo_id = Column(String(8), ForeignKey("repositories.id"), nullable=False)
    summary = Column(Text)
    architecture_overview = Column(Text)
    data_flow = Column(Text)
    dependencies = Column(JSON)              # list[str]
    entry_points = Column(JSON)              # list[str]
    file_ranking = Column(JSON)              # list[{file, importance, purpose}]
    learning_plan = Column(JSON)             # Guided learning steps
    generated_flows = Column(JSON)           # Flow diagrams
    created_at = Column(DateTime, default=datetime.utcnow)

    repository = relationship("Repository", back_populates="analyses")


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String(8), primary_key=True, default=gen_uuid)
    repo_id = Column(String(8), ForeignKey("repositories.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    repository = relationship("Repository", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(8), ForeignKey("chat_sessions.id"), nullable=False)
    role = Column(String(16))               # user | assistant
    content = Column(Text)
    hinglish_content = Column(Text, nullable=True)
    sources = Column(JSON, nullable=True)   # list of file paths cited
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("ChatSession", back_populates="messages")


# ─────────────────────────────────────────────────────────────────────────────
"""
app/schemas/schemas.py — Pydantic request/response schemas
"""
from pydantic import BaseModel, HttpUrl
from typing import Optional, List, Any


# ── Repository ────────────────────────────────────────────────────────────────

class UploadRepoRequest(BaseModel):
    repo_url: str

class UploadRepoResponse(BaseModel):
    repo_id: str
    status: str
    total_files: int
    detected_frameworks: List[str]
    entry_points: List[str]
    message: str


# ── Analysis ──────────────────────────────────────────────────────────────────

class FileRank(BaseModel):
    file: str
    importance: int
    purpose: str

class AnalysisResponse(BaseModel):
    repo_id: str
    project_name: str
    language: str
    framework: str
    total_files: int
    total_lines: int
    dependencies: List[str]
    entry_points: List[str]
    summary: str
    architecture_overview: str
    data_flow: str
    file_ranking: List[FileRank]


# ── Chat ──────────────────────────────────────────────────────────────────────

class ChatHistoryItem(BaseModel):
    role: str                               # "user" | "assistant"
    content: str

class ChatRequest(BaseModel):
    repo_id: str
    message: str
    history: List[ChatHistoryItem] = []
    hinglish: bool = False

class ChatResponse(BaseModel):
    answer: str
    hinglish: Optional[str] = None
    sources: List[str] = []


# ── Hinglish ──────────────────────────────────────────────────────────────────

class HinglishRequest(BaseModel):
    text: str
    style: str = "casual"                   # casual | formal | developer

class HinglishResponse(BaseModel):
    original: str
    hinglish: str


# ── Voice ─────────────────────────────────────────────────────────────────────

class VoiceInputResponse(BaseModel):
    transcript: str
    mock: bool = False

class VoiceSynthRequest(BaseModel):
    text: str
    lang: str = "en"                        # en | hi
    speed: float = 1.0


# ── Guided Learning ───────────────────────────────────────────────────────────

class LearningStep(BaseModel):
    step: int
    title: str
    description: str
    files_to_read: List[str]
    key_concepts: List[str]
    estimated_time: str

class LearningPlanResponse(BaseModel):
    repo_id: str
    project_name: str
    total_steps: int
    estimated_total_time: str
    prerequisite_knowledge: List[str]
    steps: List[LearningStep]


# ── Flow ──────────────────────────────────────────────────────────────────────

class FlowNode(BaseModel):
    id: str
    label: str
    type: str                               # entry|process|data|output|external
    description: str

class FlowEdge(BaseModel):
    from_id: str
    to_id: str
    label: str = ""

class FlowDiagram(BaseModel):
    name: str
    description: str
    nodes: List[FlowNode]
    edges: List[FlowEdge]
    text_representation: str

class FlowResponse(BaseModel):
    repo_id: str
    flows: List[FlowDiagram]


# ── Prototype ─────────────────────────────────────────────────────────────────

class UIScreen(BaseModel):
    id: str
    name: str
    route: str
    description: str
    components: List[str]
    connected_to: List[str]               # IDs of screens this links to
    jsx_code: str                         # Generated placeholder React JSX

class PrototypeResponse(BaseModel):
    repo_id: str
    detected_screens: List[UIScreen]
    navigation_structure: str
    framework_detected: str
