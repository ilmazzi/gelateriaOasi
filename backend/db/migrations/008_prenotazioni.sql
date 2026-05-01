-- Stati usati in AdminPrenotazioni / Home: in_attesa, confermata, pronta, ritirata, annullata
CREATE TABLE IF NOT EXISTS public.prenotazioni (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_cliente TEXT NOT NULL,
  telefono TEXT NOT NULL,
  email TEXT,
  data_ritiro DATE NOT NULL,
  ora_ritiro TEXT NOT NULL,
  gusti TEXT NOT NULL,
  taglia TEXT DEFAULT 'media',
  quantita INTEGER NOT NULL DEFAULT 1,
  note TEXT,
  stato TEXT NOT NULL DEFAULT 'in_attesa',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prenotazioni_stato ON public.prenotazioni (stato);
CREATE INDEX IF NOT EXISTS idx_prenotazioni_created ON public.prenotazioni (created_at DESC);
