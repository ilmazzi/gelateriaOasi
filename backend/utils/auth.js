import { verifyToken } from "./jwt.js";

const bearerPrefix = /^Bearer\s+/i;

export const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !bearerPrefix.test(header)) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = header.replace(bearerPrefix, "").trim();
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = verifyToken(token);
    // Allineato a signToken al login: payload con `sub` (id utente) e `role`
    req.user = {
      id: decoded.sub,
      role: decoded.role,
    };
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

/** Usa dopo `authenticate`. Solo utenti con role `admin`. */
export const requireAdmin = (req, res, next) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};
