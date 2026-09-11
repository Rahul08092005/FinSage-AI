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
