create table if not exists public.vaschette (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  nome text not null,
  peso_grammi integer not null,
  prezzo numeric(10,2) not null,
  active boolean not null default true,
  ordinamento integer not null default 0
);

alter table public.vaschette enable row level security;

drop policy if exists "public can read active vaschette" on public.vaschette;
create policy "public can read active vaschette"
on public.vaschette
for select
to anon, authenticated
using (active = true);

drop policy if exists "admin full access vaschette" on public.vaschette;
create policy "admin full access vaschette"
on public.vaschette
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
