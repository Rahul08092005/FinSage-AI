import { Router } from "express";
import { uploadKnowledge } from "../controllers/knowledge.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.post("/upload", uploadKnowledge);

export default router;
