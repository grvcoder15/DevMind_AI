// src/App.jsx
// Root component — wires AppProvider, Sidebar, top bar, and page routing.

import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import Sidebar from "./components/Sidebar";
import Badge from "./components/Badge";
import UploadPage    from "./pages/UploadPage";
import DashboardPage from "./pages/DashboardPage";
import ChatPage      from "./pages/ChatPage";
import LearningPage  from "./pages/LearningPage";
import FlowPage      from "./pages/FlowPage";
import PrototypePage from "./pages/PrototypePage";

// ─── Inner app (needs context) ───────────────────────────────────────────────

function AppShell() {
  const location = useLocation();
  const showSidebar = location.pathname !== "/" && location.pathname !== "/auth/callback";

  return (
    <div className="h-screen bg-slate-950 flex overflow-hidden font-sans">
      {showSidebar && (
        <Sidebar />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar (hidden on upload page) */}
        {showSidebar && (
          <div className="border-b border-slate-800/60 px-6 py-2 flex items-center justify-between bg-slate-950 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-indigo-600 rounded flex items-center justify-center text-[10px] font-bold text-white">
                DM
              </div>
              <span className="text-slate-500 text-xs">DevMind AI</span>
            </div>
            <Badge color="green">● Active</Badge>
          </div>
        )}

        {/* Page content with routing */}
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/auth/callback" element={<UploadPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/learning" element={<LearningPage />} />
          <Route path="/flow" element={<FlowPage />} />
          <Route path="/prototype" element={<PrototypePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

// ─── Root export ─────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </BrowserRouter>
  );
}
