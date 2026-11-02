-- ============================================================
-- Índice de Inglés — acceso solo para emails autorizados
-- Pégalo en Supabase → SQL Editor → Run (después de schema.sql).
--
-- Dos cerrojos, los dos en el servidor:
--   1. Registro: un email que no está en la lista no puede crear cuenta
--      (ni siquiera recibe el email de confirmación).
--   2. Datos: aunque exista una cuenta de antes, si su email no está en la
--      lista no puede leer ni subir progreso.
-- La lista NO va en este archivo (el repositorio es público): los emails se
-- añaden aparte con
--   insert into public.allowed_emails (email) values ('alguien@ejemplo.com');
-- y se quitan con
--   delete from public.allowed_emails where email = 'alguien@ejemplo.com';
-- ============================================================

create table if not exists public.allowed_emails (
  email text primary key check (email = lower(trim(email)))
);

-- Sin políticas: la app no puede leer ni tocar la lista.
alter table public.allowed_emails enable row level security;
revoke all on public.allowed_emails from anon, authenticated;

-- 1. Registro: corta la creación de la cuenta si el email no está en la lista.
create or replace function public.block_unlisted_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.allowed_emails where email = lower(trim(new.email))) then
    raise exception 'EMAIL_NOT_ALLOWED';
  end if;
  return new;
end;
$$;

revoke all on function public.block_unlisted_signup() from public, anon, authenticated;

drop trigger if exists only_allowed_emails on auth.users;
create trigger only_allowed_emails
  before insert on auth.users
  for each row execute function public.block_unlisted_signup();

-- 2. Datos: ¿el email de la sesión está en la lista?
create or replace function public.current_user_allowed()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.allowed_emails where email = lower(trim(auth.jwt() ->> 'email'))
  );
$$;

revoke all on function public.current_user_allowed() from public, anon;
grant execute on function public.current_user_allowed() to authenticated;

drop policy if exists "progress_own_rows" on public.progress;
create policy "progress_own_rows" on public.progress
  for all
  using (auth.uid() = user_id and public.current_user_allowed())
  with check (auth.uid() = user_id and public.current_user_allowed());
