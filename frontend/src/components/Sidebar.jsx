// src/components/Sidebar.jsx
// Left navigation sidebar shown on all pages except Upload.

import { Link, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import Badge from "./Badge";

const NAV_ITEMS = [
  { id: "upload",    path: "/",          icon: "⬆",  label: "Upload Repo" },
  { id: "dashboard", path: "/dashboard", icon: "◈",  label: "Dashboard" },
  { id: "chat",      path: "/chat",      icon: "💬", label: "AI Chat" },
  // { id: "learning",  path: "/learning",  icon: "🎓", label: "Learn Mode" },
  { id: "flow",      path: "/flow",      icon: "⟳",  label: "Flow Viewer" },
  { id: "prototype", path: "/prototype", icon: "◻",  label: "Prototype" },
];

export default function Sidebar() {
  const { analysis, setAnalysis } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  
  const handleNewAnalysis = () => {
    if (confirm("Start a new analysis? Current data will be cleared.")) {
      setAnalysis(null);
      navigate("/");
    }
  };
  
  return (
    <div className="w-56 bg-slate-950 border-r border-slate-800/60 flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-slate-800/60 flex items-center gap-2.5">
        <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-xs font-bold text-white">
          DM
        </div>
        <div>
          <div className="text-white text-sm font-semibold">DevMind AI</div>
          <div className="text-slate-600 text-[10px] font-mono">v2.0</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive
                  ? "bg-indigo-950/60 text-indigo-300 border border-indigo-800/40"
                  : "text-slate-500 hover:text-slate-300 hover:bg-slate-900"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Active repo info */}
      {analysis && (
        <div className="p-4 border-t border-slate-800/60">
          <div className="text-[10px] text-slate-600 mb-1 font-mono">ACTIVE REPO</div>
          <div className="text-xs text-indigo-400 font-mono truncate">{analysis.project_name}</div>
          <div className="flex gap-1.5 mt-1.5 mb-2">
            <Badge color="slate">{analysis.language}</Badge>
            <Badge color="indigo">{analysis.framework}</Badge>
          </div>
          <button
            onClick={handleNewAnalysis}
            className="w-full text-xs text-slate-500 hover:text-indigo-400 py-1.5 rounded border border-slate-800 hover:border-indigo-800/40 transition-colors"
          >
            ⟲ New Analysis
          </button>
        </div>
      )}
    </div>
  );
}
