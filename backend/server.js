import "dotenv/config";
import express from "express";
import cors from "cors";
import { query } from "./utils/connectDB.js";
import authRoutes from "./routes/authRoutes.js";
import entitiesRoutes from "./routes/entitiesRoutes.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
// Upload immagini lato frontend usa data URL (base64), quindi serve un limite più alto.
app.use(express.json({ limit: "15mb" }));

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

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
