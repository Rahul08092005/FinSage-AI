"use client";

import { AppShell } from "@/components/AppShell";
import { GoalCard } from "@/components/GoalCard";

export default function GoalsPage() {
  return (
    <AppShell
      title="Savings Targets"
      subtitle="Target capital milestones against maturity deadlines — Phase 2 Core."
    >
      {(token) => <GoalCard token={token} />}
    </AppShell>
  );
}
