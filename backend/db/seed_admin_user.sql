-- Utente admin iniziale (JWT / tabella public.users)
-- Password di questo seed: CambiaSubito2026!
-- Rigenera l'hash con: node -e "require('bcrypt').hash('TuaPassword', 10).then(console.log)"
-- Esegui DOPO schema_railway_full.sql (o quando esiste public.users).

INSERT INTO public.users (email, password_hash, role)
VALUES (
  'davide.mazzitelli84@gmail.com',
  '$2b$10$zuR7ZM11sIqIWjeBRztXHOtmaFFl5cnKN22RTgNNCiTo64m7VBi3G',
  'admin'
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  updated_at = NOW();
