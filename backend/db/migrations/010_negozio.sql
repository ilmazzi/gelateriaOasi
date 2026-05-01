-- Record singolo o pochi; frontend usa list()[0] (Footer, Home, AdminNegozio)
CREATE TABLE IF NOT EXISTS public.negozio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descrizione TEXT,
  foto TEXT,
  indirizzo TEXT,
  telefono TEXT,
  email TEXT,
  orari TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
