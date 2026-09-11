// Person 1 (Aditi) owns this file.
import { Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../middleware/auth.middleware";

const budgetSchema = z.object({
  // Phase 4: category gets a max length to prevent payload abuse.
  // monthlyLimit was already .positive() — no change needed.
  category: z.string().min(1).max(100, { message: "Category must be 100 characters or fewer" }),
  monthlyLimit: z.number().positive(),
  currency: z.string().optional(),
});

export async function listBudgets(req: AuthedRequest, res: Response) {
  const budgets = await prisma.budget.findMany({ where: { userId: req.userId } });
  res.json(budgets);
}

export async function upsertBudget(req: AuthedRequest, res: Response) {
  const parsed = budgetSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const budget = await prisma.budget.upsert({
    where: { userId_category: { userId: req.userId as string, category: parsed.data.category } },
    update: { monthlyLimit: parsed.data.monthlyLimit, currency: parsed.data.currency ?? "INR" },
    create: {
      userId: req.userId as string,
      category: parsed.data.category,
      monthlyLimit: parsed.data.monthlyLimit,
      currency: parsed.data.currency ?? "INR",
    },
  });
  res.status(201).json(budget);
}

export async function deleteBudget(req: AuthedRequest, res: Response) {
  const { id } = req.params;
  const existing = await prisma.budget.findFirst({ where: { id, userId: req.userId } });
  if (!existing) return res.status(404).json({ error: "Budget not found" });

  await prisma.budget.delete({ where: { id } });
  res.status(204).send();
}

// Phase 4 will replace this with Person 3's real calculate_budget_variance();
// Phase 2 just proves budget vs actual spend can be compared at all.
export async function budgetVariance(req: AuthedRequest, res: Response) {
  const budgets = await prisma.budget.findMany({ where: { userId: req.userId } });

  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const results = await Promise.all(
    budgets.map(async (b) => {
      const spent = await prisma.transaction.aggregate({
        where: { userId: req.userId, category: b.category, transactionDate: { gte: start } },
        _sum: { amount: true },
      });
      const spentAmount = Number(spent._sum.amount ?? 0);
      return {
        category: b.category,
        limit: Number(b.monthlyLimit),
        spent: spentAmount,
        remaining: Number(b.monthlyLimit) - spentAmount,
      };
    })
  );

  res.json(results);
}
