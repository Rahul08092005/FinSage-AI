import { AuthGate } from "@/components/AuthGate";
import { BudgetCard } from "@/components/BudgetCard";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";

export default function BudgetsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6">
          <h1 className="text-xl font-semibold text-navy">Budgets</h1>
          <p className="mt-1 text-sm text-slate-500">Set a monthly limit per category and track variance live.</p>
          <div className="mt-6">
            <AuthGate>{(token) => <BudgetCard token={token} />}</AuthGate>
          </div>
        </main>
      </div>
    </div>
  );
}
