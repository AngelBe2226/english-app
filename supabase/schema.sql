-- ============================================================
-- Índice de Inglés — sincronización del progreso entre dispositivos
-- Pégalo UNA vez en Supabase → SQL Editor → Run.
--
-- Modelo: clave/valor por usuario (igual que el progreso local de la app).
-- Fusión sin conflictos: cada clave por separado, gana la escritura más
-- reciente (updated_at = reloj del dispositivo que hizo el cambio). Los
-- borrados se guardan como "lápidas" (deleted = true) para que viajen.
-- server_ts lo pone el servidor y sirve para pedir "lo nuevo desde X".
-- ============================================================

create table if not exists public.progress (
  user_id    uuid    not null default auth.uid() references auth.users (id) on delete cascade,
  key        text    not null,
  value      text,
  deleted    boolean not null default false,
  updated_at bigint  not null,
  server_ts  bigint  not null default (floor(extract(epoch from clock_timestamp()) * 1000))::bigint,
  primary key (user_id, key)
);

create index if not exists progress_user_server_ts on public.progress (user_id, server_ts);

-- Seguridad: cada usuario solo ve y toca sus propias filas.
alter table public.progress enable row level security;

drop policy if exists "progress_own_rows" on public.progress;
create policy "progress_own_rows" on public.progress
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Subida en lote con "gana el más reciente" aplicado en el servidor:
-- una fila existente solo se sobrescribe si lo que llega es más nuevo.
create or replace function public.sync_push(items jsonb)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  n  integer := 0;
  it jsonb;
begin
  for it in select * from jsonb_array_elements(items) loop
    insert into public.progress as p (user_id, key, value, deleted, updated_at, server_ts)
    values (
      auth.uid(),
      it ->> 'key',
      it ->> 'value',
      coalesce((it ->> 'deleted')::boolean, false),
      (it ->> 'updated_at')::bigint,
      (floor(extract(epoch from clock_timestamp()) * 1000))::bigint
    )
    on conflict (user_id, key) do update
      set value      = excluded.value,
          deleted    = excluded.deleted,
          updated_at = excluded.updated_at,
          server_ts  = excluded.server_ts
      where p.updated_at < excluded.updated_at;
    if found then
      n := n + 1;
    end if;
  end loop;
  return n;
end;
$$;

revoke all on function public.sync_push(jsonb) from public, anon;
grant execute on function public.sync_push(jsonb) to authenticated;
