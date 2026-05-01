-- Su DB già creati solo con lo schema Supabase originale (senza categoria_id), aggiunge le colonne usate dal frontend.
ALTER TABLE public.gelati
  ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES public.categorie (id) ON DELETE SET NULL;

ALTER TABLE public.panini
  ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES public.categorie (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_gelati_categoria_id ON public.gelati (categoria_id);
CREATE INDEX IF NOT EXISTS idx_panini_categoria_id ON public.panini (categoria_id);
