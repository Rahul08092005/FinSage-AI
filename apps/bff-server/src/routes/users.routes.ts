import { Router } from "express";
import { getMe, updateSalary } from "../controllers/users.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.get("/me", getMe);
router.patch("/me/salary", updateSalary);

export default router;
