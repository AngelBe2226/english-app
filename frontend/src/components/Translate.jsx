import { useState } from "react";
import RichText from "./RichText";
import HighlightButton from "./HighlightButton";

// Traducción inversa (ES → EN): el alumno lee la frase en español, intenta
// decirla/escribirla en inglés y pulsa para comprobar. Producción activa:
// recuperar el inglés desde el español cuesta más que reconocerlo, así que
// fija mejor. Estado puramente local — no necesita backend.
export default function Translate({ items, title, hlId }) {
  const rows = items || [];
  const [revealed, setRevealed] = useState({});
  const [allShown, setAllShown] = useState(false);

  function toggleAll() {
    if (allShown) {
      setRevealed({});
      setAllShown(false);
    } else {
      setRevealed(Object.fromEntries(rows.map((_, i) => [i, true])));
      setAllShown(true);
    }
  }

  return (
    <div className="translate">
      <div className="translate-head">
        <span className="translate-tag">traducción inversa</span>
        {hlId && <HighlightButton id={hlId} label="ejercicio destacado" />}
        <span className="translate-title">{title || "Dilo en inglés"}</span>
        {rows.length > 1 && (
          <button className="rp-btn rp-off translate-all" onClick={toggleAll}>
            {allShown ? "ocultar todo" : "ver todo"}
          </button>
        )}
      </div>

      <ol className="tr-rows">
        {rows.map((it, i) => {
          const shown = !!revealed[i];
          return (
            <li key={i} className="tr-row">
              <span className="tr-es">{it.es}</span>
              {shown ? (
                <RichText className="tr-en" html={it.en} />
              ) : (
                <button
                  className="tr-reveal"
                  onClick={() => setRevealed((r) => ({ ...r, [i]: true }))}
                >
                  {it.hint ? `· · · ${it.hint}` : "· · · pulsa para ver el inglés"}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
