// Phase 4: Export report — gathers the user's financial snapshot (transactions,
// budgets, variance, goals, health score) and delegates markdown generation to
// Rahul's POST /internal/reports/generate endpoint on the AI engine.
// Follows the same style as analytics.controller.ts (requireAuth, prisma, fetch).
// Phase 5: If the user has annualIncome set, also passes a financial_plan block
// (monthly_salary, annual_income, tax_regime, investment_80c_ytd) so the AI
// engine can include Rahul's Financial Plan section in the returned markdown.
import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../middleware/auth.middleware";

const AI_ENGINE_BASE = process.env.AI_ENGINE_URL || "http://localhost:8000";

// ---------------------------------------------------------------------------
// GET /api/v1/reports/export
// Returns a downloadable .md file with the user's full financial report.
// ---------------------------------------------------------------------------
export async function exportReport(req: AuthedRequest, res: Response) {
  const now = new Date();

  // --- 1. Gather last 3 months of data (same window as health-score) --------
  const threeMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 3, 1));

  const [transactions, budgets, goals] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: req.userId, transactionDate: { gte: threeMonthsAgo } },
      orderBy: { transactionDate: "desc" },
    }),
    prisma.budget.findMany({ where: { userId: req.userId } }),
    prisma.goal.findMany({ where: { userId: req.userId } }),
  ]);

  // --- 2. Compute budget variance (same logic as budgets.controller.ts) ------
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
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

  // --- 3. Get health score from AI engine ------------------------------------
  let healthScore: number | null = null;
  try {
    const hsRes = await fetch(`${AI_ENGINE_BASE}/internal/analytics/health-score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactions, budgets, goals }),
    });
    if (hsRes.ok) {
      const hsBody = await hsRes.json();
      healthScore = hsBody.score ?? null;
    } else {
      console.error("[exportReport] Health-score AI error:", hsRes.status, await hsRes.text());
    }
  } catch (err: any) {
    console.error("[exportReport] Could not reach AI engine for health-score:", err.message);
    // Non-fatal — proceed with null score so the report still generates
  }

  // --- 4. Phase 5: Build optional financial_plan payload --------------------
  // Only included when annualIncome is set; completely absent otherwise so the
  // AI engine template never sees a partial/broken object.
  let financialPlan: {
    monthly_salary: number | null;
    annual_income: number;
    tax_regime: string | null;
    investment_80c_ytd: number;
  } | undefined;

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { monthlySalary: true, annualIncome: true, taxRegime: true },
    });

    if (user?.annualIncome != null) {
      // Compute 80C-eligible investment total for the current Indian financial year
      // (1 April → 31 March). Simplification: any transaction categorised as
      // 'Investment' counts toward 80C. A future iteration would use an explicit
      // is80CEligible flag or a dedicated table.
      const fyStart = now.getUTCMonth() >= 3 // April = month index 3
        ? new Date(Date.UTC(now.getUTCFullYear(), 3, 1))         // this calendar year's Apr 1
        : new Date(Date.UTC(now.getUTCFullYear() - 1, 3, 1));   // previous calendar year's Apr 1

      const investment80cAggregate = await prisma.transaction.aggregate({
        where: {
          userId: req.userId,
          category: "Investment",
          transactionDate: { gte: fyStart },
        },
        _sum: { amount: true },
      });

      financialPlan = {
        monthly_salary: user.monthlySalary !== null ? Number(user.monthlySalary) : null,
        annual_income: Number(user.annualIncome),
        tax_regime: user.taxRegime ?? null,
        investment_80c_ytd: Number(investment80cAggregate._sum.amount ?? 0),
      };
    }
  } catch (err: any) {
    // Non-fatal — if the user lookup fails, omit the plan section rather than
    // crash the whole export.
    console.error("[exportReport] Could not fetch user for financial plan:", err.message);
  }

  // --- 5. Call Rahul's report-generate endpoint ------------------------------
  let markdown: string;
  try {
    const genRes = await fetch(`${AI_ENGINE_BASE}/internal/reports/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transactions,
        budgets: budgetVariance,
        goals,
        health_score: healthScore,
        // Phase 5: only included when annualIncome is set; undefined values are
        // omitted by JSON.stringify so the key is completely absent otherwise.
        ...(financialPlan !== undefined ? { financial_plan: financialPlan } : {}),
      }),
    });

    if (!genRes.ok) {
      const errText = await genRes.text();
      console.error("[exportReport] AI engine generate error:", genRes.status, errText);
      return res.status(502).json({ error: "AI engine failed to generate report", detail: errText });
    }

    const genBody = await genRes.json();
    markdown = genBody.markdown;

    if (typeof markdown !== "string" || markdown.trim().length === 0) {
      return res.status(502).json({ error: "AI engine returned empty report" });
    }
  } catch (err: any) {
    console.error("[exportReport] Could not reach AI engine for report generation:", err.message);
    return res.status(503).json({ error: "AI engine unreachable", detail: err.message });
  }

  // --- 6. Return as downloadable .md file ------------------------------------
  const dateStr = now.toISOString().slice(0, 10); // e.g. 2026-09-18
  const filename = `financial-report-${dateStr}.md`;

  res.setHeader("Content-Type", "text/markdown; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  return res.status(200).send(markdown);
}
