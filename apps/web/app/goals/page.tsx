"use client";
import { AuthGate } from "@/components/AuthGate";
import { GoalCard } from "@/components/GoalCard";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";

export default function GoalsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8">
          <div className="border-b border-line pb-4">
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink md:text-3xl">
              Savings Targets
            </h1>
            <p className="mt-1 text-xs text-ink-muted">
              Target capital milestones against maturity deadlines — Phase 2 Core.
            </p>
          </div>
          <div className="mt-6">
            <AuthGate>{(token) => <GoalCard token={token} />}</AuthGate>
          </div>
        </main>
      </div>
    </div>
  );
}
