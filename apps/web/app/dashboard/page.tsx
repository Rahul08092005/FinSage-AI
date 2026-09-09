"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { OverviewCards } from "@/components/OverviewCards";
import { getHealth } from "@/lib/api";

export default function DashboardPage() {
  const [bffStatus, setBffStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await getHealth();
        setBffStatus(res);
      } catch (e: any) {
        setError("Could not reach the BFF server. Is it running on port 4000?");
      }
    }
    checkHealth();
  }, []);

  return (
    <AppShell
      title="Financial Overview"
      subtitle="Live wealth management metrics, double-entry ledgers, and AI telemetry."
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/transactions"
            className="rounded-md border border-line bg-paper px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-ink hover:bg-paper-sheet"
          >
            + Record Transaction
          </Link>
          <Link
            href="/advisor"
            className="rounded-md bg-ink px-3 py-1.5 text-xs font-bold text-paper-sheet shadow-subtle transition hover:bg-ink-light"
          >
            Ask AI Advisor
          </Link>
        </div>
      }
    >
      {/* Primary Financial Overview Metrics & Charts */}
      <OverviewCards />

      {/* System Telemetry & Health Status */}
      <div className="mt-8 rounded-xl border border-line bg-paper-sheet p-6 shadow-subtle">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
              System Telemetry & Health Status
            </span>
          </div>
          {bffStatus?.status === "ok" ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-teal/30 bg-teal-tint px-2.5 py-0.5 text-[11px] font-semibold text-teal">
              <span className="h-1.5 w-1.5 rounded-full bg-teal animate-pulse" />
              Live Operational
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-rose/30 bg-rose-tint px-2.5 py-0.5 text-[11px] font-semibold text-rose">
              Checking Services...
            </span>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-rose/30 bg-rose-tint p-3 text-xs font-medium text-rose">
            ⚠ {error}
          </div>
        )}

        {bffStatus && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-line bg-paper p-3">
              <span className="text-[10px] uppercase tracking-wider text-ink-subtle">Database</span>
              <p className="mt-1 font-mono text-xs font-bold text-teal">
                PostgreSQL + pgvector: {bffStatus.database || "connected"}
              </p>
            </div>
            <div className="rounded-lg border border-line bg-paper p-3">
              <span className="text-[10px] uppercase tracking-wider text-ink-subtle">Cache & Queue</span>
              <p className="mt-1 font-mono text-xs font-bold text-teal">
                Redis 7: {bffStatus.redis || "connected"}
              </p>
            </div>
            <div className="rounded-lg border border-line bg-paper p-3">
              <span className="text-[10px] uppercase tracking-wider text-ink-subtle">AI Inference</span>
              <p className="mt-1 font-mono text-xs font-bold text-[#6366f1]">
                Groq LLM Engine: online
              </p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
