import bcrypt from "bcrypt";
import { query } from "../utils/connectDB.js";
import { signToken } from "../utils/jwt.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "Email e password obbligatori" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const { rows } = await query(
      `SELECT id, email, password_hash, role FROM public.users WHERE lower(email) = $1`,
      [normalizedEmail],
    );

    const user = rows[0];
    const ok = user && (await bcrypt.compare(String(password), user.password_hash));

    if (!ok) {
      return res.status(401).json({ message: "Credenziali non valide" });
    }

    const token = signToken({
      sub: String(user.id),
      role: user.role,
    });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("login", err);
    return res.status(500).json({ message: "Errore server" });
  }
};

export const me = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, email, role, created_at FROM public.users WHERE id = $1`,
      [req.user.id],
    );

    const user = rows[0];
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    return res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
    });
  } catch (err) {
    console.error("me", err);
    return res.status(500).json({ message: "Errore server" });
  }
};
