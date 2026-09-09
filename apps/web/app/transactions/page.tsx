"use client";

import { AppShell } from "@/components/AppShell";
import { TransactionsTable } from "@/components/TransactionsTable";

export default function TransactionsPage() {
  return (
    <AppShell
      title="Account Transactions"
      subtitle="Live double-entry journal and voucher records — Phase 2 Core."
    >
      {(token) => <TransactionsTable token={token} />}
    </AppShell>
  );
}
