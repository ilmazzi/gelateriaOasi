import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const useSsl = () => process.env.PG_SSL === "true";

const readConfig = () => {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const pgUser = process.env.PG_USER || process.env.PGUSER;
  const pgPassword = process.env.PG_PASSWORD || process.env.PGPASSWORD;
  const pgHost = process.env.PG_HOST || process.env.PGHOST;
  const pgPort = process.env.PG_PORT || process.env.PGPORT || "5432";
  const pgDatabase = process.env.PG_DATABASE || process.env.PGDATABASE;
  return { databaseUrl, pgUser, pgPassword, pgHost, pgPort, pgDatabase };
};

let pool;
let poolInitError;

/** Connessioni TLS verso Postgres gestite dal driver; qui solo dimensionamento pool e timeout di attesa. */
const poolSizing = () => ({
  max: Math.max(2, Math.min(Number(process.env.PG_POOL_MAX || 12), 30)),
  idleTimeoutMillis: Number(process.env.PG_IDLE_MS || 30_000),
  connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT_MS || 10_000),
});

const createPool = () => {
  const { databaseUrl, pgUser, pgPassword, pgHost, pgPort, pgDatabase } = readConfig();
  const ssl = useSsl() ? { ssl: { rejectUnauthorized: false } } : {};
  const sizing = poolSizing();

  if (databaseUrl) {
    return new pg.Pool({
      connectionString: databaseUrl,
      ...ssl,
      ...sizing,
    });
  }
  if (pgUser && pgPassword && pgHost && pgDatabase) {
    return new pg.Pool({
      user: pgUser,
      password: pgPassword,
      host: pgHost,
      port: Number(pgPort),
      database: pgDatabase,
      ...ssl,
      ...sizing,
    });
  }
  return null;
};

/** Pool creato al primo utilizzo così il server può fare bind su PORT anche se mancano ancora le variabili DB su Railway. */
const getPool = () => {
  if (poolInitError) throw poolInitError;
  if (pool) return pool;

  const next = createPool();
  if (!next) {
    poolInitError = new Error(
      "Database non configurato: imposta DATABASE_URL oppure PG_USER, PG_PASSWORD, PG_HOST, PG_DATABASE " +
        "(PG_PORT opzionale, default 5432). Equivalenti libpq: PGUSER, PGPASSWORD, PGHOST, PGDATABASE.",
    );
    throw poolInitError;
  }
  pool = next;
  pool.on("error", (err) => {
    console.error("Postgres pool error:", err);
  });
  return pool;
};

export const query = (text, params) => getPool().query(text, params);

/** Dopo cold start apre subito 1–2 connessioni così la prima richiesta utente non paga tutto il handshake. */
export async function warmupDbPool() {
  try {
    await Promise.all([query("SELECT 1"), query("SELECT 1 AS n")]);
    console.log("[db] warmup ok");
  } catch (err) {
    console.warn("[db] warmup:", err instanceof Error ? err.message : err);
  }
}
