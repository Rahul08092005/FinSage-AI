"use client";

import { AppShell } from "@/components/AppShell";
import { WhatIfSimulator } from "@/components/WhatIfSimulator";

export default function WhatIfPage() {
  return (
    <AppShell
      title="What-If Simulator"
      subtitle="Change the numbers. See what happens."
      hideHeader={true}
    >
      {(token) => <WhatIfSimulator token={token} />}
    </AppShell>
  );
}
