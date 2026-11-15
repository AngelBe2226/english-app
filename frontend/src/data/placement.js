// Test de nivel (diagnóstico CEFR A1→C1) y rutas recomendadas por nivel.
// 5 preguntas por banda; se puntúa cada banda y se asigna el nivel más alto
// superado de forma consecutiva. Todo offline (datos embebidos).

export const BANDS = ["A1", "A2", "B1", "B2", "C1"];

export const QUESTIONS = [
  // ---- A1 ----
  { id: "p-a1-1", band: "A1", q: "___ name is Ana.", options: ["My", "Me"], correctIndex: 0, explain: ["Posesivo delante del sustantivo: my name.", "Me es objeto, no posesivo."] },
  { id: "p-a1-2", band: "A1", q: "She ___ a receptionist.", options: ["is", "are"], correctIndex: 0, explain: ["Con she: is.", "Are es para you/we/they."] },
  { id: "p-a1-3", band: "A1", q: "There ___ two beds in the room.", options: ["are", "is"], correctIndex: 0, explain: ["Two beds es plural: there are.", "Is es singular."] },
  { id: "p-a1-4", band: "A1", q: "I ___ like tea.", options: ["don't", "doesn't"], correctIndex: 0, explain: ["Con I: don't.", "Doesn't es para he/she/it."] },
  { id: "p-a1-5", band: "A1", q: "___ you from Spain?", options: ["Are", "Is"], correctIndex: 0, explain: ["Con you: are.", "Is es para he/she/it."] },

  // ---- A2 ----
  { id: "p-a2-1", band: "A2", q: "Yesterday we ___ a great film.", options: ["watched", "watch"], correctIndex: 0, explain: ["Yesterday pide pasado: watched.", "Watch es presente."] },
  { id: "p-a2-2", band: "A2", q: "This hotel is ___ than that one.", options: ["cheaper", "more cheap"], correctIndex: 0, explain: ["Cheap es corto: cheaper.", "Los adjetivos cortos no llevan more."] },
  { id: "p-a2-3", band: "A2", q: "I'm going to ___ my friends tonight.", options: ["meet", "met"], correctIndex: 0, explain: ["Going to + base: meet.", "Met es pasado."] },
  { id: "p-a2-4", band: "A2", q: "There isn't ___ coffee left.", options: ["any", "some"], correctIndex: 0, explain: ["Negativa: any.", "Some va en afirmativas."] },
  { id: "p-a2-5", band: "A2", q: "He ___ get up early on Sundays.", options: ["doesn't", "don't"], correctIndex: 0, explain: ["Con he: doesn't.", "Don't no va con he."] },

  // ---- B1 ----
  { id: "p-b1-1", band: "B1", q: "If it rains, we ___ stay in.", options: ["will", "would"], correctIndex: 0, explain: ["Condicional 1: will.", "Would es hipotético (condicional 2)."] },
  { id: "p-b1-2", band: "B1", q: "I've worked here ___ three years.", options: ["for", "since"], correctIndex: 0, explain: ["For + duración.", "Since necesita un punto de inicio."] },
  { id: "p-b1-3", band: "B1", q: "She told me that she ___ tired.", options: ["was", "is"], correctIndex: 0, explain: ["Estilo indirecto: is → was.", "En estilo indirecto se retrocede el tiempo."] },
  { id: "p-b1-4", band: "B1", q: "I'm not used ___ early starts.", options: ["to", "—"], correctIndex: 0, explain: ["Be used to + -ing o sustantivo.", "Used sin to no significa estar acostumbrado."] },
  { id: "p-b1-5", band: "B1", q: "By the time we arrived, the meeting ___.", options: ["had started", "started"], correctIndex: 0, explain: ["Anterior a otro pasado: had started.", "Started no marca que ya había empezado."] },

  // ---- B2 ----
  { id: "p-b2-1", band: "B2", q: "I wish I ___ more time.", options: ["had", "have"], correctIndex: 0, explain: ["Deseo presente: wish + pasado.", "Tras wish no va presente."] },
  { id: "p-b2-2", band: "B2", q: "He denied ___ the vase.", options: ["breaking", "to break"], correctIndex: 0, explain: ["Deny + -ing.", "Deny no va con to."] },
  { id: "p-b2-3", band: "B2", q: "The project, ___ took months, is finally done.", options: ["which", "what"], correctIndex: 0, explain: ["Explicativa de cosa: which.", "What no es relativo con antecedente."] },
  { id: "p-b2-4", band: "B2", q: "You ___ have told me earlier — now it's too late!", options: ["should", "must"], correctIndex: 0, explain: ["Reproche: should have.", "Must have es deducción."] },
  { id: "p-b2-5", band: "B2", q: "The guests would rather we ___ the music down.", options: ["turned", "turn"], correctIndex: 0, explain: ["Would rather + otra persona + pasado.", "Tras would rather + sujeto va pasado."] },

  // ---- C1 ----
  { id: "p-c1-1", band: "C1", q: "Not only ___ late, but he also forgot the file.", options: ["was he", "he was"], correctIndex: 0, explain: ["Not only + inversión: was he.", "Falta la inversión."] },
  { id: "p-c1-2", band: "C1", q: "___ for your help, we would have failed.", options: ["Had it not been", "If it wouldn't be"], correctIndex: 0, explain: ["Had it not been for = de no ser por.", "Would no va en la condición."] },
  { id: "p-c1-3", band: "C1", q: "It's high time we ___ a decision.", options: ["made", "make"], correctIndex: 0, explain: ["It's high time + pasado.", "Tras it's time + sujeto va pasado."] },
  { id: "p-c1-4", band: "C1", q: "Little ___ that she was the manager.", options: ["did he know", "he knew"], correctIndex: 0, explain: ["Little + inversión: did he know.", "Falta la inversión."] },
  { id: "p-c1-5", band: "C1", q: "Scarcely ___ when the phone rang.", options: ["had I arrived", "I had arrived"], correctIndex: 0, explain: ["Scarcely + inversión: had I arrived.", "Falta la inversión."] },
];

