// Conjugación completa de un verbo inglés en todos los tiempos y modos,
// en afirmativa, negativa e interrogativa, voz activa y pasiva, con un
// ejemplo por tiempo. Trabaja sobre las partes de verbParts().

export const PERSONS = [
  { key: "1s", label: "I", subj: "I" },
  { key: "2s", label: "you", subj: "you" },
  { key: "3s", label: "he / she / it", subj: "he" },
  { key: "1p", label: "we", subj: "we" },
  { key: "2p", label: "you", subj: "you" },
  { key: "3p", label: "they", subj: "they" },
];

const beNow = (p) => (p === "1s" ? "am" : p === "3s" ? "is" : "are");
const beWas = (p) => (p === "1s" || p === "3s" ? "was" : "were");
const haveNow = (p) => (p === "3s" ? "has" : "have");

const NEG = {
  am: "am not", is: "isn't", are: "aren't", was: "wasn't", were: "weren't",
  have: "haven't", has: "hasn't", had: "hadn't", will: "won't", would: "wouldn't",
  do: "don't", does: "doesn't", did: "didn't",
};

// Cada tiempo devuelve { aux, rest } para una persona: aux es el primer
// auxiliar (el que se niega o se adelanta en la pregunta). aux null = tiempo
// simple que necesita do/does/did en negativa e interrogativa.
const T = {
  presentSimple: (V, p) =>
    V.base === "be"
      ? { aux: beNow(p), rest: "" }
      : { aux: null, doAux: p === "3s" ? "does" : "do", main: p === "3s" ? V.s3 : V.base, rest: "" },
  presentContinuous: (V, p) => ({ aux: beNow(p), rest: V.ing }),
  presentPerfect: (V, p) => ({ aux: haveNow(p), rest: V.pp[0] }),
  presentPerfectContinuous: (V, p) => ({ aux: haveNow(p), rest: "been " + V.ing }),
  pastSimple: (V, p) =>
    V.base === "be" ? { aux: beWas(p), rest: "" } : { aux: null, doAux: "did", main: V.past[0], rest: "" },
  pastContinuous: (V, p) => ({ aux: beWas(p), rest: V.ing }),
  pastPerfect: (V) => ({ aux: "had", rest: V.pp[0] }),
  pastPerfectContinuous: (V) => ({ aux: "had", rest: "been " + V.ing }),
  futureSimple: (V) => ({ aux: "will", rest: V.base }),
  futureContinuous: (V) => ({ aux: "will", rest: "be " + V.ing }),
  futurePerfect: (V) => ({ aux: "will", rest: "have " + V.pp[0] }),
  futurePerfectContinuous: (V) => ({ aux: "will", rest: "have been " + V.ing }),
  goingTo: (V, p) => ({ aux: beNow(p), rest: "going to " + V.base }),
  conditional: (V) => ({ aux: "would", rest: V.base }),
  conditionalContinuous: (V) => ({ aux: "would", rest: "be " + V.ing }),
  conditionalPerfect: (V) => ({ aux: "would", rest: "have " + V.pp[0] }),
  conditionalPerfectContinuous: (V) => ({ aux: "would", rest: "have been " + V.ing }),
};

// Pasiva: el verbo be en el tiempo correspondiente + participio.
const P = {
  presentSimple: (V, p) => ({ aux: beNow(p), rest: V.pp[0] }),
  presentContinuous: (V, p) => ({ aux: beNow(p), rest: "being " + V.pp[0] }),
  presentPerfect: (V, p) => ({ aux: haveNow(p), rest: "been " + V.pp[0] }),
  pastSimple: (V, p) => ({ aux: beWas(p), rest: V.pp[0] }),
  pastContinuous: (V, p) => ({ aux: beWas(p), rest: "being " + V.pp[0] }),
  pastPerfect: (V) => ({ aux: "had", rest: "been " + V.pp[0] }),
  futureSimple: (V) => ({ aux: "will", rest: "be " + V.pp[0] }),
  futurePerfect: (V) => ({ aux: "will", rest: "have been " + V.pp[0] }),
  goingTo: (V, p) => ({ aux: beNow(p), rest: "going to be " + V.pp[0] }),
  conditional: (V) => ({ aux: "would", rest: "be " + V.pp[0] }),
  conditionalPerfect: (V) => ({ aux: "would", rest: "have been " + V.pp[0] }),
};

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const join = (...xs) => xs.filter(Boolean).join(" ");

