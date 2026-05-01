import { Router } from "express";
import { login, me } from "../controllers/authController.js";
import { authenticate } from "../utils/auth.js";

const router = Router();

router.post("/auth/login", login);
router.get("/auth/me", authenticate, me);

export default router;
