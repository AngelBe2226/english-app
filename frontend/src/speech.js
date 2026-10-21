// Síntesis de voz con la Web Speech API del navegador. No necesita archivos ni
// backend y funciona offline con las voces del sistema (incl. iOS Safari, el
// objetivo de la PWA). Si el navegador no la soporta, degrada en silencio.

const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

export function speechSupported() {
  return !!synth && typeof window.SpeechSynthesisUtterance === "function";
}

// Quita etiquetas HTML y normaliza espacios para leer solo el texto.
export function stripHtml(html) {
  if (!html) return "";
  const el = document.createElement("div");
  el.innerHTML = html;
  return (el.textContent || "").replace(/\s+/g, " ").trim();
}

let cachedVoice = undefined; // undefined = sin resolver; null = no hay voz EN

function pickEnglishVoice() {
  if (cachedVoice !== undefined) return cachedVoice;
  const voices = synth.getVoices() || [];
  if (!voices.length) return undefined; // aún no cargadas
  const en = voices.filter((v) => /^en(-|_|$)/i.test(v.lang));
  // Preferencia: británica > estadounidense > cualquier inglés.
  cachedVoice =
    en.find((v) => /en-GB/i.test(v.lang)) ||
    en.find((v) => /en-US/i.test(v.lang)) ||
    en[0] ||
    null;
  return cachedVoice;
}

// Algunas plataformas cargan las voces de forma asíncrona.
if (synth && typeof synth.addEventListener === "function") {
  synth.addEventListener("voiceschanged", () => {
    cachedVoice = undefined;
    pickEnglishVoice();
  });
}

// Lee un texto en inglés. Si ya se está leyendo, corta lo anterior.
// onend/onerror notifican el fin para que el botón recupere su estado.
export function speak(text, { onend } = {}) {
  if (!speechSupported()) return false;
  const clean = typeof text === "string" ? text : "";
  if (!clean) return false;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(clean);
  u.lang = "en-GB";
  const v = pickEnglishVoice();
  if (v) u.voice = v;
  u.rate = 0.95;
  if (onend) {
    u.onend = onend;
    u.onerror = onend;
  }
  synth.speak(u);
  return true;
}

export function stopSpeaking() {
  if (synth) synth.cancel();
}
