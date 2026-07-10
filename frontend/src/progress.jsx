import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "./api";

// Global progress store. Loads every saved key once, keeps it in memory,
// and writes through to the backend on each change (optimistic update).
const ProgressCtx = createContext(null);

export function ProgressProvider({ children }) {
  const [progress, setProgress] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api
      .getProgress()
      .then((data) => setProgress(data || {}))
      .catch(() => setProgress({}))
      .finally(() => setLoaded(true));
  }, []);

  const getVal = useCallback((key) => progress[key] ?? null, [progress]);

  const setVal = useCallback((key, value) => {
    setProgress((prev) => ({ ...prev, [key]: value }));
    api.setProgress(key, value).catch(() => {});
  }, []);

  const resetPrefix = useCallback((prefix) => {
    setProgress((prev) => {
      const next = {};
      for (const k of Object.keys(prev)) if (!k.startsWith(prefix)) next[k] = prev[k];
      return next;
    });
    return api.resetPrefix(prefix).catch(() => {});
  }, []);

  return (
    <ProgressCtx.Provider value={{ progress, loaded, getVal, setVal, resetPrefix }}>
      {children}
    </ProgressCtx.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressCtx);
  if (!ctx) throw new Error("useProgress must be used within ProgressProvider");
  return ctx;
}
