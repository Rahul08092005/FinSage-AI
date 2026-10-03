"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getMe, getExpenseSummary, getGoals } from "@/lib/api";
import { formatINR } from "@/lib/formatCurrency";

interface WhatIfSimulatorProps {
  token: string;
}

interface GoalItem {
  id: string;
  title: string;
  targetAmount: number | string;
  startDate?: string;
  endDate: string;
  createdAt?: string;
}

interface ExpenseCategoryItem {
  category: string;
  total: number;
  count?: number;
}

// Map goal titles to contextual icons and accent styles (matches FinSage visual system)
function getGoalPersonality(title: string) {
  const lower = (title || "").toLowerCase();
  if (lower.includes("headphone") || lower.includes("airpod") || lower.includes("audio") || lower.includes("music")) {
    return { icon: "🎧", tag: "GEAR & AUDIO", accentBg: "bg-indigo-50/80", ringColor: "#6366f1", sticker: "🎵" };
  }
  if (lower.includes("car") || lower.includes("bike") || lower.includes("vehicle") || lower.includes("drive")) {
    return { icon: "🚗", tag: "WHEELS & RIDE", accentBg: "bg-amber-50/80", ringColor: "#f59e0b", sticker: "🏎️" };
  }
  if (lower.includes("emergency") || lower.includes("shield") || lower.includes("safety") || lower.includes("rainy")) {
    return { icon: "🛡️", tag: "SAFETY SHIELD", accentBg: "bg-emerald-50/80", ringColor: "#10b981", sticker: "🛡️" };
  }
  if (lower.includes("travel") || lower.includes("trip") || lower.includes("vacation") || lower.includes("flight") || lower.includes("japan") || lower.includes("europe")) {
    return { icon: "✈️", tag: "WANDERLUST", accentBg: "bg-cyan-50/80", ringColor: "#06b6d4", sticker: "🌏" };
  }
  if (lower.includes("laptop") || lower.includes("phone") || lower.includes("tech") || lower.includes("macbook") || lower.includes("ipad")) {
    return { icon: "💻", tag: "TECH UPGRADE", accentBg: "bg-violet-50/80", ringColor: "#8b5cf6", sticker: "⚡" };
  }
  if (lower.includes("home") || lower.includes("house") || lower.includes("rent") || lower.includes("decor") || lower.includes("flat")) {
    return { icon: "🏠", tag: "SANCTUARY", accentBg: "bg-rose-50/80", ringColor: "#f43f5e", sticker: "🪴" };
  }
  return { icon: "🎯", tag: "MONEY MISSION", accentBg: "bg-lime-50/80", ringColor: "#84cc16", sticker: "✨" };
}

// Local storage helper for client-side tracked contributions
function getGoalSaved(id: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(`finsage_goal_savings_${id}`);
    return raw ? parseFloat(raw) || 0 : 0;
  } catch {
    return 0;
  }
}

