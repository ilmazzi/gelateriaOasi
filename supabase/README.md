# Supabase setup

## 1) Cloud project

1. Create a Supabase project.
2. Open **Project Settings -> API**.
3. Copy:
   - `Project URL` -> `VITE_SUPABASE_URL`
   - `anon public` key -> `VITE_SUPABASE_ANON_KEY`
4. Create `.env.local` from `.env.example`.

## 2) Run migrations and seed (SQL editor)

Execute, in order:

1. `supabase/migrations/20260428140500_init.sql`
2. `supabase/seed.sql`

## 3) Local + Cloud workflow

- Use the same schema files for both local and cloud.
- For local development, start a local Supabase stack with Supabase CLI and run the same SQL files.
- Keep env vars in `.env.local` and switch between local/cloud by changing URL + anon key.

## 4) Booking emails (cliente + gelateria)

Deploy edge function:

1. `supabase functions deploy send-booking-emails`
2. Set secrets:
   - `supabase secrets set BREVO_API_KEY=...`
   - `supabase secrets set BOOKING_FROM_EMAIL='Gelateria Oasi <no-reply@tuodominio.it>'`
   - `supabase secrets set GELATERIA_BOOKING_EMAIL='prenotazioni@tuodominio.it'`

When a booking is created from `Prenota`, the app invokes this function and sends:
- one email to gelateria
- one confirmation email to cliente (if email is provided)
