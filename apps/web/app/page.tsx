import { FinFlipHero } from "@/components/FinFlipHero";
import { Navbar } from "@/components/Navbar";
import { OverviewCards } from "@/components/OverviewCards";
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
    <div className="flex min-h-screen flex-col bg-paper">
      <Navbar />
      <FinFlipHero />
      <div id="dashboard-overview" className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8">
          <div className="border-b border-line pb-4">
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink md:text-3xl">
              Financial Overview
            </h1>
            <p className="mt-1 text-xs text-ink-muted">
              Live wealth management metrics and system telemetry — Phase 2 Core.
            </p>
          </div>

          <OverviewCards />

          <div className="mt-8 rounded-lg border border-line bg-paper-sheet p-6 shadow-subtle">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                System Telemetry & Health Status
              </h2>
              {bffStatus?.status === "ok" && (
                <span className="inline-flex items-center gap-1 rounded-full border border-teal/30 bg-teal-tint px-2.5 py-0.5 text-[11px] font-semibold text-teal">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal" />
                  Live Operational
                </span>
              )}
            </div>

            {error && (
              <div className="mt-4 rounded-md border border-rose/30 bg-rose-tint p-3 text-xs font-medium text-rose">
                ⚠ {error}
              </div>
            )}

            {bffStatus && (
              <pre className="mt-4 overflow-x-auto rounded-md border border-line/70 bg-paper p-4 font-mono text-xs text-ink-muted">
                {JSON.stringify(bffStatus, null, 2)}
              </pre>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
