import multer from "multer";
import { Router } from "express";
import {
  createTransaction, deleteTransaction, listTransactions, updateTransaction,
} from "../controllers/transactions.controller";
import { importCsv } from "../controllers/documents.controller";
import { requireAuth } from "../middleware/auth.middleware";

// Use memory storage for CSV imports — file is read as text and not stored on disk
const csvUpload = multer({ storage: multer.memoryStorage() });

const router = Router();

router.use(requireAuth);
router.get("/", listTransactions);
router.post("/", createTransaction);
router.patch("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);

// Step 5 — CSV import (Phase 3)
router.post("/import-csv", csvUpload.single("file"), importCsv);

export default router;
