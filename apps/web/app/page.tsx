import { Card } from "@/components/Card";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { getHealth } from "@/lib/api";

// Server component: fetches live status from the BFF (which itself checks
// Postgres + Redis) — this is the "frontend <-> backend connected" proof
// for the Phase 1 demo video.
export default async function DashboardPage() {
  let bffStatus: any = null;
  let error: string | null = null;

  try {
    bffStatus = await getHealth();
  } catch (e) {
    error = "Could not reach the BFF server. Is it running on port 4000?";
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6">
          <h1 className="text-xl font-semibold text-navy">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Layout, navigation, and component library — Radhika, Phase 1.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card title="Net Worth" value="₹ —" />
            <Card title="Monthly Spend" value="₹ —" accent="orange" />
            <Card title="Financial Health" value="—" />
          </div>

          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-navy">System status (live)</h2>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            {bffStatus && (
              <pre className="mt-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                {JSON.stringify(bffStatus, null, 2)}
              </pre>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
