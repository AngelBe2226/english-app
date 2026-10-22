import { Fragment, useMemo, useState } from "react";
import { CAMBRIDGE, partMeta, matchesAny } from "../data/cambridge";

const LEVELS = ["B2", "C1"];

// Divide un texto con marcadores {{n}} en segmentos de texto y huecos.
function splitPassage(text) {
  return text.split(/\{\{(\d+)\}\}/); // [txt, "1", txt, "2", ...]
}

// Simulacro Cambridge — Use of English. Elige nivel (B2/C1) y parte (1–4),
// responde y pulsa «Comprobar» para corregir y ver las respuestas modelo.
// Todo offline y autocorregido (las transformaciones muestran modelo para
// autoevaluar variantes válidas).
export default function CambridgeExam() {
  const [level, setLevel] = useState("B2");
  const [partIndex, setPartIndex] = useState(0);
  const [resp, setResp] = useState({});
  const [checked, setChecked] = useState(false);

  const task = CAMBRIDGE[level].parts[partIndex];
  const meta = partMeta(task.type);

  function switchTo(nextLevel, nextPart) {
    setLevel(nextLevel);
    setPartIndex(nextPart);
    setResp({});
    setChecked(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function setAnswer(key, value) {
    setResp((r) => ({ ...r, [key]: value }));
    if (checked) setChecked(false);
  }

  // Cuenta de huecos y aciertos para el marcador.
  const { total, correct } = useMemo(() => {
    const gaps = task.type === "transformations" ? task.items : task.gaps;
    let c = 0;
    gaps.forEach((g, i) => {
      if (task.type === "mcq-cloze") {
        if (resp[i] === g.correctIndex) c++;
      } else {
        if (matchesAny(resp[i], g.answers)) c++;
      }
    });
    return { total: gaps.length, correct: c };
  }, [task, resp]);

  function isGapCorrect(i, g) {
    if (task.type === "mcq-cloze") return resp[i] === g.correctIndex;
    return matchesAny(resp[i], g.answers);
  }

  // ---- render de un hueco dentro del texto (partes 1–3) ----
  function renderGap(i) {
    const g = task.gaps[i];
    const ok = checked && isGapCorrect(i, g);
    const bad = checked && !isGapCorrect(i, g);
    const cls = "gap" + (ok ? " gap-ok" : "") + (bad ? " gap-bad" : "");

    if (task.type === "mcq-cloze") {
      return (
        <span className="gap-wrap" key={"g" + i}>
          <span className="gap-n">{i + 1}</span>
          <select
            className={cls + " gap-select"}
            value={resp[i] ?? ""}
            onChange={(e) => setAnswer(i, e.target.value === "" ? undefined : Number(e.target.value))}
          >
            <option value="">—</option>
            {g.options.map((opt, oi) => (
              <option key={oi} value={oi}>
                {String.fromCharCode(65 + oi)}. {opt}
              </option>
            ))}
          </select>
          {bad && <span className="gap-sol">{g.options[g.correctIndex]}</span>}
        </span>
      );
    }

    // open-cloze y word-formation: input de texto
    return (
      <span className="gap-wrap" key={"g" + i}>
        <span className="gap-n">{i + 1}</span>
        <input
          type="text"
          className={cls + " gap-input"}
          value={resp[i] ?? ""}
          onChange={(e) => setAnswer(i, e.target.value)}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          size={Math.max(6, (g.answers[0] || "").length + 2)}
        />
        {task.type === "word-formation" && <span className="gap-root">{g.root}</span>}
        {bad && <span className="gap-sol">{g.answers[0]}</span>}
      </span>
    );
  }

  const score = checked ? (
    <div className="exam-score">
      <span className="exam-score-num">{correct}/{total}</span>
      <span className="exam-score-pct">{Math.round((correct / total) * 100)}%</span>
    </div>
  ) : null;

  return (
    <div className="cambridge">
      <header className="cambridge-head">
        <h2>Simulacro Cambridge — Use of English</h2>
        <p className="cambridge-sub">
          Practica las cuatro partes de <i>Use of English</i> de los exámenes de Cambridge.
          Elige nivel y parte, responde y corrige al instante.
        </p>
      </header>

      <div className="cambridge-tabs">
        <div className="ct-levels">
          {LEVELS.map((lv) => (
            <button
              key={lv}
              className={"ct-level" + (lv === level ? " active" : "")}
              onClick={() => switchTo(lv, 0)}
            >
              {CAMBRIDGE[lv].label}
            </button>
          ))}
        </div>
        <div className="ct-parts">
          {CAMBRIDGE[level].parts.map((p, i) => (
            <button
              key={i}
              className={"ct-part" + (i === partIndex ? " active" : "")}
              onClick={() => switchTo(level, i)}
            >
              Parte {i + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="exam-task">
        <div className="exam-task-head">
          <span className="exam-part-name">{meta.name}</span>
          <span className="exam-task-title">{task.title}</span>
        </div>
        <p className="exam-instr">{meta.instr}</p>

        {task.type === "transformations" ? (
          <ol className="kwt-list">
            {task.items.map((it, i) => {
              const ok = checked && isGapCorrect(i, it);
              const bad = checked && !isGapCorrect(i, it);
              return (
                <li key={i} className="kwt-item">
                  <p className="kwt-lead">{it.lead}</p>
                  <p className="kwt-key">
                    palabra clave: <b>{it.keyword}</b>
                  </p>
                  <p className="kwt-prompt">
                    {it.before && <span>{it.before} </span>}
                    <input
                      type="text"
                      className={"gap-input kwt-input" + (ok ? " gap-ok" : "") + (bad ? " gap-bad" : "")}
                      value={resp[i] ?? ""}
                      onChange={(e) => setAnswer(i, e.target.value)}
                      autoComplete="off"
                      spellCheck={false}
                      placeholder={`${task.min}–${task.max} palabras`}
                    />
                    {it.after && <span> {it.after}</span>}
                  </p>
                  {checked && (
                    <p className="kwt-model">
                      Respuesta modelo: <b>{it.before ? it.before + " " : ""}{it.model}{it.after ? " " + it.after : ""}</b>
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="exam-passage">
            {splitPassage(task.text).map((seg, idx) =>
              idx % 2 === 1 ? (
                <Fragment key={idx}>{renderGap(Number(seg) - 1)}</Fragment>
              ) : (
                <Fragment key={idx}>{seg}</Fragment>
              )
            )}
          </p>
        )}
      </div>

      <div className="exam-actions">
        <button className="exam-check" onClick={() => setChecked(true)}>
          Comprobar respuestas
        </button>
        <button
          className="exam-reset"
          onClick={() => {
            setResp({});
            setChecked(false);
          }}
        >
          ↺ Vaciar
        </button>
        {score}
      </div>

      {checked && task.type === "transformations" && (
        <p className="exam-note">
          Las transformaciones admiten varias formulaciones válidas: compara tu respuesta con la modelo.
          El marcador solo cuenta las coincidencias exactas más habituales.
        </p>
      )}
    </div>
  );
}
