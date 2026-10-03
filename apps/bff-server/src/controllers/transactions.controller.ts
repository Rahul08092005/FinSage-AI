// Person 1 (Aditi) owns this file. Phase 2: full CRUD for transactions,
// scoped to the logged-in user via requireAuth. This is the API Person 4's
// Transactions page and Person 3's normalization pipeline both build against.
// Phase 5: adds parseSms and confirmSms (UPI/bank SMS review-before-commit pipeline).
import { Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../middleware/auth.middleware";

const AI_ENGINE_BASE = process.env.AI_ENGINE_URL || "http://localhost:8000";

// Minimum confidence threshold for returning a draft (same 0.5 threshold used
// in the Phase 3 OCR pipeline — see documents.controller.ts).
const SMS_CONFIDENCE_THRESHOLD = 0.5;

const createSchema = z.object({
  // Phase 4: positive() rejects 0 and negative amounts; descriptions and
  // categories get a max length to prevent payload abuse; transactionDate
  // is validated as a real parseable date, not just any string.
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
  source: z.string().optional(),
});

export async function listTransactions(req: AuthedRequest, res: Response) {
  const { category, from, to, page = "1", limit = "20" } = req.query as Record<string, string>;

  const where: any = { userId: req.userId };
  if (category) where.category = category;
  if (from || to) {
    where.transactionDate = {};
    if (from) where.transactionDate.gte = new Date(from);
    if (to) where.transactionDate.lte = new Date(to);
  }

  const take = Math.min(Number(limit) || 20, 100); // hard max 100 — verified Phase 4
  const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { transactionDate: "desc" },
      skip,
      take,
    }),
    prisma.transaction.count({ where }),
  ]);

  res.json({ items, total, page: Number(page), limit: take });
}

export async function createTransaction(req: AuthedRequest, res: Response) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const tx = await prisma.transaction.create({
    data: {
      userId: req.userId as string,
      amount: parsed.data.amount,
      category: parsed.data.category,
      transactionDate: new Date(parsed.data.transactionDate),
      description: parsed.data.description,
      accountId: parsed.data.accountId,
      source: parsed.data.source ?? "manual",
    },
  });

  // Audit log: transaction created
  console.log(
    `[AUDIT] userId=${req.userId} action=transaction.create transactionId=${tx.id} timestamp=${new Date().toISOString()}`
  );

  res.status(201).json(tx);
}

export async function updateTransaction(req: AuthedRequest, res: Response) {
  const { id } = req.params;
  const existing = await prisma.transaction.findFirst({ where: { id, userId: req.userId } });
  if (!existing) return res.status(404).json({ error: "Transaction not found" });

  const parsed = createSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const updated = await prisma.transaction.update({
    where: { id },
    data: {
      ...parsed.data,
      transactionDate: parsed.data.transactionDate ? new Date(parsed.data.transactionDate) : undefined,
    },
  });
  res.json(updated);
}

export async function deleteTransaction(req: AuthedRequest, res: Response) {
  const { id } = req.params;
  const existing = await prisma.transaction.findFirst({ where: { id, userId: req.userId } });
  if (!existing) return res.status(404).json({ error: "Transaction not found" });

  await prisma.transaction.delete({ where: { id } });

  // Audit log: transaction deleted
  console.log(
    `[AUDIT] userId=${req.userId} action=transaction.delete transactionId=${id} timestamp=${new Date().toISOString()}`
  );

  res.status(204).send();
}

export async function parseSms(req: AuthedRequest, res: Response) {
  const smsText = (req.body.smsText ?? req.body.sms_text ?? "").trim();
  if (!smsText) {
    return res.status(400).json({ error: "sms_text or smsText is required and must not be empty" });
  }

  try {
    const aiRes = await fetch(`${AI_ENGINE_BASE}/internal/adapters/bank-upi/parse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sms_text: smsText }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("[parseSms] AI engine error:", aiRes.status, errText);
      return res.status(502).json({ error: "AI engine failed to parse SMS", detail: errText });
    }

    const aiBody = await aiRes.json();
    const txn = aiBody.transaction;
    const confidence = aiBody.confidence ?? 0.95;

    if (!txn || confidence < SMS_CONFIDENCE_THRESHOLD) {
      return res.status(200).json({
        draft: null,
        confidence,
        message:
          confidence < SMS_CONFIDENCE_THRESHOLD
            ? `Parse confidence too low (${confidence.toFixed(2)} < ${SMS_CONFIDENCE_THRESHOLD}). Please enter the transaction manually.`
            : "AI engine could not extract a transaction from this SMS.",
      });
    }

    // Try to link user's account if account masked info exists
    const accounts = await prisma.account.findMany({
      where: { userId: req.userId },
    });

    let matchedAccountId: string | undefined = undefined;
    let matchedAccountName: string | undefined = undefined;

    if (txn.account) {
      const match = accounts.find((a) =>
        a.name.toLowerCase().includes(String(txn.account).toLowerCase())
      );
      if (match) {
        matchedAccountId = match.id;
        matchedAccountName = match.name;
      }
    }

    if (!matchedAccountId && accounts.length > 0) {
      matchedAccountId = accounts[0].id;
      matchedAccountName = accounts[0].name;
    }

    const draft = {
      amount: txn.amount,
      description: txn.description || "SMS Transaction",
      category: txn.category || "General",
      transactionDate: txn.date || new Date().toISOString().slice(0, 10),
      type: txn.type || "debit",
      source: "upi_sms",
      accountId: matchedAccountId,
      accountName: matchedAccountName,
      confidence,
    };

    return res.status(200).json({ draft, transaction: draft, confidence });
  } catch (err: any) {
    console.error("[parseSms] Could not reach AI engine:", err.message);
    return res.status(503).json({ error: "AI engine unreachable", detail: err.message });
  }
}

const confirmSmsSchema = z.object({
  amount: z.union([z.number(), z.string()]).transform((val) => Number(val)),
  category: z.string().optional().default("General"),
  transactionDate: z
    .string()
    .optional()
    .default(() => new Date().toISOString()),
  description: z.string().min(1, { message: "Description is required" }),
  accountId: z.string().optional(),
});

export async function confirmSms(req: AuthedRequest, res: Response) {
  const parsed = confirmSmsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const tx = await prisma.transaction.create({
    data: {
      userId: req.userId as string,
      amount: parsed.data.amount,
      category: parsed.data.category,
      transactionDate: new Date(parsed.data.transactionDate),
      description: parsed.data.description,
      accountId: parsed.data.accountId || undefined,
      source: "upi_sms",
    },
  });

  console.log(
    `[AUDIT] userId=${req.userId} action=transaction.confirm_sms transactionId=${tx.id} timestamp=${new Date().toISOString()}`
  );

  res.status(201).json(tx);
}

