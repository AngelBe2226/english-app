// Clave de audio de un texto: la misma en la app y en el generador
// (scripts/audio), para que cada frase o palabra encuentre su archivo.
// Sin DOM ni crypto.subtle: funciona en Node y en http://localhost.

const ENTITIES = { amp: "&", nbsp: " ", quot: '"', apos: "'", lt: "<", gt: ">", rsquo: "’", lsquo: "‘", hellip: "…", mdash: "—", ndash: "–" };

// Texto tal como se oye: sin etiquetas ni entidades y con espacios normales.
// Una palabra suelta va en minúsculas (salvo «I») para que «She» y «she»
// compartan audio.
export function normText(input) {
  let s = String(input || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(#\d+|#x[0-9a-f]+|\w+);/gi, (m, e) => {
      if (e[0] === "#") return String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
      return ENTITIES[e.toLowerCase()] ?? m;
    })
    .replace(/\s+/g, " ")
    .trim();
  if (/^[A-Za-z]+(['’][A-Za-z]+)*$/.test(s) && s !== "I" && !/^I['’]/.test(s)) s = s.toLowerCase();
  return s;
}

// cyrb53: hash de 53 bits, rápido y estable (colisiones despreciables para
// cientos de miles de textos). Devuelve 14 caracteres hexadecimales.
export function audioKey(text) {
  const str = normText(text);
  let h1 = 0xdeadbeef ^ 0x6a09e667;
  let h2 = 0x41c6ce57 ^ 0x6a09e667;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const n = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  return n.toString(16).padStart(14, "0");
}

// Carpeta de la voz: si cambian la voz o las instrucciones, se cambia aquí y
// se regenera todo en una carpeta nueva (los audios viejos no se mezclan).
export const AUDIO_VOICE = "heart-us-v1";

export function audioPath(text) {
  const k = audioKey(text);
  return `${AUDIO_VOICE}/${k.slice(0, 2)}/${k}.mp3`;
}
