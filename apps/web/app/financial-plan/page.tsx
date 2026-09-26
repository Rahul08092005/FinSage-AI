"use client";

import { AppShell } from "@/components/AppShell";
import { FinancialPlanView } from "@/components/FinancialPlanView";

export default function FinancialPlanPage() {
  return (
    <AppShell
      title="Your Financial Plan"
      subtitle="Tax-optimized wealth modeling and goal milestone roadmaps."
      hideHeader={true}
    >
      {(token) => <FinancialPlanView token={token} />}
    </AppShell>
  );
}
