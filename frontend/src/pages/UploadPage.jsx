// src/pages/UploadPage.jsx
// Landing page: GitHub URL input, pipeline progress, and feature showcase.

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import Spinner from "../components/Spinner";
import GitHubRepoSelector from "../components/GitHubRepoSelector";
import { MOCK_ANALYSIS, EXAMPLE_REPOS } from "../utils/mockData";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

const PIPELINE_STEPS = [
  "Cloning repository...",
  "Parsing file tree...",
  "Detecting frameworks...",
  "Building AI context...",
  "Indexing embeddings...",
];

const FEATURE_CARDS = [
  { icon: "⬡", title: "Architecture Map", desc: "Auto-generated diagrams" },
  { icon: "🎓", title: "Learn Mode", desc: "Step-by-step curriculum" },
  { icon: "अ", title: "Hinglish", desc: "Dev-friendly Hindi-English" },
];

export default function UploadPage() {
  const { setAnalysis } = useApp();
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [showRepoSelector, setShowRepoSelector] = useState(false);
  const [oauthProcessing, setOauthProcessing] = useState(false);

  // Handle OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      
      if (!code) return;
      
      setOauthProcessing(true);
      try {
        // Exchange code for access token
        const response = await fetch(`${API_BASE}/github/oauth/callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.detail || 'Failed to authenticate with GitHub');
        }

        const data = await response.json();
        
        // Store access token in localStorage
        localStorage.setItem('github_token', data.access_token);
        localStorage.setItem('github_user', JSON.stringify(data.user));

        // Clean URL and show repo selector
        window.history.replaceState({}, document.title, window.location.pathname);
        setShowRepoSelector(true);
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError('GitHub authentication failed. Please try again.');
      } finally {
        setOauthProcessing(false);
      }
    };

    handleOAuthCallback();
  }, []);

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError("Please enter a GitHub URL");
      return;
    }
    
    if (!url.includes("github.com")) {
      setError("Please enter a valid GitHub URL");
      return;
    }

    setError("");
    setLoading(true);
    setStep(0);

    try {
      // Step 1: Clone repository
      setStep(1);
      const uploadResponse = await fetch(`${API_BASE}/upload-repo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_url: url }),
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.detail || "Failed to clone repository");
      }

      const uploadData = await uploadResponse.json();
      const repoId = uploadData.repo_id;

      // Step 2-4: Parsing & detecting (backend is doing this)
      setStep(2);
      await new Promise(r => setTimeout(r, 800));
      setStep(3);
      await new Promise(r => setTimeout(r, 800));

      // Step 5: AI Analysis
      setStep(4);
      const analyzeResponse = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_id: repoId }),
      });

      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json();
        throw new Error(errorData.detail || "Analysis failed");
      }

      const analysisData = await analyzeResponse.json();
      
      // Step 6: Done!
      setStep(5);
      await new Promise(r => setTimeout(r, 500));

      // Save real analysis data to context
      setAnalysis({
        ...analysisData,
        _repoUrl: url,
        repo_url: url,
      });
      
      setLoading(false);
      navigate("/dashboard");
    } catch (err) {
      console.error("Analysis error:", err);
      
      // Parse error response
      let errorMessage = err.message || "Failed to analyze repository";
      
      // Check if it's a 429 rate limit error
      if (err.response?.status === 429 || errorMessage.includes("rate-limit") || errorMessage.includes("quota")) {
        setError("⏰ All AI models are rate-limited. Google's free tier has strict limits. Please wait 5-10 minutes and try again. Your repository is saved - just click 'Analyze' again later!");
      } else if (err.response?.status === 500) {
        // Extract custom message from 500 error if available
        try {
          const detail = JSON.parse(err.response?.data || '{}').detail;
          if (detail) {
            setError(detail);
          } else {
            setError("⏰ AI analysis failed. Models may be busy. Wait 5 minutes and retry.");
          }
        } catch {
          setError("⏰ AI analysis failed. Models may be busy. Wait 5 minutes and retry.");
        }
      } else {
        setError(errorMessage);
      }
      
      setLoading(false);
      setStep(0);
    }
  };

  const handleSelectRepo = (repoUrl) => {
    setUrl(repoUrl);
    setShowRepoSelector(false);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-slate-950">
      {oauthProcessing ? (
        <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-8 text-center">
          <Spinner size="lg" />
          <p className="text-slate-300 mt-4">Authenticating with GitHub...</p>
        </div>
      ) : (
        <div className="max-w-xl w-full">
        {/* Hero text */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-indigo-950/50 border border-indigo-800/40 rounded-full px-4 py-1.5 text-xs text-indigo-400 mb-6 font-mono">
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
            AI-Powered Codebase Intelligence v2.0
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Understand any codebase{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
              instantly
            </span>
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Architecture diagrams · AI chat · Guided learning paths · Hinglish explanations · Flow visualizer
          </p>
        </div>

        {/* URL input */}
        <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-1.5 flex gap-2 mb-3">
          <input
            id="repo-url-input"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            placeholder="https://github.com/user/repository"
            className="flex-1 bg-transparent text-slate-200 placeholder-slate-600 text-sm px-4 py-2.5 outline-none font-mono"
          />
          <button
            onClick={() => setShowRepoSelector(true)}
            disabled={loading}
            className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
            title="Choose from your GitHub repositories"
          >
            📁 Choose
          </button>
          <button
            id="analyze-btn"
            onClick={handleAnalyze}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:text-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
          >
            {loading ? <><Spinner /><span>Analyzing</span></> : "Analyze →"}
          </button>
        </div>

        {error && (
          <div className="mb-3 bg-rose-950/20 border border-rose-800/40 rounded-lg p-3 flex items-start gap-3">
            <span className="text-rose-400 text-lg">⏰</span>
            <div>
              <p className="text-rose-400 text-xs font-medium mb-1">Analysis Rate Limited</p>
              <p className="text-rose-300/80 text-xs leading-relaxed">{error}</p>
              {error.includes("5-10 minutes") && (
                <p className="text-rose-300/60 text-xs mt-2 italic">
                  💡 Tip: Your repository is already uploaded. Just wait and click "Analyze" again - no need to re-upload!
                </p>
              )}
            </div>
          </div>
        )}

        {/* Example repos */}
        <div className="flex gap-2 flex-wrap mb-4">
          <span className="text-slate-600 text-xs self-center">Try:</span>
          {EXAMPLE_REPOS.map((ex) => (
            <button
              key={ex.url}
              onClick={() => setUrl(ex.url)}
              className="text-xs text-indigo-400 bg-indigo-950/40 border border-indigo-900/50 hover:border-indigo-700/60 px-3 py-1.5 rounded-lg font-mono transition-colors"
            >
              {ex.label}
            </button>
          ))}
        </div>

        {/* Info banner */}
        <div className="mb-6 bg-slate-900/40 border border-slate-800/60 rounded-lg p-3 text-xs text-slate-400 leading-relaxed">
          <p className="mb-1">
            <span className="text-indigo-400 font-semibold">Smart AI System:</span> Automatically tries 7 different models with intelligent caching.
          </p>
          <p className="text-slate-500">
            If rate-limited, wait 5-10 minutes. Analysis is cached - no need to re-analyze same repo! 🚀
          </p>
        </div>

        {/* Pipeline progress */}
        {loading && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            {PIPELINE_STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-3 py-1.5 text-sm">
                <span
                  className={`font-mono w-4 ${
                    i < step
                      ? "text-emerald-400"
                      : i === step
                      ? "text-indigo-400"
                      : "text-slate-700"
                  }`}
                >
                  {i < step ? "✓" : i === step ? "▶" : "○"}
                </span>
                <span
                  className={
                    i < step
                      ? "text-slate-400"
                      : i === step
                      ? "text-slate-200"
                      : "text-slate-700"
                  }
                >
                  {s}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Feature cards */}
        {!loading && (
          <div className="grid grid-cols-3 gap-3 mt-4">
            {FEATURE_CARDS.map(({ icon, title, desc }) => (
              <div key={title} className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 text-center">
                <div className="text-xl mb-2 text-indigo-400">{icon}</div>
                <div className="text-white text-xs font-semibold mb-1">{title}</div>
                <div className="text-slate-600 text-[10px]">{desc}</div>
              </div>
            ))}
          </div>
        )}
        </div>
      )}

      {/* GitHub Repository Selector Modal */}
      <GitHubRepoSelector
        isOpen={showRepoSelector}
        onClose={() => setShowRepoSelector(false)}
        onSelectRepo={handleSelectRepo}
      />
    </div>
  );
}
