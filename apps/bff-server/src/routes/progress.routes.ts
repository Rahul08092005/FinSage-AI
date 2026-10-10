import { Router } from "express";
import { getUserProgress } from "../controllers/progress.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.get("/", getUserProgress);

export default router;
