import { Router } from "express";
import { expenseSummary } from "../controllers/expenses.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.get("/summary", expenseSummary);

export default router;
