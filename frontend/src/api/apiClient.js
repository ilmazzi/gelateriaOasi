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

const TOKEN_KEY = "oasi_access_token";
const AUTH_EVENT = "oasi_auth_changed";

const normalizeRow = (row) => ({
  ...row,
  created_date: row?.created_at,
});

const getApiBaseUrl = () => {
  const envUrl = /** @type {any} */ (import.meta).env?.VITE_API_URL;
  if (!envUrl) {
    throw new Error("VITE_API_URL non impostata: configura la variabile ambiente del frontend.");
  }
  return String(envUrl).replace(/\/$/, "");
};

const API_BASE_URL = getApiBaseUrl();

const getToken = () => localStorage.getItem(TOKEN_KEY);
const setToken = (token) => {
  if (!token) localStorage.removeItem(TOKEN_KEY);
  else localStorage.setItem(TOKEN_KEY, token);

  window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: { token: token || null } }));
};

const parseError = async (res) => {
  const text = await res.text();
  if (!text) return `${res.status} ${res.statusText}`;
  try {
    const json = JSON.parse(text);
    return json.message || json.error || `${res.status} ${res.statusText}`;
  } catch {
    return text;
  }
};

const request = async (path, options = {}) => {
  const token = getToken();
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const message = await parseError(res);
    throw new Error(message || "Richiesta non riuscita");
  }

  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text);
};

const parseOrder = (orderBy) => {
  if (!orderBy) return "-created_date";
  return String(orderBy);
};

const makeEntity = (entityName) => {
  const table = TABLE_MAP[entityName];

  return {
    async list(orderBy = "-created_date", limit = 1000) {
      const params = new URLSearchParams({
        orderBy: parseOrder(orderBy),
        limit: String(limit),
      });
      const rows = await request(`/entities/${table}?${params.toString()}`);
      return Array.isArray(rows) ? rows.map(normalizeRow) : [];
    },

    async filter(where = {}) {
      const rows = await request(`/entities/${table}/filter`, {
        method: "POST",
        body: { where },
      });
      return Array.isArray(rows) ? rows.map(normalizeRow) : [];
    },

    async categoryByProductType(productType) {
      const rows = await request(`/categorie/by-product-type/${encodeURIComponent(productType || "")}`);
      return Array.isArray(rows) ? rows.map(normalizeRow) : [];
    },

    async create(payload) {
      const row = await request(`/entities/${table}`, {
        method: "POST",
        body: payload,
      });
      return row ? normalizeRow(row) : row;
    },

    async update(id, payload) {
      const row = await request(`/entities/${table}/${encodeURIComponent(String(id))}`, {
        method: "PATCH",
        body: payload,
      });
      return row ? normalizeRow(row) : row;
    },

    async delete(id) {
      await request(`/entities/${table}/${encodeURIComponent(String(id))}`, {
        method: "DELETE",
      });
      return true;
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
        const file_url = await fileToDataUrl(file);
        return { file_url };
      },
    },
  },

  auth: {
    async login({ email, password }) {
      const data = await request("/auth/login", {
        method: "POST",
        body: { email, password },
      });

      if (!data?.token) throw new Error("Token non ricevuto dal server");
      setToken(data.token);
      return data;
    },

    async me() {
      return request("/auth/me");
    },

    logout(redirectTo) {
      setToken(null);
      if (redirectTo) window.location.href = redirectTo;
    },

    redirectToLogin(redirectTo) {
      const target = redirectTo || window.location.href;
      window.location.href = `/admin/login?redirect=${encodeURIComponent(target)}`;
    },

    onAuthStateChange(callback) {
      const handler = async () => {
        const token = getToken();
        if (!token) {
          callback("SIGNED_OUT", null);
          return;
        }

        try {
          const user = await this.me();
          callback("SIGNED_IN", { user, access_token: token });
        } catch {
          setToken(null);
          callback("SIGNED_OUT", null);
        }
      };

      window.addEventListener(AUTH_EVENT, handler);
      handler();

      return {
        data: {
          subscription: {
            unsubscribe() {
              window.removeEventListener(AUTH_EVENT, handler);
            },
          },
        },
      };
    },

    async getSession() {
      const token = getToken();
      if (!token) return { data: { session: null } };

      try {
        const user = await this.me();
        return { data: { session: { access_token: token, user } } };
      } catch {
        setToken(null);
        return { data: { session: null } };
      }
    },
  },
};
