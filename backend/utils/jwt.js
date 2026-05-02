import jwt from "jsonwebtoken";

const expiresIn = process.env.JWT_EXPIRES_IN || "8h";

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET non impostato nel .env");
  }
  return secret;
};

/** Crea un access token (dopo login riuscito). */
export const signToken = (payload) => {
  return jwt.sign(payload, getSecret(), {
    expiresIn,
    algorithm: "HS256",
  });
};

/** Verifica firma e scadenza. Se il token non è valido, `jsonwebtoken` lancia (gestisci con try/catch nel middleware). */
export const verifyToken = (token) => {
  return jwt.verify(token, getSecret(), { algorithms: ["HS256"] });
};
