"use client";

import { useState } from "react";
import { FinancialExperiment, ExperimentResult } from "@/lib/api";
import { formatINR } from "@/lib/formatCurrency";

interface ExperimentCardProps {
  experiment: FinancialExperiment;
  onConclude?: (id: string) => Promise<void>;
  isConcluding?: boolean;
}

// Category visual icon & style mapping consistent with FinSage
const CATEGORY_MAP: Record<string, { icon: string; bg: string; text: string; border: string }> = {
  "Food & Dining": { icon: "🍽️", bg: "bg-orange-50", text: "text-orange-800", border: "border-orange-200" },
  Food: { icon: "🍽️", bg: "bg-orange-50", text: "text-orange-800", border: "border-orange-200" },
  Groceries: { icon: "🛒", bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200" },
  Entertainment: { icon: "🎬", bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200" },
  Shopping: { icon: "🛍️", bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200" },
  Rent: { icon: "🏠", bg: "bg-lime-50", text: "text-lime-800", border: "border-lime-200" },
  Utilities: { icon: "⚡", bg: "bg-violet-50", text: "text-violet-800", border: "border-violet-200" },
  Bills: { icon: "⚡", bg: "bg-violet-50", text: "text-violet-800", border: "border-violet-200" },
  Travel: { icon: "✈️", bg: "bg-cyan-50", text: "text-cyan-800", border: "border-cyan-200" },
  Transport: { icon: "🚕", bg: "bg-cyan-50", text: "text-cyan-800", border: "border-cyan-200" },
  Healthcare: { icon: "💊", bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-200" },
  Subscriptions: { icon: "📱", bg: "bg-indigo-50", text: "text-indigo-800", border: "border-indigo-200" },
};

function getCategoryMeta(cat: string) {
  return CATEGORY_MAP[cat] || { icon: "🧪", bg: "bg-stone-50", text: "text-stone-800", border: "border-stone-200" };
}

// Format confidence pill colors: high (teal), medium (gold/amber), low (muted grey)
function getConfidenceBadge(confidence?: string) {
  const conf = (confidence || "medium").toLowerCase();
  if (conf === "high") {
    return {
      label: "HIGH CONFIDENCE",
      bg: "bg-teal-50 border-teal-200 text-teal-800",
      dot: "bg-teal-600",
    };
  }
  if (conf === "medium") {
    return {
      label: "MEDIUM CONFIDENCE",
      bg: "bg-amber-50 border-amber-200 text-amber-800",
      dot: "bg-amber-500",
    };
  }
  return {
    label: "LOW CONFIDENCE",
    bg: "bg-stone-100 border-stone-200 text-stone-600",
    dot: "bg-stone-400",
  };
}

export function ExperimentCard({ experiment, onConclude, isConcluding = false }: ExperimentCardProps) {
  const isCompleted = experiment.status === "completed" || experiment.status === "concluded";
  const catMeta = getCategoryMeta(experiment.category);

  // Extract result values defensively across naming conventions
  const res: ExperimentResult | undefined = experiment.result || undefined;
  const baselineDailyAvg = res?.baselineDailyAvg ?? res?.baseline_daily_avg ?? null;
  const interventionDailyAvg = res?.interventionDailyAvg ?? res?.intervention_daily_avg ?? null;
  const percentDifference = res?.percentDifference ?? res?.percent_difference ?? null;
  const confidence = res?.confidence ?? "medium";
  const annualImpact = res?.projectedAnnualImpact ?? res?.projected_annual_impact ?? null;

  const confBadge = getConfidenceBadge(confidence);

  return (
    <div className="rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-5 sm:p-6 shadow-xs transition-all hover:border-[#84cc16]/50">
      {/* 1. TOP HEADER STRIP */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5DAC4]/60 pb-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${catMeta.bg} ${catMeta.border} ${catMeta.text}`}
          >
            <span>{catMeta.icon}</span>
            <span>{experiment.category}</span>
          </span>

          <span className="text-[10px] font-mono text-stone-400">
            {experiment.baselineDays || 30}-day baseline
          </span>
        </div>

        <div>
          {isCompleted ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              <span>Concluded ✓</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>In Progress ⚡</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. MIDDLE: HYPOTHESIS */}
      <div className="py-4">
        <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400 block mb-1">
          HYPOTHESIS
        </span>
        <p className="font-serif text-base sm:text-lg font-bold text-[#18122B] leading-snug">
          &ldquo;{experiment.hypothesis}&rdquo;
        </p>

        <div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-stone-400">
          <span>Started: {new Date(experiment.createdAt || experiment.startDate || Date.now()).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
          {experiment.concludedAt && (
            <>
              <span>&middot;</span>
              <span>Concluded: {new Date(experiment.concludedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
            </>
          )}
        </div>
      </div>

      {/* 3. BOTTOM SECTION: ACTIVE ACTION vs COMPLETED METRICS */}
      {!isCompleted ? (
        /* ACTIVE EXPERIMENT ACTION */
        <div className="pt-3 border-t border-[#E5DAC4]/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-xs text-stone-500 font-medium">
            <span className="font-bold text-[#3f6212]">✦ MONEY LAB:</span> Gather spending data in this window, then conclude to analyze impact.
          </div>

          <button
            type="button"
            onClick={() => onConclude && onConclude(experiment.id)}
            disabled={isConcluding}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#18122B] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-stone-800 disabled:opacity-50 transition cursor-pointer shrink-0"
          >
            {isConcluding ? (
              <>
                <span className="animate-spin text-xs">✦</span>
                <span>Concluding…</span>
              </>
            ) : (
              <>
                <span>Conclude Experiment</span>
                <span className="text-[#84cc16]">&rarr;</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* COMPLETED EXPERIMENT RESULT METRICS (PASSBOOK / LEDGER GRID) */
        <div className="pt-3 border-t border-[#E5DAC4]/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#18122B]/70">
              ✦ THE RECEIPTS
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase ${confBadge.bg}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${confBadge.dot}`} />
              <span>{confBadge.label}</span>
            </span>
          </div>

          {/* METRIC TILES GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 rounded-xl bg-[#FAF8F5] p-3 border border-[#E5DAC4]/60">
            {/* 1. Baseline daily average */}
            <div className="p-2 bg-white rounded-lg border border-[#E5DAC4]/50">
              <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 block">
                BASELINE
              </span>
              <div className="font-serif text-sm font-bold text-[#18122B] mt-0.5">
                {baselineDailyAvg !== null ? `${formatINR(baselineDailyAvg)}` : "—"}
                <span className="text-[10px] font-sans font-normal text-stone-400"> / day</span>
              </div>
            </div>

            {/* 2. Intervention daily average */}
            <div className="p-2 bg-white rounded-lg border border-[#E5DAC4]/50">
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#3f6212] block">
                INTERVENTION
              </span>
              <div className="font-serif text-sm font-bold text-[#3f6212] mt-0.5">
                {interventionDailyAvg !== null ? `${formatINR(interventionDailyAvg)}` : "—"}
                <span className="text-[10px] font-sans font-normal text-stone-400"> / day</span>
              </div>
            </div>

            {/* 3. Percent difference */}
            <div className="p-2 bg-white rounded-lg border border-[#E5DAC4]/50">
              <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 block">
                CHANGE
              </span>
              <div
                className={`font-serif text-sm font-bold mt-0.5 ${
                  percentDifference !== null && percentDifference < 0
                    ? "text-emerald-700"
                    : percentDifference !== null && percentDifference > 0
                    ? "text-amber-700"
                    : "text-stone-700"
                }`}
              >
                {percentDifference !== null ? (
                  <>
                    <span>{percentDifference > 0 ? "+" : ""}</span>
                    <span>{percentDifference}%</span>
                  </>
                ) : (
                  "—"
                )}
              </div>
            </div>

            {/* 4. Projected Annual Impact */}
            <div className="p-2 bg-white rounded-lg border border-[#E5DAC4]/50">
              <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 block">
                ANNUAL IMPACT
              </span>
              <div
                className={`font-serif text-sm font-bold mt-0.5 ${
                  annualImpact !== null && annualImpact < 0
                    ? "text-emerald-700"
                    : annualImpact !== null && annualImpact > 0
                    ? "text-amber-700"
                    : "text-stone-800"
                }`}
              >
                {annualImpact !== null ? (
                  <>
                    <span>{annualImpact > 0 ? "+" : "-"}</span>
                    <span>{formatINR(Math.abs(annualImpact))}</span>
                    <span className="text-[9px] font-sans font-normal text-stone-400"> / yr</span>
                  </>
                ) : (
                  "—"
                )}
              </div>
            </div>
          </div>

          <div className="text-[10px] font-mono text-stone-400 flex items-center justify-between pt-1">
            <span>Deterministic A/B comparison</span>
            <span>receipts &gt; vibes ✦</span>
          </div>
        </div>
      )}
    </div>
  );
}
