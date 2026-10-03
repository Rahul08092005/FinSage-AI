"use client";

import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { ExperimentCard } from "@/components/ExperimentCard";
import {
  createExperiment,
  getExperiments,
  concludeExperiment,
  FinancialExperiment,
} from "@/lib/api";

const CATEGORY_OPTIONS = [
  "Food & Dining",
  "Food",
  "Groceries",
  "Shopping",
  "Entertainment",
  "Travel",
  "Transport",
  "Utilities",
  "Bills",
  "Rent",
  "Healthcare",
  "Subscriptions",
];

function ExperimentsContent({ token }: { token: string }) {
  const [experiments, setExperiments] = useState<FinancialExperiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [hypothesis, setHypothesis] = useState("");
  const [baselineDays, setBaselineDays] = useState(30);
  const [isCreating, setIsCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Conclude loading tracker (per experiment ID)
  const [concludingId, setConcludingId] = useState<string | null>(null);

  const fetchExperiments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getExperiments(token);
      setExperiments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("[ExperimentsPage] Load error:", err);
      setError(err?.message || "Failed to load financial experiments.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchExperiments();
  }, [fetchExperiments]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!hypothesis.trim()) {
      setFormError("Please enter a clear money hypothesis to test.");
      return;
    }

    setIsCreating(true);
    setFormError(null);

    try {
      await createExperiment(token, {
        category,
        hypothesis: hypothesis.trim(),
        baselineDays: Number(baselineDays) || 30,
      });

      // Reset form
      setHypothesis("");
      setBaselineDays(30);
      setCategory(CATEGORY_OPTIONS[0]);

      // Refetch
      await fetchExperiments();
    } catch (err: any) {
      console.error("[ExperimentsPage] Create error:", err);
      setFormError(err?.message || "Failed to create experiment.");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleConclude(id: string) {
    if (concludingId) return; // Prevent multiple simultaneous conclusion requests
    setConcludingId(id);
    try {
      await concludeExperiment(token, id);
      await fetchExperiments();
    } catch (err: any) {
      console.error("[ExperimentsPage] Conclude error:", err);
      alert(err?.message || "Failed to conclude experiment. Please try again.");
    } finally {
      setConcludingId(null);
    }
  }

  // Derive active and completed collections
  const activeExperiments = experiments.filter(
    (e) => e.status !== "completed" && e.status !== "concluded"
  );
  const completedExperiments = experiments.filter(
    (e) => e.status === "completed" || e.status === "concluded"
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* A. PAGE HERO HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E5DAC4] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#84cc16]/20 border border-[#84cc16]/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#3f6212]">
              ✦ MONEY LAB
            </span>
            <span className="text-[11px] font-mono text-stone-500">
              receipts &gt; vibes ✦
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-black tracking-tight text-[#18122B]">
            FINANCIAL EXPERIMENTS
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 font-medium mt-0.5">
            Test a money hypothesis. Keep the receipts.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="rounded-full bg-[#FAF8F5] border border-[#E5DAC4] px-3 py-1 text-[11px] font-mono text-stone-600">
            {activeExperiments.length} Active &middot; {completedExperiments.length} Concluded
          </span>
        </div>
      </div>

      {/* B. CREATE EXPERIMENT SECTION */}
      <div className="rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#E5DAC4]/60 pb-3 mb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#18122B]/70 block">
              ✦ RUN THE TEST
            </span>
            <h2 className="font-serif text-lg font-bold text-[#18122B]">
              Launch a New Spending Experiment
            </h2>
          </div>
          <span className="text-[10px] font-mono text-stone-400">
            A/B Hypothesis
          </span>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            {/* 1. Category dropdown */}
            <div className="sm:col-span-4">
              <label
                htmlFor="experiment-category"
                className="block text-xs font-bold text-[#18122B] mb-1.5"
              >
                Category to Test
              </label>
              <select
                id="experiment-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-[#E5DAC4] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#18122B] focus:border-[#84cc16] focus:outline-none shadow-2xs"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Baseline days */}
            <div className="sm:col-span-3">
              <label
                htmlFor="experiment-baseline-days"
                className="block text-xs font-bold text-[#18122B] mb-1.5"
              >
                Baseline Window (Days)
              </label>
              <input
                id="experiment-baseline-days"
                type="number"
                min={7}
                max={90}
                value={baselineDays}
                onChange={(e) => setBaselineDays(Number(e.target.value))}
                className="w-full rounded-xl border border-[#E5DAC4] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#18122B] focus:border-[#84cc16] focus:outline-none shadow-2xs font-mono"
              />
            </div>

            {/* 3. Launch button */}
            <div className="sm:col-span-5 flex items-end">
              <button
                type="submit"
                disabled={isCreating}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#18122B] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-stone-800 disabled:opacity-50 transition cursor-pointer"
              >
                {isCreating ? (
                  <>
                    <span className="animate-spin text-xs">✦</span>
                    <span>Creating Experiment…</span>
                  </>
                ) : (
                  <>
                    <span>+ Launch Experiment</span>
                    <span className="text-[#84cc16]">&rarr;</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 4. Hypothesis statement */}
          <div>
            <label
              htmlFor="experiment-hypothesis"
              className="block text-xs font-bold text-[#18122B] mb-1.5"
            >
              Your Hypothesis
            </label>
            <input
              id="experiment-hypothesis"
              type="text"
              placeholder="e.g. If I reduce food delivery, my daily food spend will fall by at least 25%..."
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
              className="w-full rounded-xl border border-[#E5DAC4] bg-white px-4 py-2.5 text-xs font-medium text-[#18122B] placeholder:text-stone-400 focus:border-[#84cc16] focus:outline-none shadow-2xs"
            />
            <p className="mt-1 text-[11px] text-stone-500 font-medium">
              State the specific behavioral change and what you expect to happen to your daily category spend.
            </p>
          </div>
        </form>
      </div>

      {/* C. ACTIVE EXPERIMENTS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5DAC4]/60 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#18122B]/70">
              ✦ CURRENT EXPERIMENTS
            </span>
            <span className="rounded-full bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 text-[10px]">
              {activeExperiments.length} Active
            </span>
          </div>
          <span className="text-[10px] font-mono text-stone-400">
            test the theory
          </span>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-8 text-center">
            <div className="mx-auto w-8 h-8 rounded-full bg-lime-400/20 flex items-center justify-center text-sm animate-spin mb-2">
              ✦
            </div>
            <p className="text-xs text-stone-500 font-medium">Loading experiments…</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
            <p className="text-xs font-bold text-rose-800">{error}</p>
            <button
              type="button"
              onClick={fetchExperiments}
              className="mt-3 inline-flex items-center gap-1 rounded-full bg-rose-700 px-3.5 py-1 text-xs font-bold text-white hover:bg-rose-800"
            >
              ↺ Retry
            </button>
          </div>
        ) : activeExperiments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#DDD9CF] bg-[#FAF8F5] p-8 text-center">
            <div className="mx-auto w-10 h-10 rounded-full bg-lime-400/20 flex items-center justify-center text-lg mb-2">
              🧪
            </div>
            <h3 className="font-serif text-sm font-bold text-[#18122B]">
              No active experiments yet.
            </h3>
            <p className="mt-1 text-xs text-stone-500 max-w-sm mx-auto font-medium">
              Pick one money hypothesis above and launch an experiment to start tracking intervention data.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {activeExperiments.map((exp) => (
              <ExperimentCard
                key={exp.id}
                experiment={exp}
                onConclude={handleConclude}
                isConcluding={concludingId === exp.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* D. COMPLETED EXPERIMENTS SECTION */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between border-b border-[#E5DAC4]/60 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#18122B]/70">
              ✦ THE RECEIPTS
            </span>
            <span className="rounded-full bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 text-[10px]">
              {completedExperiments.length} Concluded
            </span>
          </div>
          <span className="text-[10px] font-mono text-stone-400">
            VERDICT: DATA
          </span>
        </div>

        {!loading && completedExperiments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#DDD9CF] bg-[#FAF8F5] p-8 text-center">
            <p className="text-xs text-stone-500 font-medium">
              Concluded experiments with baseline vs intervention analytics will appear here once you wrap up an active test.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {completedExperiments.map((exp) => (
              <ExperimentCard key={exp.id} experiment={exp} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExperimentsPage() {
  return (
    <AppShell hideHeader={true}>
      {(token) => <ExperimentsContent token={token} />}
    </AppShell>
  );
}
