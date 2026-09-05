"use client";
import { useEffect, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { Card } from "@/components/Card";
import { SalaryCard } from "@/components/SalaryCard";
import { SpendingCharts } from "@/components/SpendingCharts";
import { getExpenseSummary, getHealthScore, getSpendingTrend } from "@/lib/api";

function AuthenticatedOverviewCards({ token }: { token: string }) {
  const [spend, setSpend] = useState<number | null>(null);
  const [categories, setCategories] = useState<Array<{ category: string; total: number; count: number }>>([]);
  const [trend, setTrend] = useState<Array<{ month: string; total: number }>>([]);
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const monthStr = `${year}-${month}`;

        const [summaryRes, trendRes, healthRes] = await Promise.allSettled([
          getExpenseSummary(token, monthStr),
          getSpendingTrend(token),
          getHealthScore(token),
        ]);

        if (summaryRes.status === "fulfilled" && summaryRes.value) {
          setSpend(Number(summaryRes.value.total) || 0);
          setCategories(summaryRes.value.byCategory || []);
        }

        if (trendRes.status === "fulfilled" && trendRes.value) {
          setTrend(trendRes.value);
        }

        if (healthRes.status === "fulfilled" && healthRes.value?.score != null) {
          setHealthScore(healthRes.value.score);
        }
      } catch (e) {
        console.error("Failed to load dashboard metrics:", e);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [token]);

  const spendFormatted = loading
    ? "Loading…"
    : `₹ ${Number(spend || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  const healthScoreFormatted = loading
    ? "Loading…"
    : healthScore !== null
    ? `${healthScore} / 100`
    : "—";

  return (
    <>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SalaryCard token={token} />
        <Card title="Monthly Spend" value={spendFormatted} accent="orange" />
        <Card title="Financial Health" value={healthScoreFormatted} accent="teal" />
      </div>

      <SpendingCharts categoryData={categories} trendData={trend} loading={loading} />
    </>
  );
}

export function OverviewCards() {
  return (
    <AuthGate>
      {(token) => <AuthenticatedOverviewCards token={token} />}
    </AuthGate>
  );
}
