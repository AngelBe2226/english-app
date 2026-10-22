// Simulacro Cambridge — Use of English (B2 First y C1 Advanced).
// Las 4 partes clásicas: multiple-choice cloze, open cloze, word formation y
// key word transformations. Todo offline (módulo embebido). Los textos usan
// marcadores {{n}} para los huecos, que el componente sustituye por campos.

// Normaliza una respuesta para compararla sin importar may/min, espacios o
// signos de puntuación finales.
export function normAns(s) {
  return (s || "")
    .toLowerCase()
    .replace(/[.,;:!?'"]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchesAny(value, answers) {
  const v = normAns(value);
  if (!v) return false;
  return (answers || []).some((a) => normAns(a) === v);
}

const PART_META = {
  "mcq-cloze": {
    name: "Parte 1 · Multiple-choice cloze",
    instr: "Lee el texto y elige para cada hueco la opción correcta (A–D). Se evalúa vocabulario y colocaciones.",
  },
  "open-cloze": {
    name: "Parte 2 · Open cloze",
    instr: "Escribe UNA sola palabra en cada hueco. Se evalúa la gramática (preposiciones, auxiliares, relativos…).",
  },
  "word-formation": {
    name: "Parte 3 · Word formation",
    instr: "Usa la palabra EN MAYÚSCULAS del final para formar una palabra que encaje en el hueco.",
  },
  transformations: {
    name: "Parte 4 · Key word transformations",
    instr: "Completa la segunda frase para que signifique lo mismo que la primera, usando la palabra clave. No cambies la palabra clave.",
  },
};

export const CAMBRIDGE = {
  B2: {
    label: "B2 First",
    parts: [
      {
        type: "mcq-cloze",
        title: "Boutique hotels",
        text: "Small hotels are enjoying a surprising revival. Travellers who used to {{1}} for large international chains now look for places with genuine character. Part of the {{2}} lies in the personal service: staff often greet guests by name and {{3}} a genuine interest in their stay. Unlike big resorts, boutique hotels rarely {{4}} hundreds of identical rooms; instead, each one is decorated differently. This attention to detail comes {{5}} a price, of course, but many guests are happy to pay {{6}} for a memorable experience. Industry experts {{7}} out that word of mouth is crucial for these businesses: a single enthusiastic review can {{8}} a huge difference to a small hotel's reputation.",
        gaps: [
          { options: ["opt", "decide", "select", "pick"], correctIndex: 0 },
          { options: ["appeal", "attention", "appearance", "approach"], correctIndex: 0 },
          { options: ["take", "have", "put", "set"], correctIndex: 0 },
          { options: ["offer", "give", "deliver", "supply"], correctIndex: 0 },
          { options: ["at", "with", "for", "to"], correctIndex: 0 },
          { options: ["extra", "plus", "added", "further"], correctIndex: 0 },
          { options: ["point", "bring", "set", "take"], correctIndex: 0 },
          { options: ["make", "do", "have", "cause"], correctIndex: 0 },
        ],
      },
      {
        type: "open-cloze",
        title: "Travelling on a budget",
        text: "Planning a holiday {{1}} spending too much money is easier than you might think. The first step is to be flexible {{2}} your dates: flights are often much cheaper {{3}} you travel midweek. It is also worth signing up {{4}} airline newsletters, {{5}} frequently advertise special offers. Once you arrive, try to avoid eating {{6}} the main tourist areas, {{7}} prices tend to be higher. Instead, ask a local {{8}} recommendations — you will usually eat better and pay less.",
        gaps: [
          { answers: ["without"] },
          { answers: ["about", "with"] },
          { answers: ["if", "when"] },
          { answers: ["for", "to"] },
          { answers: ["which"] },
          { answers: ["in", "near", "around"] },
          { answers: ["where"] },
          { answers: ["for"] },
        ],
      },
      {
        type: "word-formation",
        title: "A career in tourism",
        text: "The tourism industry offers a wide range of {{1}} opportunities. For many young people, it is an attractive choice because the work is rarely {{2}}. A receptionist, for instance, deals with {{3}} guests every day, which calls for patience and {{4}}. Good communication is {{5}} the most important skill of all. Staff must be able to give clear {{6}} and respond politely, even when a customer is being {{7}}. With experience, many workers move into {{8}} positions.",
        gaps: [
          { root: "EMPLOY", answers: ["employment"] },
          { root: "BORE", answers: ["boring"] },
          { root: "DIFFER", answers: ["different"] },
          { root: "FLEXIBLE", answers: ["flexibility"] },
          { root: "DOUBT", answers: ["undoubtedly"] },
          { root: "EXPLAIN", answers: ["explanations"] },
          { root: "REASON", answers: ["unreasonable"] },
          { root: "MANAGE", answers: ["managerial", "management"] },
        ],
      },
      {
        type: "transformations",
        title: "Key word transformations",
        min: 2,
        max: 5,
        items: [
          { lead: "I haven't seen her for three years.", keyword: "SINCE", before: "It's three years", after: "her.", answers: ["since I saw"], model: "since I saw" },
          { lead: "They cancelled the meeting because of the storm.", keyword: "CALLED", before: "The meeting", after: "because of the storm.", answers: ["was called off"], model: "was called off" },
          { lead: "Perhaps she forgot the address.", keyword: "MIGHT", before: "She", after: "the address.", answers: ["might have forgotten"], model: "might have forgotten" },
          { lead: "It wasn't necessary for you to book a table.", keyword: "NEED", before: "You", after: "a table.", answers: ["needn't have booked", "didn't need to book", "did not need to book"], model: "needn't have booked" },
          { lead: "I'm sure he was very tired.", keyword: "MUST", before: "He", after: "very tired.", answers: ["must have been"], model: "must have been" },
          { lead: "'Don't touch the stove,' the mother told the child.", keyword: "NOT", before: "The mother told the child", after: "the stove.", answers: ["not to touch"], model: "not to touch" },
        ],
      },
    ],
  },

  C1: {
    label: "C1 Advanced",
    parts: [
      {
        type: "mcq-cloze",
        title: "First impressions",
        text: "It is often said that we form an opinion of a stranger within seconds of meeting them. This initial judgement, researchers argue, is remarkably difficult to {{1}}. Once we have {{2}} someone as friendly or hostile, we tend to interpret their later behaviour in a way that {{3}} that first impression. Interestingly, these snap judgements are not {{4}} as unreliable as we might assume; in many cases they {{5}} out to be surprisingly accurate. However, they can also {{6}} us astray, particularly when we rely too {{7}} on superficial cues such as clothing. The challenge, then, is to remain open to {{8}} our first impression when the evidence demands it.",
        gaps: [
          { options: ["shake", "move", "lift", "push"], correctIndex: 0 },
          { options: ["labelled", "named", "called", "titled"], correctIndex: 0 },
          { options: ["confirms", "proves", "approves", "agrees"], correctIndex: 0 },
          { options: ["nearly", "hardly", "rarely", "scarcely"], correctIndex: 0 },
          { options: ["turn", "come", "bring", "set"], correctIndex: 0 },
          { options: ["lead", "take", "drive", "send"], correctIndex: 0 },
          { options: ["heavily", "strongly", "deeply", "hardly"], correctIndex: 0 },
          { options: ["revising", "renewing", "reviewing", "restoring"], correctIndex: 0 },
        ],
      },
      {
        type: "open-cloze",
        title: "The lost art of conversation",
        text: "In an age of constant digital communication, the ability to hold a good face-to-face conversation is, {{1}} to some, in decline. We have become so {{2}} to typing short messages that speaking at length can feel oddly demanding. {{3}} it comes to listening, the problem is even more pronounced. Rather {{4}} paying full attention, we are often merely waiting {{5}} our turn to speak. {{6}} a result, genuine dialogue — the kind in {{7}} both people feel truly heard — is becoming rare. Learning to listen properly is a skill {{8}} deserves far more attention than it currently receives.",
        gaps: [
          { answers: ["according"] },
          { answers: ["accustomed", "used"] },
          { answers: ["when"] },
          { answers: ["than"] },
          { answers: ["for"] },
          { answers: ["as"] },
          { answers: ["which"] },
          { answers: ["that", "which"] },
        ],
      },
      {
        type: "word-formation",
        title: "The power of curiosity",
        text: "Curiosity is one of the most {{1}} drivers of human learning. From early {{2}}, we are driven to explore and ask questions. Psychologists believe this {{3}} to investigate the unknown has been essential to our {{4}} as a species. Unfortunately, formal education can sometimes have the {{5}} effect of dampening this instinct. When learning becomes purely a matter of {{6}} facts, students may lose their natural {{7}}. The most {{8}} teachers, by contrast, keep curiosity alive.",
        gaps: [
          { root: "POWER", answers: ["powerful"] },
          { root: "CHILD", answers: ["childhood"] },
          { root: "WILLING", answers: ["willingness"] },
          { root: "SURVIVE", answers: ["survival"] },
          { root: "INTEND", answers: ["unintended"] },
          { root: "MEMORISE", answers: ["memorising", "memorizing"] },
          { root: "ENTHUSE", answers: ["enthusiasm"] },
          { root: "INSPIRE", answers: ["inspiring", "inspirational"] },
        ],
      },
      {
        type: "transformations",
        title: "Key word transformations",
        min: 3,
        max: 6,
        items: [
          { lead: "I didn't understand the problem until she explained it.", keyword: "ONLY", before: "", after: "did I understand the problem.", answers: ["Only when she explained it", "Only after she explained it"], model: "Only when she explained it" },
          { lead: "People say he was a brilliant manager.", keyword: "SAID", before: "He", after: "a brilliant manager.", answers: ["is said to have been"], model: "is said to have been" },
          { lead: "I regret not booking earlier.", keyword: "WISH", before: "I", after: "earlier.", answers: ["wish I had booked"], model: "wish I had booked" },
          { lead: "It's possible that she missed the train.", keyword: "MAY", before: "She", after: "the train.", answers: ["may have missed"], model: "may have missed" },
          { lead: "They are redecorating our office at the moment.", keyword: "BEING", before: "Our office", after: "at the moment.", answers: ["is being redecorated"], model: "is being redecorated" },
          { lead: "He didn't apologise, which surprised me.", keyword: "FAILED", before: "I was surprised that", after: "apologise.", answers: ["he failed to"], model: "he failed to" },
        ],
      },
    ],
  },
};

export function partMeta(type) {
  return PART_META[type] || { name: type, instr: "" };
}
