// Motor de repaso espaciado (SRS) + gamificación, todo offline en localStorage.
// Algoritmo tipo SM-2 simplificado con tres valoraciones: otra vez / bien / fácil.
// El estado es por dispositivo (como el resto del progreso de la app).

const KEY = "english-app-srs";
const DAY = 24 * 60 * 60 * 1000;
export const DAILY_GOAL = 20; // repasos objetivo al día
const NEW_PER_DAY = 12; // tarjetas nuevas que se introducen cada día
const MASTER_INTERVAL = 21; // días de intervalo para considerar una tarjeta "dominada"

function todayStr(now = Date.now()) {
  return new Date(now).toISOString().slice(0, 10);
}

export function loadSrs() {
  try {
    const raw = localStorage.getItem(KEY);
    const s = raw ? JSON.parse(raw) : null;
    return normalise(s);
  } catch {
    return normalise(null);
  }
}

function normalise(s) {
  return {
    cards: (s && s.cards) || {},
    meta: {
      streak: 0,
      bestStreak: 0,
      lastStudy: null,
      xp: 0,
      totalReviews: 0,
      reviewsToday: 0,
      reviewsDate: null,
      newToday: 0,
      newDate: null,
      ...(s && s.meta),
    },
  };
}

export function saveSrs(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* modo privado: no persiste, no pasa nada */
  }
}

// Asegura que los contadores diarios correspondan a HOY (si no, los reinicia).
function rollDay(meta, now) {
  const t = todayStr(now);
  if (meta.reviewsDate !== t) {
    meta.reviewsDate = t;
    meta.reviewsToday = 0;
  }
  if (meta.newDate !== t) {
    meta.newDate = t;
    meta.newToday = 0;
  }
  return meta;
}

// Construye la cola de la sesión: tarjetas vencidas + nuevas (hasta el cupo del
// día). `deck` es el array de tarjetas con id. Devuelve ids ordenados.
export function buildSession(deck, state, now = Date.now()) {
  rollDay(state.meta, now);
  const due = [];
  const fresh = [];
  for (const card of deck) {
    const c = state.cards[card.id];
    if (!c || c.reps === 0 && !c.interval) {
      if (!c) fresh.push(card.id);
      else if (c.due <= now) due.push(card.id); // nueva ya empezada y vencida
    } else if (c.due <= now) {
      due.push(card.id);
    }
  }
  const newAllowed = Math.max(0, NEW_PER_DAY - state.meta.newToday);
  const chosen = [...shuffle(due), ...fresh.slice(0, newAllowed)];
  return chosen;
}

