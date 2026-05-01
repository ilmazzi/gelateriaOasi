CREATE TABLE IF NOT EXISTS public.promozioni (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titolo TEXT NOT NULL,
  descrizione TEXT,
  foto TEXT,
  data_inizio DATE,
  data_fine DATE,
  sconto_percentuale INTEGER,
  attiva BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promozioni_attiva ON public.promozioni (attiva);