export function WhatIfSimulator({ token }: WhatIfSimulatorProps) {
  // Raw Data fetched from existing endpoints
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [salary, setSalary] = useState<number | null>(null);
  const [categories, setCategories] = useState<ExpenseCategoryItem[]>([]);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [goals, setGoals] = useState<GoalItem[]>([]);

  // Client-side Scenario Control States (Instant React state)
  const [salaryChangePct, setSalaryChangePct] = useState<number>(0); // -20% to +30%
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [expenseChangePct, setExpenseChangePct] = useState<number>(0); // -50% to +50%
  const [contributionDelta, setContributionDelta] = useState<number>(0); // e.g. -25000 to +50000 INR

  // Fetch initial data once on mount
  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const currentMonthStr = `${year}-${month}`;

      const [userRes, expenseRes, goalsRes] = await Promise.all([
        getMe(token).catch((e) => {
          console.warn("[WhatIfSimulator] getMe error:", e);
          return null;
        }),
        getExpenseSummary(token, currentMonthStr).catch((e) => {
          console.warn("[WhatIfSimulator] getExpenseSummary error:", e);
          return null;
        }),
        getGoals(token).catch((e) => {
          console.warn("[WhatIfSimulator] getGoals error:", e);
          return [];
        }),
      ]);

      if (!userRes && !expenseRes && (!goalsRes || (Array.isArray(goalsRes) && goalsRes.length === 0))) {
        throw new Error("Couldn't load your scenario data. Please check your connection.");
      }

      // 1. Extract salary
      const rawSalary = userRes?.monthlySalary ?? userRes?.salary ?? null;
      const parsedSalary = rawSalary !== null && rawSalary !== undefined ? Number(rawSalary) : null;
      setSalary(parsedSalary && parsedSalary > 0 ? parsedSalary : null);

      // 2. Extract expenses & category breakdown
      if (expenseRes) {
        const catList: ExpenseCategoryItem[] = Array.isArray(expenseRes.byCategory)
          ? expenseRes.byCategory.map((c: any) => ({
              category: String(c.category || "General"),
              total: Number(c.total) || 0,
              count: Number(c.count) || 0,
            }))
          : [];
        setCategories(catList);
        setTotalExpenses(Number(expenseRes.total) || 0);

        if (catList.length > 0) {
          setSelectedCategory(catList[0].category);
        }
      }

      // 3. Extract goals
      if (Array.isArray(goalsRes)) {
        setGoals(goalsRes);
      }
    } catch (err: any) {
      console.error("[WhatIfSimulator] Data load error:", err);
      setError(err?.message || "Couldn't load your scenario data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [token]);

  // Reset scenario controls back to 0% / baseline
  function handleReset() {
    setSalaryChangePct(0);
    setExpenseChangePct(0);
    setContributionDelta(0);
    if (categories.length > 0) {
      setSelectedCategory(categories[0].category);
    }
  }

  const isScenarioActive = salaryChangePct !== 0 || expenseChangePct !== 0 || contributionDelta !== 0;

  // Selected Category expense calculation
  const currentCategoryExpense = useMemo(() => {
    const found = categories.find((c) => c.category === selectedCategory);
    return found ? found.total : 0;
  }, [categories, selectedCategory]);

  // Instant Client-Side Scenario Calculations
  const calculations = useMemo(() => {
    const currentSalary = salary ?? 0;
    const currentExpenses = totalExpenses;

    // 1. Projected Salary
    const projectedSalary = Math.round(currentSalary * (1 + salaryChangePct / 100));

    // 2. Adjusted Category Expense
    const adjustedCategoryExpense = Math.round(currentCategoryExpense * (1 + expenseChangePct / 100));

    // 3. Adjusted Total Expenses (modifying ONLY the selected category)
    const adjustedTotalExpenses = Math.max(
      0,
      Math.round(currentExpenses - currentCategoryExpense + adjustedCategoryExpense)
    );

    // 4. Baseline & Projected Monthly Savings
    const baselineMonthlySavings = currentSalary - currentExpenses;
    const projectedMonthlySavings = (projectedSalary - adjustedTotalExpenses) + contributionDelta;
    const savingsDelta = projectedMonthlySavings - baselineMonthlySavings;

    // 5. Goal Timeline Projections
    const goalProjections = goals.map((goal) => {
      const savedAmount = getGoalSaved(goal.id);
      const targetAmount = Number(goal.targetAmount) || 0;
      const remainingAmount = Math.max(0, targetAmount - savedAmount);

      let baselineMonths: number | null = null;
      if (baselineMonthlySavings > 0) {
        baselineMonths = Math.ceil(remainingAmount / baselineMonthlySavings);
      }

      let projectedMonths: number | null = null;
      if (projectedMonthlySavings > 0) {
        projectedMonths = Math.ceil(remainingAmount / projectedMonthlySavings);
      }

      let monthsDelta: number | null = null;
      if (baselineMonths !== null && projectedMonths !== null) {
        monthsDelta = baselineMonths - projectedMonths; // positive means sooner, negative means later
      }

      return {
        goal,
        savedAmount,
        targetAmount,
        remainingAmount,
        baselineMonths,
        projectedMonths,
        monthsDelta,
      };
    });

    return {
      currentSalary,
      currentExpenses,
      projectedSalary,
      adjustedCategoryExpense,
      adjustedTotalExpenses,
      baselineMonthlySavings,
      projectedMonthlySavings,
      savingsDelta,
      goalProjections,
    };
  }, [
    salary,
    totalExpenses,
    categories,
    selectedCategory,
    currentCategoryExpense,
    salaryChangePct,
    expenseChangePct,
    contributionDelta,
    goals,
  ]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-8 text-center shadow-xs">
          <div className="mx-auto w-10 h-10 rounded-full bg-lime-400/20 flex items-center justify-center text-lg animate-pulse mb-3">
            ✦
          </div>
          <h2 className="font-serif text-lg font-bold text-[#18122B]">
            Loading your money universe…
          </h2>
          <p className="mt-1 text-xs text-stone-500 font-medium">
            Fetching your latest income, expenses, and goals for live simulation.
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-8 text-center shadow-xs">
          <div className="mx-auto w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-lg text-rose-700 mb-3">
            ⚠️
          </div>
          <h2 className="font-serif text-lg font-bold text-rose-900">
            Couldn&apos;t load your scenario data
          </h2>
          <p className="mt-1 text-xs text-rose-700 max-w-md mx-auto font-medium">
            {error}
          </p>
          <button
            type="button"
            onClick={loadData}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-rose-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-800 transition cursor-pointer"
          >
            ↺ Try again
          </button>
        </div>
      </div>
    );
  }

  // Missing Salary Fallback State
  if (!salary || salary <= 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-8 text-center shadow-xs">
          <div className="mx-auto w-12 h-12 rounded-full bg-[#84cc16]/20 border border-[#84cc16]/30 flex items-center justify-center text-2xl mb-3">
            💰
          </div>
          <div className="inline-flex items-center gap-1 rounded-full bg-[#84cc16]/20 border border-[#84cc16]/30 px-3 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#3f6212] mb-2">
            SET YOUR SALARY FIRST ✦
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-black text-[#18122B]">
            Add your monthly salary to run a What-If scenario.
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-stone-500 max-w-md mx-auto font-medium leading-relaxed">
            The scenario tool needs your baseline monthly income to compute live savings projections and goal timelines.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#18122B] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-stone-800 transition"
            >
              <span>Go to Dashboard to set salary</span>
              <span className="text-[#84cc16]">→</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8 space-y-6">
      {/* 1. INTRO / HERO SECTION */}
      <div className="rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E5DAC4]/60 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#84cc16]/20 border border-[#84cc16]/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#3f6212]">
                ✦ WHAT IF?
              </span>
              <span className="text-[11px] font-medium text-stone-500">
                money alternate universe ✦
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-black tracking-tight text-[#18122B]">
              Change the numbers. See what happens.
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 font-medium mt-1">
              Adjust your income, category spending, or savings contribution to see instant client-side projections.
            </p>
          </div>

          {/* Reset & Status */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isScenarioActive && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#E5DAC4] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#18122B]/80 hover:bg-[#FAF7F2] hover:text-[#18122B] shadow-2xs transition cursor-pointer"
              >
                <span>↺</span>
                <span>Reset scenario</span>
              </button>
            )}
            <span className="rounded-full bg-[#FAF8F5] border border-[#E5DAC4] px-3 py-1 text-[11px] font-mono text-stone-600">
              run the numbers 👀
            </span>
          </div>
        </div>

        {/* 2. MAIN SIMULATOR TWO-COLUMN LAYOUT */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: SCENARIO CONTROLS */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-5 rounded-xl border border-[#E5DAC4]/80 bg-[#FAF8F5] p-4 sm:p-5">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-[#E5DAC4]/60 pb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#18122B]/70">
                  ✦ SCENARIO CONTROLS
                </span>
                <span className="text-[10px] font-mono text-stone-500">
                  Client-side instant
                </span>
              </div>

              {/* CONTROL 1 — SALARY SLIDER */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label
                    htmlFor="whatif-salary-slider"
                    className="text-xs font-bold text-[#18122B] flex items-center gap-1.5"
                  >
                    <span>💼</span>
                    <span>SALARY CHANGE</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                        salaryChangePct > 0
                          ? "bg-emerald-100 text-emerald-800"
                          : salaryChangePct < 0
                          ? "bg-amber-100 text-amber-800"
                          : "bg-stone-200/70 text-stone-700"
                      }`}
                    >
                      {salaryChangePct > 0 ? `+${salaryChangePct}%` : `${salaryChangePct}%`}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-stone-500 mb-2">
                  What if your income changed? (Baseline: {formatINR(calculations.currentSalary)}/mo)
                </p>
                <input
                  id="whatif-salary-slider"
                  type="range"
                  min={-20}
                  max={30}
                  step={1}
                  value={salaryChangePct}
                  onChange={(e) => setSalaryChangePct(Number(e.target.value))}
                  className="w-full accent-[#18122B] cursor-pointer"
                  aria-label="Salary change percentage"
                />
                <div className="flex justify-between text-[10px] font-mono text-stone-400 mt-1">
                  <span>-20%</span>
                  <span>-10%</span>
                  <span className="font-bold text-stone-600">0%</span>
                  <span>+10%</span>
                  <span>+20%</span>
                  <span>+30%</span>
                </div>
                <div className="mt-1.5 text-right">
                  <span className="text-[11px] font-medium text-stone-600">
                    Projected Income:{" "}
                    <strong className="font-serif font-bold text-[#18122B]">
                      {formatINR(calculations.projectedSalary)}
                    </strong>
                    /mo
                  </span>
                </div>
              </div>

              {/* CONTROL 2 — EXPENSE CATEGORY SELECTION + SLIDER */}
              <div className="pt-3 border-t border-[#E5DAC4]/60">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label
                    htmlFor="whatif-category-select"
                    className="text-xs font-bold text-[#18122B] flex items-center gap-1.5"
                  >
                    <span>🏷️</span>
                    <span>EXPENSE CATEGORY</span>
                  </label>
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                      expenseChangePct < 0
                        ? "bg-emerald-100 text-emerald-800"
                        : expenseChangePct > 0
                        ? "bg-rose-100 text-rose-800"
                        : "bg-stone-200/70 text-stone-700"
                    }`}
                  >
                    {expenseChangePct > 0 ? `+${expenseChangePct}%` : `${expenseChangePct}%`}
                  </span>
                </div>

                {categories.length > 0 ? (
                  <>
                    <div className="mb-2">
                      <select
                        id="whatif-category-select"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full rounded-lg border border-[#E5DAC4] bg-white px-3 py-1.5 text-xs font-semibold text-[#18122B] focus:border-[#84cc16] focus:outline-none shadow-2xs"
                        aria-label="Select expense category to adjust"
                      >
                        {categories.map((cat) => (
                          <option key={cat.category} value={cat.category}>
                            {cat.category} ({formatINR(cat.total)}/mo)
                          </option>
                        ))}
                      </select>
                    </div>

                    <p className="text-[11px] text-stone-500 mb-2">
                      What if spending on <strong>{selectedCategory}</strong> changed?
                    </p>

                    <input
                      id="whatif-expense-slider"
                      type="range"
                      min={-50}
                      max={50}
                      step={1}
                      value={expenseChangePct}
                      onChange={(e) => setExpenseChangePct(Number(e.target.value))}
                      className="w-full accent-[#18122B] cursor-pointer"
                      aria-label="Category expense change percentage"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-stone-400 mt-1">
                      <span>-50% (Cut back)</span>
                      <span className="font-bold text-stone-600">0%</span>
                      <span>+50% (Spend more)</span>
                    </div>

                    <div className="mt-1.5 flex justify-between text-[11px] font-medium text-stone-600">
                      <span>
                        Category:{" "}
                        <strong className="font-serif font-bold text-[#18122B]">
                          {formatINR(calculations.adjustedCategoryExpense)}
                        </strong>
                      </span>
                      <span>
                        Total Expenses:{" "}
                        <strong className="font-serif font-bold text-[#18122B]">
                          {formatINR(calculations.adjustedTotalExpenses)}
                        </strong>
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-stone-500 italic">
                    No category breakdown found for current month. Total expenses: {formatINR(totalExpenses)}.
                  </p>
                )}
              </div>

              {/* CONTROL 3 — SIP / SAVINGS CONTRIBUTION SLIDER */}
              <div className="pt-3 border-t border-[#E5DAC4]/60">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label
                    htmlFor="whatif-sip-slider"
                    className="text-xs font-bold text-[#18122B] flex items-center gap-1.5"
                  >
                    <span>⚡</span>
                    <span>MONTHLY SIP / SAVINGS DELTA</span>
                  </label>
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                      contributionDelta > 0
                        ? "bg-emerald-100 text-emerald-800"
                        : contributionDelta < 0
                        ? "bg-amber-100 text-amber-800"
                        : "bg-stone-200/70 text-stone-700"
                    }`}
                  >
                    {contributionDelta > 0
                      ? `+${formatINR(contributionDelta)}/mo`
                      : contributionDelta < 0
                      ? `-${formatINR(Math.abs(contributionDelta))}/mo`
                      : "₹0 change"}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 mb-2">
                  Allocate an additional monthly lump sum or SIP contribution to savings.
                </p>
                <input
                  id="whatif-sip-slider"
                  type="range"
                  min={-25000}
                  max={50000}
                  step={1000}
                  value={contributionDelta}
                  onChange={(e) => setContributionDelta(Number(e.target.value))}
                  className="w-full accent-[#18122B] cursor-pointer"
                  aria-label="Monthly savings or SIP contribution change in INR"
                />
                <div className="flex justify-between text-[10px] font-mono text-stone-400 mt-1">
                  <span>-₹25,000</span>
                  <span className="font-bold text-stone-600">₹0</span>
                  <span>+₹50,000</span>
                </div>
              </div>
            </div>

            {/* Footer Tag */}
            <div className="pt-3 border-t border-[#E5DAC4]/60 flex items-center justify-between text-[10px] text-stone-500 font-mono">
              <span>✦ NAIVE CLIENT-SIDE ESTIMATE</span>
              <span>NO DATA MUTATION</span>
            </div>
          </div>

          {/* RIGHT COLUMN: PROJECTED SAVINGS & GOAL TIMELINES */}
          <div className="lg:col-span-7 space-y-5">
            {/* HERO RESULT: PROJECTED MONTHLY SAVINGS */}
            <div className="rounded-xl border border-[#E5DAC4] bg-[#FFFDF8] p-5 sm:p-6 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#E5DAC4]/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#18122B]/70">
                    ✦ THE MONEY MULTIVERSE
                  </span>
                  {isScenarioActive ? (
                    <span className="rounded-full bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-0.5 text-[10px]">
                      Your future just moved.
                    </span>
                  ) : (
                    <span className="rounded-full bg-stone-100 text-stone-600 font-medium px-2 py-0.5 text-[10px]">
                      Baseline
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-stone-400">
                  Instant Projection
                </span>
              </div>

              {/* BIG STAT */}
              <div className="mt-4 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                    PROJECTED MONTHLY SAVINGS
                  </span>
                  <div className="font-serif text-3xl sm:text-4xl font-black text-[#18122B] tracking-tight mt-0.5">
                    {formatINR(calculations.projectedMonthlySavings)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {calculations.savingsDelta !== 0 && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                        calculations.savingsDelta > 0
                          ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                          : "bg-rose-50 border border-rose-200 text-rose-800"
                      }`}
                    >
                      <span>{calculations.savingsDelta > 0 ? "▲" : "▼"}</span>
                      <span>
                        {calculations.savingsDelta > 0 ? "+" : "-"}
                        {formatINR(Math.abs(calculations.savingsDelta))} / month
                      </span>
                    </span>
                  )}
                </div>
              </div>

              {/* Current vs Scenario Comparison Strip */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-lg bg-[#FAF8F5] p-3 border border-[#E5DAC4]/60 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase block">
                    Current Monthly Savings
                  </span>
                  <span className="font-serif font-bold text-stone-700 text-sm">
                    {formatINR(calculations.baselineMonthlySavings)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase block">
                    Scenario Monthly Savings
                  </span>
                  <span className="font-serif font-bold text-[#3f6212] text-sm">
                    {formatINR(calculations.projectedMonthlySavings)}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold text-stone-400 uppercase block">
                    Scenario Impact
                  </span>
                  <span className="font-medium text-stone-700 text-xs">
                    {calculations.savingsDelta > 0
                      ? `+${formatINR(calculations.savingsDelta * 12)} / year`
                      : calculations.savingsDelta < 0
                      ? `-${formatINR(Math.abs(calculations.savingsDelta * 12))} / year`
                      : "No change from baseline"}
                  </span>
                </div>
              </div>
            </div>

            {/* GOAL TIMELINE COMPARISONS */}
            <div className="rounded-xl border border-[#E5DAC4] bg-[#FFFDF8] p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#E5DAC4]/60 pb-3 mb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#18122B]/70 block">
                    ✦ GOAL TIMELINE COMPARISON
                  </span>
                  <h3 className="font-serif text-base font-bold text-[#18122B]">
                    Money Missions Under This Scenario
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-stone-400">
                  {goals.length} goal{goals.length === 1 ? "" : "s"}
                </span>
              </div>

              {goals.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#DDD9CF] bg-[#FAF8F5] p-6 text-center">
                  <p className="text-xs text-stone-500 font-medium">
                    No active goals found. Create goals to see how this scenario accelerates your completion timelines!
                  </p>
                  <Link
                    href="/goals"
                    className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#18122B] hover:text-[#3f6212]"
                  >
                    <span>Go to Goals page</span>
                    <span>→</span>
                  </Link>
                </div>
              ) : calculations.projectedMonthlySavings <= 0 ? (
                /* Edge Case: Negative or Zero Savings */
                <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-5 text-center">
                  <div className="mx-auto w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm text-amber-800 mb-2">
                    ⚠️
                  </div>
                  <h4 className="font-serif text-sm font-bold text-amber-900">
                    Timeline unavailable
                  </h4>
                  <p className="text-xs text-amber-800 max-w-md mx-auto mt-1 font-medium">
                    At this scenario, monthly savings ({formatINR(calculations.projectedMonthlySavings)}) are not positive enough to project a completion timeline.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {calculations.goalProjections.map((proj) => {
                    const personality = getGoalPersonality(proj.goal.title);
                    return (
                      <div
                        key={proj.goal.id}
                        className="rounded-xl border border-stone-200 bg-[#FAF8F5] p-4 shadow-2xs hover:border-[#84cc16]/40 transition"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg p-1 rounded-md bg-white border border-[#E5DAC4]">
                              {personality.icon}
                            </span>
                            <div>
                              <span className="text-[9px] font-bold tracking-wider uppercase text-stone-400">
                                {personality.tag}
                              </span>
                              <h4 className="font-serif text-sm font-bold text-[#18122B]">
                                {proj.goal.title}
                              </h4>
                            </div>
                          </div>

                          {/* Difference Badge */}
                          {proj.monthsDelta !== null && (
                            <div>
                              {proj.monthsDelta > 0 ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                                  ✓ {proj.monthsDelta} month{proj.monthsDelta === 1 ? "" : "s"} sooner
                                </span>
                              ) : proj.monthsDelta < 0 ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                                  ⚡ {Math.abs(proj.monthsDelta)} month{Math.abs(proj.monthsDelta) === 1 ? "" : "s"} later
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-stone-200/80 border border-stone-300 px-2 py-0.5 text-[10px] font-bold text-stone-700">
                                  On track with baseline
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Timeline comparison columns */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 rounded-lg bg-white p-3 border border-[#E5DAC4]/60">
                          <div>
                            <span className="text-[9px] font-bold text-stone-400 uppercase block">
                              Target / Saved
                            </span>
                            <span className="font-serif text-xs font-bold text-stone-800">
                              {formatINR(proj.targetAmount)}
                            </span>
                            <span className="text-[10px] text-stone-500 block">
                              ({formatINR(proj.savedAmount)} saved)
                            </span>
                          </div>

                          <div>
                            <span className="text-[9px] font-bold text-stone-400 uppercase block">
                              Current Path
                            </span>
                            <span className="font-serif text-xs font-bold text-stone-700">
                              {proj.baselineMonths !== null
                                ? `${proj.baselineMonths} month${proj.baselineMonths === 1 ? "" : "s"}`
                                : "—"}
                            </span>
                          </div>

                          <div className="col-span-2 sm:col-span-1">
                            <span className="text-[9px] font-bold text-[#3f6212] uppercase block">
                              Scenario Path
                            </span>
                            <span className="font-serif text-xs font-bold text-[#3f6212]">
                              {proj.projectedMonths !== null
                                ? `${proj.projectedMonths} month${proj.projectedMonths === 1 ? "" : "s"}`
                                : "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Subtitle footer */}
              <div className="mt-4 pt-3 border-t border-[#E5DAC4]/60 flex items-center justify-between text-[10px] text-stone-400 font-mono">
                <span>Small change. Different timeline.</span>
                <span>FinSage Scenario Engine</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
