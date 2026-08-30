import { AuthGate } from "@/components/AuthGate";
import { GoalCard } from "@/components/GoalCard";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";

export default function GoalsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6">
          <h1 className="text-xl font-semibold text-navy">Goals</h1>
          <p className="mt-1 text-sm text-slate-500">Track savings targets against a deadline.</p>
          <div className="mt-6">
            <AuthGate>{(token) => <GoalCard token={token} />}</AuthGate>
          </div>
        </main>
      </div>
    </div>
  );
}
