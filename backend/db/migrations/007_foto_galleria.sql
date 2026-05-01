CREATE TABLE IF NOT EXISTS public.foto_galleria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titolo TEXT,
  descrizione TEXT,
  foto_url TEXT NOT NULL,
  in_evidenza BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_foto_galleria_evidenza ON public.foto_galleria (in_evidenza);
