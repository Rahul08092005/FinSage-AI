import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../middleware/auth.middleware";

export interface LevelBracket {
  level: number;
  minXp: number;
  maxXp: number;
}

export const LEVEL_BRACKETS: LevelBracket[] = [
  { level: 1, minXp: 0, maxXp: 100 },
  { level: 2, minXp: 100, maxXp: 250 },
  { level: 3, minXp: 250, maxXp: 500 },
  { level: 4, minXp: 500, maxXp: 1000 },
  { level: 5, minXp: 1000, maxXp: 2000 },
  { level: 6, minXp: 2000, maxXp: 3500 },
  { level: 7, minXp: 3500, maxXp: 5000 },
  { level: 8, minXp: 5000, maxXp: 10000 },
];

export function computeGamification(
  totalXp: number,
  streakDays: number = 0
) {
  const xp = Math.max(0, Math.floor(totalXp));

  let currentBracket = LEVEL_BRACKETS[0];
  for (const bracket of LEVEL_BRACKETS) {
    if (xp >= bracket.minXp) {
      currentBracket = bracket;
    } else {
      break;
    }
  }

  const level = currentBracket.level;
  const nextLevelXp = currentBracket.maxXp;
  const levelRange = currentBracket.maxXp - currentBracket.minXp;
  const xpInCurrentLevel = Math.max(0, xp - currentBracket.minXp);
  const xpToNextLevel = Math.max(0, nextLevelXp - xp);
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((xpInCurrentLevel / levelRange) * 100))
  );

  return {
    level,
    xp,
    nextLevelXp,
    currentStreak: streakDays,
    xpToNextLevel,
    progressPercent,
  };
}

export async function getUserProgress(req: AuthedRequest, res: Response) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [txCount, budgetCount, goalCount, docCount, accountCount, recentTxs] =
      await Promise.all([
        prisma.transaction.count({ where: { userId } }),
        prisma.budget.count({ where: { userId } }),
        prisma.goal.count({ where: { userId } }),
        prisma.document.count({ where: { userId, status: "COMPLETED" } }),
        prisma.account.count({ where: { userId } }),
        prisma.transaction.findMany({
          where: { userId },
          select: { transactionDate: true },
          orderBy: { transactionDate: "desc" },
          take: 50,
        }),
      ]);

    // Deterministic XP award rules based on genuine user records:
    // - 10 XP per recorded transaction
    // - 25 XP per budget configured
    // - 50 XP per financial goal created
    // - 20 XP per verified OCR receipt / document
    // - 15 XP per financial account linked
    const txXp = txCount * 10;
    const budgetXp = budgetCount * 25;
    const goalXp = goalCount * 50;
    const docXp = docCount * 20;
    const accountXp = accountCount * 15;

    const totalXp = txXp + budgetXp + goalXp + docXp + accountXp;

    // Calculate daily active transaction streak
    let streakDays = 0;
    if (recentTxs.length > 0) {
      const distinctDates = Array.from(
        new Set(
          recentTxs.map((t) => {
            const d = new Date(t.transactionDate);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          })
        )
      ).sort().reverse();

      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      const yesterday = new Date(Date.now() - 86400000);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

      if (distinctDates.includes(todayStr) || distinctDates.includes(yesterdayStr)) {
        let checkDate = distinctDates.includes(todayStr) ? today : yesterday;
        for (const dateStr of distinctDates) {
          const expectedStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, "0")}-${String(checkDate.getDate()).padStart(2, "0")}`;
          if (dateStr === expectedStr) {
            streakDays++;
            checkDate = new Date(checkDate.getTime() - 86400000);
          } else {
            break;
          }
        }
      }
    }

    const calculated = computeGamification(totalXp, streakDays);

    return res.json({
      ...calculated,
      breakdown: {
        transactions: { count: txCount, xp: txXp },
        budgets: { count: budgetCount, xp: budgetXp },
        goals: { count: goalCount, xp: goalXp },
        documents: { count: docCount, xp: docXp },
        accounts: { count: accountCount, xp: accountXp },
      },
    });
  } catch (err: any) {
    console.error("[getUserProgress] Error:", err);
    return res.status(500).json({ error: "Failed to calculate user progress" });
  }
}
