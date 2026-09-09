"use client";

import { AppShell } from "@/components/AppShell";
import { BudgetCard } from "@/components/BudgetCard";

export default function BudgetsPage() {
  return (
    <AppShell
      title="Budget Allocations"
      subtitle="Monthly limits and real-time variance against transactions — Phase 2 Core."
    >
      {(token) => <BudgetCard token={token} />}
    </AppShell>
  );
}
