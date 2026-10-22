// Mazo de repaso (SRS): frases y vocabulario clave del curso, ES → EN, para
// practicar la producción (ver el español y recuperar el inglés). Agrupadas
// por tema. Offline (módulo embebido). El SRS programa cada tarjeta por su id.

export const VOCAB = [
  // --- Recepción ---
  { id: "v-rec-1", theme: "Recepción", es: "¿Tiene una reserva?", en: "Do you have a reservation?" },
  { id: "v-rec-2", theme: "Recepción", es: "¿Me permite su documento de identidad?", en: "May I see your ID, please?" },
  { id: "v-rec-3", theme: "Recepción", es: "Su habitación está lista.", en: "Your room is ready." },
  { id: "v-rec-4", theme: "Recepción", es: "El desayuno se sirve de 7 a 10:30.", en: "Breakfast is served from 7 to 10:30." },
  { id: "v-rec-5", theme: "Recepción", es: "¿Le ayudo con el equipaje?", en: "May I help you with your luggage?" },
  { id: "v-rec-6", theme: "Recepción", es: "La salida es a las 12 del mediodía.", en: "Check-out is at noon." },

  // --- Ventas ---
  { id: "v-sal-1", theme: "Ventas", es: "¿Qué está buscando exactamente?", en: "What exactly are you looking for?" },
  { id: "v-sal-2", theme: "Ventas", es: "Permítame mostrarle una alternativa.", en: "Let me show you an alternative." },
  { id: "v-sal-3", theme: "Ventas", es: "Esto encaja con lo que necesita.", en: "This matches what you need." },
  { id: "v-sal-4", theme: "Ventas", es: "Entiendo su preocupación.", en: "I understand your concern." },
  { id: "v-sal-5", theme: "Ventas", es: "Cerremos el trato.", en: "Let's close the deal.", hint: "cerrar un trato = close a deal" },

  // --- Gastronomía / F&B ---
  { id: "v-fb-1", theme: "F&B", es: "¿Están listos para pedir?", en: "Are you ready to order?" },
  { id: "v-fb-2", theme: "F&B", es: "¿Alguna alergia o intolerancia?", en: "Any allergies or intolerances?" },
  { id: "v-fb-3", theme: "F&B", es: "El plato del día es…", en: "Today's special is…" },
  { id: "v-fb-4", theme: "F&B", es: "Enseguida se lo traigo.", en: "I'll bring it right away." },
  { id: "v-fb-5", theme: "F&B", es: "¿Desean algo de postre?", en: "Would you like any dessert?" },

  // --- Inmobiliaria ---
  { id: "v-re-1", theme: "Inmobiliaria", es: "Está listo para entrar a vivir.", en: "It's move-in ready." },
  { id: "v-re-2", theme: "Inmobiliaria", es: "Está orientado al sur.", en: "It's south-facing." },
  { id: "v-re-3", theme: "Inmobiliaria", es: "El precio de salida es…", en: "The asking price is…" },
  { id: "v-re-4", theme: "Inmobiliaria", es: "Hay margen para negociar.", en: "There's room to negotiate." },

  // --- Transversales: teléfono y quejas ---
  { id: "v-tr-1", theme: "Transversal", es: "¿En qué puedo ayudarle?", en: "How can I help you?" },
  { id: "v-tr-2", theme: "Transversal", es: "¿Cómo se deletrea?", en: "How do you spell that?" },
  { id: "v-tr-3", theme: "Transversal", es: "Le paso con recepción.", en: "I'll put you through to reception." },
  { id: "v-tr-4", theme: "Transversal", es: "Lo siento muchísimo.", en: "I'm so sorry about that." },
  { id: "v-tr-5", theme: "Transversal", es: "Déjeme solucionarlo ahora mismo.", en: "Let me sort this out right away." },
  { id: "v-tr-6", theme: "Transversal", es: "Gracias por avisarnos.", en: "Thank you for letting us know." },
  { id: "v-tr-7", theme: "Transversal", es: "¿Hay algo más en lo que pueda ayudarle?", en: "Is there anything else I can help you with?" },

  // --- Despedida / fidelización ---
  { id: "v-by-1", theme: "Despedida", es: "Gracias por alojarse con nosotros.", en: "Thank you for staying with us." },
  { id: "v-by-2", theme: "Despedida", es: "Nos encantaría recibirle de nuevo.", en: "We'd love to welcome you back." },
  { id: "v-by-3", theme: "Despedida", es: "Buen viaje de vuelta.", en: "Have a safe trip home." },

  // --- Conectores y frases útiles ---
  { id: "v-gen-1", theme: "Conectores", es: "En realidad, …", en: "Actually, …", hint: "≠ actualmente (= currently)" },
  { id: "v-gen-2", theme: "Conectores", es: "Sin embargo, …", en: "However, …" },
  { id: "v-gen-3", theme: "Conectores", es: "Por lo tanto, …", en: "Therefore, …" },
  { id: "v-gen-4", theme: "Conectores", es: "Por cierto, …", en: "By the way, …" },
  { id: "v-gen-5", theme: "Conectores", es: "En cuanto a …", en: "As for / Regarding …" },
  { id: "v-gen-6", theme: "Conectores", es: "A pesar de …", en: "Despite / In spite of …" },
  { id: "v-gen-7", theme: "Conectores", es: "Depende de …", en: "It depends on …", hint: "on, no 'of'" },
  { id: "v-gen-8", theme: "Conectores", es: "Estoy de acuerdo.", en: "I agree.", hint: "no 'I am agree'" },
  { id: "v-gen-9", theme: "Conectores", es: "No me importa.", en: "I don't mind." },
  { id: "v-gen-10", theme: "Conectores", es: "Merece la pena.", en: "It's worth it." },
];
