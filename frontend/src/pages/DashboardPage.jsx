// src/pages/DashboardPage.jsx
// Shows full analysis: stats, file ranking, and architecture layers.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import Badge from "../components/Badge";
import SectionCard from "../components/SectionCard";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "files",    label: "File Ranking" },
  { id: "arch",     label: "Architecture" },
];

const ARCH_LAYERS = [
  { label: "API Gateway",      items: ["Auth Router", "Product Router", "Order Router", "Payment Router"], color: "indigo" },
  { label: "Service Layer",    items: ["AuthService", "OrderService", "ProductService", "PaymentService"], color: "violet" },
  { label: "Repository Layer", items: ["UserRepo", "ProductRepo", "OrderRepo"], color: "slate" },
  { label: "Data Layer",       items: ["PostgreSQL", "Redis Cache", "Celery Queue", "S3 Storage"], color: "amber" },
];

export default function DashboardPage() {
  const { analysis } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");

  // Safety check for analysis
  if (!analysis) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-800/60 px-6 py-4">
          <h2 className="text-white font-semibold">Dashboard</h2>
          <p className="text-slate-500 text-xs mt-0.5">Repository analysis overview</p>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-5xl mb-4">◈</div>
            <h3 className="text-xl font-bold text-white mb-3">Analysis Dashboard</h3>
            <p className="text-slate-400 text-sm mb-6">
              Upload and analyze a repository to view stats, architecture layers, and file rankings.
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

  // Ensure analysis has required fields with defaults
  const safeAnalysis = {
    project_name: analysis?.project_name || "Unknown Project",
    framework: analysis?.framework || "Unknown",
    language: analysis?.language || "Unknown",
    total_files: analysis?.total_files || 0,
    total_lines: analysis?.total_lines || 0,
    dependencies: Array.isArray(analysis?.dependencies) ? analysis.dependencies : [],
    entry_points: Array.isArray(analysis?.entry_points) ? analysis.entry_points : [],
    summary: analysis?.summary || "No summary available",
    architecture_overview: analysis?.architecture_overview || "No architecture overview available",
    data_flow: analysis?.data_flow || "No data flow information available",
    file_ranking: Array.isArray(analysis?.file_ranking) ? analysis.file_ranking : [],
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-800/60 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold">{safeAnalysis.project_name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge color="green">Analyzed</Badge>
            <Badge color="indigo">{safeAnalysis.framework}</Badge>
            <Badge color="slate">{safeAnalysis.language}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            id="teach-me-btn"
            onClick={() => navigate("/learning")}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            🎓 Teach Me This Codebase
          </button>
          <button
            onClick={() => navigate("/chat")}
            className="text-xs border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-slate-200 px-4 py-2 rounded-lg transition-colors"
          >
            💬 Open Chat
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="px-6 pt-5 grid grid-cols-4 gap-3">
        {[
          ["Files",        safeAnalysis.total_files],
          ["Lines",        safeAnalysis.total_lines.toLocaleString()],
          ["Dependencies", safeAnalysis.dependencies.length],
          ["Entry Points", safeAnalysis.entry_points.length],
        ].map(([label, value]) => (
          <div key={label} className="bg-slate-900/60 border border-slate-800/60 rounded-lg p-4">
            <div className="text-slate-500 text-xs mb-1">{label}</div>
            <div className="text-white text-xl font-bold font-mono">{value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="px-6 mt-5 border-b border-slate-800/60 flex gap-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`text-sm px-4 py-2.5 font-medium transition-colors ${
              tab === t.id
                ? "text-white border-b-2 border-indigo-500"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto px-6 py-5 space-y-4">
        {tab === "overview" && (
          <>
            <SectionCard title="Project Summary">
              <p className="text-slate-300 text-sm leading-relaxed">{safeAnalysis.summary}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {safeAnalysis.dependencies.map((d) => (
                  <Badge key={d} color="slate">{d}</Badge>
                ))}
              </div>
            </SectionCard>
            <SectionCard title="Architecture Overview">
              <p className="text-slate-300 text-sm leading-relaxed">{safeAnalysis.architecture_overview}</p>
            </SectionCard>
            <SectionCard title="Data Flow">
              <p className="text-slate-300 text-sm leading-relaxed">{safeAnalysis.data_flow}</p>
            </SectionCard>
          </>
        )}

        {tab === "files" && (
          <SectionCard title="File Importance Ranking">
            <p className="text-slate-600 text-xs mb-4 font-mono">
              AI-scored by architectural significance, import depth, and business logic density
            </p>
            {safeAnalysis.file_ranking.length === 0 ? (
              <p className="text-slate-500 text-sm">No file ranking data available</p>
            ) : (
              safeAnalysis.file_ranking.map((f) => (
                <div key={f.file} className="flex items-center gap-3 py-2.5 border-b border-slate-800/50 last:border-0">
                  <code className="text-xs text-indigo-300 font-mono w-44 truncate shrink-0">{f.file}</code>
                  <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                      style={{ width: `${f.importance}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 font-mono w-7 text-right">{f.importance}</span>
                  <span className="text-xs text-slate-500 w-52 truncate hidden lg:block">{f.purpose}</span>
                </div>
              ))
            )}
          </SectionCard>
        )}

        {tab === "arch" && (
          <SectionCard title="Architecture Layers">
            {ARCH_LAYERS.map((layer, i) => (
              <div key={layer.label} className="mb-4">
                <div className="text-xs text-slate-600 font-mono mb-2">{layer.label}</div>
                <div className="flex flex-wrap gap-2">
                  {layer.items.map((item) => (
                    <Badge key={item} color={layer.color}>{item}</Badge>
                  ))}
                </div>
                {i < ARCH_LAYERS.length - 1 && (
                  <div className="text-slate-700 text-center text-sm mt-3">⇕</div>
                )}
              </div>
            ))}
          </SectionCard>
        )}
      </div>
    </div>
  );
}
