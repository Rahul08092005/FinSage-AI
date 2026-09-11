import { Router } from "express";
import { exportReport } from "../controllers/reports.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.get("/export", exportReport);

export default router;
