"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  getGoals,
  whatIfScenario,
  WhatIfGoalProjection,
  WhatIfScenarioResponse,
} from "@/lib/api";
import { formatINR } from "@/lib/formatCurrency";

interface WhatIfSimulatorProps {
  token: string;
}

// Map goal titles to contextual icons and accent styles (matches GoalCard.tsx design system)
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

// Helper to format dates or month counts cleanly for display
function formatTimeline(val?: string | number): string {
  if (val === undefined || val === null || val === "") return "—";
  if (typeof val === "number") {
    return `${val} month${val === 1 ? "" : "s"}`;
  }
  const str = String(val).trim();
  // Check if it's already a duration string like "14 months"
  if (/^\d+\s*months?$/i.test(str)) {
    return str;
  }
  // Try parsing date
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
    });
  }
  return str;
}

// Compare before/after timeline to generate factual delta label
function getTimelineDeltaBadge(original?: string | number, revised?: string | number, monthsDelta?: number) {
  if (monthsDelta !== undefined && monthsDelta !== null) {
    if (monthsDelta < 0) {
      const abs = Math.abs(monthsDelta);
      return {
        label: `✓ ${abs} month${abs === 1 ? "" : "s"} sooner`,
        bg: "bg-emerald-50 border-emerald-200 text-emerald-800",
      };
    }
    if (monthsDelta > 0) {
      return {
        label: `⚡ ${monthsDelta} month${monthsDelta === 1 ? "" : "s"} later`,
        bg: "bg-amber-50 border-amber-200 text-amber-800",
      };
    }
    return {
      label: "No change",
      bg: "bg-stone-100 border-stone-200 text-stone-600",
    };
  }

  // If dates are provided, compare timestamps
  if (original && revised) {
    const d1 = new Date(original).getTime();
    const d2 = new Date(revised).getTime();
    if (!isNaN(d1) && !isNaN(d2)) {
      const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
      const diffMonths = Math.round(diffDays / 30.4);
      if (diffMonths < 0) {
        const abs = Math.abs(diffMonths);
        return {
          label: `✓ ${abs} month${abs === 1 ? "" : "s"} sooner`,
          bg: "bg-emerald-50 border-emerald-200 text-emerald-800",
        };
      }
      if (diffMonths > 0) {
        return {
          label: `⚡ ${diffMonths} month${diffMonths === 1 ? "" : "s"} later`,
          bg: "bg-amber-50 border-amber-200 text-amber-800",
        };
      }
      return {
        label: "No change",
        bg: "bg-stone-100 border-stone-200 text-stone-600",
      };
    }
  }

  return null;
}

