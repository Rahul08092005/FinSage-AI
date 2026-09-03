// Phase 3: Financial health score proxy — closes the Dashboard's long-standing
// 'Financial Health: —' placeholder.  Fetches transactions, budgets, and goals,
// then delegates the scoring to Kavya's AI engine endpoint.
// Follows the same style as other controllers (requireAuth, zod, prisma).
import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../middleware/auth.middleware";

const AI_ENGINE_BASE = process.env.AI_ENGINE_URL || "http://localhost:8000";

// ---------------------------------------------------------------------------
// GET /api/v1/analytics/health-score
// ---------------------------------------------------------------------------
export async function healthScore(req: AuthedRequest, res: Response) {
  // Last 3 months of transactions
  const now = new Date();
  const threeMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 3, 1));

  const [transactions, budgets, goals] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: req.userId, transactionDate: { gte: threeMonthsAgo } },
      orderBy: { transactionDate: "desc" },
    }),
    prisma.budget.findMany({ where: { userId: req.userId } }),
    prisma.goal.findMany({ where: { userId: req.userId } }),
  ]);

  try {
    const aiRes = await fetch(`${AI_ENGINE_BASE}/internal/analytics/health-score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactions, budgets, goals }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("[healthScore] AI engine error:", aiRes.status, errText);
      return res.status(502).json({ error: "AI engine returned an error", detail: errText });
    }

    const body = await aiRes.json();
    return res.json({ score: body.score, breakdown: body.breakdown ?? {} });
  } catch (err: any) {
    console.error("[healthScore] Could not reach AI engine:", err.message);
    return res.status(503).json({ error: "AI engine unreachable", detail: err.message });
  }
}
