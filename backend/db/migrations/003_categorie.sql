-- Categorie per menu/admin (AdminCategorie, filtri per tipo prodotto)
CREATE TABLE IF NOT EXISTS public.categorie (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_it TEXT,
  label TEXT,
  slug TEXT,
  value TEXT,
  product_type_id BIGINT NOT NULL REFERENCES public.product_types (id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categorie_product_type ON public.categorie (product_type_id);
CREATE INDEX IF NOT EXISTS idx_categorie_active ON public.categorie (active);
