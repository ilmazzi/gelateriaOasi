import { query } from "../utils/connectDB.js";
import {
  isBookingEmailConfigured,
  isBrevoOutboundConfigured,
  sendBookingStatusEmail,
  sendNewBookingEmails,
} from "../services/bookingEmails.js";

const TABLES = {
  gelati: {
    idColumn: "id",
    writableColumns: [
      "nome",
      "descrizione",
      "foto",
      "prezzo_piccolo",
      "prezzo_medio",
      "prezzo_grande",
      "categoria",
      "categoria_id",
      "in_evidenza",
      "disponibile",
      "allergeni",
    ],
  },
  panini: {
    idColumn: "id",
    writableColumns: [
      "nome",
      "descrizione",
      "foto",
      "prezzo",
      "ingredienti",
      "categoria",
      "categoria_id",
      "in_evidenza",
      "disponibile",
      "allergeni",
    ],
  },
  promozioni: {
    idColumn: "id",
    writableColumns: ["titolo", "descrizione", "foto", "data_inizio", "data_fine", "sconto_percentuale", "attiva"],
  },
  foto_galleria: {
    idColumn: "id",
    writableColumns: ["titolo", "descrizione", "foto_url", "in_evidenza"],
  },
  prenotazioni: {
    idColumn: "id",
    writableColumns: [
      "nome_cliente",
      "telefono",
      "email",
      "data_ritiro",
      "ora_ritiro",
      "gusti",
      "taglia",
      "quantita",
      "note",
      "stato",
    ],
  },
  vaschette: {
    idColumn: "id",
    writableColumns: ["nome", "peso_grammi", "prezzo", "active", "ordinamento"],
  },
  negozio: {
    idColumn: "id",
    writableColumns: ["nome", "descrizione", "foto", "indirizzo", "telefono", "email", "orari"],
  },
  categorie: {
    idColumn: "id",
    writableColumns: ["name", "name_it", "label", "slug", "value", "product_type_id", "active"],
  },
  product_types: {
    idColumn: "id",
    writableColumns: ["type", "active"],
  },
};

const ORDERABLE_COLUMNS = new Set([
  "id",
  "created_at",
  "nome",
  "titolo",
  "type",
  "name",
  "ordinamento",
  "data_inizio",
  "data_fine",
  "created_date",
]);

const resolveTable = (table) => {
  const normalized = String(table || "").trim().toLowerCase();
  const config = TABLES[normalized];
  if (!config) return null;
  return { name: normalized, ...config };
};

const normalizeRow = (row) => ({
  ...row,
  created_date: row.created_at,
});

const parseOrder = (orderByRaw) => {
  const orderBy = String(orderByRaw || "-created_date").trim();
  const descending = orderBy.startsWith("-");
  const candidate = descending ? orderBy.slice(1) : orderBy;
  const column = candidate === "created_date" ? "created_at" : candidate;
  if (!ORDERABLE_COLUMNS.has(column)) return { column: "created_at", ascending: false };
  return { column, ascending: !descending };
};

const pickWritablePayload = (payload, writableColumns) => {
  const next = {};
  for (const key of writableColumns) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      next[key] = payload[key];
    }
  }
  return next;
};

const buildFilterSql = (where, writableColumns) => {
  const allowedColumns = new Set([...writableColumns, "id", "created_at"]);
  const clauses = [];
  const values = [];
  for (const [key, value] of Object.entries(where || {})) {
    if (!allowedColumns.has(key)) continue;
    values.push(value);
    clauses.push(`${key} = $${values.length}`);
  }
  return { clauses, values };
};

export const listEntities = async (req, res) => {
  try {
    const table = resolveTable(req.params.table);
    if (!table) return res.status(404).json({ message: "Tabella non supportata" });

    const { column, ascending } = parseOrder(req.query.orderBy);
    const limit = Math.min(Math.max(Number(req.query.limit) || 1000, 1), 5000);

    const { rows } = await query(
      `SELECT * FROM public.${table.name} ORDER BY ${column} ${ascending ? "ASC" : "DESC"} LIMIT $1`,
      [limit],
    );

    return res.json(rows.map(normalizeRow));
  } catch (err) {
    console.error("listEntities", err);
    return res.status(500).json({ message: "Errore server" });
  }
};

export const filterEntities = async (req, res) => {
  try {
    const table = resolveTable(req.params.table);
    if (!table) return res.status(404).json({ message: "Tabella non supportata" });

    const where = req.body?.where || {};
    const { clauses, values } = buildFilterSql(where, table.writableColumns);
    const whereSql = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

    const { rows } = await query(`SELECT * FROM public.${table.name} ${whereSql}`, values);
    return res.json(rows.map(normalizeRow));
  } catch (err) {
    console.error("filterEntities", err);
    return res.status(500).json({ message: "Errore server" });
  }
};

