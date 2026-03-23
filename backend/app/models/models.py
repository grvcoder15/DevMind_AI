"""
app/models/models.py — SQLAlchemy ORM models (PostgreSQL-ready, SQLite fallback)
+ Pydantic request/response schemas (combined for compactness; split as needed).
"""

import uuid
from datetime import datetime

from sqlalchemy import Column, String, Integer, Text, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base
from pydantic import BaseModel
from typing import List, Optional


# ─── Helpers ─────────────────────────────────────────────────────────────────

def gen_uuid() -> str:
    return str(uuid.uuid4())[:8]


# ─── ORM Models ──────────────────────────────────────────────────────────────

class Repository(Base):
    __tablename__ = "repositories"

    id          = Column(String(8),  primary_key=True, default=gen_uuid)
    url         = Column(String(512), nullable=False, index=True)
    name        = Column(String(256))
    language    = Column(String(64))
    framework   = Column(String(64))
    total_files = Column(Integer, default=0)
    total_lines = Column(Integer, default=0)
    status      = Column(String(32), default="pending")  # pending|analyzing|ready|error
    created_at  = Column(DateTime, default=datetime.utcnow)

    analyses      = relationship("Analysis",       back_populates="repository", cascade="all, delete")
    chat_sessions = relationship("ChatSession",    back_populates="repository", cascade="all, delete")
    files         = relationship("RepositoryFile", back_populates="repository", cascade="all, delete")


class Analysis(Base):
    __tablename__ = "analyses"

    id                   = Column(String(8), primary_key=True, default=gen_uuid)
    repo_id              = Column(String(8), ForeignKey("repositories.id"), nullable=False)
    summary              = Column(Text)
    architecture_overview = Column(Text)
    data_flow            = Column(Text)
    dependencies         = Column(JSON)   # list[str]
    entry_points         = Column(JSON)   # list[str]
    file_ranking         = Column(JSON)   # list[{file, importance, purpose}]
    learning_plan        = Column(JSON)   # guided learning JSON
    generated_flows      = Column(JSON)   # flow diagrams JSON
    created_at           = Column(DateTime, default=datetime.utcnow)

    repository = relationship("Repository", back_populates="analyses")


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id         = Column(String(8), primary_key=True, default=gen_uuid)
    repo_id    = Column(String(8), ForeignKey("repositories.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    repository = relationship("Repository", back_populates="chat_sessions")
    messages   = relationship("ChatMessage", back_populates="session", cascade="all, delete")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id              = Column(Integer, primary_key=True, autoincrement=True)
    session_id      = Column(String(8), ForeignKey("chat_sessions.id"), nullable=False)
    role            = Column(String(16))         # user | assistant
    content         = Column(Text)
    hinglish_content = Column(Text, nullable=True)
    sources         = Column(JSON, nullable=True) # list[str] of file paths cited
    created_at      = Column(DateTime, default=datetime.utcnow)

    session = relationship("ChatSession", back_populates="messages")


class RepositoryFile(Base):
    __tablename__ = "repository_files"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    repo_id    = Column(String(8), ForeignKey("repositories.id"), nullable=False, index=True)
    file_path  = Column(String(512), nullable=False)
    content    = Column(Text)
    language   = Column(String(64))
    lines      = Column(Integer, default=0)
    size_bytes = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    repository = relationship("Repository", back_populates="files")


# ─── Pydantic Schemas ─────────────────────────────────────────────────────────

class FileRank(BaseModel):
    file:       str
    importance: int
    purpose:    str


class UploadRepoRequest(BaseModel):
    repo_url: str


class AnalyzeRequest(BaseModel):
    repo_id: str


class ChatHistoryItem(BaseModel):
    role:    str   # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    repo_id: str
    message: str
    history: List[ChatHistoryItem] = []
    hinglish: bool = False


class ChatResponse(BaseModel):
    answer:   str
    hinglish: Optional[str] = None
    sources:  List[str] = []


class HinglishRequest(BaseModel):
    text:  str
    style: str = "casual"   # casual | formal | developer


class LearningRequest(BaseModel):
    repo_id:       str
    force_refresh: bool = False


class FlowRequest(BaseModel):
    repo_id: str


class PrototypeRequest(BaseModel):
    repo_id: str
