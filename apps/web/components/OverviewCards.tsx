"use client";
import { useEffect, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { Card } from "@/components/Card";
import { SalaryCard } from "@/components/SalaryCard";
import { getMonthlySpend } from "@/lib/api";

function AuthenticatedOverviewCards({ token }: { token: string }) {
  const [spend, setSpend] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSpend() {
      setLoading(true);
      try {
        const total = await getMonthlySpend(token);
        setSpend(total);
      } catch (e) {
        console.error("Failed to load monthly spend:", e);
      } finally {
        setLoading(false);
      }
    }

    loadSpend();
  }, [token]);

  const spendFormatted = loading
    ? "Loading…"
    : `₹ ${Number(spend || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <SalaryCard token={token} />
      <Card title="Monthly Spend" value={spendFormatted} accent="orange" />
      <Card title="Financial Health" value="—" accent="teal" />
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
