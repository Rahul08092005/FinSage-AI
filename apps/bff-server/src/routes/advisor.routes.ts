import { Router } from "express";
import { advisorChat } from "../controllers/advisor.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.post("/chat", advisorChat);

export default router;
