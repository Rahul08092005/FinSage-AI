"use client";

import { AppShell } from "@/components/AppShell";
import { GoalCard } from "@/components/GoalCard";

export default function GoalsPage() {
  return (
    <AppShell
      title="Money Missions"
      subtitle="Give your money somewhere to go."
      hideHeader={true}
    >
      {(token) => <GoalCard token={token} />}
    </AppShell>
  );
}
