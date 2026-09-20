// Person 1 (Aditi) owns this file. Phase 2: full CRUD for transactions,
// scoped to the logged-in user via requireAuth. This is the API Person 4's
// Transactions page and Person 3's normalization pipeline both build against.
import { Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../middleware/auth.middleware";

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

const AI_ENGINE_BASE = process.env.AI_ENGINE_URL || "http://localhost:8000";

export async function parseSms(req: AuthedRequest, res: Response) {
  const smsText = req.body.smsText ?? req.body.sms_text;
  if (!smsText || typeof smsText !== "string" || !smsText.trim()) {
    return res.status(400).json({ error: "smsText is required" });
  }

  try {
    const aiRes = await fetch(`${AI_ENGINE_BASE}/internal/adapters/bank-upi/parse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sms_text: smsText.trim() }),
    });

    if (!aiRes.ok) {
      return res.status(502).json({ error: "AI engine failed to parse SMS" });
    }

    const aiData = await aiRes.json();
    const txn = aiData.transaction;
    if (!txn) {
      return res.status(422).json({ error: "Couldn't recognize this message format" });
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
      description: txn.description,
      category: txn.category || "General",
      transactionDate: txn.date || new Date().toISOString().slice(0, 10),
      type: txn.type || "debit",
      source: "bank_sms",
      accountId: matchedAccountId,
      accountName: matchedAccountName,
      confidence: aiData.confidence ?? 0.95,
    };

    return res.json({ draft, transaction: draft, confidence: draft.confidence });
  } catch (err: any) {
    console.error("[parseSms] error:", err.message);
    return res.status(500).json({ error: "Internal error parsing SMS" });
  }
}

export async function confirmSms(req: AuthedRequest, res: Response) {
  const { amount, description, category, transactionDate, accountId } = req.body;
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: "Valid amount is required" });
  }
  if (!description || typeof description !== "string") {
    return res.status(400).json({ error: "Description is required" });
  }

  const tx = await prisma.transaction.create({
    data: {
      userId: req.userId as string,
      amount: Number(amount),
      category: category || "General",
      description: description.trim(),
      transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
      accountId: accountId || undefined,
      source: "bank_sms",
    },
  });

  return res.status(201).json(tx);
}
