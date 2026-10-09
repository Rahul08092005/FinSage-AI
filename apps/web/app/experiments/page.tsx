"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { AppShell } from "@/components/AppShell";
import { ExperimentCard } from "@/components/ExperimentCard";
import { WhatIfSimulator } from "@/components/WhatIfSimulator";
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

type ExperimentTab = "scenario" | "lab" | "receipts";

function UnifiedExperimentsContent({ token }: { token: string }) {
  const [currentTab, setCurrentTab] = useState<ExperimentTab>("scenario");

  // Experiments Data & State
  const [experiments, setExperiments] = useState<FinancialExperiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Experiment Form State
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [hypothesis, setHypothesis] = useState("");
  const [baselineDays, setBaselineDays] = useState(30);
  const [isCreating, setIsCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Conclude loading tracker (per experiment ID)
  const [concludingId, setConcludingId] = useState<string | null>(null);

  // Receipt Filter State
  const [receiptFilterCategory, setReceiptFilterCategory] = useState<string>("ALL");
  const [receiptSearch, setReceiptSearch] = useState<string>("");

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
    setFormSuccess(null);

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
      setFormSuccess("Experiment launched! Gathering intervention data. ✦");

      // Refetch
      await fetchExperiments();

      // Clear success toast after delay
      setTimeout(() => setFormSuccess(null), 4000);
    } catch (err: any) {
      console.error("[ExperimentsPage] Create error:", err);
      setFormError(err?.message || "Failed to create experiment.");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleConclude(id: string) {
    if (concludingId) return;
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

  // Filtered receipts
  const filteredCompletedExperiments = completedExperiments.filter((exp) => {
    const matchesCat =
      receiptFilterCategory === "ALL" ||
      exp.category?.toLowerCase() === receiptFilterCategory.toLowerCase();
    const matchesQuery =
      !receiptSearch.trim() ||
      exp.hypothesis?.toLowerCase().includes(receiptSearch.toLowerCase()) ||
      exp.category?.toLowerCase().includes(receiptSearch.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-[#FAF6ED] text-[#18122B] pb-16 pt-2 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          1. UNIFIED HERO HEADER WITH FLOATING MASCOT
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="relative pt-1 sm:pt-2 pb-3 border-b border-[#E5DAC4]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#84cc16]/40 bg-[#ECFDF5] px-2.5 py-0.5 text-[10px] font-bold text-[#047857] mb-1.5 shadow-2xs">
              <span>✦</span>
              <span className="tracking-wider uppercase text-[9px]">EXPERIMENTS & SCENARIO ENGINE</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#18122B]">
              Change the numbers. <span className="text-amber-500">See what happens. ✦</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#18122B]/65 font-medium mt-1 max-w-2xl">
              Model personal finance scenarios, test spending hypotheses in the lab, and keep the outcome receipts.
            </p>
          </div>

          {/* Right Mascot & Status */}
          <div className="flex items-center gap-3 sm:gap-4 self-start sm:self-center shrink-0">
            <div className="hidden md:flex flex-col items-end text-right">
              <span className="font-serif text-xs font-bold italic text-[#18122B]/80">
                receipts &gt; vibes
              </span>
              <span className="font-mono text-[10px] text-[#18122B]/55">
                {activeExperiments.length} Active &middot; {completedExperiments.length} Concluded
              </span>
            </div>

            {/* Transparent Floating Mascot */}
            <div className="relative w-20 sm:w-24 h-16 sm:h-20 shrink-0 flex items-center justify-center">
              <Image
                src="/finsage-owl.png"
                alt="FinSage Money Lab Mascot"
                width={120}
                height={95}
                priority
                className="w-auto h-full object-contain pointer-events-none select-none drop-shadow-sm transition-transform duration-300 hover:scale-105"
              />
            </div>
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            2. INTERNAL SEGMENTED TABS
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="mt-4 flex items-center gap-2 border-t border-[#E5DAC4]/60 pt-3 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setCurrentTab("scenario")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer shrink-0 ${
              currentTab === "scenario"
                ? "bg-[#18122B] text-white shadow-sm"
                : "border border-[#DDD9CF] bg-white text-[#18122B]/70 hover:text-[#18122B] hover:bg-[#FAF6ED]"
            }`}
          >
            <span>✨</span>
            <span>Scenario Builder (What-If)</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab("lab")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer shrink-0 ${
              currentTab === "lab"
                ? "bg-[#18122B] text-white shadow-sm"
                : "border border-[#DDD9CF] bg-white text-[#18122B]/70 hover:text-[#18122B] hover:bg-[#FAF6ED]"
            }`}
          >
            <span>🧪</span>
            <span>Experiment Lab</span>
            {activeExperiments.length > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono font-bold ${
                  currentTab === "lab" ? "bg-[#84cc16] text-[#18122B]" : "bg-amber-100 text-amber-900"
                }`}
              >
                {activeExperiments.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab("receipts")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer shrink-0 ${
              currentTab === "receipts"
                ? "bg-[#18122B] text-white shadow-sm"
                : "border border-[#DDD9CF] bg-white text-[#18122B]/70 hover:text-[#18122B] hover:bg-[#FAF6ED]"
            }`}
          >
            <span>📜</span>
            <span>Past Experiments (Receipts)</span>
            {completedExperiments.length > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono font-bold ${
                  currentTab === "receipts"
                    ? "bg-[#84cc16] text-[#18122B]"
                    : "bg-emerald-100 text-emerald-900"
                }`}
              >
                {completedExperiments.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          TAB 1: SCENARIO BUILDER (WHAT-IF SIMULATOR)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className={currentTab === "scenario" ? "block" : "hidden"}>
        <WhatIfSimulator token={token} />
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          TAB 2: EXPERIMENT LAB (CREATE & ACTIVE EXPERIMENTS)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className={currentTab === "lab" ? "block space-y-6" : "hidden"}>
        {/* CREATE EXPERIMENT FORM */}
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
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                <span>✓</span>
                <span>{formSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              {/* Category dropdown */}
              <div className="sm:col-span-4">
                <label
                  htmlFor="lab-experiment-category"
                  className="block text-xs font-bold text-[#18122B] mb-1.5"
                >
                  Category to Test
                </label>
                <select
                  id="lab-experiment-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-[#E5DAC4] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#18122B] focus:border-[#84cc16] focus:outline-none shadow-2xs cursor-pointer"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Baseline days */}
              <div className="sm:col-span-3">
                <label
                  htmlFor="lab-experiment-baseline-days"
                  className="block text-xs font-bold text-[#18122B] mb-1.5"
                >
                  Baseline Window (Days)
                </label>
                <input
                  id="lab-experiment-baseline-days"
                  type="number"
                  min={7}
                  max={90}
                  value={baselineDays}
                  onChange={(e) => setBaselineDays(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#E5DAC4] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#18122B] focus:border-[#84cc16] focus:outline-none shadow-2xs font-mono"
                />
              </div>

              {/* Launch button */}
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

            {/* Hypothesis statement */}
            <div>
              <label
                htmlFor="lab-experiment-hypothesis"
                className="block text-xs font-bold text-[#18122B] mb-1.5"
              >
                Your Hypothesis
              </label>
              <input
                id="lab-experiment-hypothesis"
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

        {/* ACTIVE EXPERIMENTS SECTION */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5DAC4]/60 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#18122B]/70">
                ✦ CURRENT ACTIVE EXPERIMENTS
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
                No active experiments running right now.
              </h3>
              <p className="mt-1 text-xs text-stone-500 max-w-sm mx-auto font-medium">
                Pick a category hypothesis above and launch an experiment to start tracking intervention data.
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
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          TAB 3: PAST EXPERIMENTS (RECEIPTS)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className={currentTab === "receipts" ? "block space-y-4" : "hidden"}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5DAC4]/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#18122B]/70">
              ✦ THE RECEIPTS
            </span>
            <span className="rounded-full bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 text-[10px]">
              {completedExperiments.length} Concluded
            </span>
          </div>

          {/* Search & Category Filter Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Search receipts…"
              value={receiptSearch}
              onChange={(e) => setReceiptSearch(e.target.value)}
              className="rounded-xl border border-[#DDD9CF] bg-white px-3 py-1.5 text-xs font-medium text-[#18122B] placeholder:text-stone-400 focus:border-[#84cc16] focus:outline-none shadow-2xs"
            />
            <select
              value={receiptFilterCategory}
              onChange={(e) => setReceiptFilterCategory(e.target.value)}
              className="rounded-xl border border-[#DDD9CF] bg-white px-3 py-1.5 text-xs font-semibold text-[#18122B]/80 focus:outline-none shadow-2xs cursor-pointer"
            >
              <option value="ALL">All Categories ▾</option>
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!loading && filteredCompletedExperiments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#DDD9CF] bg-[#FAF8F5] p-8 text-center">
            <p className="text-xs text-stone-500 font-medium">
              {completedExperiments.length === 0
                ? "Concluded experiments with baseline vs intervention analytics will appear here once you conclude an active test in the Experiment Lab."
                : "No receipts match your search filter."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredCompletedExperiments.map((exp) => (
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
      {(token) => <UnifiedExperimentsContent token={token} />}
    </AppShell>
  );
}
