import { useState } from "react";
import RichText from "./RichText";
import HighlightButton from "./HighlightButton";

// Lectura graduada: un texto de nivel con glosario desplegable. Las preguntas
// de comprensión van en el `quiz` normal de la sección (con seguimiento), así
// que aquí solo mostramos el texto y el vocabulario de apoyo. Estado local.
export default function Reading({ reading, hlId }) {
  const r = reading || {};
  const [showGloss, setShowGloss] = useState(false);
  const glossary = r.glossary || [];

  return (
    <div className="reading">
      <div className="reading-head">
        <span className="reading-tag">lectura</span>
        {hlId && <HighlightButton id={hlId} label="lectura destacada" />}
        {r.title && <span className="reading-title">{r.title}</span>}
        {r.words && <span className="reading-meta">{r.words} palabras</span>}
      </div>

      {r.strategy && (
        <p className="reading-strategy">
          <span className="reading-strategy-tag">antes de leer</span>
          <RichText as="span" html={r.strategy} />
        </p>
      )}

      <RichText as="div" className="reading-text" html={r.text} />

      {glossary.length > 0 && (
        <div className="reading-gloss">
          <button
            className="reading-gloss-btn"
            onClick={() => setShowGloss((v) => !v)}
            aria-expanded={showGloss}
          >
            {showGloss ? "▾ Ocultar glosario" : `▸ Glosario (${glossary.length})`}
          </button>
          {showGloss && (
            <dl className="reading-gloss-list">
              {glossary.map((g, i) => (
                <div key={i} className="reading-gloss-row">
                  <dt>
                    <RichText as="span" html={g.en} />
                  </dt>
                  <dd>{g.es}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
    </div>
  );
}
