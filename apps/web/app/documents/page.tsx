"use client";

import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { TransactionsTable } from "@/components/TransactionsTable";

export default function DocumentsPage() {
  return (
    <AppShell
      title="The FinSage Vault"
      subtitle="Drop the paperwork. Let FinSage make sense of it."
      hideHeader={true}
    >
      {(token) => (
        <Suspense
          fallback={
            <div className="min-h-screen bg-[#FAF6ED] p-8 text-center text-xs font-bold text-[#18122B]/60">
              Loading document vault…
            </div>
          }
        >
          <TransactionsTable token={token} initialView="documents" />
        </Suspense>
      )}
    </AppShell>
  );
}
