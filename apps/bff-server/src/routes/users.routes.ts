import { Router } from "express";
<<<<<<< HEAD
import { getMe, updateSalary, updateTaxProfile } from "../controllers/users.controller";
=======
import { getMe, updateSalary, getTaxProfile, updateTaxProfile } from "../controllers/users.controller";
>>>>>>> 51cd8e2f482d9209d7d062ff0dd8ec0f4589a414
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.get("/me", getMe);
router.patch("/me/salary", updateSalary);
// Phase 5: separate route for tax profile — keeps salary PATCH shape intact
router.patch("/me/tax-profile", updateTaxProfile);

router.get("/tax-profile", getTaxProfile);
router.post("/tax-profile", updateTaxProfile);
router.get("/me/tax-profile", getTaxProfile);
router.post("/me/tax-profile", updateTaxProfile);

export default router;