// Cuántas nuevas/vencidas hay disponibles AHORA (para avisos).
export function available(deck, state, now = Date.now()) {
  rollDay(state.meta, now);
  let due = 0;
  let fresh = 0;
  for (const card of deck) {
    const c = state.cards[card.id];
    if (!c) fresh++;
    else if (c.due <= now) due++;
  }
  const newAllowed = Math.max(0, NEW_PER_DAY - state.meta.newToday);
  return { due, new: Math.min(fresh, newAllowed), freshTotal: fresh };
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Aplica una valoración a una tarjeta y actualiza la planificación + la
// gamificación. grade: "again" | "good" | "easy". Devuelve el nuevo estado.
export function rate(state, id, grade, now = Date.now()) {
  const meta = rollDay({ ...state.meta }, now);
  const prev = state.cards[id] || { ease: 2.5, interval: 0, reps: 0, lapses: 0, due: now };
  const c = { ...prev };
  const wasNew = prev.reps === 0 && !prev.lapses;

  if (grade === "again") {
    c.ease = Math.max(1.3, c.ease - 0.2);
    c.reps = 0;
    c.lapses = (c.lapses || 0) + 1;
    c.interval = 0;
    c.due = now; // se vuelve a ver en la misma sesión
  } else if (grade === "good") {
    if (c.reps === 0) c.interval = 1;
    else if (c.reps === 1) c.interval = 3;
    else c.interval = Math.round(c.interval * c.ease);
    c.reps += 1;
    c.due = now + c.interval * DAY;
  } else {
    // easy
    c.ease = c.ease + 0.15;
    if (c.reps === 0) c.interval = 2;
    else c.interval = Math.round(Math.max(c.interval, 1) * c.ease * 1.3);
    c.reps += 1;
    c.due = now + c.interval * DAY;
  }

  const cards = { ...state.cards, [id]: c };

  // Gamificación: XP, contadores diarios, nuevas introducidas.
  meta.xp = (meta.xp || 0) + (grade === "again" ? 1 : grade === "easy" ? 3 : 2);
  meta.reviewsToday = (meta.reviewsToday || 0) + 1;
  meta.totalReviews = (meta.totalReviews || 0) + 1;
  if (wasNew && grade !== "again") meta.newToday = (meta.newToday || 0) + 1;

  // Racha: se cuenta un "día de estudio" al primer repaso del día.
  const t = todayStr(now);
  if (meta.lastStudy !== t) {
    const yesterday = todayStr(now - DAY);
    meta.streak = meta.lastStudy === yesterday ? (meta.streak || 0) + 1 : 1;
    meta.lastStudy = t;
  }
  meta.bestStreak = Math.max(meta.bestStreak || 0, meta.streak || 0);

  return { cards, meta };
}

export function levelFromXp(xp) {
  // Nivel progresivo: cada nivel cuesta un poco más (curva suave).
  return Math.floor(0.25 * Math.sqrt(xp || 0)) + 1;
}

export function stats(deck, state, now = Date.now()) {
  const meta = state.meta;
  let mastered = 0;
  let learning = 0;
  let fresh = 0;
  for (const card of deck) {
    const c = state.cards[card.id];
    if (!c) fresh++;
    else if (c.interval >= MASTER_INTERVAL) mastered++;
    else learning++;
  }
  const avail = available(deck, state, now);
  return {
    total: deck.length,
    mastered,
    learning,
    fresh,
    due: avail.due,
    newAvail: avail.new,
    streak: meta.streak || 0,
    bestStreak: meta.bestStreak || 0,
    studiedToday: meta.lastStudy === todayStr(now),
    xp: meta.xp || 0,
    level: levelFromXp(meta.xp || 0),
    reviewsToday: meta.reviewsToday || 0,
    totalReviews: meta.totalReviews || 0,
    goal: DAILY_GOAL,
  };
}

// Logros / insignias. Cada uno se desbloquea al cumplir su condición sobre las
// estadísticas. earned() devuelve la lista con su estado para pintarlos.
export const ACHIEVEMENTS = [
  { id: "streak3", icon: "🔥", label: "En racha", desc: "3 días seguidos", test: (s) => s.bestStreak >= 3 },
  { id: "streak7", icon: "⚡", label: "Semana perfecta", desc: "7 días seguidos", test: (s) => s.bestStreak >= 7 },
  { id: "streak30", icon: "🏆", label: "Imparable", desc: "30 días seguidos", test: (s) => s.bestStreak >= 30 },
  { id: "rev50", icon: "🌱", label: "Constante", desc: "50 repasos", test: (s) => s.totalReviews >= 50 },
  { id: "rev200", icon: "🌳", label: "Veterano", desc: "200 repasos", test: (s) => s.totalReviews >= 200 },
  { id: "master10", icon: "🧠", label: "Buena memoria", desc: "10 tarjetas dominadas", test: (s) => s.mastered >= 10 },
  { id: "masterAll", icon: "👑", label: "Maestría", desc: "Mazo completo dominado", test: (s) => s.total > 0 && s.mastered >= s.total },
];

export function earnedBadges(st) {
  return ACHIEVEMENTS.map((a) => ({ ...a, earned: !!a.test(st) }));
}
