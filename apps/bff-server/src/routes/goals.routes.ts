import { Router } from "express";
import { createGoal, deleteGoal, listGoals } from "../controllers/goals.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.get("/", listGoals);
router.post("/", createGoal);
router.delete("/:id", deleteGoal);

export default router;