export const createEntity = async (req, res) => {
  try {
    const table = resolveTable(req.params.table);
    if (!table) return res.status(404).json({ message: "Tabella non supportata" });

    const payload = pickWritablePayload(req.body || {}, table.writableColumns);

    if (table.name === "prenotazioni" && !Object.prototype.hasOwnProperty.call(payload, "stato")) {
      payload.stato = "in_attesa";
    }

    const keys = Object.keys(payload);
    if (!keys.length) return res.status(400).json({ message: "Payload vuoto" });

    const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
    const values = keys.map((key) => payload[key]);

    const sql = `INSERT INTO public.${table.name} (${keys.join(", ")}) VALUES (${placeholders}) RETURNING *`;
    const { rows } = await query(sql, values);

    const row = normalizeRow(rows[0]);
    const extra = {};

    if (table.name === "prenotazioni") {
      if (isBookingEmailConfigured()) {
        try {
          await sendNewBookingEmails(row);
          extra._bookingEmailsSent = true;
        } catch (mailErr) {
          console.error("createEntity booking email", mailErr);
          extra._bookingEmailsSent = false;
          extra._bookingEmailsError = mailErr instanceof Error ? mailErr.message : String(mailErr);
        }
      } else {
        console.warn(
          "[booking] email non inviate: configura BREVO_API_KEY, BOOKING_FROM_EMAIL, GELATERIA_BOOKING_EMAIL sul backend",
        );
      }
    }

    return res.status(201).json({ ...row, ...extra });
  } catch (err) {
    console.error("createEntity", err);
    return res.status(500).json({ message: "Errore server" });
  }
};

export const updateEntity = async (req, res) => {
  try {
    const table = resolveTable(req.params.table);
    if (!table) return res.status(404).json({ message: "Tabella non supportata" });

    const payload = pickWritablePayload(req.body || {}, table.writableColumns);
    const keys = Object.keys(payload);
    if (!keys.length) return res.status(400).json({ message: "Payload vuoto" });

    const id = req.params.id;

    let prevStato = null;
    if (table.name === "prenotazioni" && Object.prototype.hasOwnProperty.call(payload, "stato")) {
      const { rows: prevRows } = await query(`SELECT stato FROM public.${table.name} WHERE ${table.idColumn} = $1`, [
        id,
      ]);
      if (!prevRows[0]) return res.status(404).json({ message: "Record non trovato" });
      prevStato = prevRows[0].stato;
    }

    const assignments = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
    const values = [...keys.map((key) => payload[key]), id];

    const sql = `UPDATE public.${table.name} SET ${assignments} WHERE ${table.idColumn} = $${values.length} RETURNING *`;
    const { rows } = await query(sql, values);
    if (!rows[0]) return res.status(404).json({ message: "Record non trovato" });

    const row = normalizeRow(rows[0]);
    const extra = {};

    if (
      table.name === "prenotazioni" &&
      Object.prototype.hasOwnProperty.call(payload, "stato") &&
      prevStato != null &&
      String(prevStato) !== String(row.stato)
    ) {
      if (row.email && String(row.email).trim()) {
        if (isBrevoOutboundConfigured()) {
          try {
            await sendBookingStatusEmail(row);
            extra._statusEmailSent = true;
          } catch (mailErr) {
            console.error("updateEntity status email", mailErr);
            extra._statusEmailSent = false;
            extra._statusEmailError = mailErr instanceof Error ? mailErr.message : String(mailErr);
          }
        } else {
          console.warn("[booking] email stato non inviata: imposta BREVO_API_KEY e BOOKING_FROM_EMAIL sul backend");
        }
      }
    }

    return res.json({ ...row, ...extra });
  } catch (err) {
    console.error("updateEntity", err);
    return res.status(500).json({ message: "Errore server" });
  }
};

export const deleteEntity = async (req, res) => {
  try {
    const table = resolveTable(req.params.table);
    if (!table) return res.status(404).json({ message: "Tabella non supportata" });

    const { rowCount } = await query(`DELETE FROM public.${table.name} WHERE ${table.idColumn} = $1`, [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: "Record non trovato" });

    return res.json({ ok: true });
  } catch (err) {
    console.error("deleteEntity", err);
    return res.status(500).json({ message: "Errore server" });
  }
};

export const listCategorieByProductType = async (req, res) => {
  try {
    const productType = String(req.params.productType || "").trim().toLowerCase();
    if (!productType) return res.json([]);

    const variants = new Set([productType]);
    if (productType.endsWith("o")) variants.add(`${productType.slice(0, -1)}i`);
    if (productType.endsWith("i")) variants.add(`${productType.slice(0, -1)}o`);

    const { rows: types } = await query(`SELECT id, type FROM public.product_types WHERE active = TRUE`);
    const typeRow = types.find((row) => {
      const dbType = String(row.type || "").trim().toLowerCase();
      if (!dbType) return false;
      for (const variant of variants) {
        if (dbType === variant || dbType.includes(variant) || variant.includes(dbType)) return true;
      }
      return false;
    });

    if (!typeRow?.id) return res.json([]);

    const { rows } = await query(
      `SELECT * FROM public.categorie WHERE active = TRUE AND product_type_id = $1 ORDER BY created_at DESC`,
      [typeRow.id],
    );

    return res.json(rows.map(normalizeRow));
  } catch (err) {
    console.error("listCategorieByProductType", err);
    return res.status(500).json({ message: "Errore server" });
  }
};
