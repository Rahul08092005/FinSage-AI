import { Router } from "express";
import { healthScore } from "../controllers/analytics.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.get("/health-score", healthScore);

export default router;
