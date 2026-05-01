-- Gelateria Oasi - Full schema bootstrap for Railway Postgres
-- Safe to run multiple times (IF NOT EXISTS / ON CONFLICT)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- Core lookups
-- ============================================================
CREATE TABLE IF NOT EXISTS public.product_types (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_types_active ON public.product_types (active);

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

-- ============================================================
-- Catalog
-- ============================================================
CREATE TABLE IF NOT EXISTS public.gelati (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descrizione TEXT,
  foto TEXT,
  prezzo_piccolo NUMERIC(10, 2),
  prezzo_medio NUMERIC(10, 2),
  prezzo_grande NUMERIC(10, 2),
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

CREATE TABLE IF NOT EXISTS public.foto_galleria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titolo TEXT,
  descrizione TEXT,
  foto_url TEXT NOT NULL,
  in_evidenza BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_foto_galleria_evidenza ON public.foto_galleria (in_evidenza);

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

-- ============================================================
-- Orders
-- ============================================================
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

-- ============================================================
-- API/JWT users
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin'
    CHECK (role IN ('admin', 'staff', 'guest')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);

-- ============================================================
-- Minimal lookup seed (idempotent)
-- ============================================================
INSERT INTO public.product_types (id, type, active)
VALUES
  (1, 'Gelati', TRUE),
  (2, 'Panini', TRUE)
ON CONFLICT (id) DO NOTHING;

SELECT setval(
  pg_get_serial_sequence('public.product_types', 'id'),
  COALESCE((SELECT MAX(id) FROM public.product_types), 1)
);

INSERT INTO public.categorie (name, name_it, label, product_type_id, active)
SELECT 'Classico', 'Classico', 'Classico', 1, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.categorie c WHERE c.name = 'Classico' AND c.product_type_id = 1);

INSERT INTO public.categorie (name, name_it, label, product_type_id, active)
SELECT 'Frutta', 'Frutta', 'Frutta', 1, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.categorie c WHERE c.name = 'Frutta' AND c.product_type_id = 1);

INSERT INTO public.categorie (name, name_it, label, product_type_id, active)
SELECT 'Panino', 'Panino', 'Panino', 2, TRUE
WHERE NOT EXISTS (SELECT 1 FROM public.categorie c WHERE c.name = 'Panino' AND c.product_type_id = 2);
