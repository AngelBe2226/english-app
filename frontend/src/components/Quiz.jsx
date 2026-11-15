import { useState } from "react";
import RichText from "./RichText";
import { useProgress } from "../progress";
import HighlightButton from "./HighlightButton";
import { displayOrder } from "../order";

// One multiple-choice question. Once answered it locks: the correct option
// turns green, a wrong pick turns red, and the choice is persisted by id.
// `justAnswered` only turns true on a live answer (not on reload), so the
// celebratory animation plays once when you choose — never as a cascade on load.
// Options are shown in a stable shuffled order; `q.explain[i]` is the short
// explanation of option i (right or wrong), listed once the question locks.
export default function Quiz({ q }) {
  const { getVal, setVal } = useProgress();
  const [justAnswered, setJustAnswered] = useState(false);
  const saved = getVal(q.id);
  const chosen = saved === null ? null : parseInt(saved, 10);
  const answered = chosen !== null;

  function choose(i) {
    if (answered) return;
    setVal(q.id, String(i));
    setJustAnswered(true);
  }

  const wasRight = answered && chosen === q.correctIndex;
  const live = justAnswered ? " just" : "";
  const order = displayOrder(q.id, q.options.length);

  return (
    <div className="quiz" data-qid={q.id}>
      <HighlightButton id={`hl:${q.id}`} label="quiz destacado" />
      <RichText as="p" className="q-question" html={q.question} />
      <div className="opts">
        {order.map((i) => {
          const opt = q.options[i];
          const isCorrect = i === q.correctIndex;
          let cls = "";
          if (answered && isCorrect) cls = "correct" + live;
          else if (answered && i === chosen) cls = "wrong" + live;
          return (
            <button key={i} className={cls} disabled={answered} onClick={() => choose(i)}>
              {opt}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className={"fb show " + (wasRight ? "ok" : "no") + live}>
          <p className="fb-head">
            {wasRight ? "✓ ¡Correcto!" : "✗ No es esa. La correcta está marcada en verde."}
          </p>
          {q.explain && <Explanations options={q.options} explain={q.explain} order={order} correct={q.correctIndex} chosen={chosen} />}
        </div>
      )}
    </div>
  );
}

// Lista de explicaciones breves, una por opción, marcando cuál es la correcta
// y cuál eligió la persona. También la usan el simulacro y el test de nivel.
export function Explanations({ options, explain, order, correct, chosen }) {
  const idx = order || options.map((_, i) => i);
  return (
    <ul className="why-list">
      {idx.map((i) =>
        explain[i] ? (
          <li key={i} className={"why " + (i === correct ? "why-ok" : "why-no") + (i === chosen ? " why-chosen" : "")}>
            <span className="why-mark" aria-hidden="true">{i === correct ? "✓" : "✗"}</span>
            <span>
              <b className="why-opt">{options[i]}</b>
              {i === chosen && <span className="why-tag">tu respuesta</span>} <RichText html={explain[i]} />
            </span>
          </li>
        ) : null
      )}
    </ul>
  );
}
