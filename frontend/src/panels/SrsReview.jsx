import { useMemo, useState } from "react";
import { VOCAB } from "../data/vocab";
import { loadSrs, saveSrs, buildSession, rate, stats } from "../srs";
import SpeakButton from "../components/SpeakButton";

// Repaso espaciado (SRS) con gamificación. Muestra el español, el alumno
// intenta producir el inglés y lo comprueba al voltear; valora la tarjeta
// (otra vez / bien / fácil) y el algoritmo programa el próximo repaso.
export default function SrsReview() {
  const byId = useMemo(() => {
    const m = {};
    for (const c of VOCAB) m[c.id] = c;
    return m;
  }, []);

  const [srs, setSrs] = useState(loadSrs);
  const [queue, setQueue] = useState(() => buildSession(VOCAB, loadSrs()));
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0); // repasos en esta sesión

  const st = stats(VOCAB, srs);
  const current = queue[0];
  const card = current ? byId[current] : null;

  function doRate(grade) {
    const next = rate(srs, current, grade);
    saveSrs(next);
    setSrs(next);
    setDone((d) => d + 1);
    setFlipped(false);
    setQueue((q) => (grade === "again" ? [...q.slice(1), q[0]] : q.slice(1)));
  }

  // Estudiar aunque no haya tarjetas vencidas: coge hasta 10 no dominadas.
  function studyAhead() {
    const ids = VOCAB.filter((c) => {
      const s = srs.cards[c.id];
      return !s || s.interval < 21;
    })
      .slice(0, 10)
      .map((c) => c.id);
    setQueue(ids);
    setFlipped(false);
  }

  function restartSession() {
    const fresh = loadSrs();
    setSrs(fresh);
    setQueue(buildSession(VOCAB, fresh));
    setDone(0);
    setFlipped(false);
  }

  const goalPct = Math.min(100, Math.round((st.reviewsToday / st.goal) * 100));

  return (
    <div className="srs">
      <header className="srs-head panel-hero">
        <span className="panel-kicker">Repaso espaciado · Gamificado</span>
        <h2>Repaso diario</h2>
        <p className="srs-sub">
          Repaso espaciado: ves el español, intentas decir el inglés y compruebas. El sistema te
          vuelve a mostrar cada frase justo cuando estás a punto de olvidarla.
        </p>
      </header>

      <div className="srs-stats">
        <div className="srs-stat srs-streak" title="Racha de días seguidos">
          <span className="srs-stat-big">🔥 {st.streak}</span>
          <span className="srs-stat-label">racha</span>
        </div>
        <div className="srs-stat" title="Nivel y puntos">
          <span className="srs-stat-big">Nv {st.level}</span>
          <span className="srs-stat-label">{st.xp} XP</span>
        </div>
        <div className="srs-stat srs-goal">
          <span className="srs-stat-big">{st.reviewsToday}/{st.goal}</span>
          <span className="srs-stat-label">meta de hoy</span>
          <span className="srs-goal-bar">
            <span className="srs-goal-fill" style={{ width: goalPct + "%" }} />
          </span>
        </div>
      </div>

      <div className="srs-counts">
        <span className="srs-count"><b>{st.due}</b> para repasar</span>
        <span className="srs-count"><b>{st.newAvail}</b> nuevas hoy</span>
        <span className="srs-count"><b>{st.mastered}</b> dominadas</span>
        <span className="srs-count srs-count-muted">{st.total} en total</span>
      </div>

      {card ? (
        <div className="srs-card">
          <div className="srs-theme">{card.theme}</div>
          <div className="srs-front">{card.es}</div>

          {flipped ? (
            <>
              <div className="srs-divider" />
              <div className="srs-back">
                <span className="srs-en">{card.en}</span>
                <SpeakButton text={card.en} title="Escuchar" />
              </div>
              {card.hint && <div className="srs-hint">💡 {card.hint}</div>}
              <div className="srs-rate">
                <button className="srs-btn srs-again" onClick={() => doRate("again")}>
                  Otra vez
                </button>
                <button className="srs-btn srs-good" onClick={() => doRate("good")}>
                  Bien
                </button>
                <button className="srs-btn srs-easy" onClick={() => doRate("easy")}>
                  Fácil
                </button>
              </div>
            </>
          ) : (
            <button className="srs-show" onClick={() => setFlipped(true)}>
              Mostrar respuesta
            </button>
          )}
        </div>
      ) : (
        <div className="srs-done">
          {done > 0 ? (
            <>
              <div className="srs-done-emoji">✅</div>
              <h3>¡Sesión completada!</h3>
              <p>
                Has repasado <b>{done}</b> {done === 1 ? "tarjeta" : "tarjetas"}.
                {st.streak > 1 && <> Racha de <b>{st.streak}</b> días. 🔥</>}
              </p>
            </>
          ) : (
            <>
              <div className="srs-done-emoji">🎉</div>
              <h3>Nada pendiente por ahora</h3>
              <p>No hay tarjetas vencidas. Puedes adelantar repaso si te apetece seguir.</p>
            </>
          )}
          <div className="srs-done-actions">
            <button className="srs-show" onClick={studyAhead}>
              Adelantar repaso (10)
            </button>
            {done > 0 && (
              <button className="srs-reset-btn" onClick={restartSession}>
                ↺ Nueva sesión
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
