import { Router } from "express";
import { getMe, updateSalary, updateTaxProfile } from "../controllers/users.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.get("/me", getMe);
router.patch("/me/salary", updateSalary);
// Phase 5: separate route for tax profile — keeps salary PATCH shape intact
router.patch("/me/tax-profile", updateTaxProfile);

export default router;
