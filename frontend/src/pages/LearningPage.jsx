// src/pages/LearningPage.jsx
// Guided step-by-step learning curriculum for the analyzed repository.

import { useState } from "react";
import { useApp } from "../context/AppContext";
import Badge from "../components/Badge";
import HinglishToggle from "../components/HinglishToggle";
import Spinner from "../components/Spinner";
import Modal from "../components/Modal";
import api from "../services/api";

export default function LearningPage() {
  const { analysis } = useApp();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [hinglishMode, setHinglishMode] = useState(false);
  const [stepHinglish, setStepHinglish] = useState({});
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "info" });

  const showModal = (title, message, type = "info") => {
    setModal({ isOpen: true, title, message, type });
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  const generatePlan = async () => {
    setLoading(true);
    try {
      console.log("Generating learning plan for repo:", analysis.repo_id);
      const data = await api.guidedLearning(analysis.repo_id);
      console.log("Learning plan received:", data);
      
      if (!data || !data.steps || data.steps.length === 0) {
        showModal(
          "No Steps Generated",
          "The AI couldn't generate learning steps.\n\nPossible reasons:\n• Repository might be too simple\n• Not enough code to analyze\n• AI needs more context\n\nTry uploading a larger codebase.",
          "warning"
        );
        setLoading(false);
        return;
      }
      
      setPlan(data);
    } catch (error) {
      console.error("Learning plan error:", error);
      showModal(
        "Generation Failed",
        `Failed to generate learning plan:\n${error.message}\n\nPlease try again or upload a different repository.`,
        "error"
      );
    }
    setLoading(false);
  };

  const toggleHinglish = async () => {
    const newMode = !hinglishMode;
    setHinglishMode(newMode);
    if (newMode && plan) {
      const current = plan.steps[activeStep];
      if (!stepHinglish[activeStep]) {
        try {
          const result = await api.convertHinglish(current.description, "casual");
          setStepHinglish((prev) => ({ ...prev, [activeStep]: result.hinglish_text }));
        } catch (error) {
          console.error("Hinglish conversion error:", error);
        }
      }
    }
  };

  // Safety check for analysis
  if (!analysis) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🎓</div>
          <h2 className="text-2xl font-bold text-white mb-3">Guided Learning Mode</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Upload and analyze a repository first to generate a personalized step-by-step learning path.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            ⬆ Upload Repository
          </button>
        </div>
      </div>
    );
  }

  // Pre-generation CTA
  if (!plan) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🎓</div>
          <h2 className="text-2xl font-bold text-white mb-3">Guided Learning Mode</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Generate a personalized step-by-step learning path for{" "}
            <span className="text-indigo-400">{analysis?.project_name}</span>.
            The AI will create a curriculum based on the codebase structure.
          </p>
          <button
            id="generate-learning-btn"
            onClick={generatePlan}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors flex items-center gap-2 mx-auto"
          >
            {loading ? (
              <><Spinner /> Generating curriculum...</>
            ) : (
              "🎓 Teach Me This Codebase"
            )}
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
            <button
              key={i}
              onClick={() => setActiveStep(i)}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-all text-xs ${
                activeStep === i
                  ? "bg-indigo-950/60 border border-indigo-800/40 text-indigo-300"
                  : i < activeStep
                  ? "text-emerald-400 hover:bg-slate-900"
                  : "text-slate-600 hover:bg-slate-900 hover:text-slate-400"
              }`}
            >
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
          {/* Step header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-sm font-bold text-white">
                {step.step}
              </div>
              <h2 className="text-xl font-bold text-white">{step.title}</h2>
            </div>
            <div className="flex items-center gap-2">
              <HinglishToggle value={hinglishMode} onChange={toggleHinglish} />
              <Badge color="amber">⏱ {step.estimated_time}</Badge>
            </div>
          </div>

          {/* Description */}
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

          {/* Files + Concepts */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4">
              <div className="text-xs text-slate-600 font-mono mb-3">📄 FILES TO READ</div>
              {step.files_to_read.map((f) => (
                <div key={f} className="flex items-center gap-2 py-1.5">
                  <span className="text-indigo-400 text-xs">▶</span>
                  <code className="text-xs text-emerald-300 font-mono">{f}</code>
                </div>
              ))}
            </div>
            <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4">
              <div className="text-xs text-slate-600 font-mono mb-3">💡 KEY CONCEPTS</div>
              {step.key_concepts.map((c) => (
                <div key={c} className="flex items-center gap-2 py-1.5">
                  <span className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
                  <span className="text-xs text-slate-300">{c}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Prev / Next */}
          <div className="flex justify-between">
            <button
              onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
              disabled={activeStep === 0}
              className="text-sm border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-slate-200 px-4 py-2 rounded-lg disabled:opacity-30 transition-all"
            >
              ← Previous
            </button>
            <button
              onClick={() => setActiveStep(Math.min(plan.steps.length - 1, activeStep + 1))}
              disabled={activeStep === plan.steps.length - 1}
              className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg disabled:opacity-30 transition-colors"
            >
              Next Step →
            </button>
          </div>
        </div>
      </div>

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
