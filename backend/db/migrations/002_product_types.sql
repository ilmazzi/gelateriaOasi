-- Tipi prodotto (Gelati / Panini / …) — usati da categorie e da apiClient.categoryByProductType
CREATE TABLE IF NOT EXISTS public.product_types (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_types_active ON public.product_types (active);