// Frase de un tiempo para una persona en un modo: "aff" | "neg" | "q".
function phrase(form, subj, mode) {
  if (form.aux === null) {
    if (mode === "aff") return join(subj, form.main, form.rest);
    if (mode === "neg") return join(subj, NEG[form.doAux], form.base, form.rest);
    return join(cap(form.doAux), subj, form.base, form.rest) + "?";
  }
  if (mode === "aff") return join(subj, form.aux, form.rest);
  if (mode === "neg") return join(subj, NEG[form.aux] || form.aux + " not", form.rest);
  return join(cap(form.aux), subj, form.rest) + (form.rest ? "?" : "…?");
}

// Nombres, usos y ejemplo (marcador temporal) de cada tiempo.
export const TENSES = [
  { group: "Indicativo · presente", items: [
    { id: "presentSimple", en: "Present simple", es: "Presente simple", use: "Rutinas, hechos y horarios.", mark: "every day" },
    { id: "presentContinuous", en: "Present continuous", es: "Presente continuo", use: "Lo que pasa ahora o planes cerrados.", mark: "right now", cont: true },
    { id: "presentPerfect", en: "Present perfect", es: "Pretérito perfecto", use: "Pasado conectado con el presente; experiencias.", mark: "this week" },
    { id: "presentPerfectContinuous", en: "Present perfect continuous", es: "Perfecto continuo", use: "Acción que empezó antes y sigue (o acaba de parar).", mark: "since this morning", cont: true },
  ]},
  { group: "Indicativo · pasado", items: [
    { id: "pastSimple", en: "Past simple", es: "Pasado simple", use: "Acción terminada en un momento del pasado.", mark: "yesterday" },
    { id: "pastContinuous", en: "Past continuous", es: "Pasado continuo", use: "Acción en curso en el pasado, a menudo interrumpida.", mark: "when the phone rang", cont: true },
    { id: "pastPerfect", en: "Past perfect", es: "Pluscuamperfecto", use: "Lo que ya había pasado antes de otro momento pasado.", mark: "before the meeting started" },
    { id: "pastPerfectContinuous", en: "Past perfect continuous", es: "Pluscuamperfecto continuo", use: "Duración hasta un momento del pasado.", mark: "for an hour before the manager arrived", cont: true },
  ]},
  { group: "Indicativo · futuro", items: [
    { id: "futureSimple", en: "Future simple (will)", es: "Futuro simple", use: "Decisiones en el momento, promesas, predicciones.", mark: "tomorrow" },
    { id: "goingTo", en: "Future: going to", es: "Futuro con going to", use: "Planes decididos y predicciones con pruebas.", mark: "next week" },
    { id: "futureContinuous", en: "Future continuous", es: "Futuro continuo", use: "Acción en curso en un momento del futuro.", mark: "at this time tomorrow", cont: true },
    { id: "futurePerfect", en: "Future perfect", es: "Futuro perfecto", use: "Lo que estará terminado antes de un momento futuro.", mark: "by Friday" },
    { id: "futurePerfectContinuous", en: "Future perfect continuous", es: "Futuro perfecto continuo", use: "Duración hasta un momento futuro.", mark: "for a year by June", cont: true },
  ]},
  { group: "Condicional", items: [
    { id: "conditional", en: "Conditional simple", es: "Condicional simple", use: "Situaciones hipotéticas y peticiones corteses.", mark: "if necessary" },
    { id: "conditionalContinuous", en: "Conditional continuous", es: "Condicional continuo", use: "Acción hipotética en curso.", mark: "now if the system worked", cont: true },
    { id: "conditionalPerfect", en: "Conditional perfect", es: "Condicional perfecto", use: "Hipótesis sobre el pasado (tercer condicional).", mark: "if someone had asked" },
    { id: "conditionalPerfectContinuous", en: "Conditional perfect continuous", es: "Condicional perfecto continuo", use: "Duración hipotética en el pasado.", mark: "all day if the system hadn't crashed", cont: true },
  ]},
];

const EX_SUBJ = ["she", "I", "we", "they", "he", "you"];
const SUBJ_PERSON = { I: "1s", you: "2s", he: "3s", she: "3s", we: "1p", they: "3p" };

