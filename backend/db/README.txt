Migrazioni Postgres per API JWT / Railway (senza RLS Supabase)

Ordine consigliato (database vuoto):
  001_extensions.sql
  002_product_types.sql
  003_categorie.sql
  004_gelati.sql
  005_panini.sql
  006_promozioni.sql
  007_foto_galleria.sql
  008_prenotazioni.sql
  009_vaschette.sql
  010_negozio.sql
  011_users_jwt.sql
  012_seed_lookups.sql        (opzionale: tipi + categorie base)
  013_alter_add_categoria_id.sql  (opzionale: solo se importi un dump vecchio senza categoria_id)

Dati demo gelati/promo/foto: vedi supabase/seed.sql nella root del repo (stesse colonni tranne eventuale categoria_id).

Nota: public.profiles / auth.users erano per Supabase Auth; con login JWT usi public.users (011).
