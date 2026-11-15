import { useEffect, useMemo, useState } from "react";
import { useLexicon } from "../lexiconStore";
import { verbParts } from "../data/lexicon/inflect";
import { TENSES, PASSIVE_TENSES, conjugateTense, otherForms } from "../data/lexicon/conjugate";
import SpeakButton from "../components/SpeakButton";
import { LoadingSkeleton } from "../components/StateViews";

// Anexo de verbos: busca o elige un verbo y ve su conjugación completa en
// todos los tiempos y modos (afirmativa, negativa, pregunta; activa y
// pasiva), con un ejemplo por tiempo. Un verbo que no esté en la lista se
// puede conjugar igualmente con las reglas de los regulares.
const FILTERS = [
  ["all", "Todos"],
  ["irr", "Irregulares"],
  ["reg", "Regulares"],
  ["mod", "Modales"],
];
const MODES = [
  ["aff", "Afirmativa"],
  ["neg", "Negativa"],
  ["q", "Pregunta"],
];

// Los modales no se conjugan: tienen una sola forma y equivalentes para los
// tiempos que les faltan.
const MODALS = [
  { base: "can", es: "poder; saber hacer algo", neg: "can't / cannot", past: "could", other: "be able to (will be able to, have been able to)", ex: "She can speak three languages." },
  { base: "could", es: "podía, podría; pude", neg: "couldn't", past: "could have + participio", other: "pasado de can y forma cortés", ex: "Could you call a taxi for me?" },
  { base: "may", es: "poder (permiso formal, posibilidad)", neg: "may not", past: "may have + participio", other: "be allowed to", ex: "May I see your passport, please?" },
  { base: "might", es: "podría, quizás", neg: "might not", past: "might have + participio", other: "posibilidad más remota que may", ex: "We might need an extra bed." },
  { base: "must", es: "deber, tener que; deducción segura", neg: "mustn't (prohibición)", past: "had to (obligación) · must have + participio (deducción)", other: "have to", ex: "Guests must check out by noon." },
  { base: "shall", es: "ofrecimientos y sugerencias", neg: "shan't (raro)", past: "—", other: "sobre todo en preguntas con I / we", ex: "Shall I carry your bags?" },
  { base: "should", es: "debería (consejo)", neg: "shouldn't", past: "should have + participio", other: "ought to", ex: "You should book the table in advance." },
  { base: "will", es: "futuro; decisiones y promesas", neg: "won't", past: "would", other: "be going to", ex: "I'll send you the invoice today." },
  { base: "would", es: "condicional; cortesía", neg: "wouldn't", past: "would have + participio", other: "used to (hábitos pasados)", ex: "Would you like a window seat?" },
  { base: "ought to", es: "debería (más formal)", neg: "ought not to", past: "ought to have + participio", other: "should", ex: "You ought to apologise to the guest." },
];

