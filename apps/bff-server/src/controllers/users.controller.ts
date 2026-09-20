import { Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../middleware/auth.middleware";

const AI_ENGINE_BASE = process.env.AI_ENGINE_URL || "http://localhost:8000";

const salarySchema = z.object({
  monthlySalary: z.number().positive(),
});

const taxProfileSchema = z.object({
  annualIncome: z.number().positive(),
  current80cInvestments: z.number().nonnegative().optional().default(0),
});

export async function getMe(req: AuthedRequest, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, name: true, email: true, monthlySalary: true },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    monthlySalary: user.monthlySalary !== null ? Number(user.monthlySalary) : null,
  });
}

export async function updateSalary(req: AuthedRequest, res: Response) {
  const parsed = salarySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const updated = await prisma.user.update({
    where: { id: req.userId },
    data: { monthlySalary: parsed.data.monthlySalary },
    select: { id: true, name: true, email: true, monthlySalary: true },
  });

  res.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    monthlySalary: updated.monthlySalary !== null ? Number(updated.monthlySalary) : null,
  });
}

export async function getTaxProfile(req: AuthedRequest, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { monthlySalary: true },
  });

  const annualIncome = user?.monthlySalary ? Number(user.monthlySalary) * 12 : 0;
  res.json({
    annualIncome,
    current80cInvestments: 0,
  });
}

export async function updateTaxProfile(req: AuthedRequest, res: Response) {
  const income = req.body.annualIncome ?? req.body.annual_income ?? req.body.income;
  const current80c =
    req.body.current80cInvestments ??
    req.body.current_80c_investments ??
    req.body.currentInvestments ??
    0;

  const parsed = taxProfileSchema.safeParse({
    annualIncome: Number(income),
    current80cInvestments: Number(current80c),
  });

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { annualIncome, current80cInvestments } = parsed.data;

  // 1. Persist updated monthly salary (annual / 12)
  await prisma.user.update({
    where: { id: req.userId },
    data: { monthlySalary: annualIncome / 12 },
  });

  // 2. Gather user context to generate comprehensive financial plan via AI engine
  const now = new Date();
  const threeMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 3, 1));
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [transactions, budgets, goals] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: req.userId, transactionDate: { gte: threeMonthsAgo } },
      orderBy: { transactionDate: "desc" },
    }),
    prisma.budget.findMany({ where: { userId: req.userId } }),
    prisma.goal.findMany({ where: { userId: req.userId } }),
  ]);

  const budgetVariance = await Promise.all(
    budgets.map(async (b) => {
      const spent = await prisma.transaction.aggregate({
        where: { userId: req.userId, category: b.category, transactionDate: { gte: monthStart } },
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

  let markdown = "";
  try {
    const genRes = await fetch(`${AI_ENGINE_BASE}/internal/reports/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transactions,
        budgets: budgetVariance,
        goals,
        health_score: null,
        income: annualIncome,
        current_investments: current80cInvestments,
      }),
    });

    if (genRes.ok) {
      const genBody = await genRes.json();
      markdown = genBody.markdown || "";
    }
  } catch (err: any) {
    console.error("[updateTaxProfile] AI engine error:", err.message);
  }

  res.json({
    success: true,
    annualIncome,
    current80cInvestments,
    markdown,
  });
}
