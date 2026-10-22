import { useMemo, useState } from "react";
import { QUESTIONS, BANDS, ROUTES, scorePlacement } from "../data/placement";

const STORE_KEY = "english-app-placement";

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function save(result) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(result));
  } catch {
    /* modo privado: no se guarda, no pasa nada */
  }
}

// Test de nivel: diagnóstico CEFR + ruta recomendada. Si ya hay un resultado
// guardado, lo muestra directamente con opción de rehacer. Todo offline.
export default function PlacementTest({ index, onSelectBlock, onGoToSection }) {
  const [saved, setSaved] = useState(loadSaved);
  const [taking, setTaking] = useState(false);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [warn, setWarn] = useState(false);

  const titleOf = useMemo(() => {
    const m = {};
    for (const b of index || []) m[b.block] = b.title;
    return (id) => m[id] || `Bloque ${id}`;
  }, [index]);

  const answeredCount = Object.keys(answers).length;

  function choose(qid, i) {
    setAnswers((a) => ({ ...a, [qid]: i }));
  }

  function submit() {
    if (answeredCount < QUESTIONS.length) {
      setWarn(true);
      const firstUn = QUESTIONS.find((q) => answers[q.id] === undefined);
      if (firstUn) {
        const el = document.getElementById("pq-" + firstUn.id);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    const r = scorePlacement(answers);
    const stored = {
      level: r.level,
      routeKey: r.routeKey,
      recommendedStart: r.recommendedStart,
      correct: r.correct,
      total: r.total,
      date: new Date().toISOString(),
    };
    setResult(r);
    setSaved(stored);
    save(stored);
    setTaking(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startNew() {
    setAnswers({});
    setResult(null);
    setWarn(false);
    setTaking(true);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  // Datos para mostrar el resultado (recién hecho o guardado).
  const shown = result
    ? { level: result.level, routeKey: result.routeKey, recommendedStart: result.recommendedStart, correct: result.correct, total: result.total, bandScore: result.bandScore }
    : saved
    ? { level: saved.level, routeKey: saved.routeKey, recommendedStart: saved.recommendedStart, correct: saved.correct, total: saved.total, bandScore: null, date: saved.date }
    : null;

  // ---------- Pantalla de resultado / inicio ----------
  if (!taking) {
    return (
      <div className="placement">
        <header className="placement-head panel-hero">
          <span className="panel-kicker">Diagnóstico · CEFR A1–C1</span>
          <h2>Test de nivel</h2>
          <p className="placement-sub">
            Un diagnóstico rápido (25 preguntas, A1→C1) que te sitúa en el Marco Común Europeo
            y te propone por dónde seguir. Sin cronómetro: elige la opción que te suene mejor.
          </p>
        </header>

        {shown ? (
          <ResultCard shown={shown} titleOf={titleOf} onSelectBlock={onSelectBlock} onGoToSection={onGoToSection} />
        ) : (
          <div className="placement-cta">
            <p>¿Listo? El test tarda unos 5 minutos.</p>
          </div>
        )}

        <div className="placement-actions">
          <button className="placement-start" onClick={startNew}>
            {shown ? "↺ Rehacer el test" : "Empezar el test"}
          </button>
        </div>
      </div>
    );
  }

  // ---------- Pantalla del test ----------
  let currentBand = null;
  return (
    <div className="placement">
      <header className="placement-head panel-hero">
        <span className="panel-kicker">Diagnóstico · CEFR A1–C1</span>
        <h2>Test de nivel</h2>
        <p className="placement-sub">
          Responde las 25 preguntas y pulsa «Ver mi nivel». {answeredCount}/{QUESTIONS.length} respondidas.
        </p>
      </header>

      <ol className="pq-list">
        {QUESTIONS.map((qq, i) => {
          const showBand = qq.band !== currentBand;
          currentBand = qq.band;
          const missing = warn && answers[qq.id] === undefined;
          return (
            <li key={qq.id} id={"pq-" + qq.id} className={"pq" + (missing ? " pq-missing" : "")}>
              {showBand && <div className="pq-band">Nivel {qq.band}</div>}
              <p className="pq-q">
                <span className="pq-n">{i + 1}.</span> {qq.q}
              </p>
              <div className="pq-opts">
                {qq.options.map((opt, oi) => (
                  <button
                    key={oi}
                    className={"pq-opt" + (answers[qq.id] === oi ? " chosen" : "")}
                    onClick={() => choose(qq.id, oi)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ol>

      {warn && answeredCount < QUESTIONS.length && (
        <p className="pq-warn">Faltan {QUESTIONS.length - answeredCount} preguntas por responder.</p>
      )}
      <div className="placement-actions">
        <button className="placement-start" onClick={submit}>
          Ver mi nivel
        </button>
      </div>
    </div>
  );
}

function ResultCard({ shown, titleOf, onSelectBlock, onGoToSection }) {
  const route = ROUTES[shown.routeKey] || ROUTES.A1;
  const pct = shown.total ? Math.round((shown.correct / shown.total) * 100) : 0;

  return (
    <div className="placement-result">
      <div className="placement-levelcard">
        <span className="placement-level-tag">Tu nivel estimado</span>
        <span className="placement-level">{shown.level}</span>
        <span className="placement-score">
          {shown.correct}/{shown.total} aciertos · {pct}%
        </span>
      </div>

      {shown.bandScore && (
        <div className="placement-bands">
          {BANDS.map((b) => {
            const bs = shown.bandScore[b];
            const p = bs.total ? Math.round((bs.correct / bs.total) * 100) : 0;
            const ok = p >= 60;
            return (
              <div key={b} className="placement-band">
                <span className="pb-label">{b}</span>
                <span className="pb-bar">
                  <span className={"pb-fill" + (ok ? " ok" : "")} style={{ width: p + "%" }} />
                </span>
                <span className="pb-pct">{bs.correct}/{bs.total}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="placement-route">
        <h3>Tu ruta recomendada</h3>
        <p className="placement-route-tip">{route.tip}</p>
        <ol className="placement-route-list">
          {route.blocks.map((rb) => (
            <li key={rb.block}>
              <button className="placement-route-block" onClick={() => onSelectBlock(rb.block)}>
                <span className="prb-num">{rb.block}</span>
                <span className="prb-title">{titleOf(rb.block)}</span>
                <span className="prb-why">{rb.why}</span>
              </button>
            </li>
          ))}
        </ol>
        <p className="placement-focus">
          Punto de partida sugerido: céntrate primero en el nivel <b>{shown.recommendedStart}</b>.
        </p>
      </div>
    </div>
  );
}
