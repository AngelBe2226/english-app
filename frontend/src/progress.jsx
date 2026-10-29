import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { api } from "./api";
import * as sync from "./sync/engine";
import { K_LAST_BLOCK, K_PLACEMENT, K_SRS_META, srsCardKey } from "./keys";

// Global progress store. Loads every saved key once, keeps it in memory,
// and writes through to the local store on each change (optimistic update).
// Every local change is also queued for Supabase sync (see sync/engine.js);
// remote changes come back through applyRemote without being re-queued.
const ProgressCtx = createContext(null);

const SYNC_DEBOUNCE_MS = 1500;
const SYNC_INTERVAL_MS = 60000;
const MIGRATED_FLAG = "english-app-migrated-v1";

// Antes del sync, el repaso, el test de nivel y el último bloque vivían
// sueltos en localStorage (y no viajarían). Se pasan una vez a claves de progreso.
function legacyItems(progress) {
  try {
    if (localStorage.getItem(MIGRATED_FLAG)) return {};
  } catch {
    return {};
  }
  const read = (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  };
  const items = {};
  const srsRaw = read("english-app-srs");
  if (srsRaw && !(K_SRS_META in progress)) {
    try {
      const s = JSON.parse(srsRaw);
      if (s?.meta) items[K_SRS_META] = JSON.stringify(s.meta);
      for (const [id, card] of Object.entries(s?.cards || {})) items[srsCardKey(id)] = JSON.stringify(card);
    } catch {
      /* dato corrupto: se ignora */
    }
  }
  const placement = read("english-app-placement");
  if (placement && !(K_PLACEMENT in progress)) items[K_PLACEMENT] = placement;
  const last = read("english-app-last-block");
  if (last && !(K_LAST_BLOCK in progress)) items[K_LAST_BLOCK] = last;
  return items;
}

