// Orden de presentación de las opciones de una pregunta: barajado con semilla
// (el id de la pregunta), así la correcta no cae siempre en el mismo sitio y
// el orden no cambia entre recargas ni entre dispositivos. Lo que se guarda
// sigue siendo el índice original de la opción.
export function displayOrder(seed, n) {
  let h = 2166136261;
  for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const next = () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const idx = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}