export function WhatIfSimulator({ token }: WhatIfSimulatorProps) {
  // Scenario Slider States (Neutral defaults = 0)
  const [incomeDelta, setIncomeDelta] = useState<number>(0);
  const [expenseDelta, setExpenseDelta] = useState<number>(0);
  const [savingsRateDelta, setSavingsRateDelta] = useState<number>(0);

  // User Goals Context State
  const [hasGoals, setHasGoals] = useState<boolean | null>(null);
  const [goalsCount, setGoalsCount] = useState<number>(0);

  // Scenario Calculation States
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [scenarioResult, setScenarioResult] = useState<WhatIfScenarioResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);

  // Request race-condition tracker
  const requestIdRef = useRef<number>(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check if user has active goals on mount
  useEffect(() => {
    let isCancelled = false;
    async function checkGoals() {
      try {
        const data = await getGoals(token);
        if (!isCancelled) {
          if (Array.isArray(data)) {
            setHasGoals(data.length > 0);
            setGoalsCount(data.length);
          } else {
            setHasGoals(false);
          }
        }
      } catch {
        if (!isCancelled) setHasGoals(false);
      }
    }
    checkGoals();
    return () => {
      isCancelled = true;
    };
  }, [token]);

  // Execute scenario calculation via backend
  const executeSimulation = useCallback(
    async (inc: number, exp: number, sav: number) => {
      if (hasGoals === false) return;

      const currentReqId = ++requestIdRef.current;
      setIsCalculating(true);
      setError(null);

      try {
        const res = await whatIfScenario(token, {
          incomeDelta: inc,
          expenseDelta: exp,
          savingsRateDelta: sav,
        });

        // Ensure we only update state for the latest request
        if (currentReqId === requestIdRef.current) {
          setScenarioResult(res);
        }
      } catch (err: any) {
        if (currentReqId === requestIdRef.current) {
          console.error("[WhatIfSimulator] Scenario execution error:", err);
          setError(
            err?.message && !err.message.includes("[object")
              ? err.message
              : "Couldn't run that scenario right now. Your goals are safe — we just couldn't calculate this scenario."
          );
        }
      } finally {
        if (currentReqId === requestIdRef.current) {
          setIsCalculating(false);
        }
      }
    },
    [token, hasGoals]
  );

  // Debounce scenario requests (400ms interval)
  useEffect(() => {
    if (!hasInteracted) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      executeSimulation(incomeDelta, expenseDelta, savingsRateDelta);
    }, 400);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [incomeDelta, expenseDelta, savingsRateDelta, hasInteracted, executeSimulation]);

  // Reset simulator to baseline
  function handleReset() {
    setIncomeDelta(0);
    setExpenseDelta(0);
    setSavingsRateDelta(0);
    setHasInteracted(false);
    setScenarioResult(null);
    setError(null);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }

  // Quick preset handlers for instant scenario exploration
  function applyPreset(inc: number, exp: number, sav: number) {
    setHasInteracted(true);
    setIncomeDelta(inc);
    setExpenseDelta(exp);
    setSavingsRateDelta(sav);
  }

  // Formatting helpers for slider labels
  const formatDeltaINR = (val: number) => {
    if (val === 0) return "₹0 (Current)";
    const sign = val > 0 ? "+" : "-";
    return `${sign}${formatINR(Math.abs(val))}/mo`;
  };

  const formatDeltaRate = (val: number) => {
    if (val === 0) return "0 pts (Baseline)";
    const sign = val > 0 ? "+" : "";
    return `${sign}${val} pts (${sign}${val}%)`;
  };

  return (
    <div className="mt-8 rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-4 sm:p-6 shadow-sm transition-all hover:border-[#84cc16]/40">
      {/* 1. GEN-Z HERO HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E5DAC4]/60 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#84cc16]/20 border border-[#84cc16]/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#3f6212]">
              ✦ WHAT IF?
            </span>
            {isCalculating && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#84cc16] animate-pulse">
                <span>Crunching your scenario…</span>
                <span className="animate-spin">✦</span>
              </span>
            )}
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-black tracking-tight text-[#18122B]">
            Change the numbers. See your future shift.
          </h2>
          <p className="text-xs sm:text-sm text-[#18122B]/65 font-medium mt-0.5">
            Play with your income, spending and savings rate. We&apos;ll run the scenario for you.
          </p>
        </div>

        {/* Action / Reset Button */}
        {hasInteracted && (
          <button
            type="button"
            onClick={handleReset}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full border border-[#E5DAC4] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#18122B]/70 hover:bg-[#FAF7F2] hover:text-[#18122B] transition cursor-pointer"
          >
            <span>↺</span>
            <span>Reset scenario</span>
          </button>
        )}
      </div>

      {/* 2. NO GOALS EMPTY STATE */}
      {hasGoals === false ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[#DDD9CF] bg-[#FAF8F5] p-8 text-center shadow-xs">
          <div className="mx-auto w-12 h-12 rounded-full bg-lime-400/25 flex items-center justify-center text-xl mb-3">
            🎯
          </div>
          <h3 className="font-serif text-lg font-bold text-[#18122B]">
            NO MONEY MISSIONS YET ✦
          </h3>
          <p className="mt-1.5 text-xs sm:text-sm text-stone-500 max-w-md mx-auto font-medium">
            Create a goal first, then we&apos;ll show you how different choices could change your completion timeline.
          </p>
          <Link
            href="/goals"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#18122B] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-stone-800 transition"
          >
            <span>+ Create your first goal</span>
            <span className="text-[#84cc16]">→</span>
          </Link>
        </div>
      ) : (
        /* 3. SIMULATOR GRID: CONTROLS (LEFT) & RESULTS (RIGHT) */
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* LEFT COLUMN: SCENARIO CONTROLS */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4 rounded-xl border border-[#E5DAC4]/80 bg-[#FAF8F5] p-4 sm:p-5">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-[#E5DAC4]/60 pb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#18122B]/70">
                  ✦ SCENARIO PARAMETERS
                </span>
                <span className="text-[10px] text-[#18122B]/40 font-mono">
                  {goalsCount} active goal{goalsCount === 1 ? "" : "s"}
                </span>
              </div>

              {/* Sliders Stack */}
              <div className="space-y-4">
                {/* 1. Income Slider */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label
                      htmlFor="whatif-income-slider"
                      className="text-xs font-bold text-[#18122B] flex items-center gap-1.5"
                    >
                      <span>💰</span>
                      <span>Monthly Income</span>
                    </label>
                    <span
                      className={`font-serif text-xs font-bold px-2 py-0.5 rounded ${
                        incomeDelta > 0
                          ? "bg-emerald-100/80 text-emerald-800"
                          : incomeDelta < 0
                          ? "bg-amber-100/80 text-amber-800"
                          : "bg-stone-200/60 text-stone-700"
                      }`}
                    >
                      {formatDeltaINR(incomeDelta)}
                    </span>
                  </div>
                  <input
                    id="whatif-income-slider"
                    type="range"
                    min={-50000}
                    max={100000}
                    step={2500}
                    value={incomeDelta}
                    onChange={(e) => {
                      setHasInteracted(true);
                      setIncomeDelta(Number(e.target.value));
                    }}
                    className="w-full accent-[#18122B] cursor-pointer"
                    aria-label="Monthly income delta in INR"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400 font-medium mt-0.5">
                    <span>-₹50K</span>
                    <span>₹0</span>
                    <span>+₹100K</span>
                  </div>
                </div>

                {/* 2. Expenses Slider */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label
                      htmlFor="whatif-expense-slider"
                      className="text-xs font-bold text-[#18122B] flex items-center gap-1.5"
                    >
                      <span>📉</span>
                      <span>Monthly Spending</span>
                    </label>
                    <span
                      className={`font-serif text-xs font-bold px-2 py-0.5 rounded ${
                        expenseDelta < 0
                          ? "bg-emerald-100/80 text-emerald-800"
                          : expenseDelta > 0
                          ? "bg-rose-100/80 text-rose-800"
                          : "bg-stone-200/60 text-stone-700"
                      }`}
                    >
                      {formatDeltaINR(expenseDelta)}
                    </span>
                  </div>
                  <input
                    id="whatif-expense-slider"
                    type="range"
                    min={-50000}
                    max={50000}
                    step={1000}
                    value={expenseDelta}
                    onChange={(e) => {
                      setHasInteracted(true);
                      setExpenseDelta(Number(e.target.value));
                    }}
                    className="w-full accent-[#18122B] cursor-pointer"
                    aria-label="Monthly expense delta in INR"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400 font-medium mt-0.5">
                    <span>-₹50K (Save more)</span>
                    <span>₹0</span>
                    <span>+₹50K (Spend more)</span>
                  </div>
                </div>

                {/* 3. Savings Rate Slider */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label
                      htmlFor="whatif-savings-slider"
                      className="text-xs font-bold text-[#18122B] flex items-center gap-1.5"
                    >
                      <span>⚡</span>
                      <span>Savings Rate</span>
                    </label>
                    <span
                      className={`font-serif text-xs font-bold px-2 py-0.5 rounded ${
                        savingsRateDelta > 0
                          ? "bg-emerald-100/80 text-emerald-800"
                          : savingsRateDelta < 0
                          ? "bg-amber-100/80 text-amber-800"
                          : "bg-stone-200/60 text-stone-700"
                      }`}
                    >
                      {formatDeltaRate(savingsRateDelta)}
                    </span>
                  </div>
                  <input
                    id="whatif-savings-slider"
                    type="range"
                    min={-20}
                    max={30}
                    step={1}
                    value={savingsRateDelta}
                    onChange={(e) => {
                      setHasInteracted(true);
                      setSavingsRateDelta(Number(e.target.value));
                    }}
                    className="w-full accent-[#18122B] cursor-pointer"
                    aria-label="Savings rate delta in percentage points"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400 font-medium mt-0.5">
                    <span>-20%</span>
                    <span>0%</span>
                    <span>+30%</span>
                  </div>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="mt-4 pt-3 border-t border-[#E5DAC4]/60">
                <span className="text-[10px] font-bold text-[#18122B]/60 uppercase tracking-wider block mb-2">
                  ✦ Quick Scenarios:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPreset(10000, 0, 0)}
                    className="rounded-full border border-stone-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#18122B] hover:bg-lime-400/20 hover:border-lime-500/40 transition cursor-pointer"
                  >
                    🚀 +₹10K Raise
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(0, -5000, 0)}
                    className="rounded-full border border-stone-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#18122B] hover:bg-lime-400/20 hover:border-lime-500/40 transition cursor-pointer"
                  >
                    ✂️ -₹5K Spend Trim
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(0, 0, 5)}
                    className="rounded-full border border-stone-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#18122B] hover:bg-lime-400/20 hover:border-lime-500/40 transition cursor-pointer"
                  >
                    💎 +5% Super Saver
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(10000, -5000, 5)}
                    className="rounded-full border border-stone-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#18122B] hover:bg-lime-400/20 hover:border-lime-500/40 transition cursor-pointer"
                  >
                    🔥 Max Acceleration
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 text-[10px] text-[#18122B]/40 font-mono">
              Debounced backend execution &middot; Backend source of truth
            </div>
          </div>

          {/* RIGHT COLUMN: SCENARIO PROJECTION RESULTS */}
          <div className="lg:col-span-7 flex flex-col justify-between rounded-xl border border-[#E5DAC4]/80 bg-white p-4 sm:p-5 shadow-xs min-h-[320px]">
            {/* Header / Scenario Tag */}
            <div>
              <div className="flex items-center justify-between border-b border-[#E5DAC4]/60 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#18122B]/80">
                    ✦ YOUR SCENARIO
                  </span>
                  {hasInteracted && !isCalculating && !error && (
                    <span className="rounded-full bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 text-[10px]">
                      Scenario loaded
                    </span>
                  )}
                </div>

                {isCalculating && (
                  <span className="text-[10px] font-bold text-[#84cc16] flex items-center gap-1">
                    <span>Running the numbers…</span>
                    <span className="animate-spin">✦</span>
                  </span>
                )}
              </div>

              {/* Error Alert */}
              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 mb-3 animate-in fade-in">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-rose-800">
                        Couldn&apos;t run that scenario right now.
                      </p>
                      <p className="text-[11px] text-rose-600 mt-0.5">
                        {error}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => executeSimulation(incomeDelta, expenseDelta, savingsRateDelta)}
                      className="rounded-lg bg-rose-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-800 transition cursor-pointer shrink-0"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              )}

              {/* Initial State (Before User Interaction) */}
              {!hasInteracted && !scenarioResult && !error && (
                <div className="py-10 text-center">
                  <span className="text-3xl">🔮</span>
                  <h3 className="font-serif text-base font-bold text-[#18122B] mt-2">
                    Adjust a number to run your first scenario.
                  </h3>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 font-medium">
                    Move the sliders on the left to see how changes to income, spending, or savings rate immediately alter your goal timelines.
                  </p>
                </div>
              )}

              {/* Scenario Results List */}
              {scenarioResult && (
                <div className={`space-y-3 transition-opacity duration-200 ${isCalculating ? "opacity-60" : "opacity-100"}`}>
                  {/* Summary Banner */}
                  {scenarioResult.summary && (
                    <div className="rounded-xl border border-[#84cc16]/30 bg-[#FAF7F2] p-3 text-xs text-[#18122B] font-medium leading-relaxed">
                      <span className="font-bold text-[#3f6212] mr-1.5">✦ Impact:</span>
                      {scenarioResult.summary}
                    </div>
                  )}

                  {/* Goals List */}
                  {scenarioResult.goals && scenarioResult.goals.length > 0 ? (
                    <div className="space-y-2.5">
                      {scenarioResult.goals.map((goal: WhatIfGoalProjection) => {
                        const personality = getGoalPersonality(goal.title);
                        const deltaBadge = getTimelineDeltaBadge(goal.originalEta, goal.revisedEta, goal.monthsDelta);

                        return (
                          <div
                            key={goal.id || goal.title}
                            className="rounded-xl border border-stone-200 bg-[#FFFDF8] p-3.5 shadow-2xs hover:border-stone-300 transition"
                          >
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-base p-1 rounded-lg bg-stone-100">
                                  {personality.icon}
                                </span>
                                <div>
                                  <span className="text-[9px] font-bold tracking-wider uppercase text-stone-400">
                                    {personality.tag}
                                  </span>
                                  <h4 className="font-serif text-sm font-bold text-[#18122B] leading-tight">
                                    {goal.title}
                                  </h4>
                                </div>
                              </div>

                              {deltaBadge && (
                                <span
                                  className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${deltaBadge.bg}`}
                                >
                                  {deltaBadge.label}
                                </span>
                              )}
                            </div>

                            {/* Before -> After Timeline Comparison */}
                            <div className="mt-2.5 grid grid-cols-2 gap-2 rounded-lg bg-[#FAF8F5] p-2.5 border border-[#E5DAC4]/60">
                              <div>
                                <span className="text-[10px] font-bold text-stone-400 uppercase">
                                  CURRENT TIMELINE
                                </span>
                                <p className="font-serif text-sm font-bold text-[#18122B] mt-0.5">
                                  {formatTimeline(goal.originalEta)}
                                </p>
                              </div>

                              <div>
                                <span className="text-[10px] font-bold text-[#3f6212] uppercase flex items-center gap-1">
                                  <span>WHAT-IF TIMELINE</span>
                                  <span className="text-[#84cc16]">→</span>
                                </span>
                                <p className="font-serif text-sm font-bold text-[#3f6212] mt-0.5">
                                  {formatTimeline(goal.revisedEta)}
                                </p>
                              </div>
                            </div>

                            {/* Additional metadata tags if available */}
                            {(goal.onTrack !== undefined || goal.projectedSavings !== undefined) && (
                              <div className="mt-2 flex items-center gap-2 text-[10px] text-stone-500 font-medium">
                                {goal.onTrack !== undefined && (
                                  <span className={goal.onTrack ? "text-emerald-700 font-semibold" : "text-amber-700 font-semibold"}>
                                    {goal.onTrack ? "✓ On track" : "⚡ Action required"}
                                  </span>
                                )}
                                {goal.projectedSavings !== undefined && (
                                  <>
                                    <span>&middot;</span>
                                    <span>Projected savings: {formatINR(goal.projectedSavings)}</span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-stone-500 font-medium">
                      No goal comparisons returned for this scenario.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer note */}
            <div className="mt-4 pt-3 border-t border-[#E5DAC4]/60 flex items-center justify-between text-[10px] text-stone-400 font-mono">
              <span>Small change. Different timeline.</span>
              <span>FinSage AI Model</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
