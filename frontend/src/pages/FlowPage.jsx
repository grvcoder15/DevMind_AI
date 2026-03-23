// src/pages/FlowPage.jsx
// Visualizes system data flows as node-chain diagrams with text representations.

import { useState } from "react";
import { useApp } from "../context/AppContext";
import Spinner from "../components/Spinner";
import Modal from "../components/Modal";
import api from "../services/api";

export default function FlowPage() {
  const { analysis } = useApp();
  const [activeFlow, setActiveFlow] = useState(0);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [flows, setFlows] = useState([]);
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
      console.log("Generating flows for repo:", analysis.repo_id);
      const data = await api.generateFlow(analysis.repo_id);
      console.log("Flow data received:", data);
      
      const detectedFlows = data.flows || [];
      if (detectedFlows.length === 0) {
        showModal(
          "No Flows Detected",
          "The AI couldn't detect any data flows.\n\nPossible reasons:\n• Simple repository structure\n• No complex request/response flows\n• AI needs more context\n\nTry with a larger, more complex codebase.",
          "warning"
        );
        setLoading(false);
        return;
      }
      
      setFlows(detectedFlows);
      setGenerated(true);
    } catch (error) {
      console.error("Flow generation error:", error);
      showModal(
        "Generation Failed",
        `Failed to generate flows:\n${error.message}\n\nPlease try again.`,
        "error"
      );
    }
    setLoading(false);
  };

  const flow = flows[activeFlow];

  // Safety check for rendering
  if (!analysis) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-800/60 px-6 py-4">
          <h2 className="text-white font-semibold">Flow Visualizer</h2>
          <p className="text-slate-500 text-xs mt-0.5">System data flow and request lifecycle diagrams</p>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-5xl mb-4 text-slate-700">⟳</div>
            <p className="text-slate-400 text-sm mb-6">
              Upload and analyze a repository first to generate system flow diagrams
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

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-800/60 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold">Flow Visualizer</h2>
          <p className="text-slate-500 text-xs mt-0.5">System data flow and request lifecycle diagrams</p>
        </div>
        {!generated && (
          <button
            id="generate-flow-btn"
            onClick={handleGenerate}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors"
          >
            {loading ? <><Spinner /> Generating flows...</> : "⟳ Generate Flows"}
          </button>
        )}
      </div>

      {/* Empty state */}
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
            {flows.map((f, i) => (
              <button
                key={i}
                onClick={() => setActiveFlow(i)}
                className={`w-full text-left px-3 py-3 rounded-lg text-xs transition-all ${
                  activeFlow === i
                    ? "bg-indigo-950/60 border border-indigo-800/40 text-indigo-300"
                    : "text-slate-500 hover:bg-slate-900 hover:text-slate-300"
                }`}
              >
                <div className="font-semibold mb-1">{f.name}</div>
                <div className="text-[10px] text-slate-600">{f.description}</div>
              </button>
            ))}
          </div>

          {/* Flow diagram */}
          <div className="flex-1 p-6 overflow-auto">
            {flow ? (
              <div className="max-w-lg">
                <h3 className="text-white font-semibold mb-1">{flow.name}</h3>
                <p className="text-slate-500 text-xs mb-6">{flow.description}</p>

              {/* Nodes chain */}
              <div className="space-y-2">
                {flow.nodes.map((node, i) => (
                  <div key={i}>
                    <div
                      className={`border rounded-xl px-5 py-3 text-sm font-medium ${
                        i === 0
                          ? "bg-indigo-950/60 border-indigo-700/60 text-indigo-300"
                          : i === flow.nodes.length - 1
                          ? "bg-emerald-950/60 border-emerald-700/60 text-emerald-300"
                          : "bg-slate-900/60 border-slate-700/60 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-600">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {node}
                      </div>
                    </div>
                    {i < flow.nodes.length - 1 && (
                      <div className="flex items-center justify-center py-1 text-slate-700">↓</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Text representation */}
              <div className="mt-6 bg-slate-900/40 border border-slate-800/60 rounded-xl p-4">
                <div className="text-xs text-slate-600 font-mono mb-2">TEXT REPRESENTATION</div>
                <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap leading-relaxed">
                  {flow.text_representation}
                </pre>
              </div>
            </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-600 text-sm">Select a flow to view details</p>
              </div>
            )}
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
