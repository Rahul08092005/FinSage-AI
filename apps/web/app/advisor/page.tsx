"use client";

import { AppShell } from "@/components/AppShell";
import { AdvisorChat } from "@/components/AdvisorChat";

export default function AdvisorPage() {
  return (
    <AppShell
      title="AI Advisor"
      subtitle="Your personal money copilot."
      hideHeader={true}
    >
      {(token) => <AdvisorChat token={token} />}
    </AppShell>
  );
}
