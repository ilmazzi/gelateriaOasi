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

const createPool = () => {
  const { databaseUrl, pgUser, pgPassword, pgHost, pgPort, pgDatabase } = readConfig();
  const ssl = useSsl() ? { ssl: { rejectUnauthorized: false } } : {};

  if (databaseUrl) {
    return new pg.Pool({
      connectionString: databaseUrl,
      ...ssl,
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
