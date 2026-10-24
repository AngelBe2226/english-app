import { useMemo } from "react";
import { useProgress } from "../progress";
import { VOCAB } from "../data/vocab";
import { ROUTES } from "../data/placement";
import { loadSrs, stats, earnedBadges } from "../srs";
import SpeakButton from "../components/SpeakButton";

export const LAST_BLOCK_KEY = "english-app-last-block";

function readJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function readStr(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function greeting(h) {
  if (h >= 6 && h < 13) return "Buenos días";
  if (h >= 13 && h < 21) return "Buenas tardes";
  return "Buenas noches";
}

// Página de inicio: el "mostrador de embarque" de la app. Saludo, continuar
// donde lo dejaste, repaso de hoy, nivel, frase del día y accesos a la práctica.
export default function HomePage({ index, onSelectBlock }) {
  const { progress } = useProgress();
  const now = new Date();

  const titleOf = useMemo(() => {
    const m = {};
    for (const b of index || []) m[b.block] = b;
    return m;
  }, [index]);

  // Respuestas de quiz por bloque (claves bNN-sMqK).
  const answeredByBlock = useMemo(() => {
    const out = {};
    for (const k of Object.keys(progress || {})) {
      const m = /^b(\d{2})-s\d+q\d+$/.exec(k);
      if (m) out[m[1]] = (out[m[1]] || 0) + 1;
    }
    return out;
  }, [progress]);
  const totalAnswered = Object.values(answeredByBlock).reduce((a, b) => a + b, 0);
  const blocksStarted = Object.keys(answeredByBlock).length;

  const srs = stats(VOCAB, loadSrs());
  const badgesEarned = earnedBadges(srs).filter((b) => b.earned).length;
  const placement = readJSON("english-app-placement");

  const last = readStr(LAST_BLOCK_KEY);
  const lastBlock = last && titleOf[last] ? titleOf[last] : null;
  // Sin historial: proponer el primer bloque de la ruta del test (o el 01).
  const suggested =
    (placement && ROUTES[placement.routeKey]?.blocks?.[0]?.block) || "01";
  const target = lastBlock || titleOf[suggested] || null;

  // Frase del día: misma frase durante todo el día.
  const dayNum = Math.floor(now.getTime() / 86400000);
  const phrase = VOCAB[dayNum % VOCAB.length];

  const dateLabel = now
    .toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })
    .replace(/\./g, "")
    .toUpperCase();

  return (
    <div className="home">
      <header className="home-hero panel-hero">
        <span className="panel-kicker">Hoy · {dateLabel}</span>
        <h2>{greeting(now.getHours())}</h2>
        <p className="home-lead">¿A qué destino del inglés viajamos hoy?</p>
      </header>

      {target && (
        <button className="ticket home-continue" onClick={() => onSelectBlock(target.block)}>
          <div className="ticket-main">
            <div className="block-kicker">
              {lastBlock ? "Próximo embarque · continúa" : "Primer embarque · empieza aquí"}
            </div>
            <h3 className="home-continue-title">{target.title}</h3>
            <p className="home-continue-sub">
              {lastBlock
                ? "Retoma donde lo dejaste."
                : placement
                ? "El primer destino de tu ruta recomendada."
                : "Un buen punto de partida. Luego haz el test de nivel."}
            </p>
          </div>
          <dl className="ticket-stub">
            <div>
              <dt>Bloque</dt>
              <dd>{target.block}</dd>
            </div>
            <div>
              <dt>Secciones</dt>
              <dd>{target.sectionCount}</dd>
            </div>
            <div>
              <dt>Respondidas</dt>
              <dd>{answeredByBlock[target.block] || 0}</dd>
            </div>
            <div className="home-board">
              <dt>Puerta</dt>
              <dd>Embarcar →</dd>
            </div>
          </dl>
        </button>
      )}

      <div className="home-grid">
        <section className="home-card">
          <span className="home-card-tag">Repaso de hoy</span>
          <div className="home-srs-row">
            <span className="home-big">🔥 {srs.streak}</span>
            <span className="home-muted">{srs.streak === 1 ? "día de racha" : "días de racha"}</span>
          </div>
          <p className="home-muted">
            {srs.due + srs.newAvail > 0
              ? `${srs.due} para repasar · ${srs.newAvail} nuevas`
              : "Todo al día. ¡Bien hecho!"}
          </p>
          <button className="srs-show home-cta" onClick={() => onSelectBlock("srs")}>
            Repasar ahora
          </button>
        </section>

        <section className="home-card home-level">
          <span className="home-card-tag">Tu visado</span>
          {placement ? (
            <>
              <span className="placement-level home-visa">{placement.level}</span>
              <button className="home-link" onClick={() => onSelectBlock("placement")}>
                Ver tu ruta →
              </button>
            </>
          ) : (
            <>
              <p className="home-muted">Aún no tienes nivel. Descubre el tuyo en 5 minutos.</p>
              <button className="srs-show home-cta" onClick={() => onSelectBlock("placement")}>
                Hacer el test
              </button>
            </>
          )}
        </section>

        <section className="note note-tip home-phrase">
          <span className="note-tag">frase del día</span>
          <p className="home-phrase-es">{phrase.es}</p>
          <p className="home-phrase-en">
            <span className="hl">{phrase.en}</span>
            <SpeakButton text={phrase.en} title="Escuchar la frase" />
          </p>
        </section>
      </div>

      <dl className="home-stats">
        <div>
          <dt>Preguntas respondidas</dt>
          <dd>{totalAnswered}</dd>
        </div>
        <div>
          <dt>Bloques empezados</dt>
          <dd>
            {blocksStarted}/{(index || []).length}
          </dd>
        </div>
        <div>
          <dt>Sellos</dt>
          <dd>
            {badgesEarned}/{earnedBadges(srs).length}
          </dd>
        </div>
        <div>
          <dt>Nivel XP</dt>
          <dd>{srs.level}</dd>
        </div>
      </dl>

      <div className="home-tools">
        <button className="home-tool" onClick={() => onSelectBlock("placement")}>
          <span className="home-tool-name">Test de nivel</span>
          <span className="home-tool-desc">Sitúate de A1 a C1 y recibe tu ruta.</span>
        </button>
        <button className="home-tool" onClick={() => onSelectBlock("cambridge")}>
          <span className="home-tool-name">Simulacro Cambridge</span>
          <span className="home-tool-desc">Use of English B2 y C1, autocorregido.</span>
        </button>
        <button className="home-tool" onClick={() => onSelectBlock("highlights")}>
          <span className="home-tool-name">Destacados</span>
          <span className="home-tool-desc">Las frases y reglas que guardaste.</span>
        </button>
      </div>
    </div>
  );
}
