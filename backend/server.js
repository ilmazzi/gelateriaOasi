import "dotenv/config";
import express from "express";
import cors from "cors";
import { query } from "./utils/connectDB.js";
import authRoutes from "./routes/authRoutes.js";
import entitiesRoutes from "./routes/entitiesRoutes.js";

const app = express();
const port = process.env.PORT || 3000;

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

app.listen(Number(port), "0.0.0.0", () => {
  console.log(`Server listening on 0.0.0.0:${port}`);
});
