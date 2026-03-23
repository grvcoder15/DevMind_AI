# 🧠 DevMind AI — Codebase Companion System v2.0

> **100% FREE** AI SaaS for understanding any GitHub codebase — with guided learning, flow visualization, Hinglish explanations, voice assistant, and UI prototype generation.

---

## 🎉 **NEW: Fully FREE Setup Available!**

DevMind AI now runs **completely free** using:
- 🦙 **Ollama** (Local LLM - Llama3, Mistral, etc.)
- 🗄️ **Supabase** (Free PostgreSQL database)
- 🎤 **Whisper + gTTS** (Free voice features)
- 🔍 **FAISS** (Local vector search)

**Quick Start:** [QUICKSTART.md](QUICKSTART.md) | **Ollama Setup:** [OLLAMA_SETUP.md](OLLAMA_SETUP.md)

---

## 📁 Complete Folder Structure

```
devmind-ai/
│
├── backend/
│   ├── main.py                              # FastAPI app, CORS, lifespan hooks
│   ├── requirements.txt
│   ├── .env.example
│   │
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── repo.py                  # POST /upload-repo
│   │   │       ├── analyze.py               # POST /analyze
│   │   │       ├── chat.py                  # POST /chat
│   │   │       ├── hinglish.py              # POST /convert-hinglish
│   │   │       ├── voice.py                 # POST /voice/transcribe, /synthesize
│   │   │       ├── learning.py              # POST /guided-learning
│   │   │       ├── flow.py                  # POST /generate-flow
│   │   │       └── prototype.py             # POST /generate-prototype
│   │   │
│   │   ├── core/
│   │   │   ├── config.py                    # Pydantic settings (all env vars)
│   │   │   └── logging.py                   # Structured logging setup
│   │   │
│   │   ├── models/
│   │   │   └── models.py                    # SQLAlchemy ORM (PostgreSQL-ready)
│   │   │       ├── Repository
│   │   │       ├── Analysis
│   │   │       ├── ChatSession
│   │   │       └── ChatMessage
│   │   │
│   │   ├── schemas/
│   │   │   └── schemas.py                   # Pydantic request/response schemas
│   │   │
│   │   ├── services/
│   │   │   ├── ai_service.py                # LLM client (Ollama + HuggingFace + OpenRouter + Anthropic + OpenAI)
│   │   │   ├── repo_service.py              # Git clone → file parsing → snapshot
│   │   │   ├── analysis_service.py          # Parallel LLM analysis pipeline
│   │   │   ├── chat_service.py              # RAG chat (vector search + LLM)
│   │   │   ├── hinglish_service.py          # Hinglish conversion (3 styles)
│   │   │   ├── voice_service.py             # Whisper STT + gTTS
│   │   │   ├── learning_service.py          # Guided curriculum generation
│   │   │   ├── flow_service.py              # System flow diagram generation
│   │   │   └── prototype_service.py         # UI screen detection + React gen
│   │   │
│   │   └── db/
│   │       ├── session.py                   # SQLAlchemy async session factory
│   │       └── vector_store.py              # FAISS index per repo
│   │
│   └── tests/
│       ├── test_repo_service.py
│       ├── test_analysis_service.py
│       ├── test_chat_service.py
│       └── test_learning_service.py
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   │
│   └── src/
│       ├── App.jsx                          # Root app + context + router
│       ├── main.jsx                         # Vite entry point
│       │
│       ├── context/
│       │   └── AppContext.jsx               # Global state (analysis, repo, page)
│       │
│       ├── pages/
│       │   ├── UploadPage.jsx               # GitHub URL input + pipeline progress
│       │   ├── DashboardPage.jsx            # Analysis results (3 tabs)
│       │   ├── ChatPage.jsx                 # AI chat + Hinglish + Voice
│       │   ├── LearningPage.jsx             # Step-by-step guided learning
│       │   ├── FlowPage.jsx                 # Flow visualizer
│       │   └── PrototypePage.jsx            # UI screen previews
│       │
│       ├── components/
│       │   ├── Sidebar.jsx                  # Navigation sidebar
│       │   ├── Badge.jsx                    # Colored label badges
│       │   ├── HinglishToggle.jsx           # Toggle switch for Hindi/English
│       │   ├── VoiceButton.jsx              # Mic button + Web Speech API
│       │   ├── Spinner.jsx                  # Loading indicator
│       │   ├── SectionCard.jsx              # Content card wrapper
│       │   ├── FileBar.jsx                  # File importance progress bar
│       │   ├── FlowDiagram.jsx              # Flow node/edge renderer
│       │   ├── PrototypePreview.jsx         # Screen device-frame preview
│       │   ├── ChatMessage.jsx              # Message bubble + Hinglish box
│       │   └── InlineCode.jsx               # Backtick → <code> renderer
│       │
│       ├── hooks/
│       │   ├── useChat.js                   # Chat state + send logic
│       │   ├── useAnalysis.js               # Analysis state + polling
│       │   ├── useVoice.js                  # Web Speech API hook
│       │   └── useHinglish.js               # Hinglish conversion cache
│       │
│       ├── services/
│       │   └── api.js                       # All fetch calls to FastAPI backend
│       │
│       └── utils/
│           ├── codeHighlight.js             # Backtick parsing
│           └── speechUtils.js               # TTS helper
│
└── README.md
```

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite)                     │
│                                                                     │
│  Upload → Dashboard → Chat → Learning → Flow → Prototype            │
│                                                                     │
│  Components: Sidebar · HinglishToggle · VoiceButton · FlowDiagram  │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ REST API (JSON)
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      FASTAPI BACKEND (Python)                       │
│                                                                     │
│  /upload-repo     /analyze       /chat          /convert-hinglish   │
│  /voice/*         /guided-learning  /generate-flow  /generate-prototype │
└──────┬────────────────────────────────────────────────────────┬─────┘
       │                                                        │
┌──────▼────────────────────────────────┐  ┌───────────────────▼──────┐
│            SERVICE LAYER              │  │      AI / LLM LAYER      │
│                                       │  │                          │
│  RepoService    — Git clone + parse   │  │  LLMClient               │
│  AnalysisService — Parallel analysis  │  │  ├─ Anthropic Claude     │
│  ChatService    — RAG pipeline        │  │  └─ OpenAI GPT-4o        │
│  HinglishService — 3 style modes      │  │                          │
│  VoiceService   — Whisper + gTTS      │  │  Prompts:                │
│  LearningService — Curriculum gen     │  │  ├─ Summary              │
│  FlowService    — Flow diagrams       │  │  ├─ Architecture         │
│  PrototypeService — UI detection      │  │  ├─ Chat RAG             │
└──────┬────────────────────────────────┘  │  ├─ Hinglish (3 styles)  │
       │                                   │  ├─ Learning plan        │
┌──────▼────────────────────────────────┐  │  ├─ Flow diagrams        │
│          DATA LAYER                   │  │  └─ Prototype detection  │
│                                       │  └──────────────────────────┘
│  FAISS Vector Store (per repo)        │
│  ├─ 60-line chunks, 15-line overlap   │
│  ├─ OpenAI text-embedding-3-small     │
│  └─ Cosine similarity fallback        │
│                                       │
│  PostgreSQL (SQLAlchemy async)        │
│  ├─ Repository table                  │
│  ├─ Analysis table                    │
│  ├─ ChatSession + ChatMessage tables  │
│  └─ SQLite fallback for dev           │
└───────────────────────────────────────┘
```

---

## ⚙️ Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set:
#   ANTHROPIC_API_KEY=sk-ant-...
#   OPENAI_API_KEY=sk-...      (for embeddings)

# Start server
uvicorn main:app --reload --port 8000

# API docs available at:
# http://localhost:8000/docs
```

### Frontend Setup

```bash
cd frontend

npm install
npm run dev

# Opens at: http://localhost:5173
```

---

## 🔌 API Reference

| Method | Endpoint               | Description                                |
|--------|------------------------|--------------------------------------------|
| POST   | `/upload-repo`         | Clone + parse GitHub repo → returns repo_id |
| POST   | `/analyze`             | Full AI analysis (summary, arch, files)    |
| POST   | `/chat`                | RAG chat with Hinglish option              |
| POST   | `/convert-hinglish`    | Convert any text (3 styles)               |
| POST   | `/voice/transcribe`    | Audio file → transcript (Whisper)          |
| POST   | `/voice/synthesize`    | Text → MP3 audio stream (gTTS)             |
| POST   | `/guided-learning`     | Generate step-by-step learning curriculum  |
| POST   | `/generate-flow`       | Generate system flow diagrams              |
| POST   | `/generate-prototype`  | Detect UI screens + React placeholders     |
| GET    | `/health`              | System health check                        |
| GET    | `/docs`                | Swagger UI                                 |

---

## 🤖 AI Prompt Design

### 1. Codebase Summary
```
Analyze this codebase snapshot:
[Directory tree + package files injected]

Respond ONLY in this format:
SUMMARY: <2-3 sentences>
FRAMEWORK: <name>
LANGUAGE: <name>
DEPENDENCIES: <comma-separated>
```

### 2. Guided Learning Plan
```
Create a guided learning plan for:
Project: {name} | Framework: {fw} | Architecture: {arch}

Return JSON:
{
  "prerequisite_knowledge": [...],
  "estimated_total_time": "X hours",
  "steps": [{step, title, description, files_to_read, key_concepts, estimated_time}]
}
```

### 3. Hinglish Conversion (3 Styles)

**Casual** — "yahan JWT token check hota hai ki user valid hai ya nahi"
**Formal** — "Yeh module authentication ka kaam karta hai JWT ke zariye"
**Developer** — "bhai dekh, ek dum simple — token verify karo aur aage jao"

### 4. Flow Generation
```
Generate 3-4 flow diagrams as JSON:
{flows: [{name, description, text_representation, nodes, edges}]}
Node types: entry | process | data | output | external | error
```

### 5. RAG Chat
```
System: Full project context + architecture + key files
User: [Top-5 vector search results] + user question
```

---

## 🔄 Data Flow

```
REPO UPLOAD → AI ANALYSIS
─────────────────────────
1. POST /upload-repo { repo_url }
2. GitPython.clone_from() → local disk
3. Walk file tree → filter noise → FileNode[]
4. Detect frameworks (package.json, imports)
5. FAISS: chunk files (60 lines, 15 overlap)
6. OpenAI embed chunks → FAISS IndexFlatL2
7. Cache RepoSnapshot in app.state
↓
8. POST /analyze { repo_id }
9. Parallel LLM calls (asyncio.gather):
   - Summary + Framework
   - Architecture overview
   - Data flow description
   - File importance ranking
10. Cache AnalysisResult

CHAT → RAG RESPONSE
────────────────────
1. POST /chat { repo_id, message, hinglish }
2. Embed user question (OpenAI)
3. FAISS search → top-5 relevant code chunks
4. Build system prompt: project context + chunks
5. Claude API → answer
6. If hinglish=true → post-process with Hinglish prompt
7. Return { answer, hinglish, sources }

VOICE PIPELINE
──────────────
1. Browser: Web Speech API → transcript (free, no server)
   OR: Upload audio → POST /voice/transcribe → Whisper STT
2. Transcript → POST /chat (normal RAG flow)
3. Response text → POST /voice/synthesize → gTTS MP3
   OR: Browser: SpeechSynthesis API (free, no server)
4. Play audio in browser
```

---

## 🧩 requirements.txt

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
pydantic==2.7.1
pydantic-settings==2.2.1
anthropic==0.28.0
openai==1.30.0
GitPython==3.1.43
faiss-cpu==1.8.0
numpy==1.26.4
sqlalchemy[asyncio]==2.0.30
aiosqlite==0.20.0
asyncpg==0.29.0
openai-whisper==20231117
gTTS==2.5.1
httpx==0.27.0
redis==5.0.4
python-dotenv==1.0.1
python-multipart==0.0.9
```
