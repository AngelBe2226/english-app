import { useEffect, useRef, useState } from "react";
import { speak, stopSpeaking, speechSupported, stripHtml } from "../speech";

// Botón de escucha: lee en inglés el texto dado (acepta HTML, lo limpia).
// Se oculta solo si el navegador no soporta síntesis de voz. `text` puede ser
// una cadena o una función que la devuelve (para leer varias líneas juntas).
export default function SpeakButton({ text, title = "Escuchar", className = "" }) {
  const [playing, setPlaying] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  if (!speechSupported()) return null;

  function onClick(e) {
    e.stopPropagation();
    if (playing) {
      stopSpeaking();
      setPlaying(false);
      return;
    }
    const raw = typeof text === "function" ? text() : text;
    const clean = stripHtml(raw);
    if (!clean) return;
    const ok = speak(clean, {
      onend: () => {
        if (mounted.current) setPlaying(false);
      },
    });
    if (ok) setPlaying(true);
  }

  return (
    <button
      type="button"
      className={"speak-btn" + (playing ? " speaking" : "") + (className ? " " + className : "")}
      onClick={onClick}
      aria-label={title}
      title={title}
    >
      {playing ? "◼" : "🔊"}
    </button>
  );
}
