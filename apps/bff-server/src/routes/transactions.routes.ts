import { Router } from "express";
import {
  createTransaction, deleteTransaction, listTransactions, updateTransaction,
} from "../controllers/transactions.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);
router.get("/", listTransactions);
router.post("/", createTransaction);
router.patch("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);

export default router;
