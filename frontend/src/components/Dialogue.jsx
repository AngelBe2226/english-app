import { useState } from "react";
import RichText from "./RichText";
import HighlightButton from "./HighlightButton";

// A conversation block for thematic units. Renders speaker turns (English +
// optional Spanish gloss) and offers a role-play mode: pick a speaker and
// their lines hide behind a "your turn" button so you try to produce the
// phrase before revealing it. Pure local state — no backend needed.
export default function Dialogue({ dialogue, title, hlId }) {
  const turns = dialogue || [];
  const speakers = [...new Set(turns.map((t) => t.speaker))];
  const [hideRole, setHideRole] = useState(null);
  const [revealed, setRevealed] = useState({});

  function pickRole(sp) {
    setHideRole((cur) => (cur === sp ? null : sp));
    setRevealed({});
  }

  return (
    <div className="dialogue">
      <div className="dialogue-head">
        <span className="dialogue-tag">diálogo</span>
        {hlId && <HighlightButton id={hlId} label="diálogo destacado" />}
        {title && <span className="dialogue-title">{title}</span>}
      </div>

      {speakers.length > 1 && (
        <div className="roleplay-bar">
          <span className="rp-label">Role-play — practica un papel:</span>
          {speakers.map((sp) => (
            <button
              key={sp}
              className={"rp-btn" + (hideRole === sp ? " active" : "")}
              onClick={() => pickRole(sp)}
            >
              {sp}
            </button>
          ))}
          {hideRole && (
            <button
              className="rp-btn rp-off"
              onClick={() => {
                setHideRole(null);
                setRevealed({});
              }}
            >
              ver todo
            </button>
          )}
        </div>
      )}

      <ol className="dlg-turns">
        {turns.map((t, i) => {
          const mine = hideRole === t.speaker;
          const hidden = mine && !revealed[i];
          return (
            <li key={i} className={"dlg-turn" + (mine ? " dlg-mine" : "")}>
              <span className="dlg-speaker">{t.speaker}</span>
              <span className="dlg-body">
                {hidden ? (
                  <button
                    className="dlg-reveal"
                    onClick={() => setRevealed((r) => ({ ...r, [i]: true }))}
                  >
                    · · · tu turno — pulsa para ver la frase
                  </button>
                ) : (
                  <>
                    <RichText className="dlg-en" html={t.en} />
                    {t.es && <span className="dlg-es">{t.es}</span>}
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
