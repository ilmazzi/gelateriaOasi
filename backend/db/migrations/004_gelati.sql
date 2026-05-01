-- Gelati: supabase init + colonne opzionali usate dal frontend (categoria_id)
CREATE TABLE IF NOT EXISTS public.gelati (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descrizione TEXT,
  foto TEXT,
  prezzo_piccolo NUMERIC(10, 2),
  prezzo_medio NUMERIC(10, 2),
  prezzo_grande NUMERIC(10, 2),
  -- Slug legacy (seed originale) o testo libero; Menu risolve anche tramite categoria_id
  categoria TEXT NOT NULL DEFAULT 'classico',
  categoria_id UUID REFERENCES public.categorie (id) ON DELETE SET NULL,
  in_evidenza BOOLEAN NOT NULL DEFAULT FALSE,
  disponibile BOOLEAN NOT NULL DEFAULT TRUE,
  allergeni TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gelati_disponibile ON public.gelati (disponibile);
CREATE INDEX IF NOT EXISTS idx_gelati_evidenza ON public.gelati (in_evidenza);
CREATE INDEX IF NOT EXISTS idx_gelati_categoria_id ON public.gelati (categoria_id);
