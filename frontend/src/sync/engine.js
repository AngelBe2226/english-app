// Motor de sincronización del progreso con Supabase.
//
// Cada dispositivo sigue guardando en local (SQLite en los Macs, localStorage
// en el iPhone), así que todo funciona offline. Además:
//  - Cada cambio local entra en una cola (outbox) con la hora del dispositivo.
//  - push(): sube la cola. El servidor (sync_push) solo sobrescribe una clave
//    si lo que llega es MÁS RECIENTE → fusión por clave, gana lo último.
//  - pull(): baja lo cambiado en el servidor desde el último tirón (por
//    server_ts) y lo aplica en local, salvo las claves con un cambio local
//    pendiente más nuevo (que ganarán al subirse).
//  - Los borrados viajan como lápidas (deleted = true): un "reiniciar bloque"
//    en el iPhone también borra en el Mac, y no resucita.
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";

const OUTBOX_KEY = "english-app-sync-outbox";
const META_KEY = "english-app-sync-meta";
const PULL_OVERLAP_MS = 5000; // margen por si dos escrituras se cruzan en el servidor
const PAGE = 1000;
const PUSH_CHUNK = 500;

export const syncConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// ---- almacenamiento local de la cola y del estado (inyectable para tests) ----
let storage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* modo privado: la cola vive solo en memoria de esta sesión */
    }
  },
};
export function _setStorage(s) {
  storage = s;
}

function readJSON(key, fallback) {
  try {
    const raw = storage.get(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key, value) {
  storage.set(key, JSON.stringify(value));
}

// ---- cliente de Supabase (perezoso) ----
let client = null;
export function getClient() {
  if (!syncConfigured) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: "english-app-auth" },
    });
  }
  return client;
}

// ---- cola de cambios locales ----
// outbox = { [key]: { value: string | null, ts: number } }   (null = borrado)
export function enqueue(changes, now = Date.now()) {
  if (!changes.length) return;
  const ob = readJSON(OUTBOX_KEY, {});
  for (const [key, value] of changes) ob[key] = { value, ts: now };
  writeJSON(OUTBOX_KEY, ob);
}

export function pendingCount() {
  return Object.keys(readJSON(OUTBOX_KEY, {})).length;
}

export function getMeta() {
  return readJSON(META_KEY, { lastPull: 0, userId: null, lastSync: null });
}
function setMeta(patch) {
  writeJSON(META_KEY, { ...getMeta(), ...patch });
}

// Primera sincronización de un usuario en este dispositivo: se sube todo lo
// local con una marca de tiempo mínima (1). Así, si la nube ya tiene esa clave,
// gana la nube; si no la tiene, se sube. Resultado: la unión de ambos.
export function seedFromLocal(localMap, userId) {
  if (getMeta().userId === userId) return false;
  const ob = readJSON(OUTBOX_KEY, {});
  for (const [key, value] of Object.entries(localMap)) {
    if (!(key in ob)) ob[key] = { value, ts: 1 };
  }
  writeJSON(OUTBOX_KEY, ob);
  setMeta({ userId, lastPull: 0 });
  return true;
}

export async function push(sb) {
  const entries = Object.entries(readJSON(OUTBOX_KEY, {}));
  for (let i = 0; i < entries.length; i += PUSH_CHUNK) {
    const chunk = entries.slice(i, i + PUSH_CHUNK);
    const items = chunk.map(([key, e]) => ({
      key,
      value: e.value,
      deleted: e.value === null,
      updated_at: e.ts,
    }));
    const { error } = await sb.rpc("sync_push", { items });
    if (error) throw error;
    // Quitar de la cola solo lo enviado que no haya cambiado mientras tanto.
    const cur = readJSON(OUTBOX_KEY, {});
    for (const [key, e] of chunk) {
      const c = cur[key];
      if (c && c.ts === e.ts && c.value === e.value) delete cur[key];
    }
    writeJSON(OUTBOX_KEY, cur);
  }
  return entries.length;
}

// `apply(changes)` recibe [[key, value|null], ...] y lo escribe en local.
export async function pull(sb, apply) {
  const meta = getMeta();
  const since = Math.max(0, (meta.lastPull || 0) - PULL_OVERLAP_MS);
  let maxTs = meta.lastPull || 0;
  let applied = 0;
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await sb
      .from("progress")
      .select("key,value,deleted,updated_at,server_ts")
      .gt("server_ts", since)
      .order("server_ts", { ascending: true })
      .order("key", { ascending: true })
      .range(offset, offset + PAGE - 1);
    if (error) throw error;
    const rows = data || [];
    const ob = readJSON(OUTBOX_KEY, {});
    const changes = [];
    for (const r of rows) {
      if (r.server_ts > maxTs) maxTs = r.server_ts;
      const local = ob[r.key];
      if (local && local.ts >= r.updated_at) continue; // lo local es más nuevo: se subirá
      if (local) delete ob[r.key]; // lo remoto es más nuevo: descartar lo pendiente
      changes.push([r.key, r.deleted ? null : r.value]);
    }
    writeJSON(OUTBOX_KEY, ob);
    if (changes.length) {
      await apply(changes);
      applied += changes.length;
    }
    if (rows.length < PAGE) break;
  }
  setMeta({ lastPull: maxTs, lastSync: Date.now() });
  return applied;
}

// ---- sesión ----
export async function currentSession() {
  const sb = getClient();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data?.session || null;
}

export function onAuthChange(cb) {
  const sb = getClient();
  if (!sb) return () => {};
  const { data } = sb.auth.onAuthStateChange((_event, session) => cb(session));
  return () => data.subscription.unsubscribe();
}

export async function signIn(email, password) {
  const { error } = await getClient().auth.signInWithPassword({ email, password });
  if (error) throw error;
}

// Devuelve true si hay que confirmar el email antes de poder entrar.
export async function signUp(email, password) {
  const redirect = window.location.origin + ((import.meta.env && import.meta.env.BASE_URL) || "/");
  const { data, error } = await getClient().auth.signUp({
    email,
    password,
    options: { emailRedirectTo: redirect },
  });
  if (error) throw error;
  return !data.session;
}

export async function signOut() {
  await getClient().auth.signOut();
  setMeta({ userId: null, lastPull: 0 });
}
