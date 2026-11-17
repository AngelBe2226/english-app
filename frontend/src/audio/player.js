import { AUDIO_BASE } from "./config";
import { audioPath, normText } from "./key";
import { speak, stopSpeaking, speechSupported } from "../speech";

// Reproductor: voz real (MP3 generado con Kokoro y guardado en R2) y, si no
// hay audio para ese texto o no hay conexión, la voz del sistema.
// Los MP3 se piden con fetch: el service worker los guarda (CacheFirst), así
// lo ya escuchado suena también sin conexión.
// Un único <audio> compartido: iOS solo deja reproducir sin gesto en un
// elemento que se «desbloqueó» dentro de un toque, así que se desbloquea en
// cada clic (unlock) antes de cualquier espera.

// WAV mínimo en silencio (0,05 s) para desbloquear el audio en iOS.
function silentWav() {
  const n = 1200;
  const buf = new DataView(new ArrayBuffer(44 + n * 2));
  const w = (o, str) => [...str].forEach((c, i) => buf.setUint8(o + i, c.charCodeAt(0)));
  w(0, "RIFF");
  buf.setUint32(4, 36 + n * 2, true);
  w(8, "WAVEfmt ");
  buf.setUint32(16, 16, true);
  buf.setUint16(20, 1, true);
  buf.setUint16(22, 1, true);
  buf.setUint32(24, 24000, true);
  buf.setUint32(28, 48000, true);
  buf.setUint16(32, 2, true);
  buf.setUint16(34, 16, true);
  w(36, "data");
  buf.setUint32(40, n * 2, true);
  let bin = "";
  new Uint8Array(buf.buffer).forEach((b) => (bin += String.fromCharCode(b)));
  return "data:audio/wav;base64," + btoa(bin);
}

let el = null;
let token = 0;
let blobUrl = null;

function audioEl() {
  if (!el && typeof Audio !== "undefined") {
    el = new Audio();
    el.preload = "auto";
  }
  return el;
}

// Llamar dentro del gesto del usuario (clic/toque).
export function unlockAudio() {
  const a = audioEl();
  if (!a || a.dataset.unlocked) return;
  a.src = silentWav();
  const p = a.play();
  if (p && p.catch) p.catch(() => {});
  a.dataset.unlocked = "1";
  // La voz del sistema también necesita un primer uso dentro del gesto.
  if (speechSupported()) {
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    window.speechSynthesis.speak(u);
  }
}

export function audioEnabled() {
  return Boolean(AUDIO_BASE);
}

export function stopAll() {
  token++;
  const a = audioEl();
  if (a) a.pause();
  stopSpeaking();
}

function speakAsync(text) {
  return new Promise((resolve) => {
    if (!speechSupported() || !speak(text, { onend: resolve })) resolve();
  });
}

async function playClip(text, my) {
  const res = await fetch(`${AUDIO_BASE}/${audioPath(text)}`, { mode: "cors" });
  if (!res.ok) throw new Error("no-audio");
  const blob = await res.blob();
  if (my !== token) return;
  const a = audioEl();
  if (blobUrl) URL.revokeObjectURL(blobUrl);
  blobUrl = URL.createObjectURL(blob);
  a.src = blobUrl;
  await new Promise((resolve, reject) => {
    a.onended = resolve;
    a.onerror = () => reject(new Error("decode"));
    const p = a.play();
    if (p && p.catch) p.catch(reject);
  });
}

// Reproduce un texto o una lista de textos seguidos (p. ej. un diálogo).
// Devuelve una promesa que se resuelve al terminar (o al ser interrumpida).
export async function playTexts(input) {
  stopAll();
  const my = token;
  const list = (Array.isArray(input) ? input : [input]).map(normText).filter(Boolean);
  for (const text of list) {
    if (my !== token) return;
    if (AUDIO_BASE) {
      try {
        await playClip(text, my);
        continue;
      } catch {
        // Sin audio para este texto (o sin conexión y sin caché): voz del sistema.
      }
    }
    if (my !== token) return;
    await speakAsync(text);
  }
}
