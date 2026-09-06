// Person 1 (Aditi) owns this file.
// Phase 2: a read-only summary endpoint over the same transactions table —
// "expenses" is a categorized view, not a separate table.
import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../middleware/auth.middleware";

export async function expenseSummary(req: AuthedRequest, res: Response) {
  const { month } = req.query as { month?: string }; // "YYYY-MM"

  const where: any = { userId: req.userId };
  if (month) {
    const start = new Date(`${month}-01T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1);
    where.transactionDate = { gte: start, lt: end };
  }

  const grouped = await prisma.transaction.groupBy({
    by: ["category"],
    where,
    _sum: { amount: true },
    _count: { _all: true },
  });

  const byCategory = grouped.map((g) => ({
    category: g.category,
    total: g._sum.amount ?? 0,
    count: g._count._all,
  }));

  const total = byCategory.reduce((sum, c) => sum + Number(c.total), 0);

  res.json({ month: month ?? "all", byCategory, total });
}
