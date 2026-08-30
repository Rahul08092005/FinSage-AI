// Person 1 (Aditi) owns this file. Phase 2: full CRUD for transactions,
// scoped to the logged-in user via requireAuth. This is the API Person 4's
// Transactions page and Person 3's normalization pipeline both build against.
import { Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../middleware/auth.middleware";

const createSchema = z.object({
  amount: z.number(),
  category: z.string().min(1),
  transactionDate: z.string(), // ISO date string
  description: z.string().min(1),
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

  const take = Math.min(Number(limit) || 20, 100);
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
  res.status(204).send();
}
