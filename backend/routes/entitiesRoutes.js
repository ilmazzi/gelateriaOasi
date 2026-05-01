import { Router } from "express";
import {
  createEntity,
  deleteEntity,
  filterEntities,
  listCategorieByProductType,
  listEntities,
  updateEntity,
} from "../controllers/entitiesController.js";
import { authenticate, requireAdmin } from "../utils/auth.js";

const router = Router();

// Public reads
router.get("/entities/:table", listEntities);
router.post("/entities/:table/filter", filterEntities);
router.get("/categorie/by-product-type/:productType", listCategorieByProductType);

// Public write only for bookings
router.post("/entities/prenotazioni", createEntity);

// Admin writes for everything else
router.post("/entities/:table", authenticate, requireAdmin, createEntity);
router.patch("/entities/:table/:id", authenticate, requireAdmin, updateEntity);
router.delete("/entities/:table/:id", authenticate, requireAdmin, deleteEntity);

export default router;
