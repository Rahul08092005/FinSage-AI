"use client";

import { useEffect, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { DominantBalanceHero } from "@/components/DominantBalanceHero";
import { AiCompanionBar } from "@/components/AiCompanionBar";
import { SpendingCharts } from "@/components/SpendingCharts";
import { getExpenseSummary, getHealthScore, getMe, getSpendingTrend } from "@/lib/api";

function AuthenticatedOverviewCards({ token }: { token: string }) {
  const [salary, setSalary] = useState<number | null>(null);
  const [spend, setSpend] = useState<number | null>(null);
  const [categories, setCategories] = useState<Array<{ category: string; total: number; count: number }>>([]);
  const [trend, setTrend] = useState<Array<{ month: string; total: number }>>([]);
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

      {/* 2. Compact AI Robot Companion Bar */}
      <AiCompanionBar />

      {/* 3. Main Analytics: Top 5 Category Breakdown & Spending Rhythm */}
      <SpendingCharts categoryData={categories} trendData={trend} loading={loading} />
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
