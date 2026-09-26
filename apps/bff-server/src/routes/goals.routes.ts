import { Router } from "express";
import { createGoal, deleteGoal, listGoals, whatIfSimulator } from "../controllers/goals.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.get("/", listGoals);
router.post("/", createGoal);
router.delete("/:id", deleteGoal);

// Phase 6: What-If financial simulator — proxies to Kavya's AI engine endpoint.
// POST /api/v1/goals/what-if
// Body: { incomeDelta: number, expenseDelta: number, savingsRateDelta: number }
router.post("/what-if", whatIfSimulator);

export default router;
