create extension if not exists "pgcrypto";

create table if not exists public.gelati (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descrizione text,
  foto text,
  prezzo_piccolo numeric(10,2),
  prezzo_medio numeric(10,2),
  prezzo_grande numeric(10,2),
  categoria text not null default 'classico',
  in_evidenza boolean not null default false,
  disponibile boolean not null default true,
  allergeni text,
  created_at timestamptz not null default now()
);

create table if not exists public.promozioni (
  id uuid primary key default gen_random_uuid(),
  titolo text not null,
  descrizione text,
  foto text,
  data_inizio date,
  data_fine date,
  sconto_percentuale integer,
  attiva boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.foto_galleria (
  id uuid primary key default gen_random_uuid(),
  titolo text,
  descrizione text,
  foto_url text not null,
  in_evidenza boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.prenotazioni (
  id uuid primary key default gen_random_uuid(),
  nome_cliente text not null,
  telefono text not null,
  email text,
  data_ritiro date not null,
  ora_ritiro text not null,
  gusti text not null,
  taglia text default 'media',
  quantita integer not null default 1,
  note text,
  stato text not null default 'in_attesa',
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'staff',
  created_at timestamptz not null default now()
);

alter table public.gelati enable row level security;
alter table public.promozioni enable row level security;
alter table public.foto_galleria enable row level security;
alter table public.prenotazioni enable row level security;
alter table public.profiles enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'admin'
  );
$$;

drop policy if exists "public can read visible gelati" on public.gelati;
create policy "public can read visible gelati"
on public.gelati
for select
to anon, authenticated
using (disponibile = true);

drop policy if exists "public can read active promos" on public.promozioni;
create policy "public can read active promos"
on public.promozioni
for select
to anon, authenticated
using (attiva = true);

drop policy if exists "public can read highlighted photos" on public.foto_galleria;
create policy "public can read highlighted photos"
on public.foto_galleria
for select
to anon, authenticated
using (in_evidenza = true);

drop policy if exists "public can insert prenotazioni" on public.prenotazioni;
create policy "public can insert prenotazioni"
on public.prenotazioni
for insert
to anon, authenticated
with check (true);

drop policy if exists "admin full access gelati" on public.gelati;
create policy "admin full access gelati"
on public.gelati
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin full access promozioni" on public.promozioni;
create policy "admin full access promozioni"
on public.promozioni
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin full access foto" on public.foto_galleria;
create policy "admin full access foto"
on public.foto_galleria
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin full access prenotazioni" on public.prenotazioni;
create policy "admin full access prenotazioni"
on public.prenotazioni
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "users can read own profile" on public.profiles;
create policy "users can read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "admin can manage profiles" on public.profiles;
create policy "admin can manage profiles"
on public.profiles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
