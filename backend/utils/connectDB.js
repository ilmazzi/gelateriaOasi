import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const requiredEnvVars = ["PG_USER", "PG_PASSWORD", "PG_HOST", "PG_PORT", "PG_DATABASE"];

for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    throw new Error(`Environment variable ${key} is not set`);
  }
}

const useSsl = process.env.PG_SSL === "true";

const pool = new pg.Pool({
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  host: process.env.PG_HOST,
  port: Number(process.env.PG_PORT),
  database: process.env.PG_DATABASE,
  ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});

pool.on("error", (err) => {
  console.error("Postgres pool error:", err);
});

export const query = (text, params) => pool.query(text, params);
