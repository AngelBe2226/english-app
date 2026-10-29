// Valores PÚBLICOS del proyecto de Supabase "english-app" (Project Settings →
// Data API / API Keys). La publishable key está pensada para ir en el
// navegador: la seguridad la ponen las políticas RLS de supabase/schema.sql
// (cada usuario solo ve sus filas) y sync_push está cerrada a anónimos.
// Se pueden sobrescribir con VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.
// NUNCA poner aquí la secret key ni la service_role.
const env = import.meta.env || {};
export const SUPABASE_URL = env.VITE_SUPABASE_URL || "https://ssitvsnhecgkbgeklbye.supabase.co";
export const SUPABASE_ANON_KEY =
  env.VITE_SUPABASE_ANON_KEY || "sb_publishable_TSYgt5aCJZxGrhYoDtlYOQ_fdHhhJ7r";