// Tabla de un tiempo: una fila por persona + ejemplo.
export function conjugateTense(V, tenseId, { mode = "aff", passive = false, tail = "", index = 0, stative = false } = {}) {
  const build = (passive ? P : T)[tenseId];
  if (!build) return null;
  const form = (p) => ({ ...build(V, p), base: V.base });
  const rows = PERSONS.map((pp) => ({
    person: pp.label,
    text: phrase(form(pp.key), pp.subj === "he" ? pp.label : pp.subj, mode),
  }));
  const meta = TENSES.flatMap((g) => g.items).find((t) => t.id === tenseId);
  let example = null;
  if (!(stative && meta?.cont)) {
    if (passive) {
      const { subj, person } = passiveSubject(tail);
      example = phrase(form(person), subj, mode).replace(/\?$/, "") + " " + meta.mark + (mode === "q" ? "?" : ".");
    } else {
      const s = EX_SUBJ[index % EX_SUBJ.length];
      const core = phrase(form(SUBJ_PERSON[s]), s, mode).replace(/\?$/, "");
      example = cap(join(core, tail, meta.mark)) + (mode === "q" ? "?" : ".");
    }
  }
  return { rows, example };
}

// En pasiva, el complemento del ejemplo pasa a ser el sujeto: se corta en la
// primera preposición o partícula (the guest to the room → the guest) y los
// pronombres objeto pasan a sujeto (him → he).
const OBJ_TO_SUBJ = { him: "he", her: "she", them: "they", us: "we", me: "I", it: "it", you: "you" };
export function passiveSubject(tail) {
  let s = (tail || "it").replace(/\s(to|for|into|on|as|of|over|in|out|off|up|down|open|with|at|from|by|about|back)\b.*$/, "");
  const first = s.split(" ")[0];
  if (OBJ_TO_SUBJ[first] && s === first) s = OBJ_TO_SUBJ[first];
  const last = s.split(" ").pop();
  const person = s === "I" ? "1s" : s === "you" || s === "we" || s === "they" ? "3p" : /[^s]s$/.test(last) && s.split(" ").length > 1 ? "3p" : "3s";
  return { subj: s === "I" ? s : s.charAt(0).toUpperCase() + s.slice(1), person };
}

// Modos sin tiempo: subjuntivo, imperativo y formas no personales.
export function otherForms(V, { passive = false, tail = "" } = {}) {
  const pp = V.pp[0];
  const t = tail ? " " + tail : "";
  if (passive) {
    const { subj: obj } = passiveSubject(tail);
    return [
      { id: "subj", en: "Subjunctive", es: "Subjuntivo", use: "Tras insist, suggest, recommend… (that + sujeto + be + participio).",
        rows: [["presente", `that it be ${pp}`], ["negativa", `that it not be ${pp}`]],
        example: `The manager insists that ${obj.toLowerCase() === "i" ? "I" : obj.charAt(0).toLowerCase() + obj.slice(1)} be ${pp} today.` },
      { id: "inf", en: "Non-finite forms", es: "Formas no personales", use: "Infinitivo, gerundio y participio en pasiva.",
        rows: [["infinitivo", `to be ${pp}`], ["infinitivo perfecto", `to have been ${pp}`], ["gerundio", `being ${pp}`], ["gerundio perfecto", `having been ${pp}`]],
        example: `${obj} ${/^(we|they|you)$/i.test(obj) || / \w+[^s]s$/.test(obj) ? "need" : "needs"} to be ${pp} before noon.` },
    ];
  }
  const be = V.base === "be";
  return [
    { id: "subj", en: "Subjunctive", es: "Subjuntivo",
      use: "Presente: tras insist, suggest, recommend (that + sujeto + infinitivo sin -s). Pasado: deseos e hipótesis (I wish, if only, if I were).",
      rows: [
        ["presente", `that he ${V.base}`],
        ["presente negativo", `that he not ${V.base}`],
        ["pasado", be ? "if I were / if he were" : `if he ${V.past[0]}`],
        ["pasado negativo", be ? "if I weren't" : `if he didn't ${V.base}`],
      ],
      example: `The manager insists that she ${V.base}${t} today.` },
    { id: "imp", en: "Imperative", es: "Imperativo", use: "Órdenes, instrucciones e invitaciones.",
      rows: [
        ["afirmativo", cap(V.base) + t],
        ["negativo", `Don't ${V.base}` + t],
        ["1ª plural", `Let's ${V.base}` + t],
        ["1ª plural negativo", `Let's not ${V.base}` + t],
      ],
      example: `Please ${V.base}${t}.` },
    { id: "inf", en: "Non-finite forms", es: "Formas no personales", use: "Infinitivo, gerundio y participios.",
      rows: [
        ["infinitivo", `to ${V.base}`],
        ["infinitivo continuo", `to be ${V.ing}`],
        ["infinitivo perfecto", `to have ${pp}`],
        ["gerundio / -ing", V.ing],
        ["gerundio perfecto", `having ${pp}`],
        ["participio pasado", V.pp.join(" / ")],
      ],
      example: `${cap(V.ing)}${t} is part of the job.` },
  ];
}

export const PASSIVE_TENSES = Object.keys(P);
