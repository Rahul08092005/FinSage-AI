import { formatINR } from "./formatCurrency";

export interface CategorySpend {
  category: string;
  total: number;
  count?: number;
}

export interface RawTransactionInput {
  amount: number | string;
  category: string;
  transactionDate: string;
}

export interface CategoryBudgetInput {
  category: string;
  monthlyLimit: number;
}

export interface TrendInsightInput {
  currentMonthCategories?: CategorySpend[];
  previousMonthCategories?: CategorySpend[];
  transactions?: RawTransactionInput[];
  budgets?: CategoryBudgetInput[];
  now?: Date;
}

export interface TrendInsight {
  id: string;
  type: "increase" | "decrease" | "started" | "budget" | "empty";
  text: string;
  category?: string;
  percentage?: number;
  delta?: number;
  tone: "warning" | "favorable" | "neutral";
}

/**
 * Computes 1–2 short, client-side trend and insight callouts comparing
 * current calendar month's spending with the immediately preceding calendar month.
 *
 * Requirements:
 * - Pure client-side calculation using existing transaction/category data.
 * - Handles current calendar month vs preceding calendar month boundaries.
 * - Handles categories in both months, only current, only previous, or zero previous spending.
 * - Never divides by zero (no NaN or Infinity).
 * - Avoids trivial fluctuations (< 2% or < ₹100).
 * - Formats percentages as clean whole numbers.
 * - Max 2 concise insights returned.
 */
export function generateTrendInsights(input: TrendInsightInput): TrendInsight[] {
  const currentDate = input.now ? new Date(input.now) : new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed (e.g. 8 for September)

  // Immediately preceding calendar month
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;

  const currentMap: Record<string, number> = {};
  const previousMap: Record<string, number> = {};

  // 1. If raw transactions are provided, aggregate by calendar month using actual dates
  if (input.transactions && input.transactions.length > 0) {
    for (const tx of input.transactions) {
      if (!tx.category || tx.amount == null) continue;
      const d = new Date(tx.transactionDate);
      if (isNaN(d.getTime())) continue;

      const amt = Number(tx.amount);
      if (isNaN(amt) || amt <= 0) continue;

      const y = d.getFullYear();
      const m = d.getMonth();

      if (y === currentYear && m === currentMonth) {
        currentMap[tx.category] = (currentMap[tx.category] || 0) + amt;
      } else if (y === prevYear && m === prevMonth) {
        previousMap[tx.category] = (previousMap[tx.category] || 0) + amt;
      }
    }
  } else {
    // 2. Otherwise use pre-aggregated category totals from dashboard fetches
    if (input.currentMonthCategories) {
      for (const c of input.currentMonthCategories) {
        if (!c.category) continue;
        const amt = Number(c.total);
        if (!isNaN(amt) && amt > 0) {
          currentMap[c.category] = (currentMap[c.category] || 0) + amt;
        }
      }
    }

    if (input.previousMonthCategories) {
      for (const p of input.previousMonthCategories) {
        if (!p.category) continue;
        const amt = Number(p.total);
        if (!isNaN(amt) && amt > 0) {
          previousMap[p.category] = (previousMap[p.category] || 0) + amt;
        }
      }
    }
  }

  const allCategories = Array.from(
    new Set([...Object.keys(currentMap), ...Object.keys(previousMap)])
  );

  interface ScoredCandidate {
    insight: TrendInsight;
    score: number;
  }

  const candidates: ScoredCandidate[] = [];

  // 3. Evaluate Month-over-Month Category Changes
  for (const cat of allCategories) {
    const current = currentMap[cat] || 0;
    const previous = previousMap[cat] || 0;

    // Case A: Spending present in both months
    if (current > 0 && previous > 0) {
      const delta = current - previous;
      const rawPct = ((current - previous) / previous) * 100;
      const percentage = Math.round(rawPct);
      const absPct = Math.abs(percentage);
      const absDelta = Math.abs(delta);

      // Filter out trivial fluctuations (less than 2% movement or tiny rupee shift)
      if (absPct >= 2 && absDelta >= 100) {
        const isUp = delta > 0;
        candidates.push({
          insight: {
            id: `trend-${cat}`,
            type: isUp ? "increase" : "decrease",
            text: `${cat} spending is ${isUp ? "up" : "down"} ${absPct}% vs last month`,
            category: cat,
            percentage: absPct,
            delta,
            // Spending increases are flagged as warning/caution; decreases are favorable
            tone: isUp ? "warning" : "favorable",
          },
          // Movement score prioritizes significant financial weight combined with percentage movement
          score: absDelta * (1 + Math.min(absPct, 200) / 100),
        });
      }
    }
    // Case B: Category present only in current month (zero previous-month spending)
    else if (current > 0 && previous === 0) {
      // Avoid division by zero! Never generate NaN or Infinity.
      // Use qualitative insight if meaningful (>= ₹500)
      if (current >= 500) {
        candidates.push({
          insight: {
            id: `started-${cat}`,
            type: "started",
            text: `${cat} spending started this month`,
            category: cat,
            delta: current,
            tone: "neutral",
          },
          score: current * 0.75,
        });
      }
    }
    // Case C: Category present only in previous month (zero current-month spending)
    else if (current === 0 && previous > 0) {
      // Optional: if previous was large, could note zero spend, but prioritize active spends
      if (previous >= 1000) {
        candidates.push({
          insight: {
            id: `down-zero-${cat}`,
            type: "decrease",
            text: `${cat} spending is down 100% vs last month`,
            category: cat,
            percentage: 100,
            delta: -previous,
            tone: "favorable",
          },
          score: previous * 0.6,
        });
      }
    }
  }

  // 4. Optional Budget Pace Insight (if budgets are available)
  if (input.budgets && input.budgets.length > 0) {
    const dayOfMonth = currentDate.getDate();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Only project after day 3 to ensure reasonable pace sample
    if (dayOfMonth >= 3) {
      for (const b of input.budgets) {
        const limit = Number(b.monthlyLimit) || 0;
        const spent = currentMap[b.category] || 0;
        if (limit <= 0 || spent <= 0) continue;

        const dailyPace = spent / dayOfMonth;
        const projectedMonthEnd = dailyPace * daysInMonth;

        if (projectedMonthEnd > limit && spent < limit) {
          candidates.push({
            insight: {
              id: `budget-warning-${b.category}`,
              type: "budget",
              text: `You're on track to exceed your ${b.category} budget by month end`,
              category: b.category,
              tone: "warning",
            },
            score: (projectedMonthEnd - limit) * 1.5,
          });
        }
      }
    }
  }

  // 5. Select at most 2 insights, sorted by movement impact
  if (candidates.length === 0) {
    // If there is insufficient data for a meaningful comparison, show honest empty state
    return [
      {
        id: "empty-trend",
        type: "empty",
        text: "Add more transactions to unlock spending trends.",
        tone: "neutral",
      },
    ];
  }

  candidates.sort((a, b) => b.score - a.score);

  // Return maximum 2 insights
  return candidates.slice(0, 2).map((c) => c.insight);
}
