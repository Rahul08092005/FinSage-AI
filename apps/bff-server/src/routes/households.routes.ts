import { Router } from "express";
import {
  getHouseholdSummary,
  createHousehold,
  inviteMember,
  addSharedExpense,
  deleteSharedExpense,
} from "../controllers/households.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);

router.get("/summary", getHouseholdSummary);
router.post("/", createHousehold);
router.post("/:id/invite", inviteMember);
router.post("/:id/expenses", addSharedExpense);
router.delete("/:id/expenses/:expenseId", deleteSharedExpense);

export default router;
