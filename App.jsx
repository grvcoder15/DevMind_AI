// DevMind AI – Codebase Companion
// Full React Frontend — Vite + Tailwind
// src/App.jsx (single-file architecture for prototype; split into pages/ for production)

import { useState, useRef, useEffect, createContext, useContext } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT — Global app state
// ═══════════════════════════════════════════════════════════════════════════

const AppContext = createContext(null);

function useApp() {
  return useContext(AppContext);
}

// ═══════════════════════════════════════════════════════════════════════════
// API SERVICE — All backend calls
// ═══════════════════════════════════════════════════════════════════════════

const API = "http://localhost:8000";

const api = {
  async uploadRepo(url) {
    const r = await fetch(`${API}/upload-repo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo_url: url }),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },

  async analyze(repoId) {
    const r = await fetch(`${API}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo_id: repoId }),
    });
    return r.json();
  },

  async chat(repoId, message, history, hinglish = false) {
    const r = await fetch(`${API}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo_id: repoId, message, history, hinglish }),
    });
    return r.json();
  },

  async convertHinglish(text, style = "casual") {
    const r = await fetch(`${API}/convert-hinglish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, style }),
    });
    return r.json();
  },

  async guidedLearning(repoId) {
    const r = await fetch(`${API}/guided-learning`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo_id: repoId }),
    });
    return r.json();
  },

  async generateFlow(repoId) {
    const r = await fetch(`${API}/generate-flow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo_id: repoId }),
    });
    return r.json();
  },

  async generatePrototype(repoId) {
    const r = await fetch(`${API}/generate-prototype`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo_id: repoId }),
    });
    return r.json();
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// ANTHROPIC DIRECT — For the live prototype widget
// (In production, all AI calls go through your FastAPI backend)
// ═══════════════════════════════════════════════════════════════════════════

async function claudeChat(messages, systemPrompt) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    }),
  });
  const d = await r.json();
  return d.content?.[0]?.text || "No response.";
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════

const MOCK_ANALYSIS = {
  project_name: "FastAPI E-Commerce Backend",
  language: "Python",
  framework: "FastAPI",
  total_files: 42,
  total_lines: 3840,
  dependencies: ["fastapi","sqlalchemy","pydantic","redis","celery","alembic","stripe","jwt"],
  entry_points: ["main.py","app/api/v1/router.py","app/workers/celery_app.py"],
  summary: "Production-grade e-commerce REST API built with FastAPI. Handles JWT authentication, product catalog, cart & order processing, Stripe payments, and async email notifications via Celery workers.",
  architecture_overview: "Layered architecture: Router → Service → Repository → Model. JWT auth middleware on protected routes. Redis for session caching. Celery + Redis for async task queue. PostgreSQL as primary data store.",
  data_flow: "HTTP Request → FastAPI Router → JWT Middleware → Service Layer → Repository (SQLAlchemy ORM) → PostgreSQL. Async operations dispatched to Celery queue via Redis broker.",
  file_ranking: [
    { file: "main.py", importance: 98, purpose: "App entry, middleware chain setup" },
    { file: "app/api/v1/auth.py", importance: 92, purpose: "JWT login, register, token refresh" },
    { file: "app/services/order_service.py", importance: 88, purpose: "Order lifecycle & Stripe payments" },
    { file: "app/models/user.py", importance: 85, purpose: "User ORM model + relations" },
    { file: "app/core/security.py", importance: 82, purpose: "Password hashing, JWT utilities" },
    { file: "app/api/v1/products.py", importance: 78, purpose: "Product CRUD endpoints" },
    { file: "app/workers/email_worker.py", importance: 71, purpose: "Async email task queue" },
    { file: "app/db/session.py", importance: 65, purpose: "SQLAlchemy session factory" },
  ],
};

const MOCK_LEARNING = {
  estimated_total_time: "6-8 hours",
  prerequisite_knowledge: ["Python basics", "REST APIs", "SQL fundamentals", "HTTP protocol"],
  steps: [
    { step: 1, title: "Start at the Entry Point", description: "Understand app initialization, middleware chain, and how FastAPI is configured.", files_to_read: ["main.py","app/core/config.py"], key_concepts: ["ASGI","Middleware","CORS","Lifespan events"], estimated_time: "30 minutes" },
    { step: 2, title: "Understand the Data Models", description: "Learn the SQLAlchemy ORM models and how they map to database tables.", files_to_read: ["app/models/user.py","app/models/product.py","app/models/order.py"], key_concepts: ["ORM","SQLAlchemy","Relationships","Migrations"], estimated_time: "45 minutes" },
    { step: 3, title: "Trace the Auth Flow", description: "Follow JWT authentication from login → token generation → protected route access.", files_to_read: ["app/api/v1/auth.py","app/core/security.py","app/dependencies/auth.py"], key_concepts: ["JWT","OAuth2","Password hashing","Dependency injection"], estimated_time: "60 minutes" },
    { step: 4, title: "Explore the Service Layer", description: "Understand business logic separation and how services orchestrate repositories.", files_to_read: ["app/services/order_service.py","app/services/product_service.py"], key_concepts: ["Service pattern","Repository pattern","Business logic"], estimated_time: "45 minutes" },
    { step: 5, title: "Async Tasks with Celery", description: "Understand background job processing for emails, notifications, and heavy operations.", files_to_read: ["app/workers/celery_app.py","app/workers/email_worker.py"], key_concepts: ["Celery","Redis broker","Async tasks","Worker processes"], estimated_time: "40 minutes" },
    { step: 6, title: "Payment Integration", description: "Trace a complete order from cart to Stripe payment to fulfillment.", files_to_read: ["app/services/order_service.py","app/api/v1/payments.py"], key_concepts: ["Stripe webhooks","Idempotency","Payment lifecycle"], estimated_time: "50 minutes" },
  ],
};

const MOCK_FLOWS = [
  { name: "HTTP Request Flow", description: "Full lifecycle of an API request", text_representation: "Client Request\n    ↓\nFastAPI Router\n    ↓\nJWT Middleware\n    ↓\nRoute Handler\n    ↓\nService Layer\n    ↓\nRepository (ORM)\n    ↓\nPostgreSQL\n    ↓\nJSON Response", nodes: ["Client","Router","Auth MW","Handler","Service","Repository","Database","Response"], type: "request" },
  { name: "Authentication Flow", description: "User login and token validation", text_representation: "POST /auth/login\n    ↓\nValidate Credentials\n    ↓\nHash & Compare\n    ↓\nGenerate JWT\n    ↓\nReturn Token\n    ↓\n(Subsequent requests)\n    ↓\nVerify JWT Signature\n    ↓\nExtract User Context", nodes: ["Login Endpoint","User Lookup","Password Verify","JWT Generator","Token Response","JWT Validator","User Context"], type: "auth" },
  { name: "Order Processing Flow", description: "End-to-end order lifecycle", text_representation: "POST /orders\n    ↓\nValidate Cart Items\n    ↓\nCalculate Total\n    ↓\nStripe Payment Intent\n    ↓\nConfirm Payment\n    ↓\nCreate Order Record\n    ↓\nDispatch Email Task\n    ↓\nReturn Order ID", nodes: ["Order Request","Cart Validation","Price Calc","Stripe API","Payment Confirm","DB Write","Celery Queue","Email Worker"], type: "business" },
];

// ═══════════════════════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function Badge({ children, color = "indigo" }) {
  const c = {
    indigo: "bg-indigo-950 text-indigo-300 border-indigo-800",
    green:  "bg-emerald-950 text-emerald-300 border-emerald-800",
    amber:  "bg-amber-950 text-amber-300 border-amber-800",
    slate:  "bg-slate-800 text-slate-400 border-slate-700",
    rose:   "bg-rose-950 text-rose-300 border-rose-800",
    violet: "bg-violet-950 text-violet-300 border-violet-800",
  }[color];
  return <span className={`text-xs px-2.5 py-0.5 rounded border font-mono ${c}`}>{children}</span>;
}

function Spinner({ size = "sm" }) {
  const s = size === "sm" ? "w-4 h-4" : "w-6 h-6";
  return <div className={`${s} border-2 border-indigo-400 border-t-transparent rounded-full animate-spin`} />;
}

function HinglishToggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
        value
          ? "bg-amber-950/60 border-amber-700/60 text-amber-300"
          : "bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-600"
      }`}
    >
      <span className="text-sm">अ</span>
      <span>Hinglish {value ? "ON" : "OFF"}</span>
      <div className={`w-6 h-3 rounded-full transition-colors ${value ? "bg-amber-600" : "bg-slate-700"}`}>
        <div className={`w-2.5 h-2.5 bg-white rounded-full m-0.25 transition-transform ${value ? "translate-x-3" : "translate-x-0.5"}`} style={{ marginTop: "1px", marginLeft: value ? "12px" : "2px" }} />
      </div>
    </button>
  );
}

