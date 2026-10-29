// Valores PÚBLICOS del proyecto de Supabase (Project Settings → API → Project
// URL y anon public key). La anon key está pensada para ir en el navegador: la
// seguridad la ponen las políticas RLS de supabase/schema.sql (cada usuario
// solo ve sus filas). Mientras estén vacíos, la sincronización queda apagada y
// la app funciona igual que antes (solo en local).
const env = import.meta.env || {};
export const SUPABASE_URL = env.VITE_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || "";
