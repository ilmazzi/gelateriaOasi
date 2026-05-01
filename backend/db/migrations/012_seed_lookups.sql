-- Dati minimi per far funzionare categoryByProductType / menu (opzionale, idempotente)
-- Esegui dopo 002–003. Gli id 1 e 2 sono stabili per collegare categorie da Admin.

INSERT INTO public.product_types (id, type, active)
VALUES
  (1, 'Gelati', TRUE),
  (2, 'Panini', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Allinea la sequenza bigserial dopo insert espliciti
SELECT setval(
  pg_get_serial_sequence('public.product_types', 'id'),
  COALESCE((SELECT MAX(id) FROM public.product_types), 1)
);

-- Esempi: aggiungi altre categorie da /admin/categorie
INSERT INTO public.categorie (name, name_it, label, product_type_id, active)
SELECT 'Classico', 'Classico', 'Classico', 1, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.categorie c WHERE c.name = 'Classico' AND c.product_type_id = 1);

INSERT INTO public.categorie (name, name_it, label, product_type_id, active)
SELECT 'Frutta', 'Frutta', 'Frutta', 1, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.categorie c WHERE c.name = 'Frutta' AND c.product_type_id = 1);

INSERT INTO public.categorie (name, name_it, label, product_type_id, active)
SELECT 'Panino', 'Panino', 'Panino', 2, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.categorie c WHERE c.name = 'Panino' AND c.product_type_id = 2);
