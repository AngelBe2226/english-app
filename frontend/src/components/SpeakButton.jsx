import { useEffect, useRef, useState } from "react";
import { speechSupported } from "../speech";
import { audioEnabled, playTexts, stopAll, unlockAudio } from "../audio/player";

// Botón de escucha. `text` puede ser una cadena (acepta HTML), una lista de
// cadenas que se leen seguidas, o una función que devuelve cualquiera de las
// dos. Usa la voz real (MP3) si existe y, si no, la del sistema.
export default function SpeakButton({ text, title = "Escuchar", className = "" }) {
  const [playing, setPlaying] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  if (!audioEnabled() && !speechSupported()) return null;

  function onClick(e) {
    e.stopPropagation();
    if (playing) {
      stopAll();
      setPlaying(false);
      return;
    }
    unlockAudio(); // dentro del gesto: necesario en iOS
    const value = typeof text === "function" ? text() : text;
    if (!value || (Array.isArray(value) && !value.length)) return;
    setPlaying(true);
    playTexts(value).finally(() => {
      if (mounted.current) setPlaying(false);
    });
  }

  return (
    <button
      type="button"
      className={"speak-btn" + (playing ? " speaking" : "") + (className ? " " + className : "")}
      onClick={onClick}
      aria-label={playing ? "Detener" : title}
      aria-pressed={playing}
      title={playing ? "Detener" : title}
    >
      <SpeakerIcon playing={playing} />
    </button>
  );
}

// Altavoz con ondas; mientras suena, las ondas laten y aparece el «stop» al
// pasar por encima.
export function SpeakerIcon({ playing }) {
  return (
    <svg className="speak-ico" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
      <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path className="speak-wave w1" d="M15.2 9.2a4 4 0 0 1 0 5.6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path className="speak-wave w2" d="M17.8 6.8a7.4 7.4 0 0 1 0 10.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {playing && <rect className="speak-stop" x="6.5" y="6.5" width="11" height="11" rx="2.2" fill="currentColor" />}
    </svg>
  );
}
