"use client";

import { AppShell } from "@/components/AppShell";
import { AdvisorChat } from "@/components/AdvisorChat";

export default function AdvisorPage() {
  return (
    <AppShell
      title="AI Wealth Advisory Desk"
      subtitle="Live intelligence stream analyzing transaction histories, budget ceilings, and archival goals."
    >
      {(token) => <AdvisorChat token={token} />}
    </AppShell>
  );
}
