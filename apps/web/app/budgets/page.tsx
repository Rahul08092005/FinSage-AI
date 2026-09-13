"use client";

import { AppShell } from "@/components/AppShell";
import { BudgetCard } from "@/components/BudgetCard";

export default function BudgetsPage() {
  return (
    <AppShell hideHeader={true}>
      {(token) => <BudgetCard token={token} />}
    </AppShell>
  );
}
