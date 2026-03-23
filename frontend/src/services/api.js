// src/services/api.js
// Axios-style fetch wrapper for all FastAPI backend endpoints.
// In development, Vite proxy forwards these to http://localhost:8000
// In production (Railway), use VITE_API_BASE_URL env variable

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

async function request(endpoint, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

const api = {
  /** Clone + parse a GitHub repository. Returns { repo_id, total_files, ... } */
  uploadRepo(repoUrl) {
    return request("/upload-repo", {
      method: "POST",
      body: JSON.stringify({ repo_url: repoUrl }),
    });
  },

  /** Run full AI analysis on a previously uploaded repo. */
  analyze(repoId) {
    return request("/analyze", {
      method: "POST",
      body: JSON.stringify({ repo_id: repoId }),
    });
  },

  /**
   * RAG chat over the indexed codebase.
   * @param {string} repoId
   * @param {string} message
   * @param {Array<{role:string, content:string}>} history
   * @param {boolean} hinglish
   */
  chat(repoId, message, history = [], hinglish = false) {
    return request("/chat", {
      method: "POST",
      body: JSON.stringify({ repo_id: repoId, message, history, hinglish }),
    });
  },

  /**
   * Convert English text to Hinglish.
   * @param {string} text
   * @param {'casual'|'formal'|'developer'} style
   */
  convertHinglish(text, style = "casual") {
    return request("/convert-hinglish", {
      method: "POST",
      body: JSON.stringify({ text, style }),
    });
  },

  /** Generate a step-by-step guided learning plan. */
  guidedLearning(repoId, forceRefresh = false) {
    return request("/guided-learning", {
      method: "POST",
      body: JSON.stringify({ repo_id: repoId, force_refresh: forceRefresh }),
    });
  },

  /** Generate system flow diagrams. */
  generateFlow(repoId) {
    return request("/generate-flow", {
      method: "POST",
      body: JSON.stringify({ repo_id: repoId }),
    });
  },

  /** Detect UI screens and generate React placeholders. */
  generatePrototype(repoId) {
    return request("/generate-prototype", {
      method: "POST",
      body: JSON.stringify({ repo_id: repoId }),
    });
  },

  /** Health check. */
  health() {
    return request("/health");
  },
};

export default api;