// Ruta recomendada por nivel: bloques en los que centrarse, con un porqué.
// Los ids se resuelven a títulos desde el índice cargado.
export const ROUTES = {
  A1: {
    tip: "Empieza por los cimientos: cómo se arma la frase y el presente. Ve despacio y repite en voz alta.",
    blocks: [
      { block: "01", why: "la base de toda frase" },
      { block: "02", why: "in / on / at y las más usadas" },
      { block: "05", why: "el orden sujeto-verbo-objeto" },
      { block: "09", why: "empieza por el presente" },
      { block: "18", why: "inglés útil desde el día 1" },
    ],
  },
  A2: {
    tip: "Ya tienes la base. Afianza pasados, comparativos y conectores, y suma unidades temáticas.",
    blocks: [
      { block: "03", why: "unir ideas (and, but, because)" },
      { block: "04", why: "describir con precisión" },
      { block: "09", why: "pasados y futuros" },
      { block: "24", why: "evita los calcos del español" },
      { block: "19", why: "practica en contexto real" },
    ],
  },
  B1: {
    tip: "Nivel intermedio: domina perfectos, condicionales y modales, y lee textos graduados.",
    blocks: [
      { block: "06", why: "frases más largas y ricas" },
      { block: "10", why: "hipótesis, permiso y obligación" },
      { block: "13", why: "las palabras que de verdad se usan" },
      { block: "27", why: "entrena la comprensión lectora" },
      { block: "26", why: "teléfono, quejas, despedidas" },
    ],
  },
  B2: {
    tip: "Intermedio alto: trabaja énfasis, voz pasiva, estilo indirecto y el análisis de frases largas.",
    blocks: [
      { block: "07", why: "dar énfasis como un nativo" },
      { block: "08", why: "registro formal y escrito" },
      { block: "16", why: "evita repetir, suena fluido" },
      { block: "22", why: "qué decir en cada situación" },
      { block: "28", why: "entiende frases complejas" },
    ],
  },
  C1: {
    tip: "Nivel avanzado: pule matices, idioms y registro. Ya puedes con textos de opinión y simulacros de examen.",
    blocks: [
      { block: "23", why: "los matices que marcan el C1" },
      { block: "12", why: "expresiones idiomáticas" },
      { block: "07", why: "repaso fino de inversión" },
      { block: "28", why: "análisis de oraciones complejas" },
      { block: "27", why: "lee y comenta textos de opinión" },
    ],
  },
};

// Puntúa las respuestas y asigna el nivel. `answers` = { questionId: chosenIndex }.
export function scorePlacement(answers) {
  const bandScore = {};
  for (const b of BANDS) bandScore[b] = { correct: 0, total: 0 };
  for (const item of QUESTIONS) {
    bandScore[item.band].total += 1;
    if (answers[item.id] === item.correctIndex) bandScore[item.band].correct += 1;
  }
  const passed = (b) => bandScore[b].total > 0 && bandScore[b].correct / bandScore[b].total >= 0.6;

  // Nivel = banda más alta superada de forma consecutiva desde A1.
  let level = null;
  for (const b of BANDS) {
    if (passed(b)) level = b;
    else break;
  }
  // Primera banda NO superada: dónde conviene centrarse.
  let recommendedStart = BANDS.find((b) => !passed(b)) || "C1";

  const total = QUESTIONS.length;
  const correct = Object.values(bandScore).reduce((s, x) => s + x.correct, 0);

  if (!level) {
    // No supera ni A1 → ruta A1 como punto de partida.
    return { level: "Pre-A1", routeKey: "A1", recommendedStart: "A1", bandScore, correct, total };
  }
  const allPassed = BANDS.every(passed);
  return {
    level: allPassed ? "C1+" : level,
    routeKey: level, // la ruta del nivel alcanzado
    recommendedStart: allPassed ? "C1" : recommendedStart,
    bandScore,
    correct,
    total,
  };
}
