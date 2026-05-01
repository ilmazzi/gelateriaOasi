-- Panini: allineato a AdminPanini / Home / apiClient.entities.Panino
CREATE TABLE IF NOT EXISTS public.panini (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descrizione TEXT,
  foto TEXT,
  prezzo NUMERIC(10, 2),
  ingredienti TEXT,
  categoria TEXT NOT NULL DEFAULT 'panino',
  categoria_id UUID REFERENCES public.categorie (id) ON DELETE SET NULL,
  in_evidenza BOOLEAN NOT NULL DEFAULT FALSE,
  disponibile BOOLEAN NOT NULL DEFAULT TRUE,
  allergeni TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_panini_disponibile ON public.panini (disponibile);
CREATE INDEX IF NOT EXISTS idx_panini_categoria_id ON public.panini (categoria_id);
