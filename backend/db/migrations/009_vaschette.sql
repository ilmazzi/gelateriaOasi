CREATE TABLE IF NOT EXISTS public.vaschette (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  nome TEXT NOT NULL,
  peso_grammi INTEGER NOT NULL,
  prezzo NUMERIC(10, 2) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  ordinamento INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_vaschette_active ON public.vaschette (active);
