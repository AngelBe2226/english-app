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
          { options: ["opt", "decide", "select", "pick"], correctIndex: 0, explain: ["Opt for = decantarse por: la única que va con for.", "Decide va con on (decide on), no con for.", "Select no lleva preposición: select a hotel.", "Pick no va con for en este sentido; sería pick a chain."] },
          { options: ["appeal", "attention", "appearance", "approach"], correctIndex: 0, explain: ["The appeal = el atractivo: explica por qué gustan.", "Attention no es «el atractivo» del hotel.", "Appearance = aspecto físico; no encaja con «part of the…».", "Approach = enfoque; no explica por qué atraen."] },
          { options: ["take", "have", "put", "set"], correctIndex: 0, explain: ["Take an interest in = interesarse por: colocación fija.", "Have an interest es tener un interés, no mostrarlo.", "Put no forma colocación con interest.", "Set no va con interest."] },
          { options: ["offer", "give", "deliver", "supply"], correctIndex: 0, explain: ["Offer rooms = ofrecer habitaciones.", "Give no se usa para la oferta de un hotel.", "Deliver = entregar o repartir.", "Supply = suministrar; no encaja con habitaciones."] },
          { options: ["at", "with", "for", "to"], correctIndex: 0, explain: ["Come at a price = tener un precio: expresión fija.", "With no forma esta expresión.", "For no forma esta expresión.", "To no forma esta expresión."] },
          { options: ["extra", "plus", "added", "further"], correctIndex: 0, explain: ["Pay extra = pagar de más.", "Plus es preposición o sustantivo, no va tras pay así.", "Added necesita sustantivo (added value).", "Further necesita sustantivo y no significa «de más» aquí."] },
          { options: ["point", "bring", "set", "take"], correctIndex: 0, explain: ["Point out = señalar, destacar.", "Bring out = sacar a la luz; no con experts así.", "Set out = exponer, pero no «señalar que».", "Take out = sacar."] },
          { options: ["make", "do", "have", "cause"], correctIndex: 0, explain: ["Make a difference = marcar la diferencia.", "«Do a difference» no se usa.", "Have no forma esta colocación.", "Cause a difference no es natural."] },
        ],
      },
      {
        type: "open-cloze",
        title: "Travelling on a budget",
        text: "Planning a holiday {{1}} spending too much money is easier than you might think. The first step is to be flexible {{2}} your dates: flights are often much cheaper {{3}} you travel midweek. It is also worth signing up {{4}} airline newsletters, {{5}} frequently advertise special offers. Once you arrive, try to avoid eating {{6}} the main tourist areas, {{7}} prices tend to be higher. Instead, ask a local {{8}} recommendations — you will usually eat better and pay less.",
        gaps: [
          { answers: ["without"], why: "Without + -ing = sin gastar demasiado." },
          { answers: ["about", "with"], why: "Flexible about/with = flexible con algo." },
          { answers: ["if", "when"], why: "If/when introduce la condición del vuelo barato." },
          { answers: ["for", "to"], why: "Sign up for/to = apuntarse a." },
          { answers: ["which"], why: "Which: relativo explicativo de cosa (newsletters)." },
          { answers: ["in", "near", "around"], why: "In/near/around = en o cerca de la zona turística." },
          { answers: ["where"], why: "Where = donde (relativo de lugar)." },
          { answers: ["for"], why: "Ask someone for something = pedir algo a alguien." },
        ],
      },
      {
        type: "word-formation",
        title: "A career in tourism",
        text: "The tourism industry offers a wide range of {{1}} opportunities. For many young people, it is an attractive choice because the work is rarely {{2}}. A receptionist, for instance, deals with {{3}} guests every day, which calls for patience and {{4}}. Good communication is {{5}} the most important skill of all. Staff must be able to give clear {{6}} and respond politely, even when a customer is being {{7}}. With experience, many workers move into {{8}} positions.",
        gaps: [
          { root: "EMPLOY", answers: ["employment"], why: "Employment opportunities = oportunidades de empleo (sustantivo)." },
          { root: "BORE", answers: ["boring"], why: "Boring = aburrido (lo que causa aburrimiento)." },
          { root: "DIFFER", answers: ["different"], why: "Different = diferentes (adjetivo)." },
          { root: "FLEXIBLE", answers: ["flexibility"], why: "Flexibility = flexibilidad (sustantivo tras and)." },
          { root: "DOUBT", answers: ["undoubtedly"], why: "Undoubtedly = sin duda (adverbio negativo con un-)." },
          { root: "EXPLAIN", answers: ["explanations"], why: "Explanations = explicaciones (plural tras clear)." },
          { root: "REASON", answers: ["unreasonable"], why: "Unreasonable = poco razonable (prefijo negativo)." },
          { root: "MANAGE", answers: ["managerial", "management"], why: "Managerial/management positions = puestos de dirección." },
        ],
      },
      {
        type: "transformations",
        title: "Key word transformations",
        min: 2,
        max: 5,
        items: [
          { lead: "I haven't seen her for three years.", keyword: "SINCE", before: "It's three years", after: "her.", answers: ["since I saw"], model: "since I saw", why: "It's three years since + pasado simple." },
          { lead: "They cancelled the meeting because of the storm.", keyword: "CALLED", before: "The meeting", after: "because of the storm.", answers: ["was called off"], model: "was called off", why: "Pasiva de call off = cancelar." },
          { lead: "Perhaps she forgot the address.", keyword: "MIGHT", before: "She", after: "the address.", answers: ["might have forgotten"], model: "might have forgotten", why: "Might have + participio = posibilidad en el pasado." },
          { lead: "It wasn't necessary for you to book a table.", keyword: "NEED", before: "You", after: "a table.", answers: ["needn't have booked", "didn't need to book", "did not need to book"], model: "needn't have booked", why: "Needn't have + participio = no hacía falta (y se hizo)." },
          { lead: "I'm sure he was very tired.", keyword: "MUST", before: "He", after: "very tired.", answers: ["must have been"], model: "must have been", why: "Must have been = deducción segura sobre el pasado." },
          { lead: "'Don't touch the stove,' the mother told the child.", keyword: "NOT", before: "The mother told the child", after: "the stove.", answers: ["not to touch"], model: "not to touch", why: "Tell someone not to + infinitivo." },
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
          { options: ["shake", "move", "lift", "push"], correctIndex: 0, explain: ["Shake = quitarse de encima una impresión.", "Move no se usa con impresiones así.", "Lift = levantar.", "Push = empujar."] },
          { options: ["labelled", "named", "called", "titled"], correctIndex: 0, explain: ["Label someone as = etiquetar a alguien como.", "Name no va con as así.", "Called no va con as.", "Titled = titulado (un libro)."] },
          { options: ["confirms", "proves", "approves", "agrees"], correctIndex: 0, explain: ["Confirms = confirma la impresión.", "Proves = demuestra; no encaja con interpretar.", "Approves = aprueba.", "Agrees no lleva objeto así."] },
          { options: ["nearly", "hardly", "rarely", "scarcely"], correctIndex: 0, explain: ["Not nearly as… as = ni mucho menos tan…", "Hardly no va con not.", "Rarely no encaja con not… as.", "Scarcely no va con not."] },
          { options: ["turn", "come", "bring", "set"], correctIndex: 0, explain: ["Turn out = resultar.", "Come out = salir o publicarse.", "Bring out = sacar.", "Set out = emprender."] },
          { options: ["lead", "take", "drive", "send"], correctIndex: 0, explain: ["Lead astray = llevar por mal camino.", "Take astray no se usa.", "Drive astray no se usa.", "Send astray no es la colocación."] },
          { options: ["heavily", "strongly", "deeply", "hardly"], correctIndex: 0, explain: ["Rely heavily on = depender mucho de.", "Strongly no va con rely.", "Deeply no va con rely.", "Hardly = apenas; cambia el sentido."] },
          { options: ["revising", "renewing", "reviewing", "restoring"], correctIndex: 0, explain: ["Revising = revisar y cambiar una opinión.", "Renewing = renovar (un contrato).", "Reviewing = repasar; no implica cambiar.", "Restoring = restaurar."] },
        ],
      },
      {
        type: "open-cloze",
        title: "The lost art of conversation",
        text: "In an age of constant digital communication, the ability to hold a good face-to-face conversation is, {{1}} to some, in decline. We have become so {{2}} to typing short messages that speaking at length can feel oddly demanding. {{3}} it comes to listening, the problem is even more pronounced. Rather {{4}} paying full attention, we are often merely waiting {{5}} our turn to speak. {{6}} a result, genuine dialogue — the kind in {{7}} both people feel truly heard — is becoming rare. Learning to listen properly is a skill {{8}} deserves far more attention than it currently receives.",
        gaps: [
          { answers: ["according"], why: "According to = según." },
          { answers: ["accustomed", "used"], why: "Accustomed/used to + -ing = acostumbrados a." },
          { answers: ["when"], why: "When it comes to = en lo que respecta a." },
          { answers: ["than"], why: "Rather than = en lugar de." },
          { answers: ["for"], why: "Wait for = esperar a." },
          { answers: ["as"], why: "As a result = como resultado." },
          { answers: ["which"], why: "In which = en la que (relativo con preposición)." },
          { answers: ["that", "which"], why: "That/which: relativo de skill." },
        ],
      },
      {
        type: "word-formation",
        title: "The power of curiosity",
        text: "Curiosity is one of the most {{1}} drivers of human learning. From early {{2}}, we are driven to explore and ask questions. Psychologists believe this {{3}} to investigate the unknown has been essential to our {{4}} as a species. Unfortunately, formal education can sometimes have the {{5}} effect of dampening this instinct. When learning becomes purely a matter of {{6}} facts, students may lose their natural {{7}}. The most {{8}} teachers, by contrast, keep curiosity alive.",
        gaps: [
          { root: "POWER", answers: ["powerful"], why: "Powerful = poderoso (adjetivo)." },
          { root: "CHILD", answers: ["childhood"], why: "Childhood = infancia (from early childhood)." },
          { root: "WILLING", answers: ["willingness"], why: "Willingness = disposición (sustantivo)." },
          { root: "SURVIVE", answers: ["survival"], why: "Survival = supervivencia (sustantivo)." },
          { root: "INTEND", answers: ["unintended"], why: "Unintended = no buscado (prefijo un- + participio)." },
          { root: "MEMORISE", answers: ["memorising", "memorizing"], why: "Memorising = memorizar (-ing tras of)." },
          { root: "ENTHUSE", answers: ["enthusiasm"], why: "Enthusiasm = entusiasmo (sustantivo)." },
          { root: "INSPIRE", answers: ["inspiring", "inspirational"], why: "Inspiring = inspiradores (adjetivo)." },
        ],
      },
      {
        type: "transformations",
        title: "Key word transformations",
        min: 3,
        max: 6,
        items: [
          { lead: "I didn't understand the problem until she explained it.", keyword: "ONLY", before: "", after: "did I understand the problem.", answers: ["Only when she explained it", "Only after she explained it"], model: "Only when she explained it", why: "Only when/after + oración + inversión (did I understand)." },
          { lead: "People say he was a brilliant manager.", keyword: "SAID", before: "He", after: "a brilliant manager.", answers: ["is said to have been"], model: "is said to have been", why: "Is said to have been: pasiva impersonal con algo anterior." },
          { lead: "I regret not booking earlier.", keyword: "WISH", before: "I", after: "earlier.", answers: ["wish I had booked"], model: "wish I had booked", why: "Wish + had + participio = arrepentimiento pasado." },
          { lead: "It's possible that she missed the train.", keyword: "MAY", before: "She", after: "the train.", answers: ["may have missed"], model: "may have missed", why: "May have + participio = posibilidad en el pasado." },
          { lead: "They are redecorating our office at the moment.", keyword: "BEING", before: "Our office", after: "at the moment.", answers: ["is being redecorated"], model: "is being redecorated", why: "Pasiva continua: is being + participio." },
          { lead: "He didn't apologise, which surprised me.", keyword: "FAILED", before: "I was surprised that", after: "apologise.", answers: ["he failed to"], model: "he failed to", why: "Fail to = no hacer algo." },
        ],
      },
    ],
  },
};

export function partMeta(type) {
  return PART_META[type] || { name: type, instr: "" };
}
