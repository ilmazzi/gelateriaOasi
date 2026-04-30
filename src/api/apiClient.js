import { assertSupabase, supabase } from "@/lib/supabase-client";

const TABLE_MAP = {
  Gelato: "gelati",
  Panino: "panini",
  Promozione: "promozioni",
  FotoGalleria: "foto_galleria",
  Prenotazione: "prenotazioni",
  Vaschetta: "vaschette",
  Negozio: "negozio",
  Categoria: "categorie",
  TipoProdotto: "product_types",
};

const normalizeRow = (row) => ({
  ...row,
  created_date: row.created_at,
});

const parseOrder = (orderBy) => {
  if (!orderBy) return { column: "created_at", ascending: false };
  const descending = orderBy.startsWith("-");
  const rawColumn = descending ? orderBy.slice(1) : orderBy;
  const column = rawColumn === "created_date" ? "created_at" : rawColumn;
  return { column, ascending: !descending };
};

const applyFilters = (query, where = {}) => {
  let nextQuery = query;
  Object.entries(where).forEach(([key, value]) => {
    nextQuery = nextQuery.eq(key, value);
  });
  return nextQuery;
};

const ensureOk = (result, action) => {
  if (result.error) {
    throw new Error(`${action} fallita: ${result.error.message}`);
  }
  return result.data;
};

let requestQueue = Promise.resolve();
const runWithClientLock = async (operation) => {
  const next = requestQueue.then(operation, operation);
  requestQueue = next.catch(() => undefined);
  return next;
};

