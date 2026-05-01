import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const useSsl = process.env.PG_SSL === "true";
const databaseUrl = process.env.DATABASE_URL?.trim();

/** Compat: nostre PG_* oppure variabili libpq / Railway (${{ Postgres.* }}) */
const pgUser = process.env.PG_USER || process.env.PGUSER;
const pgPassword = process.env.PG_PASSWORD || process.env.PGPASSWORD;
const pgHost = process.env.PG_HOST || process.env.PGHOST;
const pgPort = process.env.PG_PORT || process.env.PGPORT;
const pgDatabase = process.env.PG_DATABASE || process.env.PGDATABASE;

let pool;

if (databaseUrl) {
  pool = new pg.Pool({
    connectionString: databaseUrl,
    ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  });
} else if (pgUser && pgPassword && pgHost && pgPort && pgDatabase) {
  pool = new pg.Pool({
    user: pgUser,
    password: pgPassword,
    host: pgHost,
    port: Number(pgPort),
    database: pgDatabase,
    ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  });
} else {
  throw new Error(
    "Database non configurato: imposta DATABASE_URL oppure PG_USER/PG_PASSWORD/PG_HOST/PG_PORT/PG_DATABASE " +
      "(o le equivalenti PGUSER, PGPASSWORD, PGHOST, PGPORT, PGDATABASE da Railway Postgres).",
  );
}

pool.on("error", (err) => {
  console.error("Postgres pool error:", err);
});

export const query = (text, params) => pool.query(text, params);
