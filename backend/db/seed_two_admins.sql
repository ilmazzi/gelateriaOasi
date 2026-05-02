-- Due utenti admin (JWT / public.users)
-- Esegui dopo schema/migrazioni che creano public.users.
--
-- Credenziali di DEFAULT (cambiare email prima di eseguire se vuoi altri indirizzi):
--   admin1@baroasigelateria.it  →  OasiAdminSeed2026!
--   admin2@baroasigelateria.it  →  OasiAdmin2Seed2026!
--
-- Rigenera hash bcrypt (cost 10) dal backend:
--   node -e "require('bcrypt').hash('TuaPassword', 10).then(console.log)"

INSERT INTO public.users (email, password_hash, role)
VALUES
  (
    'lucafrix@gmail.com',
    '$2b$10$iO/PupkdHYXTeceH6o6S0O7YX09ocXHPUvFENBTLnYt.4c8XARKdu',
    'admin'
  ),
  (
    'm4rti_a@yahoo.it',
    '$2b$10$iO/PupkdHYXTeceH6o6S0O7YX09ocXHPUvFENBTLnYt.4c8XARKdu',
    'admin'
  )
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  updated_at = NOW();
