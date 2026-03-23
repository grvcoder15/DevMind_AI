// src/components/GitHubRepoSelector.jsx
// Modal to browse and select repositories from user's GitHub account

import { useState, useEffect } from "react";
import Spinner from "./Spinner";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export default function GitHubRepoSelector({ isOpen, onClose, onSelectRepo }) {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState(localStorage.getItem("github_token") || "");
  const [tokenInput, setTokenInput] = useState("");
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Check if user just completed OAuth
    const storedToken = localStorage.getItem("github_token");
    if (storedToken && storedToken !== token) {
      setToken(storedToken);
      const storedUser = localStorage.getItem("github_user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }
    
    if (isOpen && token) {
      fetchRepos();
      if (!user) {
        fetchUser();
      }
    }
  }, [isOpen, token]);

  const fetchUser = async () => {
    try {
      const response = await fetch(`${API_BASE}/github/user?access_token=${token}`);
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (err) {
      console.error("Failed to fetch user:", err);
    }
  };

  const fetchRepos = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/github/repos?access_token=${token}`);
      if (!response.ok) {
        throw new Error("Invalid token or API error");
      }
      const data = await response.json();
      setRepos(data.repos || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToken = () => {
    localStorage.setItem("github_token", tokenInput);
    setToken(tokenInput);
  };

  const handleOAuthLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/github/oauth/login`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || "Failed to start GitHub login");
      }
      
      // Redirect to GitHub OAuth authorization page
      window.location.href = data.auth_url;
    } catch (err) {
      console.error("OAuth login error:", err);
      setError(err.message || "Failed to initiate GitHub OAuth. Check console for details.");
      setLoading(false);
    }
  };

  const handleSelectRepo = (repo) => {
    onSelectRepo(repo.html_url);
    onClose();
  };

  const filteredRepos = repos.filter(repo =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (repo.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              {user ? `${user.login}'s Repositories` : "Choose Repository"}
            </h2>
            {user && (
              <p className="text-sm text-slate-400 mt-1">
                {user.public_repos} repositories
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* OAuth Login (if not authenticated) */}
        {!token && (
          <div className="p-6 border-b border-slate-800 text-center">
            <p className="text-slate-300 text-sm mb-4">
              Connect your GitHub account to browse your repositories
            </p>
            <button
              onClick={handleOAuthLogin}
              disabled={loading}
              className="bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600 text-white px-6 py-3 rounded-lg font-medium transition-all inline-flex items-center gap-3"
            >
              {loading ? (
                <>
                  <Spinner />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  Login with GitHub
                </>
              )}
            </button>
            <p className="text-xs text-slate-500 mt-4">
              You'll be redirected to GitHub to authorize access
            </p>
            {error && (
              <div className="mt-4 p-3 bg-red-900/30 border border-red-800/50 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
                {error.includes("not configured") && (
                  <p className="text-xs text-slate-400 mt-2">
                    Setup required: See <span className="font-mono">GITHUB_OAUTH_SETUP.md</span>
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Search */}
        {token && repos.length > 0 && (
          <div className="p-4 border-b border-slate-800">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Search repositories..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

        {/* Repository List */}
        <div className="flex-1 overflow-auto p-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-400 mb-2">{error}</p>
              <button
                onClick={() => {
                  localStorage.removeItem("github_token");
                  setToken("");
                  setError("");
                }}
                className="text-sm text-slate-400 hover:text-white underline"
              >
                Clear token and try again
              </button>
            </div>
          )}

          {!loading && !error && token && filteredRepos.length === 0 && (
            <p className="text-center text-slate-400 py-8">
              {searchQuery ? "No repositories match your search" : "No repositories found"}
            </p>
          )}

          <div className="space-y-2">
            {filteredRepos.map((repo) => (
              <button
                key={repo.id}
                onClick={() => handleSelectRepo(repo)}
                className="w-full text-left bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-indigo-600 rounded-lg p-4 transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-white group-hover:text-indigo-400 transition-colors">
                    {repo.name}
                  </h3>
                  <div className="flex items-center gap-3 text-xs">
                    {repo.language && (
                      <span className="px-2 py-1 bg-slate-700 rounded text-slate-300">
                        {repo.language}
                      </span>
                    )}
                    <span className="text-slate-400">
                      ⭐ {repo.stargazers_count}
                    </span>
                  </div>
                </div>
                {repo.description && (
                  <p className="text-sm text-slate-400 line-clamp-2">
                    {repo.description}
                  </p>
                )}
                <p className="text-xs text-slate-500 mt-2">
                  {repo.full_name}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
