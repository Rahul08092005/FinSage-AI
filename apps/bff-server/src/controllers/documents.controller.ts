// Phase 3: document upload, status polling, confirm-review, and CSV import.
// Follows the same style as transactions.controller.ts (requireAuth, zod, prisma).
import { Response } from "express";
import fs from "fs";
import path from "path";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { redis } from "../lib/redis";
import { AuthedRequest } from "../middleware/auth.middleware";

// ---------------------------------------------------------------------------
// POST /api/v1/documents/upload  (multipart — multer already ran before us)
// ---------------------------------------------------------------------------
export async function uploadDocument(req: AuthedRequest, res: Response) {
  if (!req.file) {
    return res.status(400).json({ error: "No file provided (field name must be 'file')" });
  }

  const docType = (req.body.docType as string | undefined)?.trim();
  if (!docType) {
    return res.status(400).json({ error: "docType field is required" });
  }

  const allowedDocTypes = ["receipt", "bank_statement", "other"];
  if (!allowedDocTypes.includes(docType)) {
    return res.status(400).json({ error: `docType must be one of: ${allowedDocTypes.join(", ")}` });
  }

  const fileUrl = req.file.path; // e.g. uploads/1234567890-myreceipt.png

  const doc = await prisma.document.create({
    data: {
      userId: req.userId as string,
      title: req.file.originalname,
      docType,
      fileUrl,
      status: "QUEUED",
    },
  });

  // Push job onto the Redis processing queue (worker BRPOP's this list)
  const job = JSON.stringify({ documentId: doc.id, filePath: fileUrl, docType });
  await redis.lpush("document-processing-queue", job);

  // Audit log: document uploaded
  console.log(
    `[AUDIT] userId=${req.userId} action=document.upload documentId=${doc.id} docType=${docType} timestamp=${new Date().toISOString()}`
  );

  return res.status(201).json({ documentId: doc.id, status: doc.status });
}

// ---------------------------------------------------------------------------
// GET /api/v1/documents
// ---------------------------------------------------------------------------
export async function listDocuments(req: AuthedRequest, res: Response) {
  const documents = await prisma.document.findMany({
    where: { userId: req.userId },
    orderBy: { uploadedAt: "desc" },
    select: {
      id: true,
      title: true,
      docType: true,
      status: true,
      confidence: true,
      uploadedAt: true,
    },
  });
  res.json(documents);
}

// ---------------------------------------------------------------------------
// GET /api/v1/documents/:id
// ---------------------------------------------------------------------------
export async function getDocument(req: AuthedRequest, res: Response) {
  const { id } = req.params;
  const doc = await prisma.document.findFirst({
    where: { id, userId: req.userId },
  });
  if (!doc) return res.status(404).json({ error: "Document not found" });
  res.json(doc);
}

// ---------------------------------------------------------------------------
// POST /api/v1/documents/:id/confirm
// Accepts edited transaction rows from the review UI, bulk-creates real
// Transaction rows, and marks the Document COMPLETED.
// ---------------------------------------------------------------------------
const confirmRowSchema = z.object({
  // Phase 4: same validation rules as the main transaction createSchema —
  // amount must be positive, dates must parse, strings have reasonable caps.
  amount: z.number().positive({ message: "Amount must be greater than 0" }),
  category: z.string().min(1).max(100, { message: "Category must be 100 characters or fewer" }),
  transactionDate: z.string().refine((s) => !isNaN(Date.parse(s)), {
    message: "transactionDate must be a valid date string (e.g. ISO 8601)",
  }),
  description: z
    .string()
    .min(1)
    .max(500, { message: "Description must be 500 characters or fewer" }),
  accountId: z.string().optional(),
});

const confirmSchema = z.object({
  transactions: z.array(confirmRowSchema).min(1),
});

export async function confirmDocument(req: AuthedRequest, res: Response) {
  const { id } = req.params;

  const doc = await prisma.document.findFirst({ where: { id, userId: req.userId } });
  if (!doc) return res.status(404).json({ error: "Document not found" });

  const parsed = confirmSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  // Bulk-create Transaction rows — same pattern as createTransaction
  await prisma.transaction.createMany({
    data: parsed.data.transactions.map((t) => ({
      userId: req.userId as string,
      amount: t.amount,
      category: t.category,
      transactionDate: new Date(t.transactionDate),
      description: t.description,
      accountId: t.accountId,
      source: "ocr",
    })),
  });

  // Mark document COMPLETED
  const updated = await prisma.document.update({
    where: { id },
    data: { status: "COMPLETED" },
  });

  res.json({ documentId: updated.id, status: updated.status, count: parsed.data.transactions.length });
}

// ---------------------------------------------------------------------------
// POST /api/v1/transactions/import-csv  (multipart — multer csv upload)
// Forwards raw CSV bytes to the AI engine's parse-csv-transactions endpoint,
// then bulk-creates the normalised Transaction rows.
// ---------------------------------------------------------------------------
const AI_ENGINE_BASE = process.env.AI_ENGINE_URL || "http://localhost:8000";

export async function importCsv(req: AuthedRequest, res: Response) {
  if (!req.file) {
    return res.status(400).json({ error: "No CSV file provided (field name must be 'file')" });
  }

  // Buffer is available when multer uses memoryStorage (used in transactions.routes.ts)
  const csvText = req.file.buffer
    ? req.file.buffer.toString("utf-8")
    : fs.readFileSync(req.file.path, "utf-8");

  // Forward to Kavya's parse-csv-transactions endpoint
  let rows: any[];
  try {
    const aiRes = await fetch(`${AI_ENGINE_BASE}/internal/analytics/parse-csv-transactions`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: csvText,
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("[importCsv] AI engine error:", aiRes.status, errText);
      return res.status(502).json({ error: "AI engine failed to parse CSV", detail: errText });
    }

    rows = await aiRes.json();
  } catch (err: any) {
    console.error("[importCsv] Could not reach AI engine:", err.message);
    return res.status(503).json({ error: "AI engine unreachable", detail: err.message });
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(422).json({ error: "AI engine returned no transaction rows from CSV" });
  }

  // Bulk-create — same createMany pattern used in confirmDocument above
  const result = await prisma.transaction.createMany({
    data: rows.map((r: any) => ({
      userId: req.userId as string,
      amount: Number(r.amount),
      category: String(r.category),
      transactionDate: new Date(r.transactionDate ?? r.transaction_date ?? r.date),
      description: String(r.description ?? r.narration ?? ""),
      accountId: r.accountId ?? undefined,
      source: "csv",
    })),
    skipDuplicates: true,
  });

  res.status(201).json({ count: result.count });
}
