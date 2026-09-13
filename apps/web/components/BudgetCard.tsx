"use client";

import { useEffect, useState, useMemo } from "react";
import { deleteBudget, getBudgets, getBudgetVariance, upsertBudget } from "@/lib/api";

interface VarianceItem {
  category: string;
  limit: number;
  spent: number;
  variance: number;
}

const CATEGORY_META: Record<string, { icon: string; name: string }> = {
  "Food & Dining": { icon: "🍜", name: "Food & Dining" },
  Food: { icon: "🍜", name: "Food & Dining" },
  Groceries: { icon: "🛒", name: "Groceries" },
  Utilities: { icon: "⚡", name: "Utilities" },
  Bills: { icon: "⚡", name: "Utilities" },
  Shopping: { icon: "🛍️", name: "Shopping" },
  Entertainment: { icon: "🎬", name: "Entertainment" },
  Travel: { icon: "✈️", name: "Travel" },
  Transport: { icon: "🚕", name: "Transport" },
  Healthcare: { icon: "💊", name: "Healthcare" },
  Rent: { icon: "🏠", name: "Rent" },
  Subscriptions: { icon: "📱", name: "Subscriptions" },
  Other: { icon: "💳", name: "Other" },
};

function getCategoryMeta(cat: string) {
  return CATEGORY_META[cat] || { icon: "💳", name: cat };
}

function formatIndianCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
}

// Circular SVG Progress Ring Component
function CircularRing({
  percentage,
  size = 90,
  strokeWidth = 8,
  ringColor = "#84cc16",
  ringBg = "#ECFCCB",
  isOver = false,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  ringColor?: string;
  ringBg?: string;
  isOver?: boolean;
}) {
  const [displayedPct, setDisplayedPct] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayedPct(Math.min(percentage, 100));
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayedPct / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg className="rotate-[-90deg]" width={size} height={size}>
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ringBg}
          strokeWidth={strokeWidth}
        />
        {/* Animated Progress Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* Center Percentage Display */}
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span
          className={`font-mono text-sm sm:text-base font-black tracking-tight ${
            isOver ? "text-[#EF4444]" : "text-[#18122B]"
          }`}
        >
          {percentage}%
        </span>
      </div>
    </div>
  );
}

