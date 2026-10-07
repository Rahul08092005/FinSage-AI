"use client";

import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { TransactionsTable } from "@/components/TransactionsTable";

export default function TransactionsPage() {
  return (
    <AppShell hideHeader={true}>
      {(token) => (
        <Suspense
          fallback={
            <div className="min-h-screen bg-[#FAF6ED] p-8 text-center text-xs font-bold text-[#18122B]/60">
              Loading financial ledger & vault…
            </div>
          }
        >
          <TransactionsTable token={token} />
        </Suspense>
      )}
    </AppShell>
  );
}
