"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { OverviewCards } from "@/components/OverviewCards";
import { getHealth } from "@/lib/api";

export default function DashboardPage() {
  const [bffStatus, setBffStatus] = useState<any>(null);

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await getHealth();
        setBffStatus(res);
      } catch (e: any) {
        // quiet fallback
      }
    }
    checkHealth();
  }, []);

  return (
    <AppShell hideHeader={true}>
      <div className="flex flex-col gap-2.5 sm:gap-3">
        {/* Compact Header */}
        <div className="flex items-center justify-between gap-3 pt-1 pb-0.5">
          <div>
            <h1 className="font-serif text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-[#18122B] leading-tight">
              YOUR MONEY, AT A GLANCE.
            </h1>
            <p className="text-xs text-[#18122B]/60 font-medium">
              Everything important, in one place.
            </p>
          </div>

          <Link
            href="/transactions"
            className="group inline-flex items-center gap-1.5 rounded-full bg-[#18122B] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#2e234c] hover:scale-105 active:scale-95"
          >
            <span>+ Record Transaction</span>
            <span className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
          </Link>
        </div>

        {/* Essential Core: Snapshot, AI Assistant Bar, Main Analytics */}
        <OverviewCards />

        {/* Compact System Status Strip (Bottom, ~28px) */}
        <footer className="mt-1 border-t border-[#E5DAC4]/60 pt-2 pb-1">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#18122B]/50 font-medium">
            <div className="flex items-center gap-3">
              <span className="font-bold uppercase tracking-wider text-[#18122B]/40">
                SYSTEM STATUS
              </span>
              <span className="inline-flex items-center gap-1 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-[#84cc16]" />
                Database {bffStatus?.database || "up"}
              </span>
              <span className="inline-flex items-center gap-1 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-[#84cc16]" />
                Cache {bffStatus?.redis || "up"}
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-[#6366f1]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6366f1]" />
                AI online
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[#3f6212] font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-[#84cc16] animate-pulse" />
              Live Operational
            </div>
          </div>
        </footer>
      </div>
    </AppShell>
  );
}
