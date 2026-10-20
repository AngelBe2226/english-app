// Capa de datos con DOBLE modo:
//  - ONLINE (Macs con el backend FastAPI): usa /api como siempre (progreso en SQLite).
//  - OFFLINE (PWA en iPhone, sin backend): usa el contenido estático empaquetado
//    en /content/*.json y guarda el progreso en localStorage del dispositivo.
// El modo se detecta una vez (ping a /api/health) y se cachea.

const BASE = import.meta.env.BASE_URL || "/"; // soporta hosting en subruta (GitHub Pages)
const staticUrl = (p) => BASE + p;

async function json(res) {
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

// --- Detección de modo (online = backend disponible) ---
let modePromise = null;
function isOffline() {
  if (!modePromise) {
    const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 2500));
    modePromise = Promise.race([fetch("/api/health", { cache: "no-store" }), timeout])
      .then((r) => !r.ok) // 200 → online (false); 404 u otro → offline (true)
      .catch(() => true); // sin red / sin backend → offline
  }
  return modePromise;
}

// --- Progreso en localStorage (modo offline) ---
const LS_KEY = "english-app-progress";
function lsGet() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}") || {};
  } catch {
    return {};
  }
}
function lsSet(obj) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(obj));
  } catch {}
}

export const api = {
  // ---- Contenido: intenta el backend; si falla, cae al estático empaquetado ----
  listBlocks: () =>
    fetch("/api/blocks")
      .then(json)
      .catch(() => fetch(staticUrl("content/_index.json")).then(json)),

  searchIndex: () =>
    fetch("/api/search-index")
      .then(json)
      .catch(() => fetch(staticUrl("content/search-index.json")).then(json)),

  getBlock: (block) =>
    fetch(`/api/blocks/${block}`)
      .then(json)
      .catch(() => fetch(staticUrl(`content/block_${block}.json`)).then(json)),

  // ---- Progreso: backend (SQLite) online, localStorage offline ----
  getProgress: async () => {
    if (await isOffline()) return lsGet();
    return fetch("/api/progress").then(json).catch(() => lsGet());
  },

  setProgress: async (key, value) => {
    if (await isOffline()) {
      const o = lsGet();
      o[key] = String(value);
      lsSet(o);
      return { ok: true };
    }
    return fetch(`/api/progress/${encodeURIComponent(key)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    }).then(json);
  },

  deleteProgress: async (key) => {
    if (await isOffline()) {
      const o = lsGet();
      delete o[key];
      lsSet(o);
      return { ok: true };
    }
    return fetch(`/api/progress/${encodeURIComponent(key)}`, { method: "DELETE" }).then(json);
  },

  resetPrefix: async (prefix) => {
    if (await isOffline()) {
      const o = lsGet();
      for (const k of Object.keys(o)) if (k.startsWith(prefix)) delete o[k];
      lsSet(o);
      return { ok: true };
    }
    return fetch(`/api/progress/reset?prefix=${encodeURIComponent(prefix)}`, {
      method: "POST",
    }).then(json);
  },

  importProgress: async (items) => {
    if (await isOffline()) {
      lsSet({ ...lsGet(), ...items });
      return { ok: true };
    }
    return fetch("/api/progress/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    }).then(json);
  },
};
