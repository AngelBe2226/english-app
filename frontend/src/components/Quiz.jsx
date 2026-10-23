import { useState } from "react";
import RichText from "./RichText";
import { useProgress } from "../progress";
import HighlightButton from "./HighlightButton";

// One multiple-choice question. Once answered it locks: the correct option
// turns green, a wrong pick turns red, and the choice is persisted by id.
// `justAnswered` only turns true on a live answer (not on reload), so the
// celebratory animation plays once when you choose — never as a cascade on load.
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

  return (
    <div className="quiz" data-qid={q.id}>
      <HighlightButton id={`hl:${q.id}`} label="quiz destacado" />
      <RichText as="p" className="q-question" html={q.question} />
      <div className="opts">
        {q.options.map((opt, i) => {
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
          {wasRight ? "✓ ¡Correcto!" : "✗ La respuesta correcta está marcada en verde."}
        </div>
      )}
    </div>
  );
}