export function BudgetCard({ token }: { token: string }) {
  const [variance, setVariance] = useState<VarianceItem[]>([]);
  const [budgetMap, setBudgetMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState({ category: "Food & Dining", monthlyLimit: "" });
  const [isSaving, setIsSaving] = useState(false);

  // Delete Confirmation State
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  function showToast(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  }

  async function load() {
    setLoading(true);
    try {
      const [varData, rawBudgets] = await Promise.all([
        getBudgetVariance(token),
        getBudgets(token),
      ]);
      setVariance(Array.isArray(varData) ? varData : []);
      const map: Record<string, string> = {};
      if (Array.isArray(rawBudgets)) {
        rawBudgets.forEach((b: any) => {
          map[b.category] = b.id;
        });
      }
      setBudgetMap(map);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  // Open Modal for New or Existing Category
  function handleOpenModal(categoryToEdit?: string, existingLimit?: number) {
    setModalForm({
      category: categoryToEdit || "Food & Dining",
      monthlyLimit: existingLimit ? String(existingLimit) : "",
    });
    setIsModalOpen(true);
  }

  // Save / Upsert Budget
  async function handleSaveBudget(e: React.FormEvent) {
    e.preventDefault();
    if (!modalForm.monthlyLimit || Number(modalForm.monthlyLimit) <= 0) return;

    setIsSaving(true);
    try {
      await upsertBudget(token, {
        category: modalForm.category,
        monthlyLimit: Number(modalForm.monthlyLimit),
      });
      setIsModalOpen(false);
      showToast(`Budget limit set for ${modalForm.category}!`);
      load();
    } catch (e: any) {
      console.error(e);
      showToast("Failed to set budget limit");
    } finally {
      setIsSaving(false);
    }
  }

  // Delete Budget
  async function handleConfirmDelete() {
    if (!deleteCandidate) return;
    const budgetId = budgetMap[deleteCandidate];
    if (!budgetId) return;

    setIsDeleting(true);
    try {
      await deleteBudget(token, budgetId);
      showToast(`Removed budget for ${deleteCandidate}`);
      setDeleteCandidate(null);
      load();
    } catch (e: any) {
      console.error(e);
      showToast("Failed to delete budget");
    } finally {
      setIsDeleting(false);
    }
  }

  // Totals & Status Calculations for BUDGET PULSE
  const pulseMetrics = useMemo(() => {
    if (variance.length === 0) {
      return {
        totalSpent: 31500,
        totalLimit: 50000,
        remaining: 18500,
        overallPct: 63,
        statusLabel: "ON TRACK",
        statusMessage: "You're 63% through your budget. Still looking good.",
        criticalCategory: null as VarianceItem | null,
        healthyCategory: null as VarianceItem | null,
      };
    }

    const totalSpent = variance.reduce((acc, v) => acc + Number(v.spent || 0), 0);
    const totalLimit = variance.reduce((acc, v) => acc + Number(v.limit || 0), 0);
    const remaining = totalLimit - totalSpent;
    const overallPct = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

    let statusLabel = "ON TRACK";
    let statusMessage = `You're ${overallPct}% through your monthly budget. Still looking good.`;

    if (overallPct > 100) {
      statusLabel = "OVER BUDGET";
      statusMessage = `You've exceeded your combined limit by ₹${formatIndianCurrency(
        Math.abs(remaining)
      )}. Time to plug the leaks.`;
    } else if (overallPct >= 80) {
      statusLabel = "WATCH SPENDING";
      statusMessage = `You've used ${overallPct}% of your budget. Slow down on discretionary buys.`;
    }

    // Spot overbudget or high usage categories
    const sortedByOverage = [...variance].sort((a, b) => {
      const aOver = a.spent - a.limit;
      const bOver = b.spent - b.limit;
      return bOver - aOver;
    });

    const criticalCategory = sortedByOverage[0]?.spent > sortedByOverage[0]?.limit
      ? sortedByOverage[0]
      : null;

    const healthyCategory = [...variance].find(
      (v) => v.limit > 0 && v.spent / v.limit < 0.5
    ) || null;

    return {
      totalSpent,
      totalLimit,
      remaining,
      overallPct,
      statusLabel,
      statusMessage,
      criticalCategory,
      healthyCategory,
    };
  }, [variance]);

  // Status mapping for individual category cards
  function getTileStatus(spent: number, limit: number) {
    const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;

    if (pct > 100) {
      return {
        pct,
        label: "Oops. We crossed the line.",
        pillClass: "border-rose-300 bg-rose-50 text-rose-700",
        ringColor: "#EF4444",
        ringBg: "#FEE2E2",
        sticker: "⚠️",
        isOver: true,
      };
    }
    if (pct >= 90) {
      return {
        pct,
        label: "Watch this one.",
        pillClass: "border-orange-300 bg-orange-50 text-orange-700",
        ringColor: "#F97316",
        ringBg: "#FFEDD5",
        sticker: "!",
        isOver: false,
      };
    }
    if (pct >= 75) {
      return {
        pct,
        label: "Touching the limit.",
        pillClass: "border-amber-300 bg-amber-50 text-amber-800",
        ringColor: "#F59E0B",
        ringBg: "#FEF3C7",
        sticker: "👀",
        isOver: false,
      };
    }
    if (pct >= 50) {
      return {
        pct,
        label: "Money behaving.",
        pillClass: "border-purple-300 bg-purple-50 text-purple-700",
        ringColor: "#8B5CF6",
        ringBg: "#F3E8FF",
        sticker: "✦",
        isOver: false,
      };
    }
    return {
      pct,
      label: "You're chilling.",
      pillClass: "border-[#84cc16]/40 bg-[#84cc16]/15 text-[#3f6212]",
      ringColor: "#84cc16",
      ringBg: "#ECFCCB",
      sticker: "✨",
      isOver: false,
    };
  }

  return (
    <div className="flex flex-col gap-3 pb-8">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col gap-2 pt-1 pb-0.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-black tracking-tight text-[#18122B] leading-tight">
            BUDGETS THAT BEHAVE.
          </h1>
          <p className="text-xs text-[#18122B]/65 font-medium">
            Set limits, dodge the leaks, and keep your wallet smiling.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="group inline-flex items-center justify-center gap-1.5 rounded-full bg-[#18122B] px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#2e234c] hover:scale-105 active:scale-95 sm:w-auto"
        >
          <span className="text-[#84cc16] font-bold">✨</span>
          <span>+ Add budget</span>
          <span className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
        </button>
      </div>

      {/* Global Action Toast */}
      {message && (
        <div className="flex items-center gap-1.5 rounded-xl border border-[#84cc16]/40 bg-[#84cc16]/15 px-3 py-1.5 text-xs font-bold text-[#3f6212] animate-fadeIn">
          <span>✓</span>
          <span>{message}</span>
        </div>
      )}

      {/* 2. HERO / OVERVIEW CARD: "BUDGET PULSE" */}
      <div className="relative overflow-hidden rounded-3xl border border-[#E5DAC4] bg-[#FFFDF8] p-4 sm:p-5 shadow-sm transition-all hover:border-[#84cc16]/60">
        {/* Floating Smart Insight Sticker */}
        {pulseMetrics.criticalCategory ? (
          <div className="absolute top-3 right-4 sm:top-4 sm:right-5 hidden sm:flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-bold text-rose-700 shadow-xs rotate-1 hover:rotate-0 transition-transform">
            <span>⚡ MONEY MOVE:</span>
            <span className="font-semibold">{pulseMetrics.criticalCategory.category} needs attention.</span>
          </div>
        ) : pulseMetrics.healthyCategory ? (
          <div className="absolute top-3 right-4 sm:top-4 sm:right-5 hidden sm:flex items-center gap-1.5 rounded-full border border-[#84cc16]/40 bg-[#84cc16]/15 px-3 py-1 text-[11px] font-black text-[#3f6212] shadow-xs -rotate-1 hover:rotate-0 transition-transform">
            <span>✨ NICE:</span>
            <span className="font-semibold">{pulseMetrics.healthyCategory.category} is comfortably under budget.</span>
          </div>
        ) : null}

        {/* Decorative Floating Spark Ornament */}
        <div className="pointer-events-none absolute -bottom-6 -right-6 h-28 w-28 rounded-full bg-[#84cc16]/10 blur-xl" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: Title & Large Circular Ring */}
          <div className="flex items-center gap-4 sm:gap-6">
            <CircularRing
              percentage={pulseMetrics.overallPct}
              size={96}
              strokeWidth={10}
              ringColor={pulseMetrics.overallPct > 100 ? "#EF4444" : "#84cc16"}
              ringBg={pulseMetrics.overallPct > 100 ? "#FEE2E2" : "#ECFCCB"}
              isOver={pulseMetrics.overallPct > 100}
            />

            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-black uppercase tracking-wider text-[#18122B]/60">
                  BUDGET PULSE
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-black tracking-wider uppercase ${
                    pulseMetrics.statusLabel === "OVER BUDGET"
                      ? "bg-rose-100 text-rose-700"
                      : pulseMetrics.statusLabel === "WATCH SPENDING"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-[#84cc16]/20 text-[#3f6212]"
                  }`}
                >
                  ● {pulseMetrics.statusLabel}
                </span>
              </div>

              <h2 className="font-serif text-lg sm:text-xl font-black text-[#18122B] mt-0.5">
                How's the money looking?
              </h2>

              <p className="mt-0.5 text-xs text-[#18122B]/70 font-medium max-w-sm sm:max-w-md">
                {pulseMetrics.statusMessage}
              </p>
            </div>
          </div>

          {/* Right: Metrics Callout */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between border-t border-[#E5DAC4]/60 pt-2.5 sm:border-t-0 sm:pt-0 shrink-0">
            <div className="text-left sm:text-right">
              <span className="font-serif text-lg sm:text-2xl font-black text-[#18122B] tabular-nums">
                ₹ {formatIndianCurrency(pulseMetrics.totalSpent)}
              </span>
              <span className="ml-1 text-xs font-bold text-[#18122B]/50">spent</span>
            </div>

            <div className="text-right mt-0.5">
              <span
                className={`font-serif text-sm sm:text-base font-bold tabular-nums ${
                  pulseMetrics.remaining < 0 ? "text-rose-600" : "text-[#84cc16]"
                }`}
              >
                {pulseMetrics.remaining < 0 ? "-" : ""}₹{" "}
                {formatIndianCurrency(pulseMetrics.remaining)}
              </span>
              <span className="ml-1 text-[11px] font-semibold text-[#18122B]/50">
                {pulseMetrics.remaining < 0 ? "over ceiling" : "left to spend"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. COLLECTIBLE CATEGORY TILES (Responsive Grid) */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#18122B]/60">
            CATEGORY TILES ({variance.length})
          </span>
          <span className="text-[10px] text-[#18122B]/40 font-mono">
            Hover for controls
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-[24px] border border-[#E5DAC4]/50 bg-white p-4 h-44"
              >
                <div className="h-4 w-28 rounded bg-[#E5DAC4]/60 mb-3" />
                <div className="flex items-center justify-center my-3">
                  <div className="h-16 w-16 rounded-full bg-[#E5DAC4]/60" />
                </div>
                <div className="h-4 w-36 rounded bg-[#E5DAC4]/40 mt-2" />
              </div>
            ))}
          </div>
        ) : variance.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-[#E5DAC4] bg-[#FFFDF8] py-12 text-center p-6">
            <span className="text-3xl">✨</span>
            <h3 className="mt-2 font-serif text-lg font-black text-[#18122B]">
              NO BUDGET TILES DEFINED YET
            </h3>
            <p className="mt-1 max-w-sm text-xs text-[#18122B]/60 font-medium">
              Create your first category spending limit to start tracking your financial discipline.
            </p>
            <button
              onClick={() => handleOpenModal()}
              className="mt-4 rounded-full bg-[#18122B] px-4 py-2 text-xs font-bold text-white shadow hover:bg-[#2e234c] transition-all"
            >
              + Set First Budget
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {variance.map((v) => {
              const meta = getCategoryMeta(v.category);
              const status = getTileStatus(v.spent, v.limit);
              const remaining = v.limit - v.spent;

              return (
                <div
                  key={v.category}
                  className="group relative flex flex-col justify-between rounded-[24px] border border-[#E5DAC4] bg-[#FFFDF8] p-4 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-[#84cc16]/70 hover:shadow-md"
                >
                  {/* Card Top: Category Icon + Title + Sticker */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base sm:text-lg">{meta.icon}</span>
                      <span className="font-mono text-xs font-black uppercase tracking-wider text-[#18122B]">
                        {meta.name}
                      </span>
                    </div>

                    {/* Fun decorative status sticker */}
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-white border border-[#DDD9CF] text-xs shadow-2xs group-hover:scale-110 transition-transform"
                      title={status.label}
                    >
                      {status.sticker}
                    </span>
                  </div>

                  {/* Card Middle: Circular Progress Ring & Numbers */}
                  <div className="my-3 flex items-center justify-between gap-3">
                    <CircularRing
                      percentage={status.pct}
                      size={76}
                      strokeWidth={8}
                      ringColor={status.ringColor}
                      ringBg={status.ringBg}
                      isOver={status.isOver}
                    />

                    <div className="flex-1 text-right">
                      <span className="block font-serif text-xl sm:text-2xl font-black text-[#18122B] tabular-nums tracking-tight">
                        ₹ {formatIndianCurrency(v.spent)}
                      </span>
                      <span className="block text-[11px] font-semibold text-[#18122B]/50">
                        of ₹ {formatIndianCurrency(v.limit)}
                      </span>
                      <span
                        className={`block text-[10px] font-bold tabular-nums mt-0.5 ${
                          remaining < 0 ? "text-rose-600 font-black" : "text-[#3f6212]"
                        }`}
                      >
                        {remaining < 0
                          ? `₹ ${formatIndianCurrency(Math.abs(remaining))} over ceiling`
                          : `₹ ${formatIndianCurrency(remaining)} left`}
                      </span>
                    </div>
                  </div>

                  {/* Card Bottom: Status Pill + Quick Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#E5DAC4]/60">
                    {/* Status Pill */}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-black tracking-wide ${status.pillClass}`}
                    >
                      <span>●</span>
                      <span>{status.label}</span>
                    </span>

                    {/* Edit & Delete Action Buttons */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenModal(v.category, v.limit)}
                        className="flex h-6 w-6 items-center justify-center rounded-lg border border-transparent text-[#18122B]/50 hover:border-[#DDD9CF] hover:bg-white hover:text-[#18122B] transition-colors"
                        title="Edit limit"
                      >
                        ✏️
                      </button>

                      {budgetMap[v.category] && (
                        <button
                          onClick={() => setDeleteCandidate(v.category)}
                          className="flex h-6 w-6 items-center justify-center rounded-lg border border-transparent text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-colors"
                          title="Remove budget"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. SET / EDIT BUDGET LIMIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md rounded-[26px] border border-[#E5DAC4] bg-[#FFFDF8] p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E5DAC4]/60 pb-3">
              <div>
                <h3 className="font-serif text-lg font-black text-[#18122B]">
                  SET CATEGORY BUDGET
                </h3>
                <p className="text-[11px] text-[#18122B]/60 font-medium">
                  Give this category a monthly spending ceiling.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-[#18122B]/50 hover:bg-[#18122B]/10 hover:text-[#18122B]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#18122B]/70 mb-1">
                  Category
                </label>
                <select
                  value={modalForm.category}
                  onChange={(e) => setModalForm({ ...modalForm, category: e.target.value })}
                  className="w-full rounded-xl border border-[#DDD9CF] bg-white px-3 py-2 text-xs font-semibold text-[#18122B] focus:border-[#84cc16] focus:outline-none focus:ring-2 focus:ring-[#84cc16]/30"
                >
                  <option value="Food & Dining">🍜 Food & Dining</option>
                  <option value="Groceries">🛒 Groceries</option>
                  <option value="Shopping">🛍️ Shopping</option>
                  <option value="Utilities">⚡ Utilities</option>
                  <option value="Entertainment">🎬 Entertainment</option>
                  <option value="Travel">✈️ Travel</option>
                  <option value="Healthcare">💊 Healthcare</option>
                  <option value="Rent">🏠 Rent</option>
                  <option value="Subscriptions">📱 Subscriptions</option>
                  <option value="Other">💳 Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#18122B]/70 mb-1">
                  Monthly Limit (₹)
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 font-serif text-sm font-bold text-[#18122B]/60">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    required
                    placeholder="e.g. 8000"
                    value={modalForm.monthlyLimit}
                    onChange={(e) =>
                      setModalForm({ ...modalForm, monthlyLimit: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#DDD9CF] bg-white py-2 pl-7 pr-3 text-xs font-semibold text-[#18122B] placeholder:text-[#18122B]/40 focus:border-[#84cc16] focus:outline-none focus:ring-2 focus:ring-[#84cc16]/30"
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-2 border-t border-[#E5DAC4]/60">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-[#DDD9CF] bg-white px-3.5 py-2 text-xs font-bold text-[#18122B]/80 hover:bg-[#FBF7EE]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !modalForm.monthlyLimit}
                  className="rounded-xl bg-[#18122B] px-4 py-2 text-xs font-bold text-white shadow hover:bg-[#2e234c] disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Set Budget Limit →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. DELETE CONFIRMATION DIALOG */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm rounded-[24px] border border-[#E5DAC4] bg-[#FFFDF8] p-5 shadow-2xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600 text-lg mb-3">
              ⚠️
            </div>
            <h3 className="font-serif text-base font-black text-[#18122B]">
              Remove budget for {deleteCandidate}?
            </h3>
            <p className="mt-1 text-xs text-[#18122B]/70 font-medium">
              This will remove the monthly spending limit for this category. Your historical
              transactions will remain completely intact.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="rounded-xl border border-[#DDD9CF] bg-white px-3.5 py-1.5 text-xs font-bold text-[#18122B]/80 hover:bg-[#FBF7EE]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="rounded-xl bg-rose-600 px-4 py-1.5 text-xs font-bold text-white shadow hover:bg-rose-700 disabled:opacity-50"
              >
                {isDeleting ? "Removing..." : "Remove Budget"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
