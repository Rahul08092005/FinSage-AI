"use client";

import { AppShell } from "@/components/AppShell";
import { TransactionsTable } from "@/components/TransactionsTable";

export default function TransactionsPage() {
  return (
    <AppShell hideHeader={true}>
      {(token) => <TransactionsTable token={token} />}
    </AppShell>
  );
}
