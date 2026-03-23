// src/context/AppContext.jsx
// Global application state — repo data, analysis result with localStorage persistence.

import { createContext, useContext, useState, useEffect } from "react";

const AppContext = createContext(null);
const STORAGE_KEY = "devmind_analysis";

/**
 * useApp — consume global app state from any component.
 */
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

/**
 * AppProvider — wraps the entire app and provides shared state with persistence.
 */
export function AppProvider({ children }) {
  // Load from localStorage on mount
  const [analysis, setAnalysisState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error("Failed to load analysis from storage:", error);
      return null;
    }
  });

  // Persist to localStorage whenever analysis changes
  const setAnalysis = (newAnalysis) => {
    try {
      if (newAnalysis) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newAnalysis));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
      setAnalysisState(newAnalysis);
    } catch (error) {
      console.error("Failed to save analysis to storage:", error);
      setAnalysisState(newAnalysis);
    }
  };

  const value = {
    analysis,
    setAnalysis,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