function VoiceButton({ onTranscript, listening, setListening }) {
  const handleClick = () => {
    if (listening) { setListening(false); return; }
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SR();
      rec.lang = "en-IN";
      rec.continuous = false;
      rec.onresult = (e) => { onTranscript(e.results[0][0].transcript); setListening(false); };
      rec.onerror = () => setListening(false);
      rec.onend = () => setListening(false);
      rec.start();
      setListening(true);
    } else {
      // Simulate for demo
      onTranscript("Explain the authentication flow in this codebase");
    }
  };

  return (
    <button
      onClick={handleClick}
      title={listening ? "Stop listening" : "Voice input (click to speak)"}
      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
        listening
          ? "bg-rose-600 animate-pulse text-white"
          : "bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600"
      }`}
    >
      {listening ? "⏹" : "🎤"}
    </button>
  );
}

function Sidebar({ activePage, setPage, analysis }) {
  const navItems = [
    { id: "upload",    icon: "⬆", label: "Upload Repo" },
    { id: "dashboard", icon: "◈", label: "Dashboard",    disabled: !analysis },
    { id: "chat",      icon: "💬", label: "AI Chat",     disabled: !analysis },
    { id: "learning",  icon: "🎓", label: "Learn Mode",  disabled: !analysis },
    { id: "flow",      icon: "⟳", label: "Flow Viewer", disabled: !analysis },
    { id: "prototype", icon: "◻", label: "Prototype",   disabled: !analysis },
  ];

  return (
    <div className="w-56 bg-slate-950 border-r border-slate-800/60 flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-slate-800/60 flex items-center gap-2.5">
        <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-xs font-bold text-white">DM</div>
        <div>
          <div className="text-white text-sm font-semibold">DevMind AI</div>
          <div className="text-slate-600 text-[10px] font-mono">v2.0</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => !item.disabled && setPage(item.id)}
            disabled={item.disabled}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
              activePage === item.id
                ? "bg-indigo-950/60 text-indigo-300 border border-indigo-800/40"
                : item.disabled
                ? "text-slate-700 cursor-not-allowed"
                : "text-slate-500 hover:text-slate-300 hover:bg-slate-900"
            }`}
          >
            <span className="text-base">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Repo info */}
      {analysis && (
        <div className="p-4 border-t border-slate-800/60">
          <div className="text-[10px] text-slate-600 mb-1 font-mono">ACTIVE REPO</div>
          <div className="text-xs text-indigo-400 font-mono truncate">{analysis.project_name}</div>
          <div className="flex gap-1.5 mt-1.5">
            <Badge color="slate">{analysis.language}</Badge>
            <Badge color="indigo">{analysis.framework}</Badge>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE: UPLOAD
// ═══════════════════════════════════════════════════════════════════════════

function UploadPage() {
  const { setAnalysis, setPage } = useApp();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");

  const steps = ["Cloning repository...", "Parsing file tree...", "Detecting frameworks...", "Building AI context...", "Indexing embeddings..."];
  const examples = [
    { label: "tiangolo/fastapi", url: "https://github.com/tiangolo/fastapi" },
    { label: "vercel/next.js",   url: "https://github.com/vercel/next.js" },
    { label: "django/django",    url: "https://github.com/django/django" },
  ];

  const handleAnalyze = async () => {
    if (!url.trim()) { setError("Please enter a GitHub URL"); return; }
    setError("");
    setLoading(true);
    setStep(0);

    // Simulate pipeline steps
    for (let i = 0; i <= steps.length; i++) {
      await new Promise(r => setTimeout(r, 500));
      setStep(i);
    }

    // In production: call api.uploadRepo(url) then api.analyze(repo_id)
    setAnalysis({ ...MOCK_ANALYSIS, _repoUrl: url });
    setLoading(false);
    setPage("dashboard");
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-slate-950">
      <div className="max-w-xl w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-indigo-950/50 border border-indigo-800/40 rounded-full px-4 py-1.5 text-xs text-indigo-400 mb-6 font-mono">
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
            AI-Powered Codebase Intelligence v2.0
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Understand any codebase{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">instantly</span>
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Architecture diagrams · AI chat · Guided learning paths · Hinglish explanations · Flow visualizer
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-1.5 flex gap-2 mb-3">
          <input
            value={url}
            onChange={e => { setUrl(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleAnalyze()}
            placeholder="https://github.com/user/repository"
            className="flex-1 bg-transparent text-slate-200 placeholder-slate-600 text-sm px-4 py-2.5 outline-none font-mono"
          />
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:text-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
          >
            {loading ? <><Spinner /><span>Analyzing</span></> : "Analyze →"}
          </button>
        </div>

        {error && <p className="text-rose-400 text-xs mb-3">{error}</p>}

        <div className="flex gap-2 flex-wrap mb-6">
          <span className="text-slate-600 text-xs self-center">Try:</span>
          {examples.map(e => (
            <button key={e.url} onClick={() => setUrl(e.url)}
              className="text-xs text-indigo-400 bg-indigo-950/40 border border-indigo-900/50 hover:border-indigo-700/60 px-3 py-1.5 rounded-lg font-mono transition-colors">
              {e.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-3 py-1.5 text-sm">
                <span className={`font-mono w-4 ${i < step ? "text-emerald-400" : i === step ? "text-indigo-400" : "text-slate-700"}`}>
                  {i < step ? "✓" : i === step ? "▶" : "○"}
                </span>
                <span className={i < step ? "text-slate-400" : i === step ? "text-slate-200" : "text-slate-700"}>{s}</span>
              </div>
            ))}
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[["⬡","Architecture Map","Auto-generated diagrams"],["🎓","Learn Mode","Step-by-step curriculum"],["अ","Hinglish","Dev-friendly Hindi-English"]].map(([ic,t,d]) => (
              <div key={t} className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 text-center">
                <div className="text-xl mb-2 text-indigo-400">{ic}</div>
                <div className="text-white text-xs font-semibold mb-1">{t}</div>
                <div className="text-slate-600 text-[10px]">{d}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE: DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════

function DashboardPage() {
  const { analysis, setPage } = useApp();
  const [tab, setTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "files", label: "File Ranking" },
    { id: "arch", label: "Architecture" },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-800/60 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold">{analysis.project_name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge color="green">Analyzed</Badge>
            <Badge color="indigo">{analysis.framework}</Badge>
            <Badge color="slate">{analysis.language}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPage("learning")} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            🎓 Teach Me This Codebase
          </button>
          <button onClick={() => setPage("chat")} className="text-xs border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-slate-200 px-4 py-2 rounded-lg transition-colors">
            💬 Open Chat
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 pt-5 grid grid-cols-4 gap-3">
        {[["Files", analysis.total_files], ["Lines", analysis.total_lines.toLocaleString()], ["Dependencies", analysis.dependencies.length], ["Entry Points", analysis.entry_points.length]].map(([l, v]) => (
          <div key={l} className="bg-slate-900/60 border border-slate-800/60 rounded-lg p-4">
            <div className="text-slate-500 text-xs mb-1">{l}</div>
            <div className="text-white text-xl font-bold font-mono">{v}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="px-6 mt-5 border-b border-slate-800/60 flex gap-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`text-sm px-4 py-2.5 font-medium transition-colors ${tab === t.id ? "text-white border-b-2 border-indigo-500" : "text-slate-500 hover:text-slate-300"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-5 space-y-4">
        {tab === "overview" && (
          <>
            <SectionCard title="Project Summary">
              <p className="text-slate-300 text-sm leading-relaxed">{analysis.summary}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">{analysis.dependencies.map(d => <Badge key={d} color="slate">{d}</Badge>)}</div>
            </SectionCard>
            <SectionCard title="Architecture Overview">
              <p className="text-slate-300 text-sm leading-relaxed">{analysis.architecture_overview}</p>
            </SectionCard>
            <SectionCard title="Data Flow">
              <p className="text-slate-300 text-sm leading-relaxed">{analysis.data_flow}</p>
            </SectionCard>
          </>
        )}
        {tab === "files" && (
          <SectionCard title="File Importance Ranking">
            <p className="text-slate-600 text-xs mb-4 font-mono">AI-scored by architectural significance, import depth, and business logic density</p>
            {analysis.file_ranking.map(f => (
              <div key={f.file} className="flex items-center gap-3 py-2.5 border-b border-slate-800/50 last:border-0">
                <code className="text-xs text-indigo-300 font-mono w-44 truncate shrink-0">{f.file}</code>
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" style={{ width: `${f.importance}%` }} />
                </div>
                <span className="text-xs text-slate-500 font-mono w-7 text-right">{f.importance}</span>
                <span className="text-xs text-slate-500 w-52 truncate hidden lg:block">{f.purpose}</span>
              </div>
            ))}
          </SectionCard>
        )}
        {tab === "arch" && (
          <SectionCard title="Architecture Layers">
            {[
              { label: "API Gateway", items: ["Auth Router", "Product Router", "Order Router", "Payment Router"], color: "indigo" },
              { label: "Service Layer", items: ["AuthService", "OrderService", "ProductService", "PaymentService"], color: "violet" },
              { label: "Repository Layer", items: ["UserRepo", "ProductRepo", "OrderRepo"], color: "slate" },
              { label: "Data Layer", items: ["PostgreSQL", "Redis Cache", "Celery Queue", "S3 Storage"], color: "amber" },
            ].map((layer, i) => (
              <div key={layer.label} className="mb-4">
                <div className="text-xs text-slate-600 font-mono mb-2">{layer.label}</div>
                <div className="flex flex-wrap gap-2">
                  {layer.items.map(item => <Badge key={item} color={layer.color}>{item}</Badge>)}
                </div>
                {i < 3 && <div className="text-slate-700 text-center text-sm mt-3">⇕</div>}
              </div>
            ))}
          </SectionCard>
        )}
      </div>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800/60 rounded-xl p-5">
      <h3 className="text-slate-400 font-semibold text-xs uppercase tracking-wider mb-4">{title}</h3>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE: CHAT
// ═══════════════════════════════════════════════════════════════════════════

function ChatPage() {
  const { analysis } = useApp();
  const [messages, setMessages] = useState([
    { role: "assistant", content: `I've analyzed **${analysis?.project_name}** (${analysis?.total_files} files). Ask me anything about the architecture, flows, authentication, database schema, or specific files.`, hinglish: null },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hinglishMode, setHinglishMode] = useState(false);
  const [listening, setListening] = useState(false);
  const bottomRef = useRef(null);

  const suggestions = [
    "Explain the login and authentication flow",
    "Where are database models defined?",
    "How does the order processing work?",
    "What async background tasks exist?",
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text = input) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user", content: text };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);

    const a = analysis;
    const system = `You are an expert code analyst for: ${a._repoUrl || "the repository"}
Project: ${a.project_name} (${a.framework}/${a.language})
Summary: ${a.summary}
Architecture: ${a.architecture_overview}
Data flow: ${a.data_flow}
Key files: ${a.file_ranking.map(f => `${f.file} — ${f.purpose}`).join(", ")}
Entry points: ${a.entry_points.join(", ")}

Answer concisely (<200 words). Reference specific files using backtick format. Be technically precise.`;

    try {
      const history = newMsgs.slice(-8).map(m => ({ role: m.role, content: m.content }));
      const answer = await claudeChat(history, system);

      let hinglish = null;
      if (hinglishMode) {
        hinglish = await claudeChat(
          [{ role: "user", content: `Convert to casual Hinglish (Hindi+English dev mix). Keep file names/code in English. Max 120 words. No preamble.\n\nText: ${answer}` }],
          "Convert English tech explanations to natural Hinglish."
        );
      }
      setMessages(prev => [...prev, { role: "assistant", content: answer, hinglish }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "API error. Check your connection.", hinglish: null }]);
    }
    setLoading(false);
  };

  const toggleHinglish = async () => {
    const newMode = !hinglishMode;
    setHinglishMode(newMode);
    if (newMode) {
      const updated = await Promise.all(
        messages.map(async m => {
          if (m.role === "assistant" && !m.hinglish) {
            const h = await claudeChat([{ role: "user", content: `Convert to casual Hinglish. Keep code in English. Max 100 words.\n\n${m.content}` }], "Convert to Hinglish.").catch(() => m.content);
            return { ...m, hinglish: h };
          }
          return m;
        })
      );
      setMessages(updated);
    }
  };

  const speakText = (text) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/`[^`]+`/g, ""));
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-800/60 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-slate-300 text-sm font-medium">AI Chat</span>
          <code className="text-slate-600 text-xs font-mono">{analysis?.project_name}</code>
        </div>
        <HinglishToggle value={hinglishMode} onChange={toggleHinglish} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5">AI</div>
            )}
            <div className="max-w-2xl">
              <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-indigo-950/50 border border-indigo-800/40 text-slate-200"
                  : "bg-slate-900/60 border border-slate-800/60 text-slate-300"
              }`}>
                <InlineCode text={m.content} />
              </div>
              {m.role === "assistant" && hinglishMode && m.hinglish && (
                <div className="mt-2 bg-amber-950/30 border border-amber-800/40 rounded-xl px-4 py-3">
                  <div className="text-[10px] text-amber-600 mb-1.5 font-mono">अ HINGLISH</div>
                  <p className="text-amber-200/80 text-sm leading-relaxed">{m.hinglish}</p>
                </div>
              )}
              {m.role === "assistant" && (
                <button onClick={() => speakText(hinglishMode && m.hinglish ? m.hinglish : m.content)}
                  className="text-[10px] text-slate-700 hover:text-slate-500 mt-1 ml-1 transition-colors">
                  🔊 Read aloud
                </button>
              )}
            </div>
            {m.role === "user" && (
              <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-xs text-slate-300 shrink-0 mt-0.5">U</div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">AI</div>
            <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl px-4 py-3 flex items-center gap-1.5">
              {[0, 1, 2].map(i => <span key={i} className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="px-6 pb-2 flex flex-wrap gap-2">
          {suggestions.map(s => (
            <button key={s} onClick={() => sendMessage(s)}
              className="text-xs bg-slate-900/60 border border-slate-700/60 hover:border-indigo-700/60 text-slate-500 hover:text-indigo-300 px-3 py-1.5 rounded-lg transition-all">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-6 pb-4 pt-2 border-t border-slate-800/60 shrink-0">
        <div className="flex gap-2 items-end bg-slate-900/60 border border-slate-700/60 rounded-xl p-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Ask about the codebase… (Enter to send)"
            rows={1}
            className="flex-1 bg-transparent text-slate-200 placeholder-slate-600 text-sm px-2 py-1.5 outline-none resize-none font-mono leading-relaxed"
            style={{ maxHeight: "120px" }}
          />
          <div className="flex gap-1.5 pb-1">
            <VoiceButton onTranscript={t => { setInput(t); }} listening={listening} setListening={setListening} />
            <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
              className="w-9 h-9 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white flex items-center justify-center rounded-lg transition-colors">
              ↑
            </button>
          </div>
        </div>
        <p className="text-slate-700 text-[10px] mt-1.5 text-center font-mono">
          Full repo context loaded · {analysis?.total_files} files · Claude-powered
        </p>
      </div>
    </div>
  );
}

function InlineCode({ text }) {
  const parts = (text || "").split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("`") && p.endsWith("`")
          ? <code key={i} className="bg-slate-800 text-emerald-300 px-1.5 py-0.5 rounded text-xs font-mono">{p.slice(1, -1)}</code>
          : <span key={i}>{p}</span>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE: GUIDED LEARNING
// ═══════════════════════════════════════════════════════════════════════════

function LearningPage() {
  const { analysis } = useApp();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [hinglishMode, setHinglishMode] = useState(false);
  const [stepHinglish, setStepHinglish] = useState({});

  const generatePlan = async () => {
    setLoading(true);
    // In production: const data = await api.guidedLearning(repoId)
    await new Promise(r => setTimeout(r, 1800));
    setPlan(MOCK_LEARNING);
    setLoading(false);
  };

  const toggleHinglish = async () => {
    const newMode = !hinglishMode;
    setHinglishMode(newMode);
    if (newMode && plan) {
      const step = plan.steps[activeStep];
      if (!stepHinglish[activeStep]) {
        const h = await claudeChat(
          [{ role: "user", content: `Convert to casual Hinglish. Keep file names and code in English. Max 120 words. No preamble.\n\n${step.description}` }],
          "Convert English tech text to Hinglish."
        ).catch(() => step.description);
        setStepHinglish(prev => ({ ...prev, [activeStep]: h }));
      }
    }
  };

  if (!plan) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🎓</div>
          <h2 className="text-2xl font-bold text-white mb-3">Guided Learning Mode</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Generate a personalized step-by-step learning path for <span className="text-indigo-400">{analysis?.project_name}</span>.
            The AI will create a curriculum based on the codebase structure.
          </p>
          <button onClick={generatePlan} disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors flex items-center gap-2 mx-auto">
            {loading ? <><Spinner /> Generating curriculum...</> : "🎓 Teach Me This Codebase"}
          </button>
        </div>
      </div>
    );
  }

  const step = plan.steps[activeStep];

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Step sidebar */}
      <div className="w-64 border-r border-slate-800/60 flex flex-col overflow-y-auto bg-slate-950">
        <div className="p-4 border-b border-slate-800/60">
          <div className="text-xs text-slate-600 font-mono mb-1">LEARNING PATH</div>
          <div className="text-white font-semibold text-sm">{analysis?.project_name}</div>
          <div className="flex gap-2 mt-2">
            <Badge color="amber">⏱ {plan.estimated_total_time}</Badge>
          </div>
        </div>

        <div className="p-3 space-y-1">
          {plan.steps.map((s, i) => (
            <button key={i} onClick={() => setActiveStep(i)}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-all text-xs ${
                activeStep === i
                  ? "bg-indigo-950/60 border border-indigo-800/40 text-indigo-300"
                  : i < activeStep
                  ? "text-emerald-400 hover:bg-slate-900"
                  : "text-slate-600 hover:bg-slate-900 hover:text-slate-400"
              }`}>
              <div className="flex items-center gap-2">
                <span className="font-mono">{i < activeStep ? "✓" : `${i + 1}.`}</span>
                <span className="font-medium">{s.title}</span>
              </div>
              <div className="text-[10px] mt-0.5 text-slate-600 ml-5">{s.estimated_time}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-sm font-bold text-white">{step.step}</div>
              <h2 className="text-xl font-bold text-white">{step.title}</h2>
            </div>
            <div className="flex items-center gap-2">
              <HinglishToggle value={hinglishMode} onChange={toggleHinglish} />
              <Badge color="amber">⏱ {step.estimated_time}</Badge>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-5 mb-4">
            <div className="text-xs text-slate-600 font-mono mb-3">WHAT YOU'LL LEARN</div>
            <p className="text-slate-300 text-sm leading-relaxed">{step.description}</p>
            {hinglishMode && stepHinglish[activeStep] && (
              <div className="mt-3 pt-3 border-t border-slate-800 bg-amber-950/20 rounded-lg p-3">
                <div className="text-[10px] text-amber-600 mb-2 font-mono">अ HINGLISH</div>
                <p className="text-amber-200/80 text-sm leading-relaxed">{stepHinglish[activeStep]}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4">
              <div className="text-xs text-slate-600 font-mono mb-3">📄 FILES TO READ</div>
              {step.files_to_read.map(f => (
                <div key={f} className="flex items-center gap-2 py-1.5">
                  <span className="text-indigo-400 text-xs">▶</span>
                  <code className="text-xs text-emerald-300 font-mono">{f}</code>
                </div>
              ))}
            </div>
            <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4">
              <div className="text-xs text-slate-600 font-mono mb-3">💡 KEY CONCEPTS</div>
              {step.key_concepts.map(c => (
                <div key={c} className="flex items-center gap-2 py-1.5">
                  <span className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
                  <span className="text-xs text-slate-300">{c}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setActiveStep(Math.max(0, activeStep - 1))} disabled={activeStep === 0}
              className="text-sm border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-slate-200 px-4 py-2 rounded-lg disabled:opacity-30 transition-all">
              ← Previous
            </button>
            <button onClick={() => setActiveStep(Math.min(plan.steps.length - 1, activeStep + 1))} disabled={activeStep === plan.steps.length - 1}
              className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg disabled:opacity-30 transition-colors">
              Next Step →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE: FLOW VIEWER
// ═══════════════════════════════════════════════════════════════════════════

function FlowPage() {
  const { analysis } = useApp();
  const [activeFlow, setActiveFlow] = useState(0);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const typeColors = { request: "indigo", auth: "violet", business: "emerald" };

  const generate = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setGenerated(true);
    setLoading(false);
  };

  const flow = MOCK_FLOWS[activeFlow];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="border-b border-slate-800/60 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold">Flow Visualizer</h2>
          <p className="text-slate-500 text-xs mt-0.5">System data flow and request lifecycle diagrams</p>
        </div>
        {!generated && (
          <button onClick={generate} disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors">
            {loading ? <><Spinner /> Generating flows...</> : "⟳ Generate Flows"}
          </button>
        )}
      </div>

      {!generated ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4 text-slate-700">⟳</div>
            <p className="text-slate-500 text-sm">Click "Generate Flows" to analyze system data flows</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Flow selector */}
          <div className="w-52 border-r border-slate-800/60 p-3 space-y-2">
            {MOCK_FLOWS.map((f, i) => (
              <button key={i} onClick={() => setActiveFlow(i)}
                className={`w-full text-left px-3 py-3 rounded-lg text-xs transition-all ${
                  activeFlow === i ? "bg-indigo-950/60 border border-indigo-800/40 text-indigo-300" : "text-slate-500 hover:bg-slate-900 hover:text-slate-300"
                }`}>
                <div className="font-semibold mb-1">{f.name}</div>
                <div className="text-[10px] text-slate-600">{f.description}</div>
              </button>
            ))}
          </div>

          {/* Flow diagram */}
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-lg">
              <h3 className="text-white font-semibold mb-1">{flow.name}</h3>
              <p className="text-slate-500 text-xs mb-6">{flow.description}</p>

              <div className="space-y-2">
                {flow.nodes.map((node, i) => (
                  <div key={i}>
                    <div className={`border rounded-xl px-5 py-3 text-sm font-medium ${
                      i === 0 ? "bg-indigo-950/60 border-indigo-700/60 text-indigo-300"
                      : i === flow.nodes.length - 1 ? "bg-emerald-950/60 border-emerald-700/60 text-emerald-300"
                      : "bg-slate-900/60 border-slate-700/60 text-slate-300"
                    }`}>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-600">{String(i + 1).padStart(2, "0")}</span>
                        {node}
                      </div>
                    </div>
                    {i < flow.nodes.length - 1 && (
                      <div className="flex items-center justify-center py-1 text-slate-700">↓</div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 bg-slate-900/40 border border-slate-800/60 rounded-xl p-4">
                <div className="text-xs text-slate-600 font-mono mb-2">TEXT REPRESENTATION</div>
                <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap leading-relaxed">{flow.text_representation}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE: PROTOTYPE VIEWER
// ═══════════════════════════════════════════════════════════════════════════

function PrototypePage() {
  const { analysis } = useApp();
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [activeScreen, setActiveScreen] = useState(0);

  const SCREENS = [
    { name: "Login", route: "/login", icon: "🔐", desc: "Authentication screen", components: ["LoginForm","EmailInput","PasswordInput","SubmitButton"] },
    { name: "Dashboard", route: "/dashboard", icon: "◈", desc: "Main overview", components: ["StatsGrid","RecentOrders","QuickActions","Sidebar"] },
    { name: "Products", route: "/products", icon: "📦", desc: "Product catalog", components: ["ProductGrid","SearchBar","FilterPanel","Pagination"] },
    { name: "Orders", route: "/orders", icon: "🛒", desc: "Order management", components: ["OrderTable","StatusBadge","DateFilter","ExportBtn"] },
    { name: "Settings", route: "/settings", icon: "⚙", desc: "Configuration", components: ["ProfileForm","SecurityTab","NotifPanel","SaveBtn"] },
  ];

  const generate = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setGenerated(true);
    setLoading(false);
  };

  const screen = SCREENS[activeScreen];

  const PreviewComponents = {
    Login: () => (
      <div className="max-w-sm mx-auto">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl mx-auto mb-4 flex items-center justify-center text-2xl">🔐</div>
          <h2 className="text-xl font-bold text-white">Welcome back</h2>
          <p className="text-slate-500 text-sm mt-1">Sign in to your account</p>
        </div>
        <div className="space-y-3">
          <input className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-300 placeholder-slate-600 outline-none" placeholder="Email address" />
          <input type="password" className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-300 placeholder-slate-600 outline-none" placeholder="Password" />
          <button className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-semibold">Sign In</button>
        </div>
        <p className="text-center text-xs text-slate-600 mt-4">Don't have an account? <span className="text-indigo-400">Register</span></p>
      </div>
    ),
    Dashboard: () => (
      <div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[["Total Orders","1,284","↑ 12%"],["Revenue","$48,200","↑ 8%"],["Users","3,891","↑ 5%"],["Products","246","→ 0%"]].map(([l,v,c]) => (
            <div key={l} className="bg-slate-800/60 border border-slate-700 rounded-lg p-3">
              <div className="text-slate-500 text-xs mb-1">{l}</div>
              <div className="text-white font-bold text-lg">{v}</div>
              <div className={`text-xs ${c.startsWith("↑") ? "text-emerald-400" : "text-slate-500"}`}>{c}</div>
            </div>
          ))}
        </div>
        <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-3">
          <div className="text-xs text-slate-500 mb-3">Recent Activity</div>
          {["Order #1042 — Delivered","User signup — alice@mail.com","Payment failed — Order #1039"].map(item => (
            <div key={item} className="flex items-center gap-2 py-1.5 border-b border-slate-700/50 last:border-0 text-xs text-slate-400">{item}</div>
          ))}
        </div>
      </div>
    ),
    Products: () => (
      <div>
        <div className="flex gap-2 mb-4">
          <input className="flex-1 bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder-slate-600 outline-none" placeholder="Search products..." />
          <button className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs">Filter</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {["Wireless Headphones — $89","Running Shoes — $149","Coffee Maker — $69","Smart Watch — $299"].map(p => {
            const [name, price] = p.split(" — ");
            return (
              <div key={name} className="bg-slate-800/60 border border-slate-700 rounded-lg p-3">
                <div className="h-20 bg-slate-700/50 rounded-lg mb-2 flex items-center justify-center text-2xl">📦</div>
                <div className="text-white text-xs font-medium">{name}</div>
                <div className="text-indigo-400 text-xs mt-1">{price}</div>
              </div>
            );
          })}
        </div>
      </div>
    ),
    Orders: () => (
      <div>
        <table className="w-full text-xs">
          <thead><tr className="border-b border-slate-700">{["Order","Customer","Total","Status"].map(h => <th key={h} className="text-left text-slate-500 pb-2 pr-3">{h}</th>)}</tr></thead>
          <tbody>
            {[["#1042","Alice J.","$249","Delivered"],["#1041","Bob M.","$89","Processing"],["#1040","Carol S.","$499","Shipped"],["#1039","Dave W.","$32","Cancelled"]].map(([o,c,t,s]) => (
              <tr key={o} className="border-b border-slate-800/50">
                <td className="py-2 pr-3 text-indigo-400 font-mono">{o}</td>
                <td className="py-2 pr-3 text-slate-300">{c}</td>
                <td className="py-2 pr-3 text-slate-300">{t}</td>
                <td className="py-2"><span className={`px-2 py-0.5 rounded text-[10px] border ${s==="Delivered"?"bg-emerald-950 text-emerald-300 border-emerald-800":s==="Cancelled"?"bg-rose-950 text-rose-300 border-rose-800":"bg-amber-950 text-amber-300 border-amber-800"}`}>{s}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
    Settings: () => (
      <div className="space-y-3">
        <input className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none" defaultValue="admin@company.com" />
        <input className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none" defaultValue="John Admin" />
        <div className="flex items-center justify-between bg-slate-800/40 border border-slate-700 rounded-lg p-3">
          <div><div className="text-xs text-slate-300">Email Notifications</div><div className="text-[10px] text-slate-600">Receive order alerts</div></div>
          <div className="w-10 h-5 bg-indigo-600 rounded-full" />
        </div>
        <button className="w-full bg-indigo-600 text-white py-2 rounded-lg text-xs font-semibold">Save Changes</button>
      </div>
    ),
  };

  const Preview = PreviewComponents[screen.name] || PreviewComponents.Dashboard;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="border-b border-slate-800/60 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold">Prototype Generator</h2>
          <p className="text-slate-500 text-xs mt-0.5">Auto-detected UI screens with React placeholders</p>
        </div>
        {!generated && (
          <button onClick={generate} disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors">
            {loading ? <><Spinner /> Detecting screens...</> : "◻ Generate Prototype"}
          </button>
        )}
      </div>

      {!generated ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4 text-slate-700">◻</div>
            <p className="text-slate-500 text-sm">AI will detect possible UI screens from your codebase routes and generate React placeholders</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Screen list */}
          <div className="w-52 border-r border-slate-800/60 p-3 space-y-1">
            {SCREENS.map((s, i) => (
              <button key={i} onClick={() => setActiveScreen(i)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all ${
                  activeScreen === i ? "bg-indigo-950/60 border border-indigo-800/40 text-indigo-300" : "text-slate-500 hover:bg-slate-900 hover:text-slate-300"
                }`}>
                <span className="mr-2">{s.icon}</span>{s.name}
                <div className="text-[10px] text-slate-600 mt-0.5 font-mono">{s.route}</div>
              </button>
            ))}
          </div>

          {/* Preview */}
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-5">
                <span className="text-2xl">{screen.icon}</span>
                <div>
                  <h3 className="text-white font-semibold">{screen.name} Screen</h3>
                  <code className="text-xs text-slate-500 font-mono">{screen.route}</code>
                </div>
                <div className="ml-auto flex gap-1.5">
                  {screen.components.map(c => <Badge key={c} color="slate">{c}</Badge>)}
                </div>
              </div>

              {/* Device frame */}
              <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl">
                <div className="flex gap-1.5 mb-4">
                  {["bg-rose-500","bg-amber-500","bg-emerald-500"].map((c,i) => <div key={i} className={`w-2.5 h-2.5 rounded-full ${c}`} />)}
                  <div className="flex-1 bg-slate-800/60 rounded h-5 mx-2 flex items-center px-3">
                    <span className="text-[10px] text-slate-600 font-mono">localhost:3000{screen.route}</span>
                  </div>
                </div>
                <Preview />
              </div>

              <div className="mt-4 flex gap-2">
                {screen.components.map(c => (
                  <span key={c} className="text-[10px] text-slate-600 bg-slate-900/60 border border-slate-800 px-2 py-1 rounded font-mono">&lt;{c} /&gt;</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════════════

export default function App() {
  const [page, setPage] = useState("upload");
  const [analysis, setAnalysis] = useState(null);

  const ctx = { page, setPage, analysis, setAnalysis };

  const pages = {
    upload:    <UploadPage />,
    dashboard: <DashboardPage />,
    chat:      <ChatPage />,
    learning:  <LearningPage />,
    flow:      <FlowPage />,
    prototype: <PrototypePage />,
  };

  return (
    <AppContext.Provider value={ctx}>
      <div className="h-screen bg-slate-950 flex overflow-hidden font-sans">
        {page !== "upload" && <Sidebar activePage={page} setPage={setPage} analysis={analysis} />}
        <div className="flex-1 flex flex-col overflow-hidden">
          {page !== "upload" && (
            <div className="border-b border-slate-800/60 px-6 py-2 flex items-center justify-between bg-slate-950 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-indigo-600 rounded flex items-center justify-center text-[10px] font-bold text-white">DM</div>
                <span className="text-slate-500 text-xs">DevMind AI</span>
              </div>
              <Badge color="green">● Active</Badge>
            </div>
          )}
          {pages[page] || <UploadPage />}
        </div>
      </div>
    </AppContext.Provider>
  );
}
