import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import { query } from "./utils/connectDB.js";
import authRoutes from "./routes/authRoutes.js";
import entitiesRoutes from "./routes/entitiesRoutes.js";

/** Railway imposta PORT; stringhe vuote o valori non numerici causerebbero bind sulla porta sbagliata → 502 dal proxy. */
const resolveListenPort = () => {
  const raw = process.env.PORT;
  if (raw === undefined || raw === null || String(raw).trim() === "") return 3000;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 3000;
};

const app = express();
const port = resolveListenPort();

/** Dietro il proxy Railway (HTTPS terminato dall’edge). */
app.set("trust proxy", 1);

/** Più affidabile di "*" con preflight + header Authorization (vedi fetch API). */
const parseCorsOrigins = (raw) => {
  if (raw == null || !String(raw).trim()) return true;
  const s = String(raw).replace(/\/$/, "").trim();
  if (!s || s === "*") return true;
  const list = s.split(",").map((o) => o.trim().replace(/\/$/, "")).filter(Boolean);
  if (list.length === 0) return true;
  if (list.length === 1) return list[0];
  return list;
};

app.use(
  cors({
    origin: parseCorsOrigins(process.env.CORS_ORIGIN),
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
// Upload immagini lato frontend usa data URL (base64), quindi serve un limite più alto.
app.use(express.json({ limit: "15mb" }));

/** Railway / probe generici spesso chiamano `/`; senza route si avrebbe 404 e il deploy può restare non routabile (502). */
app.get("/", (req, res) => {
  res.json({ ok: true });
});

/** Verifica che il processo Express sia su. */
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

/** Verifica che il pool Postgres risponda (usa `query` da connectDB). */
app.get("/health/db", async (req, res) => {
  try {
    await query("SELECT 1");
    res.json({ ok: true, db: true });
  } catch (err) {
    res.status(503).json({
      ok: false,
      db: false,
      error: err.message,
    });
  }
});

app.use("/api", authRoutes);
app.use("/api", entitiesRoutes);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(statusCode).json({ error: message });
});

/**
 * Alcuni ambienti Cloud raggiungono il pod via IPv6; bind solo su 0.0.0.0 non riceve quel traffico → 502 pur essendo “listening”.
 * Ordine: HOST esplicito (env) → :: → 0.0.0.0
 */
const bindHosts =
  process.env.HOST != null && String(process.env.HOST).trim() !== ""
    ? [String(process.env.HOST).trim()]
    : ["::", "0.0.0.0"];

function startServer(hostIndex) {
  if (hostIndex >= bindHosts.length) {
    console.error("[startup] bind fallito su tutti gli host:", bindHosts.join(", "));
    process.exit(1);
  }

  const host = bindHosts[hostIndex];
  const server = http.createServer(app);

  const onEarlyError = (err) => {
    console.warn(`[startup] bind ${JSON.stringify(host)}:${port} → ${err.code ?? ""} ${err.message}`);
    server.close(() => startServer(hostIndex + 1));
  };

  server.once("error", onEarlyError);

  server.listen(port, host, () => {
    server.off("error", onEarlyError);
    server.on("error", (err) => console.error("[runtime] HTTP server error:", err));

    const addr = server.address();
    console.log(
      `[startup] pid=${process.pid} NODE_ENV=${process.env.NODE_ENV ?? "(unset)"} PORT(env)=${JSON.stringify(process.env.PORT)} address=${JSON.stringify(addr)}`,
    );
  });
}

startServer(0);
