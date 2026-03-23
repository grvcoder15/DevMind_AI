// src/pages/PrototypePage.jsx
// Detects possible UI screens from the repo and renders React placeholder previews.

import { useState } from "react";
import { useApp } from "../context/AppContext";
import Badge from "../components/Badge";
import Spinner from "../components/Spinner";
import Modal from "../components/Modal";
import api from "../services/api";

// ─── Preview components — one per screen ─────────────────────────────────────

function LoginPreview() {
  return (
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
      <p className="text-center text-xs text-slate-600 mt-4">Don't have an account? <span className="text-indigo-400 cursor-pointer">Register</span></p>
    </div>
  );
}

function DashboardPreview() {
  return (
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
  );
}

function ProductsPreview() {
  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input className="flex-1 bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder-slate-600 outline-none" placeholder="Search products..." />
        <button className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs">Filter</button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[["Wireless Headphones","$89"],["Running Shoes","$149"],["Coffee Maker","$69"],["Smart Watch","$299"]].map(([name,price]) => (
          <div key={name} className="bg-slate-800/60 border border-slate-700 rounded-lg p-3">
            <div className="h-20 bg-slate-700/50 rounded-lg mb-2 flex items-center justify-center text-2xl">📦</div>
            <div className="text-white text-xs font-medium">{name}</div>
            <div className="text-indigo-400 text-xs mt-1">{price}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrdersPreview() {
  const rows = [["#1042","Alice J.","$249","Delivered"],["#1041","Bob M.","$89","Processing"],["#1040","Carol S.","$499","Shipped"],["#1039","Dave W.","$32","Cancelled"]];
  const statusColor = (s) => s==="Delivered" ? "bg-emerald-950 text-emerald-300 border-emerald-800" : s==="Cancelled" ? "bg-rose-950 text-rose-300 border-rose-800" : "bg-amber-950 text-amber-300 border-amber-800";
  return (
    <table className="w-full text-xs">
      <thead><tr className="border-b border-slate-700">{["Order","Customer","Total","Status"].map(h => <th key={h} className="text-left text-slate-500 pb-2 pr-3">{h}</th>)}</tr></thead>
      <tbody>
        {rows.map(([o,c,t,s]) => (
          <tr key={o} className="border-b border-slate-800/50">
            <td className="py-2 pr-3 text-indigo-400 font-mono">{o}</td>
            <td className="py-2 pr-3 text-slate-300">{c}</td>
            <td className="py-2 pr-3 text-slate-300">{t}</td>
            <td className="py-2"><span className={`px-2 py-0.5 rounded text-[10px] border ${statusColor(s)}`}>{s}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SettingsPreview() {
  return (
    <div className="space-y-3">
      <input className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none" defaultValue="admin@company.com" />
      <input className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none" defaultValue="John Admin" />
      <div className="flex items-center justify-between bg-slate-800/40 border border-slate-700 rounded-lg p-3">
        <div>
          <div className="text-xs text-slate-300">Email Notifications</div>
          <div className="text-[10px] text-slate-600">Receive order alerts</div>
        </div>
        <div className="w-10 h-5 bg-indigo-600 rounded-full" />
      </div>
      <button className="w-full bg-indigo-600 text-white py-2 rounded-lg text-xs font-semibold">Save Changes</button>
    </div>
  );
}

// ─── Dynamic Preview (uses actual component data) ───────────────────────────

function DynamicPreview({ screen }) {
  const uiElements = screen.ui_elements || {};
  const buttons = uiElements.buttons || [];
  const inputs = uiElements.inputs || [];
  const headings = uiElements.headings || [];
  const links = uiElements.links || [];
  
  return (
    <div className="max-w-2xl">
      {/* Badge showing this is extracted from real code */}
      <div className="mb-4 inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-lg text-xs">
        <span>✓</span>
        <span>Extracted from actual component code</span>
      </div>
      
      {/* Actual headings from code */}
      {headings.map((heading, i) => (
        <h2 key={i} className="text-xl font-bold text-white mb-4">
          {heading}
        </h2>
      ))}
      
      {/* Actual inputs from code */}
      {inputs.length > 0 && (
        <div className="space-y-3 mb-4">
          {inputs.map((inputLabel, i) => (
            <div key={i}>
              {inputLabel && (
                <label className="text-sm text-slate-400 mb-1 block">
                  {inputLabel}
                </label>
              )}
              <input 
                className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-300 placeholder-slate-600 outline-none focus:border-indigo-500 transition-colors"
                placeholder={inputLabel || "Enter value"}
              />
            </div>
          ))}
        </div>
      )}
      
      {/* Actual buttons from code */}
      {buttons.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4">
          {buttons.map((buttonText, i) => (
            <button 
              key={i} 
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-indigo-500/20"
            >
              {buttonText}
            </button>
          ))}
        </div>
      )}
      
      {/* Actual links from code */}
      {links.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {links.map((linkText, i) => (
            <a 
              key={i} 
              href="#" 
              className="text-indigo-400 hover:text-indigo-300 text-sm underline"
              onClick={(e) => e.preventDefault()}
            >
              {linkText}
            </a>
          ))}
        </div>
      )}
      
      {/* Fallback message if no UI elements */}
      {!headings.length && !inputs.length && !buttons.length && !links.length && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <p className="text-amber-400 text-sm font-semibold mb-1">⚠ UI Elements Not Extracted</p>
          <p className="text-slate-400 text-xs">
            Screen detected but UI elements couldn't be parsed. 
            Check the component file: <code className="text-indigo-400 bg-slate-900/60 px-2 py-0.5 rounded">{screen.name}</code>
          </p>
        </div>
      )}
    </div>
  );
}

const PREVIEW_MAP = {
  Login:     LoginPreview,
  Dashboard: DashboardPreview,
  Products:  ProductsPreview,
  Orders:    OrdersPreview,
  Settings:  SettingsPreview,
};

// ─── Main page ───────────────────────────────────────────────────────────────

export default function PrototypePage() {
  const { analysis } = useApp();
  const [loading, setLoading]           = useState(false);
  const [generated, setGenerated]       = useState(false);
  const [activeScreen, setActiveScreen] = useState(0);
  const [screens, setScreens]           = useState([]);
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "info" });

  const showModal = (title, message, type = "info") => {
    setModal({ isOpen: true, title, message, type });
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      console.log("Generating prototype for repo:", analysis.repo_id);
      const data = await api.generatePrototype(analysis.repo_id);
      console.log("Prototype data received:", data);
      console.log("Screens with UI elements:", data.screens?.map(s => ({
        name: s.name,
        has_ui_elements: !!s.ui_elements,
        buttons: s.ui_elements?.buttons?.length || 0,
        inputs: s.ui_elements?.inputs?.length || 0,
        headings: s.ui_elements?.headings?.length || 0,
        links: s.ui_elements?.links?.length || 0
      })));
      
      const detectedScreens = data.screens || [];
      
      if (detectedScreens.length === 0) {
        showModal(
          "No UI Components Detected",
          "This appears to be a backend-only repository (API/server code).\n\nPrototype generation works best with:\n• Frontend codebases (React, Vue, Angular)\n• Apps with UI routes/components\n• Projects with HTML/CSS files\n\nTry uploading a frontend repository instead.",
          "warning"
        );
        setLoading(false);
        return;
      }
      
      setScreens(detectedScreens);
      setGenerated(true);
    } catch (error) {
      console.error("Prototype generation error:", error);
      showModal(
        "Generation Failed",
        `Failed to generate prototype:\n${error.message}\n\nThis might be a backend-only codebase without UI components.\n\nPlease try again or upload a frontend repository.`,
        "error"
      );
    }
    setLoading(false);
  };

  // Safety check for analysis
  if (!analysis) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-800/60 px-6 py-4">
          <h2 className="text-white font-semibold">Prototype Generator</h2>
          <p className="text-slate-500 text-xs mt-0.5">Auto-detected UI screens with React placeholders</p>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-5xl mb-4 text-slate-700">◻</div>
            <p className="text-slate-400 text-sm mb-6">
              Upload and analyze a repository first to detect UI screens
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              ⬆ Upload Repository
            </button>
          </div>
        </div>
      </div>
    );
  }

  const screen = screens[activeScreen] || {};
  
  // Use DynamicPreview if actual UI elements were extracted from code
  // Otherwise fallback to hardcoded preview components
  const hasRealUIElements = screen.ui_elements && 
    Object.keys(screen.ui_elements).some(key => screen.ui_elements[key]?.length > 0);
  
  const Preview = hasRealUIElements
    ? () => <DynamicPreview screen={screen} />
    : PREVIEW_MAP[screen.name] || DashboardPreview;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-800/60 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold">Prototype Generator</h2>
          <p className="text-slate-500 text-xs mt-0.5">Auto-detected UI screens with React placeholders</p>
        </div>
        {!generated && (
          <button
            id="generate-prototype-btn"
            onClick={handleGenerate}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors"
          >
            {loading ? <><Spinner /> Detecting screens...</> : "◻ Generate Prototype"}
          </button>
        )}
      </div>

      {/* Empty state */}
      {!generated ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4 text-slate-700">◻</div>
            <p className="text-slate-500 text-sm">
              AI will detect possible UI screens from your codebase routes and generate React placeholders
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Screen list */}
          <div className="w-52 border-r border-slate-800/60 p-3 space-y-1">
            {screens.map((s, i) => (
              <button
                key={i}
                onClick={() => setActiveScreen(i)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all ${
                  activeScreen === i
                    ? "bg-indigo-950/60 border border-indigo-800/40 text-indigo-300"
                    : "text-slate-500 hover:bg-slate-900 hover:text-slate-300"
                }`}
              >
                <span className="mr-2">{s.icon}</span>{s.name}
                <div className="text-[10px] text-slate-600 mt-0.5 font-mono">{s.route}</div>
              </button>
            ))}
          </div>

          {/* Preview */}
          <div className="flex-1 p-6 overflow-auto">
            <div className="max-w-2xl">
              {/* Screen meta */}
              <div className="flex items-center gap-3 mb-5">
                <span className="text-2xl">{screen.icon}</span>
                <div>
                  <h3 className="text-white font-semibold">{screen.name} Screen</h3>
                  <code className="text-xs text-slate-500 font-mono">{screen.route}</code>
                </div>
                <div className="ml-auto flex gap-1.5 flex-wrap">
                  {screen.components.map((c) => (
                    <Badge key={c} color="slate">{c}</Badge>
                  ))}
                </div>
              </div>

              {/* Browser device frame */}
              <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl">
                {/* Fake browser bar */}
                <div className="flex gap-1.5 mb-4">
                  {["bg-rose-500","bg-amber-500","bg-emerald-500"].map((c, i) => (
                    <div key={i} className={`w-2.5 h-2.5 rounded-full ${c}`} />
                  ))}
                  <div className="flex-1 bg-slate-800/60 rounded h-5 mx-2 flex items-center px-3">
                    <span className="text-[10px] text-slate-600 font-mono">localhost:3000{screen.route}</span>
                  </div>
                </div>
                <Preview />
              </div>

              {/* Component tags */}
              <div className="mt-4 flex gap-2 flex-wrap">
                {screen.components.map((c) => (
                  <span key={c} className="text-[10px] text-slate-600 bg-slate-900/60 border border-slate-800 px-2 py-1 rounded font-mono">
                    &lt;{c} /&gt;
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal for errors/warnings */}
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
    </div>
  );
}