const makeEntity = (entityName) => {
  const table = TABLE_MAP[entityName];

  return {
    async list(orderBy = "-created_date", limit = 1000) {
      return runWithClientLock(async () => {
        const client = assertSupabase();
        const { column, ascending } = parseOrder(orderBy);
        const result = await client
          .from(table)
          .select("*")
          .order(column, { ascending })
          .limit(limit);

        return ensureOk(result, `Lettura ${table}`).map(normalizeRow);
      });
    },

    async categoryById(id){
      return runWithClientLock(async () => {
        const client = assertSupabase();
        const { column, ascending } = parseOrder("id");
        const result = await client
        .from(table)
        .select("name").eq("id", id)
        .limit(1);
        return ensureOk(result, `Lettura categoria ${table}`).map(normalizeRow);
      });
    },


    async categoryByProductType(productType) {
      return runWithClientLock(async () => {
        const client = assertSupabase();
        if (!productType) return [];

        const normalizedType = String(productType).trim().toLowerCase();
        const variants = new Set([normalizedType]);
        if (normalizedType.endsWith("o")) variants.add(`${normalizedType.slice(0, -1)}i`);
        if (normalizedType.endsWith("i")) variants.add(`${normalizedType.slice(0, -1)}o`);

        const productTypeResult = await client
          .from(TABLE_MAP.TipoProdotto)
          .select("id, type")
          .eq("active", true);

        const productTypes = ensureOk(productTypeResult, `Lettura ${TABLE_MAP.TipoProdotto}`);
        const productTypeRow = productTypes.find((row) => {
          const dbType = String(row.type || "").trim().toLowerCase();
          if (!dbType) return false;
          for (const variant of variants) {
            if (dbType === variant || dbType.includes(variant) || variant.includes(dbType)) {
              return true;
            }
          }
          return false;
        });
        if (!productTypeRow?.id) return [];

        const result = await client
          .from(table)
          .select("*")
          .eq("active", true)
          .eq("product_type_id", productTypeRow.id);
        return ensureOk(result, `Lettura categorie ${table}`).map(normalizeRow);
      });
    },


    

    async filter(where = {}) {
      return runWithClientLock(async () => {
        const client = assertSupabase();
        const query = applyFilters(client.from(table).select("*"), where);
        const result = await query;
        return ensureOk(result, `Filtro ${table}`).map(normalizeRow);
      });
    },

    async create(payload) {
      return runWithClientLock(async () => {
        const client = assertSupabase();
        const dataToInsert =
          entityName === "Prenotazione"
            ? { stato: "in_attesa", ...payload }
            : payload;

        if (entityName === "Prenotazione") {
          // For public bookings we cannot require a SELECT policy just to return the inserted row.
          const insertResult = await client.from(table).insert(dataToInsert);
          ensureOk(insertResult, `Creazione ${table}`);
          const record = normalizeRow({
            ...dataToInsert,
            created_at: new Date().toISOString(),
          });

          try {
            await notifyBookingEmails(client, record);
            return { ...record, _emailSent: true };
          } catch (error) {
            return {
              ...record,
              _emailSent: false,
              _emailError: error.message || "Invio email non riuscito",
            };
          }
        }

        const result = await client.from(table).insert(dataToInsert).select().single();
        const record = normalizeRow(ensureOk(result, `Creazione ${table}`));
        return record;
      });
    },

    async update(id, payload) {
      return runWithClientLock(async () => {
        const client = assertSupabase();
        let record;
        try {
          const result = await client.from(table).update(payload).eq("id", id).select().maybeSingle();
          const data = ensureOk(result, `Aggiornamento ${table}`);
          if (!data) {
            const fallbackResult = await client.from(table).update(payload).eq("id", id);
            ensureOk(fallbackResult, `Aggiornamento ${table}`);
            record = normalizeRow({
              id,
              ...payload,
              created_at: new Date().toISOString(),
            });
          } else {
            record = normalizeRow(data);
          }
        } catch (error) {
          const message = String(error?.message || "");
          if (!message.includes("single JSON object")) {
            throw error;
          }

          // Some tables may allow UPDATE but not SELECT via RLS.
          const fallbackResult = await client.from(table).update(payload).eq("id", id);
          ensureOk(fallbackResult, `Aggiornamento ${table}`);
          record = normalizeRow({
            id,
            ...payload,
            created_at: new Date().toISOString(),
          });
        }

        if (entityName === "Prenotazione" && payload?.stato && record?.email) {
          try {
            await notifyBookingStatusEmail(client, record);
            return { ...record, _statusEmailSent: true };
          } catch (error) {
            return {
              ...record,
              _statusEmailSent: false,
              _statusEmailError: error.message || "Invio email stato non riuscito",
            };
          }
        }

        return record;
      });
    },

    async delete(id) {
      return runWithClientLock(async () => {
        const client = assertSupabase();
        const result = await client.from(table).delete().eq("id", id);
        ensureOk(result, `Eliminazione ${table}`);
        return true;
      });
    },
  };
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const resolveLoginRedirect = (redirectTo) => {
  if (!redirectTo) return window.location.origin;
  try {
    return new URL(redirectTo, window.location.origin).toString();
  } catch {
    return window.location.origin;
  }
};

const notifyBookingEmails = async (client, booking) => {
  const { error } = await client.functions.invoke("send-booking-emails", {
    body: { booking },
  });

  if (error) {
    throw new Error(`Invio email fallito: ${error.message}`);
  }
};

const notifyBookingStatusEmail = async (client, booking) => {
  const { error } = await client.functions.invoke("send-booking-status-email", {
    body: { booking },
  });

  if (error) {
    throw new Error(`Invio email stato fallito: ${error.message}`);
  }
};

export const apiClient = {
  entities: {
    Gelato: makeEntity("Gelato"),
    Panino: makeEntity("Panino"),
    Promozione: makeEntity("Promozione"),
    FotoGalleria: makeEntity("FotoGalleria"),
    Prenotazione: makeEntity("Prenotazione"),
    Vaschetta: makeEntity("Vaschetta"),
    Negozio: makeEntity("Negozio"),
    Categoria: makeEntity("Categoria"),
    TipoProdotto: makeEntity("TipoProdotto"),
  },
  integrations: {
    Core: {
      async UploadFile({ file }) {
        if (!file) throw new Error("File mancante");
        // Fallback universale: persiste immagine come data URL.
        const file_url = await fileToDataUrl(file);
        return { file_url };
      },
    },
  },
  auth: {
    async me() {
      const client = assertSupabase();
      const {
        data: { user },
        error,
      } = await client.auth.getUser();
      if (error) throw error;
      return user;
    },
    async logout(redirectTo) {
      const client = assertSupabase();
      await client.auth.signOut();
      if (redirectTo) window.location.href = redirectTo;
    },
    async redirectToLogin(redirectTo) {
      const target = resolveLoginRedirect(redirectTo);
      window.location.href = `/admin/login?redirect=${encodeURIComponent(target)}`;
    },
    onAuthStateChange(callback) {
      if (!supabase) return { data: { subscription: { unsubscribe() {} } } };
      return supabase.auth.onAuthStateChange(callback);
    },
    async getSession() {
      const client = assertSupabase();
      return client.auth.getSession();
    },
  },
};
