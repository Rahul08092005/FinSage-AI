import { Router } from "express";
import {
  budgetVariance, deleteBudget, listBudgets, upsertBudget,
} from "../controllers/budgets.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.get("/", listBudgets);
router.get("/variance", budgetVariance);
router.post("/", upsertBudget);
router.delete("/:id", deleteBudget);

export default router;
