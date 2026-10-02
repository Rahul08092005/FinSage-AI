"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { DominantBalanceHero } from "@/components/DominantBalanceHero";
import { SpendingCharts } from "@/components/SpendingCharts";
import { InsightsFeed } from "@/components/InsightsFeed";
import {
  getExpenseSummary,
  getHealthScore,
  getMe,
  getSpendingTrend,
  type TrendItem,
  type InsightItem,
} from "@/lib/api";

function AuthenticatedOverviewCards({ token }: { token: string }) {
  const [salary, setSalary] = useState<number | null>(null);
  const [spend, setSpend] = useState<number | null>(null);
  const [categories, setCategories] = useState<Array<{ category: string; total: number; count: number }>>([]);
  const [trend, setTrend] = useState<TrendItem[]>([]);
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const monthStr = `${year}-${month}`;

        const [meRes, summaryRes, trendRes] = await Promise.allSettled([
          getMe(token),
          getExpenseSummary(token, monthStr),
          getSpendingTrend(token),
        ]);

        if (meRes.status === "fulfilled" && meRes.value) {
          setSalary(meRes.value.monthlySalary ?? 100000);
        }

        if (summaryRes.status === "fulfilled" && summaryRes.value) {
          setSpend(Number(summaryRes.value.total) || 0);
          setCategories(summaryRes.value.byCategory || []);
        }

        if (trendRes.status === "fulfilled" && trendRes.value) {
          setTrend(trendRes.value);
        }
      } catch (e) {
        console.error("Failed to load dashboard metrics:", e);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [token]);

  const sortedCategories = [...categories].sort((a, b) => Number(b.total) - Number(a.total));
  const topCategory = sortedCategories[0] || null;

  // Extract categories associated with warning/leak insights
  const warningCategories = useMemo(() => {
    return insights
      .filter((i) => !i.dismissed && (i.type === "warning" || i.type === "leak"))
      .map((i) => i.category || "")
      .filter(Boolean);
  }, [insights]);

  return (
    <div className="flex flex-col gap-2.5 sm:gap-3">
      {/* 1. Compact 3-Column Financial Snapshot */}
      <DominantBalanceHero
        token={token}
        salary={salary}
        spend={spend}
        topCategory={topCategory}
        loading={loading}
        onSalaryUpdated={(newSalary) => setSalary(newSalary)}
      />

      {/* 2. Main Analytics: Top 5 Category Breakdown & Spending Rhythm */}
      <SpendingCharts
        categoryData={categories}
        trendData={trend}
        loading={loading}
        warningCategories={warningCategories}
      />

      {/* 3. Pattern Intelligence Feed */}
      <InsightsFeed token={token} onInsightsLoaded={setInsights} />
    </div>
  );
}

export function OverviewCards() {
  return (
    <AuthGate>
      {(token) => <AuthenticatedOverviewCards token={token} />}
    </AuthGate>
  );
}

