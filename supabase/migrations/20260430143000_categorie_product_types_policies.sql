alter table public.categorie enable row level security;
alter table public.product_types enable row level security;

drop policy if exists "public can read active categorie" on public.categorie;
create policy "public can read active categorie"
on public.categorie
for select
to anon, authenticated
using (active = true);

drop policy if exists "public can read active product types" on public.product_types;
create policy "public can read active product types"
on public.product_types
for select
to anon, authenticated
using (active = true);

drop policy if exists "admin full access categorie" on public.categorie;
create policy "admin full access categorie"
on public.categorie
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin full access product types" on public.product_types;
create policy "admin full access product types"
on public.product_types
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
