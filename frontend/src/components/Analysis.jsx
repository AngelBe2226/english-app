import { useState } from "react";
import HighlightButton from "./HighlightButton";

// Etiquetas en español de cada función sintáctica.
const FN_LABEL = {
  subj: "Sujeto",
  verb: "Verbo",
  cd: "CD",
  ci: "CI",
  cc: "CC",
  attr: "Atributo",
  cpred: "C. pred.",
  conj: "Nexo",
};

// Análisis sintáctico interactivo: cada frase se divide en "partes" {t, fn}.
// El alumno intenta analizarla y pulsa "analizar" para revelar la función de
// cada parte con color y etiqueta. Estado local por frase — sin backend.
export default function Analysis({ analysis, hlId }) {
  const a = analysis || {};
  const items = a.items || [];
  // Funciones realmente usadas, para la leyenda.
  const used = [...new Set(items.flatMap((it) => (it.parts || []).map((p) => p.fn)).filter(Boolean))];
  const [shown, setShown] = useState({});

  function toggle(i) {
    setShown((s) => ({ ...s, [i]: !s[i] }));
  }

  return (
    <div className="analysis">
      <div className="analysis-head">
        <span className="analysis-tag">análisis sintáctico</span>
        {hlId && <HighlightButton id={hlId} label="análisis destacado" />}
        {a.title && <span className="analysis-title">{a.title}</span>}
      </div>

      {used.length > 0 && (
        <div className="analysis-legend">
          {used.map((fn) => (
            <span key={fn} className={"an-chip an-" + fn}>
              {FN_LABEL[fn] || fn}
            </span>
          ))}
        </div>
      )}

      <ol className="an-items">
        {items.map((it, i) => {
          const on = !!shown[i];
          return (
            <li key={i} className="an-item">
              <p className={"an-sentence" + (on ? " an-on" : "")}>
                {(it.parts || []).map((p, j) => (
                  <span key={j} className={on && p.fn ? "an-part an-" + p.fn : "an-part"}>
                    <span className="an-text">{p.t}</span>
                    {on && p.fn && <span className="an-fn">{FN_LABEL[p.fn] || p.fn}</span>}
                  </span>
                ))}
              </p>
              <button className="an-btn" onClick={() => toggle(i)}>
                {on ? "ocultar análisis" : "analizar"}
              </button>
              {on && it.note && <p className="an-note">{it.note}</p>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