const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export default function VerbsPanel({ initialVerb }) {
  const lex = useLexicon();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(initialVerb || null);
  const [mode, setMode] = useState("aff");
  const [passive, setPassive] = useState(false);

  useEffect(() => {
    if (initialVerb) {
      setSelected(initialVerb);
      setPassive(false);
    }
  }, [initialVerb]);

  const all = useMemo(() => (lex ? [...lex.verbs.values()].sort((a, b) => a.base.localeCompare(b.base)) : []), [lex]);
  const irregularCount = useMemo(() => all.filter((v) => v.parts.irregular).length, [all]);

  const results = useMemo(() => {
    if (filter === "mod") return [];
    const q = norm(query);
    let list = all;
    if (filter === "irr") list = list.filter((v) => v.parts.irregular);
    if (filter === "reg") list = list.filter((v) => !v.parts.irregular);
    if (!q) return list;
    const starts = list.filter((v) => v.base.startsWith(q));
    const forms = list.filter(
      (v) => !v.base.startsWith(q) && [v.parts.s3, v.parts.ing, ...v.parts.past, ...v.parts.pp].includes(q)
    );
    const meaning = list.filter((v) => !v.base.startsWith(q) && !forms.includes(v) && norm(v.es).includes(q));
    return [...starts, ...forms, ...meaning];
  }, [all, query, filter]);

  const verb = useMemo(() => {
    if (!selected || !lex) return null;
    if (lex.verbs.has(selected)) return lex.verbs.get(selected);
    return { base: selected, es: "", parts: verbParts(selected), tail: "", flags: "", guessed: true };
  }, [selected, lex]);
  const modal = MODALS.find((m) => m.base === selected);

  const q = norm(query);
  const canGuess = /^[a-z]{2,}$/.test(q) && lex && !lex.verbs.has(q) && filter !== "mod";

  function pick(base) {
    setSelected(base);
    setPassive(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  if (!lex) return <LoadingSkeleton />;

  return (
    <div className={"verbs" + (selected ? " has-selection" : "")}>
      <header className="panel-hero verbs-hero">
        <span className="panel-kicker">Anexo · Conjugación</span>
        <h2>Verbos</h2>
        <p className="verbs-lead">
          {all.length.toLocaleString("es-ES")} verbos ({irregularCount} irregulares) con su conjugación
          completa: todos los tiempos y modos, en afirmativa, negativa y pregunta, voz activa y pasiva, y un
          ejemplo para cada tiempo. Si buscas uno que no está, se conjuga con las reglas de los regulares.
        </p>
      </header>

      <div className="verbs-layout">
        <aside className="verbs-index" aria-label="Lista de verbos">
          <label className="verbs-search">
            <span className="sr-only">Buscar verbo</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busca: go, went, reservar…"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </label>
          <div className="verbs-filters" role="tablist" aria-label="Filtrar verbos">
            {FILTERS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={filter === id}
                className={"verbs-filter" + (filter === id ? " active" : "")}
                onClick={() => setFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>
          {canGuess && (
            <button type="button" className="verbs-guess" onClick={() => pick(q)}>
              Conjugar «{q}» con las reglas de los regulares
            </button>
          )}
          <ul className="verbs-list">
            {filter === "mod"
              ? MODALS.map((m) => (
                  <li key={m.base}>
                    <button type="button" className={"verbs-item" + (selected === m.base ? " current" : "")} onClick={() => pick(m.base)}>
                      <b>{m.base}</b>
                      <span>{m.es}</span>
                    </button>
                  </li>
                ))
              : results.slice(0, 400).map((v) => (
                  <li key={v.base}>
                    <button type="button" className={"verbs-item" + (selected === v.base ? " current" : "")} onClick={() => pick(v.base)}>
                      <b>{v.base}</b>
                      {v.parts.irregular && <i className="verbs-irr">irr.</i>}
                      <span>{v.es}</span>
                    </button>
                  </li>
                ))}
          </ul>
          {filter !== "mod" && results.length > 400 && (
            <p className="verbs-more">Mostrando 400 de {results.length}. Escribe para filtrar.</p>
          )}
          {filter !== "mod" && !results.length && !canGuess && <p className="verbs-more">No hay verbos con esa búsqueda.</p>}
        </aside>

        <section className="verbs-detail" aria-live="polite">
          {selected && (
            <button type="button" className="verbs-back" onClick={() => setSelected(null)}>
              ← Todos los verbos
            </button>
          )}
          {modal ? (
            <ModalCard m={modal} />
          ) : verb ? (
            <VerbDetail verb={verb} mode={mode} setMode={setMode} passive={passive} setPassive={setPassive} />
          ) : (
            <div className="verbs-empty">
              <p>Elige un verbo de la lista o búscalo por su forma en inglés o por su significado en español.</p>
              <div className="verbs-picks">
                {["be", "have", "do", "go", "get", "make", "take", "book", "check", "offer"].map((b) => (
                  <button key={b} type="button" className="verbs-pick" onClick={() => pick(b)}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function VerbDetail({ verb, mode, setMode, passive, setPassive }) {
  const V = verb.parts;
  const transitive = verb.flags.includes("t") || verb.guessed;
  const stative = verb.flags.includes("s");
  const voice = passive && transitive;
  let n = 0;
  return (
    <article className="verb-sheet">
      <header className="verb-head ticket">
        <div className="ticket-main">
          <div className="verb-title">
            <h3>to {V.base}</h3>
            <SpeakButton text={V.base} title={`Escuchar «${V.base}»`} />
          </div>
          {verb.es ? <p className="verb-es">{verb.es}</p> : <p className="verb-es verb-guessed">No está en la lista: conjugado con las reglas de los verbos regulares. Comprueba que existe y que es regular.</p>}
          <div className="verb-chips">
            <span className={"wt-chip" + (V.irregular ? " irr" : "")}>{V.irregular ? "irregular" : "regular"}</span>
            {verb.flags.includes("t") && <span className="wt-chip">transitivo</span>}
            {stative && <span className="wt-chip">verbo de estado</span>}
          </div>
        </div>
        <dl className="ticket-stub verb-parts">
          <div><dt>Pasado</dt><dd>{V.past.join(" / ")}</dd></div>
          <div><dt>Participio</dt><dd>{V.pp.join(" / ")}</dd></div>
          <div><dt>-ing</dt><dd>{V.ing}</dd></div>
          <div><dt>3ª persona</dt><dd>{V.s3}</dd></div>
        </dl>
      </header>

      <div className="verb-controls">
        <div className="seg" role="tablist" aria-label="Tipo de frase">
          {MODES.map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={mode === id} className={"seg-btn" + (mode === id ? " active" : "")} onClick={() => setMode(id)}>
              {label}
            </button>
          ))}
        </div>
        {transitive && (
          <div className="seg" role="tablist" aria-label="Voz">
            <button type="button" role="tab" aria-selected={!voice} className={"seg-btn" + (!voice ? " active" : "")} onClick={() => setPassive(false)}>
              Activa
            </button>
            <button type="button" role="tab" aria-selected={voice} className={"seg-btn" + (voice ? " active" : "")} onClick={() => setPassive(true)}>
              Pasiva
            </button>
          </div>
        )}
      </div>
      {stative && !voice && (
        <p className="verb-note">
          Verbo de estado: en los tiempos continuos casi no se usa (salvo con otro significado), así que esos
          tiempos no llevan ejemplo.
        </p>
      )}

      {TENSES.map((g) => {
        const items = g.items.filter((t) => !voice || PASSIVE_TENSES.includes(t.id));
        if (!items.length) return null;
        return (
          <section key={g.group} className="tense-group">
            <h4 className="tense-group-title">{g.group}</h4>
            <div className="tense-grid">
              {items.map((t) => {
                const c = conjugateTense(V, t.id, { mode, passive: voice, tail: verb.tail, index: n++, stative });
                return <TenseCard key={t.id} t={t} c={c} />;
              })}
            </div>
          </section>
        );
      })}

      <section className="tense-group">
        <h4 className="tense-group-title">Subjuntivo, imperativo y formas no personales</h4>
        <div className="tense-grid">
          {otherForms(V, { passive: voice, tail: verb.tail }).map((o) => (
            <div key={o.id} className="tense-card">
              <div className="tense-name">
                <b>{o.es}</b>
                <span>{o.en}</span>
              </div>
              <p className="tense-use">{o.use}</p>
              <table className="tense-table">
                <tbody>
                  {o.rows.map(([k, v]) => (
                    <tr key={k}>
                      <th scope="row">{k}</th>
                      <td>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Example text={o.example} />
            </div>
          ))}
        </div>
      </section>
      {voice && (
        <p className="verb-note">
          En pasiva no se incluyen los tiempos perfectos continuos ni los continuos del futuro y del condicional:
          existen en teoría, pero casi no se usan.
        </p>
      )}
    </article>
  );
}

function TenseCard({ t, c }) {
  return (
    <div className="tense-card">
      <div className="tense-name">
        <b>{t.es}</b>
        <span>{t.en}</span>
      </div>
      <p className="tense-use">{t.use}</p>
      <table className="tense-table">
        <tbody>
          {c.rows.map((r, i) => (
            <tr key={i}>
              <th scope="row">{r.person}</th>
              <td>{r.text.replace(/^(I|you|he \/ she \/ it|we|they) /, "")}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {c.example ? <Example text={c.example} /> : <p className="tense-ex tense-ex-none">Sin ejemplo: no se usa en continuo.</p>}
    </div>
  );
}

function Example({ text }) {
  return (
    <p className="tense-ex">
      <span>{text}</span>
      <SpeakButton text={text} title="Escuchar el ejemplo" />
    </p>
  );
}

function ModalCard({ m }) {
  return (
    <article className="verb-sheet">
      <header className="verb-head ticket">
        <div className="ticket-main">
          <div className="verb-title">
            <h3>{m.base}</h3>
            <SpeakButton text={m.base} title={`Escuchar «${m.base}»`} />
          </div>
          <p className="verb-es">{m.es}</p>
          <div className="verb-chips">
            <span className="wt-chip irr">modal</span>
          </div>
        </div>
      </header>
      <p className="verb-note">
        Los verbos modales no se conjugan: la misma forma para todas las personas (sin -s), seguidos de
        infinitivo sin <i>to</i>, y negativa y pregunta sin <i>do</i>.
      </p>
      <div className="tense-grid">
        <div className="tense-card">
          <div className="tense-name"><b>Formas</b><span>Forms</span></div>
          <table className="tense-table">
            <tbody>
              <tr><th scope="row">afirmativa</th><td>I / she / they {m.base} work</td></tr>
              <tr><th scope="row">negativa</th><td>I / she / they {m.neg} work</td></tr>
              <tr><th scope="row">pregunta</th><td>{m.base === "ought to" ? "Ought I to work?" : `${m.base.charAt(0).toUpperCase() + m.base.slice(1)} I / she / they work?`}</td></tr>
              <tr><th scope="row">pasado / perfecto</th><td>{m.past}</td></tr>
              <tr><th scope="row">equivalente</th><td>{m.other}</td></tr>
            </tbody>
          </table>
          <Example text={m.ex} />
        </div>
      </div>
    </article>
  );
}
