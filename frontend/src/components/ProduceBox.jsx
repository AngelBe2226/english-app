import { useEffect, useState } from "react";
import RichText from "./RichText";
import { useProgress } from "../progress";
import HighlightButton from "./HighlightButton";

// "Write your own sentence" box. Saves the textarea contents under its id.
// For guided writing tasks it also shows an optional self-check rubric
// (produce.rubric: string[]) and a revealable model answer (produce.model).
export default function ProduceBox({ produce }) {
  const { getVal, setVal } = useProgress();
  const saved = getVal(produce.id) || "";
  const [text, setText] = useState(saved);
  const [note, setNote] = useState(saved ? "✓ guardado" : "");
  const [checked, setChecked] = useState({});
  const [showModel, setShowModel] = useState(false);

  // Keep local text in sync when the saved value arrives after first render.
  useEffect(() => {
    setText(saved);
    setNote(saved ? "✓ guardado" : "");
    setChecked({});
    setShowModel(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [produce.id]);

  function save() {
    setVal(produce.id, text);
    setNote("✓ guardado");
    setTimeout(() => setNote((n) => (n === "✓ guardado" ? "" : n)), 2500);
  }

  return (
    <div className="produce" data-pid={produce.id}>
      <HighlightButton id={`hl:${produce.id}`} label="frase destacada" />
      <RichText as="label" className="produce-label" html={produce.label} />
      <textarea
        value={text}
        placeholder={produce.placeholder}
        onChange={(e) => {
          setText(e.target.value);
          setNote("");
        }}
      />
      <div className="produce-actions">
        <button className="save" onClick={save}>
          Guardar
        </button>
        {produce.model && (
          <button className="model-btn" onClick={() => setShowModel((s) => !s)}>
            {showModel ? "Ocultar modelo" : "Ver ejemplo modelo"}
          </button>
        )}
        <span className="saved-note">{note}</span>
      </div>

      {produce.rubric?.length > 0 && (
        <div className="produce-rubric">
          <span className="rubric-tag">revisa tu respuesta</span>
          <ul>
            {produce.rubric.map((item, i) => (
              <li key={i}>
                <label>
                  <input
                    type="checkbox"
                    checked={!!checked[i]}
                    onChange={() => setChecked((c) => ({ ...c, [i]: !c[i] }))}
                  />
                  <RichText html={item} />
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      {produce.model && showModel && (
        <div className="produce-model">
          <span className="model-tag">ejemplo modelo</span>
          <RichText as="div" className="model-body" html={produce.model} />
        </div>
      )}
    </div>
  );
}
