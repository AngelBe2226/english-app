// Dirección pública donde están los audios (bucket de Cloudflare R2). Es
// pública a propósito: solo contiene MP3. Vacía = se usa la voz del sistema.
const env = import.meta.env || {};
export const AUDIO_BASE = (env.VITE_AUDIO_BASE || "").replace(/\/$/, "");