export function ProgressProvider({ children }) {
  const [progress, setProgress] = useState({});
  const [loaded, setLoaded] = useState(false);
  const progressRef = useRef({});
  const [syncState, setSyncState] = useState(() => ({
    status: sync.syncConfigured ? "idle" : "off",
    email: null,
    lastSync: sync.getMeta().lastSync,
    pending: sync.pendingCount(),
    error: null,
  }));
  const syncing = useRef(false);
  const again = useRef(false);
  const debounce = useRef(null);

  const commit = useCallback((updater) => {
    setProgress((prev) => {
      const next = updater(prev);
      progressRef.current = next;
      return next;
    });
  }, []);

  // ---------- sincronización ----------
  // Aplica cambios llegados de la nube: memoria + almacén local, sin re-encolar.
  const applyRemote = useCallback(
    async (changes) => {
      const cur = progressRef.current;
      const sets = {};
      const dels = [];
      for (const [k, v] of changes) {
        if (v === null) {
          if (k in cur) dels.push(k);
        } else if (cur[k] !== v) {
          sets[k] = v;
        }
      }
      if (!dels.length && !Object.keys(sets).length) return;
      commit((prev) => {
        const next = { ...prev, ...sets };
        for (const k of dels) delete next[k];
        return next;
      });
      if (Object.keys(sets).length) await api.importProgress(sets).catch(() => {});
      await Promise.all(dels.map((k) => api.deleteProgress(k).catch(() => {})));
    },
    [commit]
  );

  const runSync = useCallback(async () => {
    if (!sync.syncConfigured) return;
    if (syncing.current) {
      again.current = true; // hubo cambios durante la sincronización: repetir al acabar
      return;
    }
    syncing.current = true;
    setSyncState((s) => ({ ...s, status: "syncing", pending: sync.pendingCount() }));
    try {
      const session = await sync.currentSession();
      if (!session) {
        setSyncState((s) => ({ ...s, status: "signed-out", email: null, pending: sync.pendingCount() }));
        return;
      }
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        setSyncState((s) => ({ ...s, status: "offline", email: session.user.email, pending: sync.pendingCount() }));
        return;
      }
      sync.seedFromLocal(progressRef.current, session.user.id);
      const sb = sync.getClient();
      await sync.push(sb);
      await sync.pull(sb, applyRemote);
      setSyncState({
        status: "synced",
        email: session.user.email,
        lastSync: sync.getMeta().lastSync,
        pending: sync.pendingCount(),
        error: null,
      });
    } catch (e) {
      const offline = typeof navigator !== "undefined" && navigator.onLine === false;
      setSyncState((s) => ({
        ...s,
        status: offline ? "offline" : "error",
        error: offline ? null : String(e?.message || e),
        pending: sync.pendingCount(),
      }));
    } finally {
      syncing.current = false;
      if (again.current) {
        again.current = false;
        setTimeout(() => runSync(), 300);
      }
    }
  }, [applyRemote]);

  const scheduleSync = useCallback(() => {
    if (!sync.syncConfigured) return;
    setSyncState((s) => ({ ...s, pending: sync.pendingCount() }));
    clearTimeout(debounce.current);
    debounce.current = setTimeout(runSync, SYNC_DEBOUNCE_MS);
  }, [runSync]);

  // ---------- carga inicial (+ migración de datos sueltos) ----------
  useEffect(() => {
    api
      .getProgress()
      .then((data) => {
        const base = data || {};
        const items = legacyItems(base);
        const merged = { ...base, ...items };
        progressRef.current = merged;
        setProgress(merged);
        if (Object.keys(items).length) {
          api.importProgress(items).catch(() => {});
          sync.enqueue(Object.entries(items));
        }
        try {
          localStorage.setItem(MIGRATED_FLAG, "1");
        } catch {
          /* sin almacenamiento: se reintentará en la próxima carga */
        }
      })
      .catch(() => setProgress({}))
      .finally(() => setLoaded(true));
  }, []);

  // ---------- disparadores de sincronización ----------
  useEffect(() => {
    if (!loaded || !sync.syncConfigured) return;
    runSync();
    const tick = setInterval(() => {
      if (document.visibilityState === "visible") runSync();
    }, SYNC_INTERVAL_MS);
    const onVisible = () => document.visibilityState === "visible" && runSync();
    const onOnline = () => runSync();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOnline);
    const unsub = sync.onAuthChange(() => runSync());
    return () => {
      clearInterval(tick);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOnline);
      unsub();
    };
  }, [loaded, runSync]);

  // ---------- API de progreso (cambios locales) ----------
  const getVal = useCallback((key) => progress[key] ?? null, [progress]);

  const setVal = useCallback(
    (key, value) => {
      if (progressRef.current[key] === value) return; // sin cambios: nada que guardar ni subir
      commit((prev) => ({ ...prev, [key]: value }));
      api.setProgress(key, value).catch(() => {});
      sync.enqueue([[key, value]]);
      scheduleSync();
    },
    [commit, scheduleSync]
  );

  const delVal = useCallback(
    (key) => {
      if (!(key in progressRef.current)) return Promise.resolve();
      commit((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      sync.enqueue([[key, null]]);
      scheduleSync();
      return api.deleteProgress(key).catch(() => {});
    },
    [commit, scheduleSync]
  );

  // Deletes an explicit list of keys (not a prefix) — used to reset just
  // one epígrafe's quiz without risking a prefix collision (e.g. "s1"
  // matching "s10", "s11"...).
  const delMany = useCallback(
    (keys) => {
      const present = keys.filter((k) => k in progressRef.current);
      if (!present.length) return Promise.resolve();
      commit((prev) => {
        const next = { ...prev };
        for (const k of present) delete next[k];
        return next;
      });
      sync.enqueue(present.map((k) => [k, null]));
      scheduleSync();
      return Promise.all(present.map((k) => api.deleteProgress(k).catch(() => {})));
    },
    [commit, scheduleSync]
  );

  const resetPrefix = useCallback(
    (prefix) => {
      const gone = Object.keys(progressRef.current).filter((k) => k.startsWith(prefix));
      commit((prev) => {
        const next = {};
        for (const k of Object.keys(prev)) if (!k.startsWith(prefix)) next[k] = prev[k];
        return next;
      });
      sync.enqueue(gone.map((k) => [k, null])); // lápidas: el borrado viaja a los demás
      scheduleSync();
      return api.resetPrefix(prefix).catch(() => {});
    },
    [commit, scheduleSync]
  );

  // Importa un lote de claves (upsert en local + fusión en memoria + cola).
  const importAll = useCallback(
    (items) => {
      commit((prev) => ({ ...prev, ...items }));
      sync.enqueue(Object.entries(items));
      scheduleSync();
      return api.importProgress(items);
    },
    [commit, scheduleSync]
  );

  const syncApi = {
    ...syncState,
    configured: sync.syncConfigured,
    runNow: runSync,
    signIn: async (email, password) => {
      await sync.signIn(email, password);
      await runSync();
    },
    signUp: (email, password) => sync.signUp(email, password),
    signOut: async () => {
      await sync.signOut();
      setSyncState((s) => ({ ...s, status: "signed-out", email: null, lastSync: null }));
    },
  };

  return (
    <ProgressCtx.Provider
      value={{
        progress,
        loaded,
        getVal,
        setVal,
        delVal,
        delMany,
        resetPrefix,
        importAll,
        sync: syncApi,
      }}
    >
      {children}
    </ProgressCtx.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressCtx);
  if (!ctx) throw new Error("useProgress must be used within ProgressProvider");
  return ctx;
}
