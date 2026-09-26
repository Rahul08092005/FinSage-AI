import multer from "multer";
import { Router } from "express";
import {
  createTransaction, deleteTransaction, listTransactions, updateTransaction,
  // Phase 5: SMS review-before-commit pipeline
  parseSms, confirmSms,
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

// Phase 5 — UPI/bank SMS parsing (review-before-commit, same as OCR pipeline)
router.post("/parse-sms", parseSms);
router.post("/confirm-sms", confirmSms);

export default router;
