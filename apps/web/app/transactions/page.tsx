import { AuthGate } from "@/components/AuthGate";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { TransactionsTable } from "@/components/TransactionsTable";

export default function TransactionsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6">
          <h1 className="text-xl font-semibold text-navy">Transactions</h1>
          <p className="mt-1 text-sm text-slate-500">Live data from Aditi's Transactions API — Phase 2.</p>
          <div className="mt-6">
            <AuthGate>{(token) => <TransactionsTable token={token} />}</AuthGate>
          </div>
        </main>
      </div>
    </div>
  );
}
