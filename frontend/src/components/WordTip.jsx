import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { loadLexicon } from "../lexiconStore";
import { plural, degrees } from "../data/lexicon/inflect";
import SpeakButton from "./SpeakButton";

// Ficha de palabra: aparece al pasar el ratón por una palabra subrayada
// (escritorio) o al tocarla (móvil). Muestra el significado y, según el tipo
// de palabra, sus formas: partes del verbo, plural, comparativo…
const POS = {
  v: "verbo",
  n: "sustantivo",
  nu: "sustantivo incontable",
  adj: "adjetivo",
  adv: "adverbio",
  prep: "preposición",
  conj: "conjunción",
  pron: "pronombre",
  det: "determinante",
  mod: "verbo modal",
  ctr: "contracción",
  int: "interjección",
  num: "número",
};

export function openVerb(base) {
  window.dispatchEvent(new CustomEvent("open-verb", { detail: base }));
}

export default function WordTipLayer() {
  const [tip, setTip] = useState(null); // { word, readings, rect, pinned }
  const openTimer = useRef(null);
  const closeTimer = useRef(null);
  const anchor = useRef(null);

  const close = useCallback(() => {
    clearTimeout(openTimer.current);
    anchor.current?.classList.remove("w-on");
    anchor.current = null;
    setTip(null);
  }, []);

  const show = useCallback(async (el, pinned) => {
    const lex = await loadLexicon();
    const found = lex.lookup(el.dataset.w);
    if (!found) return;
    anchor.current?.classList.remove("w-on");
    anchor.current = el;
    el.classList.add("w-on");
    setTip({ ...found, verbs: lex.verbs, rect: el.getBoundingClientRect(), pinned });
  }, []);

  useEffect(() => {
    const isWord = (t) => t instanceof Element && t.closest(".w");
    const inTip = (t) => t instanceof Element && t.closest(".wordtip");

    function onOver(e) {
      if (e.pointerType !== "mouse") return;
      const w = isWord(e.target);
      if (w) {
        clearTimeout(closeTimer.current);
        if (w === anchor.current) return;
        clearTimeout(openTimer.current);
        openTimer.current = setTimeout(() => show(w, false), 140);
      } else if (inTip(e.target)) {
        clearTimeout(closeTimer.current);
      }
    }
    function onOut(e) {
      if (e.pointerType !== "mouse") return;
      if (!isWord(e.target) && !inTip(e.target)) return;
      clearTimeout(openTimer.current);
      closeTimer.current = setTimeout(() => {
        setTip((t) => (t && !t.pinned ? (anchor.current?.classList.remove("w-on"), (anchor.current = null), null) : t));
      }, 220);
    }
    function onClick(e) {
      const w = isWord(e.target);
      if (w) {
        e.preventDefault();
        if (w === anchor.current && tip?.pinned) return close();
        show(w, true);
      } else if (!inTip(e.target)) {
        close();
      }
    }
    function onKey(e) {
      if (e.key === "Escape") close();
    }
    const onScroll = () => close();
    // En móvil la barra del navegador cambia la altura al hacer scroll: solo
    // se cierra si cambia el ancho (giro de pantalla, ventana redimensionada).
    let lastWidth = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth !== lastWidth) close();
      lastWidth = window.innerWidth;
    };
    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerout", onOut);
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", onResize);
    };
  }, [show, close, tip?.pinned]);

  if (!tip) return null;
  return createPortal(<WordCard tip={tip} onClose={close} />, document.body);
}

function WordCard({ tip, onClose }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ top: -9999, left: 0 });

  // Debajo de la palabra si cabe; si no, encima. Siempre dentro de la pantalla.
  useLayoutEffect(() => {
    const card = ref.current;
    if (!card) return;
    const { rect } = tip;
    const w = card.offsetWidth;
    const h = card.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const left = Math.min(Math.max(8, rect.left + rect.width / 2 - w / 2), vw - w - 8);
    const below = rect.bottom + 8;
    const top = below + h > vh - 8 && rect.top - h - 8 > 8 ? rect.top - h - 8 : below;
    setPos({ top, left });
  }, [tip]);

  const readings = tip.readings.slice(0, 3);
  return (
    <div
      ref={ref}
      className="wordtip"
      role="dialog"
      aria-label={`Significado de ${tip.word}`}
      style={{ top: pos.top, left: pos.left }}
    >
      <div className="wt-head">
        <span className="wt-word">{tip.word}</span>
        <SpeakButton text={tip.word} title={`Escuchar «${tip.word}»`} className="wt-speak" />
        <button type="button" className="wt-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
      </div>
      {readings.map((r, i) => (
        <Reading key={i} r={r} verbs={tip.verbs} />
      ))}
      {tip.readings[0]?.possessive && (
        <p className="wt-note">«'s» aquí indica posesión (o es la contracción de is / has).</p>
      )}
    </div>
  );
}

function Reading({ r, verbs }) {
  const { entry, lemma, tag } = r;
  const pos = entry.pos;
  return (
    <section className="wt-reading">
      <div className="wt-meta">
        <span className={"wt-pos wt-pos-" + pos}>{POS[pos] || pos}</span>
        {tag !== "base" && (
          <span className="wt-form">
            {tag} de <b>{lemma}</b>
          </span>
        )}
      </div>
      <p className="wt-es">{entry.es}</p>
      {pos === "v" && <VerbForms v={verbs.get(lemma)} />}
      {pos === "n" && (
        <p className="wt-forms">
          <span>singular <b>{lemma}</b></span>
          <span>plural <b>{plural(lemma, entry.extra)}</b>{entry.extra && <i> (irregular)</i>}</span>
        </p>
      )}
      {pos === "nu" && <p className="wt-forms"><span>incontable: sin plural, con <b>some / much</b></span></p>}
      {(pos === "adj" || (pos === "adv" && entry.extra?.includes(","))) && <Degrees word={lemma} extra={entry.extra} />}
      {entry.note && <p className="wt-note">{entry.note}</p>}
    </section>
  );
}

function VerbForms({ v }) {
  if (!v) return null;
  const p = v.parts;
  return (
    <>
      <dl className="wt-parts">
        <div><dt>base</dt><dd>{p.base}</dd></div>
        <div><dt>3ª pers.</dt><dd>{p.s3}</dd></div>
        <div><dt>pasado</dt><dd>{p.past.join(" / ")}</dd></div>
        <div><dt>particip.</dt><dd>{p.pp.join(" / ")}</dd></div>
        <div><dt>-ing</dt><dd>{p.ing}</dd></div>
      </dl>
      <div className="wt-actions">
        <span className={"wt-chip" + (p.irregular ? " irr" : "")}>{p.irregular ? "irregular" : "regular"}</span>
        <button type="button" className="wt-link" onClick={() => openVerb(v.base)}>
          Conjugación completa →
        </button>
      </div>
    </>
  );
}

function Degrees({ word, extra }) {
  const d = degrees(word, extra);
  if (!d) return <p className="wt-forms"><span>no tiene comparativo</span></p>;
  return (
    <p className="wt-forms">
      <span>comparativo <b>{d.comp}</b></span>
      <span>superlativo <b>{d.sup}</b></span>
    </p>
  );
}
