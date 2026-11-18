-- Tabla de lugares para Lorenzo. Pegar en Supabase → SQL Editor → Run.
create table if not exists public.places (
  id text not null,
  username text not null,
  title text not null,
  description text,
  image_uri text,
  latitude double precision not null,
  longitude double precision not null,
  created_at timestamptz not null default now(),
  primary key (username, id)
);

alter table public.places enable row level security;

-- Trabajo escolar: la clave publicable (rol anon) puede leer, crear y borrar lugares.
-- En una app real cada usuario solo podría tocar los suyos (con Supabase Auth).
drop policy if exists "places_anon_all" on public.places;
create policy "places_anon_all" on public.places
  for all to anon using (true) with check (true);

-- Bucket público para las fotos de los lugares (Storage).
insert into storage.buckets (id, name, public)
values ('lugares', 'lugares', true)
on conflict (id) do nothing;

drop policy if exists "lugares_anon_insert" on storage.objects;
create policy "lugares_anon_insert" on storage.objects
  for insert to anon with check (bucket_id = 'lugares');

drop policy if exists "lugares_anon_select" on storage.objects;
create policy "lugares_anon_select" on storage.objects
  for select to anon using (bucket_id = 'lugares');

drop policy if exists "lugares_anon_update" on storage.objects;
create policy "lugares_anon_update" on storage.objects
  for update to anon using (bucket_id = 'lugares') with check (bucket_id = 'lugares');

drop policy if exists "lugares_anon_delete" on storage.objects;
create policy "lugares_anon_delete" on storage.objects
  for delete to anon using (bucket_id = 'lugares');

-- Tabla de usuarios. Solo guarda el HASH SHA-256, nunca la contraseña.
create table if not exists public.users (
  username text primary key,
  password_hash text not null,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

drop policy if exists "users_anon_all" on public.users;
create policy "users_anon_all" on public.users
  for all to anon using (true) with check (true);
