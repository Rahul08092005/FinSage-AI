"use client";

import { AppShell } from "@/components/AppShell";
import { FinancialPlanView } from "@/components/FinancialPlanView";
import { WhatIfSimulator } from "@/components/WhatIfSimulator";

export default function FinancialPlanPage() {
  return (
    <AppShell
      title="Your Financial Plan"
      subtitle="Tax-optimized wealth modeling and goal milestone roadmaps."
      hideHeader={true}
    >
      {(token) => (
        <div>
          <FinancialPlanView token={token} />
          <WhatIfSimulator token={token} />
        </div>
      )}
    </AppShell>
  );
}

