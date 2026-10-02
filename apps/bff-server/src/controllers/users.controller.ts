// Phase 2: salary PATCH. Phase 5: adds tax-profile PATCH and extends getMe.
// Controller for PATCH /api/v1/users/me/salary (existing, unchanged)
// and the new PATCH /api/v1/users/me/tax-profile.
import { Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../middleware/auth.middleware";

const AI_ENGINE_BASE = process.env.AI_ENGINE_URL || "http://localhost:8000";

const salarySchema = z.object({
  monthlySalary: z.number().positive(),
});

const taxProfileSchema = z.object({
  taxRegime: z.enum(["old", "new"]).optional(),
  annualIncome: z.number().positive().optional(),
  current80cInvestments: z.number().nonnegative().optional().default(0),
});

export async function getMe(req: AuthedRequest, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      id: true,
      name: true,
      email: true,
      monthlySalary: true,
      // Phase 5: tax profile fields
      taxRegime: true,
      annualIncome: true,
    },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    monthlySalary: user.monthlySalary !== null ? Number(user.monthlySalary) : null,
    // Phase 5
    taxRegime: user.taxRegime ?? null,
    annualIncome: user.annualIncome !== null ? Number(user.annualIncome) : null,
  });
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/users/me/salary   (existing — shape unchanged)
// ---------------------------------------------------------------------------
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
    select: { monthlySalary: true, annualIncome: true, taxRegime: true },
  });

  const annualIncome = user?.annualIncome
    ? Number(user.annualIncome)
    : user?.monthlySalary
    ? Number(user.monthlySalary) * 12
    : 0;

  res.json({
    annualIncome,
    taxRegime: user?.taxRegime ?? null,
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
  const taxRegime = req.body.taxRegime;

  const parsed = taxProfileSchema.safeParse({
    annualIncome: income ? Number(income) : undefined,
    current80cInvestments: current80c ? Number(current80c) : 0,
    taxRegime: taxRegime ? String(taxRegime) : undefined,
  });

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { annualIncome, current80cInvestments, taxRegime: regime } = parsed.data;

  const updateData: any = {};
  if (annualIncome !== undefined) {
    updateData.annualIncome = annualIncome;
    updateData.monthlySalary = annualIncome / 12;
  }
  if (regime !== undefined) {
    updateData.taxRegime = regime;
  }

  const updated = await prisma.user.update({
    where: { id: req.userId },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      monthlySalary: true,
      taxRegime: true,
      annualIncome: true,
    },
  });

  // Gather user context to generate comprehensive financial plan via AI engine
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
        income: annualIncome ?? (Number(updated.monthlySalary) * 12),
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
    id: updated.id,
    name: updated.name,
    email: updated.email,
    monthlySalary: updated.monthlySalary !== null ? Number(updated.monthlySalary) : null,
    taxRegime: updated.taxRegime ?? null,
    annualIncome: updated.annualIncome !== null ? Number(updated.annualIncome) : null,
    current80cInvestments,
    markdown,
  });
}

