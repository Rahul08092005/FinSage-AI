"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  deleteBudget,
  getBudgets,
  getBudgetVariance,
  upsertBudget,
  getInsights,
  getTransactions,
  type InsightItem,
} from "@/lib/api";
import { formatINR } from "@/lib/formatCurrency";

interface VarianceItem {
  category: string;
  limit: number;
  spent: number;
  remaining: number;
}

interface TransactionItem {
  id: string;
  amount: number;
  category: string;
  transactionDate: string;
  description: string;
}

export type BudgetOwlStatus = "HAPPY" | "WATCHFUL" | "ANXIOUS" | "OVER_BUDGET";

export interface BudgetOwlState {
  status: BudgetOwlStatus;
  pct: number;
  label: string;
  subtext: string;
  ariaLabel: string;
  owlImage: string;
  pillClass: string;
  barColor: string;
  dotColor: string;
  statusTextColor: string;
  badgeColor: string;
  isOver: boolean;
}

/**
 * Reusable dynamic budget owl state calculation based on exact utilization boundaries:
 * 0%–49.99%   → Cheerful Owl On Track (HAPPY)
 * 50%–69.99%  → Watch Your Spend Owl (WATCHFUL)
 * 70%–99.99%  → Anxious Owl with Checklist (BORDERLINE / ANXIOUS)
 * 100%+       → Angry Owl Over Budget (OVER_BUDGET)
 */
export function getBudgetOwlState(spent: number, limit: number): BudgetOwlState {
  if (limit <= 0) {
    return {
      status: "HAPPY",
      pct: 0,
      label: "On track!",
      subtext: "No spending ceiling set",
      ariaLabel: "Budget status: on track",
      owlImage: "/owl-budget-happy.png",
      pillClass: "border-emerald-300 bg-emerald-50 text-emerald-800",
      barColor: "bg-[#84cc16]",
      dotColor: "text-[#84cc16]",
      statusTextColor: "text-emerald-800",
      badgeColor: "bg-emerald-100 text-emerald-800",
      isOver: false,
    };
  }

  const rawPct = (spent / limit) * 100;
  const roundedPct = Math.round(rawPct);

  // STATE 4 — OVER BUDGET (100%+)
  if (rawPct >= 100) {
    return {
      status: "OVER_BUDGET",
      pct: roundedPct,
      label: "Over budget!",
      subtext: "Exceeded monthly limit",
      ariaLabel: "Budget status: over budget",
      owlImage: "/owl-budget-angry.png",
      pillClass: "border-rose-300 bg-rose-50 text-rose-700",
      barColor: "bg-rose-500",
      dotColor: "text-rose-500",
      statusTextColor: "text-rose-600",
      badgeColor: "bg-rose-100 text-rose-800",
      isOver: true,
    };
  }

  // STATE 3 — BORDERLINE / ANXIOUS (70% – 99.99%)
  if (rawPct >= 70) {
    return {
      status: "ANXIOUS",
      pct: roundedPct,
      label: "Getting close!",
      subtext: "Approaching budget ceiling",
      ariaLabel: "Budget status: approaching limit",
      owlImage: "/owl-budget-anxious.png",
      pillClass: "border-orange-300 bg-orange-50 text-orange-800",
      barColor: "bg-orange-500",
      dotColor: "text-orange-500",
      statusTextColor: "text-orange-800",
      badgeColor: "bg-orange-100 text-orange-800",
      isOver: false,
    };
  }

  // STATE 2 — WATCHFUL (50% – 69.99%)
  if (rawPct >= 50) {
    return {
      status: "WATCHFUL",
      pct: roundedPct,
      label: "Watch your spend!",
      subtext: "Spending is picking up",
      ariaLabel: "Budget status: watch your spending",
      owlImage: "/owl-budget-watchful.png",
      pillClass: "border-amber-300 bg-amber-50 text-amber-800",
      barColor: "bg-amber-500",
      dotColor: "text-amber-500",
      statusTextColor: "text-amber-800",
      badgeColor: "bg-amber-100 text-amber-800",
      isOver: false,
    };
  }

  // STATE 1 — HAPPY (0% – 49.99%)
  return {
    status: "HAPPY",
    pct: roundedPct,
    label: "On track!",
    subtext: "Healthy safe reserves",
    ariaLabel: "Budget status: on track",
    owlImage: "/owl-budget-happy.png",
    pillClass: "border-emerald-300 bg-emerald-50 text-emerald-800",
    barColor: "bg-[#84cc16]",
    dotColor: "text-[#84cc16]",
    statusTextColor: "text-emerald-800",
    badgeColor: "bg-emerald-100 text-emerald-800",
    isOver: false,
  };
}

const CATEGORY_META: Record<
  string,
  { icon: string; name: string; bg: string; border: string; text: string; color: string }
> = {
  "Food & Dining": {
    icon: "🍜",
    name: "Food & Dining",
    bg: "bg-[#FFF7ED]",
    border: "border-[#FFEDD5]",
    text: "text-[#C2410C]",
    color: "#F97316",
  },
  Food: {
    icon: "🍜",
    name: "Food & Dining",
    bg: "bg-[#FFF7ED]",
    border: "border-[#FFEDD5]",
    text: "text-[#C2410C]",
    color: "#F97316",
  },
  Groceries: {
    icon: "🛒",
    name: "Groceries",
    bg: "bg-[#ECFDF5]",
    border: "border-[#A7F3D0]",
    text: "text-[#047857]",
    color: "#10B981",
  },
  Utilities: {
    icon: "⚡",
    name: "Utilities",
    bg: "bg-[#FAF5FF]",
    border: "border-[#E9D5FF]",
    text: "text-[#7E22CE]",
    color: "#A855F7",
  },
  Bills: {
    icon: "⚡",
    name: "Utilities",
    bg: "bg-[#FAF5FF]",
    border: "border-[#E9D5FF]",
    text: "text-[#7E22CE]",
    color: "#A855F7",
  },
  Shopping: {
    icon: "🛍️",
    name: "Shopping",
    bg: "bg-[#EFF6FF]",
    border: "border-[#BFDBFE]",
    text: "text-[#1D4ED8]",
    color: "#3B82F6",
  },
  Housing: {
    icon: "🏠",
    name: "Housing",
    bg: "bg-[#FFF1F2]",
    border: "border-[#FECDD3]",
    text: "text-[#BE123C]",
    color: "#F43F5E",
  },
  Rent: {
    icon: "🏠",
    name: "Housing",
    bg: "bg-[#FFF1F2]",
    border: "border-[#FECDD3]",
    text: "text-[#BE123C]",
    color: "#F43F5E",
  },
  Transportation: {
    icon: "🚗",
    name: "Transportation",
    bg: "bg-[#F0F9FF]",
    border: "border-[#BAE6FD]",
    text: "text-[#0369A1]",
    color: "#0284C7",
  },
  Transport: {
    icon: "🚗",
    name: "Transportation",
    bg: "bg-[#F0F9FF]",
    border: "border-[#BAE6FD]",
    text: "text-[#0369A1]",
    color: "#0284C7",
  },
  Travel: {
    icon: "✈️",
    name: "Travel",
    bg: "bg-[#F0F9FF]",
    border: "border-[#BAE6FD]",
    text: "text-[#0369A1]",
    color: "#0284C7",
  },
  Entertainment: {
    icon: "🎮",
    name: "Entertainment",
    bg: "bg-[#FAF5FF]",
    border: "border-[#E9D5FF]",
    text: "text-[#7E22CE]",
    color: "#8B5CF6",
  },
  Healthcare: {
    icon: "💊",
    name: "Healthcare",
    bg: "bg-[#FFF1F2]",
    border: "border-[#FECDD3]",
    text: "text-[#BE123C]",
    color: "#F43F5E",
  },
  Subscriptions: {
    icon: "📱",
    name: "Subscriptions",
    bg: "bg-[#F3E8FF]",
    border: "border-[#E9D5FF]",
    text: "text-[#6B21A8]",
    color: "#9333EA",
  },
  General: {
    icon: "💳",
    name: "General",
    bg: "bg-[#F8FAFC]",
    border: "border-[#E2E8F0]",
    text: "text-[#475569]",
    color: "#64748B",
  },
  Other: {
    icon: "💳",
    name: "Other",
    bg: "bg-[#F8FAFC]",
    border: "border-[#E2E8F0]",
    text: "text-[#475569]",
    color: "#64748B",
  },
};

function getCategoryMeta(cat: string) {
  return (
    CATEGORY_META[cat] || {
      icon: "💳",
      name: cat,
      bg: "bg-[#F8FAFC]",
      border: "border-[#E2E8F0]",
      text: "text-[#475569]",
      color: "#64748B",
    }
  );
}

export function BudgetCard({ token }: { token: string }) {
  const [variance, setVariance] = useState<VarianceItem[]>([]);
  const [budgetMap, setBudgetMap] = useState<Record<string, string>>({});
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");
  const [selectedMonth, setSelectedMonth] = useState<string>("This Month");
  const [tipIndex, setTipIndex] = useState(0);

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState({ category: "Food & Dining", monthlyLimit: "" });
  const [isSaving, setIsSaving] = useState(false);

  // Delete Confirmation State
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  function showToast(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3500);
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [varData, rawBudgets, insData, txData] = await Promise.allSettled([
        getBudgetVariance(token),
        getBudgets(token),
        getInsights(token),
        getTransactions(token, 10),
      ]);

      if (varData.status === "fulfilled" && Array.isArray(varData.value)) {
        setVariance(varData.value);
      } else {
        setVariance([]);
      }

      const map: Record<string, string> = {};
      if (rawBudgets.status === "fulfilled" && Array.isArray(rawBudgets.value)) {
        rawBudgets.value.forEach((b: any) => {
          map[b.category] = b.id;
        });
      }
      setBudgetMap(map);

      if (insData.status === "fulfilled" && Array.isArray(insData.value)) {
        setInsights(insData.value);
      }

      if (txData.status === "fulfilled" && Array.isArray(txData.value)) {
        setTransactions(txData.value);
      }
    } catch (e) {
      console.error("[Budgets] Error loading data:", e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

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
      showToast(`Budget limit set for ${modalForm.category}! ✦`);
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

  // Totals & Status Calculations for Summary Cards
  const summaryMetrics = useMemo(() => {
    const totalCount = variance.length;
    const totalLimit = variance.reduce((acc, v) => acc + Number(v.limit || 0), 0);
    const totalSpent = variance.reduce((acc, v) => acc + Number(v.spent || 0), 0);
    const remaining = totalLimit - totalSpent;
    const overallPct = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

    let onTrackCount = 0;
    let watchfulCount = 0;
    let nearLimitCount = 0;
    let overBudgetCount = 0;

    variance.forEach((v) => {
      const pct = v.limit > 0 ? (v.spent / v.limit) * 100 : 0;
      if (pct >= 100) {
        overBudgetCount++;
      } else if (pct >= 70) {
        nearLimitCount++;
      } else if (pct >= 50) {
        watchfulCount++;
      } else {
        onTrackCount++;
      }
    });

    const criticalCategory = [...variance].find((v) => v.spent > v.limit) || null;
    const closeCategory = [...variance].find((v) => v.limit > 0 && v.spent / v.limit >= 0.7 && v.spent <= v.limit) || null;
    const healthyCategory = [...variance].find((v) => v.limit > 0 && v.spent / v.limit < 0.5) || null;

    let pulseStatus: BudgetOwlStatus = "HAPPY";
    let pulseText = "ON TRACK";
    let pulsePill = "border-emerald-300 bg-emerald-50 text-emerald-800";
    let pulseStroke = "#84cc16";

    if (overallPct >= 100 || overBudgetCount > 0) {
      pulseStatus = "OVER_BUDGET";
      pulseText = "ATTENTION NEEDED";
      pulsePill = "border-rose-300 bg-rose-50 text-rose-700";
      pulseStroke = "#f43f5e";
    } else if (overallPct >= 70 || nearLimitCount > 0) {
      pulseStatus = "ANXIOUS";
      pulseText = "APPROACHING LIMIT";
      pulsePill = "border-orange-300 bg-orange-50 text-orange-800";
      pulseStroke = "#f97316";
    } else if (overallPct >= 50 || watchfulCount > 0) {
      pulseStatus = "WATCHFUL";
      pulseText = "WATCHFUL";
      pulsePill = "border-amber-300 bg-amber-50 text-amber-800";
      pulseStroke = "#f59e0b";
    }

    return {
      totalCount,
      totalLimit,
      totalSpent,
      remaining,
      overallPct,
      onTrackCount,
      watchfulCount,
      nearLimitCount,
      overBudgetCount,
      criticalCategory,
      closeCategory,
      healthyCategory,
      pulseStatus,
      pulseText,
      pulsePill,
      pulseStroke,
    };
  }, [variance]);

  // Filtered Budget Tiles
  const filteredVariance = useMemo(() => {
    if (selectedCategoryFilter === "ALL") return variance;
    return variance.filter((v) => v.category === selectedCategoryFilter);
  }, [variance, selectedCategoryFilter]);

  // Dynamic Tips Array
  const dynamicTips = useMemo(() => {
    const list = [];
    if (summaryMetrics.closeCategory) {
      list.push({
        title: `Watch ${summaryMetrics.closeCategory.category} spend`,
        text: `You're close to your ${summaryMetrics.closeCategory.category} limit (${Math.round((summaryMetrics.closeCategory.spent / summaryMetrics.closeCategory.limit) * 100)}% used). Try spacing out discretionary transactions this week.`,
      });
    }
    if (summaryMetrics.criticalCategory) {
      list.push({
        title: `Over budget on ${summaryMetrics.criticalCategory.category}`,
        text: `You've exceeded your monthly limit by ${formatINR(summaryMetrics.criticalCategory.spent - summaryMetrics.criticalCategory.limit)}. Consider adjusting your ceiling or shifting funds.`,
      });
    }
    list.push({
      title: "Set realistic ceilings",
      text: "Budgets work best when they give your money a realistic boundary rather than restricting your life.",
    });
    list.push({
      title: "Automate your emergency fund",
      text: "Setting aside 15% of your income into savings first keeps your category limits stress-free.",
    });
    return list;
  }, [summaryMetrics]);

  // Donut circumference constants for SVG gauge (radius 36)
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (Math.min(summaryMetrics.overallPct, 100) / 100) * circumference;

  return (
    <div className="min-h-screen bg-[#FAF6ED] text-[#18122B] pb-16 pt-2 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Global Toast Notification */}
      {message && (
        <div className="fixed top-4 right-4 z-50 rounded-xl border border-[#DDD9CF] bg-[#18122B] text-white px-4 py-2.5 text-xs font-bold shadow-xl animate-fade-in flex items-center gap-2">
          <span>✦</span>
          <span>{message}</span>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          1. HERO HEADER WITH NATURAL FLOATING MASCOT
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="relative pt-2 sm:pt-4 pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left Title Area */}
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#84cc16]/40 bg-[#ECFDF5] px-3 py-1 text-[11px] font-bold text-[#047857] mb-2 shadow-2xs">
              <span>🌿</span>
              <span className="tracking-wide uppercase text-[10px]">BUDGET TRACKER</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#18122B]">
              Budgets that behave. <span className="text-amber-500">✦</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#18122B]/60 font-medium mt-1">
              Set limits, dodge the leaks, and keep your wallet smiling.
            </p>
          </div>

          {/* Center/Right: Transparent Hero Owl with Speech Bubble & Action */}
          <div className="flex items-center gap-4 sm:gap-6 self-start lg:self-center">
            {/* Mascot Container - Pure floating illustration, NO box, NO card background */}
            <div className="relative w-36 sm:w-44 h-24 sm:h-28 shrink-0 flex items-center justify-center">
              <Image
                src="/finsage-owl.png"
                alt="FinSage Companion Mascot"
                width={200}
                height={160}
                priority
                className="w-auto h-full object-contain pointer-events-none select-none drop-shadow-sm transition-transform duration-300 hover:scale-105"
              />
            </div>

            {/* Speech bubble & CTA */}
            <div className="flex flex-col items-start gap-2">
              <div className="relative rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] px-3.5 py-1.5 shadow-2xs text-[11px] font-serif font-bold text-[#18122B] flex items-center gap-1.5">
                <span>You&apos;re on track! Keep it up!</span>
                <span className="text-emerald-600">💚</span>
              </div>

              <button
                type="button"
                onClick={() => handleOpenModal()}
                className="inline-flex items-center gap-2 rounded-full bg-[#18122B] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#18122B]/90 hover:scale-[1.02] transition-all cursor-pointer active:scale-95"
              >
                <span>+ Add Budget</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          2. LARGE COHESIVE BUDGET PULSE SUMMARY SECTION
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="rounded-3xl border border-[#E5DAC4] bg-[#FFFDF8] p-4 sm:p-6 shadow-xs my-3 sm:my-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Donut Gauge + Pulse Headline */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* SVG Donut Progress Meter */}
            <div className="relative flex items-center justify-center shrink-0 w-20 h-20 sm:w-24 sm:h-24">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
                {/* Background Ring */}
                <circle
                  cx="44"
                  cy="44"
                  r={radius}
                  fill="transparent"
                  stroke="#E5DAC4"
                  strokeWidth="8"
                  strokeOpacity="0.4"
                />
                {/* Foreground Dynamic Arc */}
                <circle
                  cx="44"
                  cy="44"
                  r={radius}
                  fill="transparent"
                  stroke={summaryMetrics.pulseStroke}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              {/* Centered Percentage */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-mono text-base sm:text-lg font-black text-[#18122B]">
                  {summaryMetrics.overallPct}%
                </span>
              </div>
            </div>

            {/* Pulse Text */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#18122B]/50">
                  BUDGET PULSE
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold ${summaryMetrics.pulsePill}`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  <span>{summaryMetrics.pulseText}</span>
                </span>
              </div>

              <h2 className="font-serif text-lg sm:text-2xl font-bold tracking-tight text-[#18122B]">
                {summaryMetrics.overallPct >= 100
                  ? "Careful, spending has reached your limit!"
                  : summaryMetrics.overallPct >= 70
                  ? "Approaching monthly limit, keep an eye!"
                  : "Looking good, on track!"}
              </h2>

              <p className="text-xs text-[#18122B]/60 font-medium">
                You&apos;ve used {summaryMetrics.overallPct}% of your total monthly budget.{" "}
                {summaryMetrics.remaining >= 0
                  ? `You have ${formatINR(summaryMetrics.remaining)} left to spend.`
                  : `You are ${formatINR(Math.abs(summaryMetrics.remaining))} over budget.`}
              </p>
            </div>
          </div>

          {/* Right: Key Financial Summary Metrics */}
          <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-10 pt-4 lg:pt-0 border-t lg:border-t-0 border-[#E5DAC4]/60">
            <div>
              <p className="font-mono text-lg sm:text-2xl font-black text-[#18122B]">
                {formatINR(summaryMetrics.totalSpent)}
              </p>
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#18122B]/50 mt-0.5">
                Total Spent
              </p>
            </div>

            <div className="hidden sm:block h-10 w-px bg-[#E5DAC4]/60" />

            <div>
              <p
                className={`font-mono text-lg sm:text-2xl font-black ${
                  summaryMetrics.remaining < 0 ? "text-rose-600" : "text-emerald-700"
                }`}
              >
                {formatINR(Math.max(0, summaryMetrics.remaining))}
              </p>
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#18122B]/50 mt-0.5">
                Left to Spend
              </p>
            </div>

            <div className="hidden sm:block h-10 w-px bg-[#E5DAC4]/60" />

            <div>
              <p className="font-mono text-lg sm:text-2xl font-black text-[#18122B]">
                {formatINR(summaryMetrics.totalLimit)}
              </p>
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#18122B]/50 mt-0.5">
                Monthly Budget
              </p>
            </div>

            {/* Mini dynamic bar graphic */}
            <div className="hidden md:flex items-end gap-1 h-8 px-2 py-1 rounded-lg bg-[#FAF6ED] border border-[#E5DAC4]/50">
              <div className="w-1.5 bg-[#84cc16] rounded-full h-3" />
              <div className="w-1.5 bg-[#84cc16] rounded-full h-5" />
              <div className="w-1.5 bg-[#84cc16] rounded-full h-7" />
              <div className="w-1.5 bg-[#84cc16] rounded-full h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          3. CATEGORY BUDGETS HEADER & FILTER BAR
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <h2 className="font-serif text-base sm:text-lg font-bold uppercase tracking-tight text-[#18122B]">
            CATEGORY BUDGETS ({variance.length})
          </h2>
        </div>

        {/* Filters & View Switches */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Month Dropdown */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-xl border border-[#DDD9CF] bg-white px-3 py-1.5 text-xs font-semibold text-[#18122B]/80 focus:outline-none cursor-pointer shadow-2xs"
          >
            <option value="This Month">📅 This Month ▾</option>
            <option value="Last Month">📅 Last Month</option>
          </select>

          {/* Category Filter Dropdown */}
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="rounded-xl border border-[#DDD9CF] bg-white px-3 py-1.5 text-xs font-semibold text-[#18122B]/80 focus:outline-none cursor-pointer shadow-2xs"
          >
            <option value="ALL">All Categories ▾</option>
            {variance.map((v) => (
              <option key={v.category} value={v.category}>
                {v.category}
              </option>
            ))}
          </select>

          {/* Cards / List View Switch */}
          <div className="flex items-center rounded-xl border border-[#DDD9CF] bg-white p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                viewMode === "cards"
                  ? "bg-[#18122B] text-white shadow-2xs"
                  : "text-[#18122B]/60 hover:text-[#18122B]"
              }`}
            >
              <span>⊞</span>
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                viewMode === "list"
                  ? "bg-[#18122B] text-white shadow-2xs"
                  : "text-[#18122B]/60 hover:text-[#18122B]"
              }`}
            >
              <span>☰</span>
              <span>List</span>
            </button>
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          4. CATEGORY BUDGET CARDS GRID (WITH DYNAMIC TRANSPARENT FLOATING OWL)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {loading ? (
        <div className="py-16 text-center text-xs font-bold text-[#18122B]/50 animate-pulse">
          Loading category budgets...
        </div>
      ) : filteredVariance.length === 0 ? (
        <div className="py-12 text-center p-8 rounded-3xl border border-[#E5DAC4] bg-[#FFFDF8] flex flex-col items-center">
          <span className="text-3xl mb-2">✨</span>
          <h3 className="font-serif text-lg font-bold text-[#18122B]">Your budget book is blank.</h3>
          <p className="text-xs text-[#18122B]/60 font-medium max-w-md mt-1 mb-4">
            Give every rupee a designated job. Set monthly category limits to prevent leaks.
          </p>
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="rounded-full bg-[#18122B] text-white px-5 py-2.5 text-xs font-bold hover:bg-[#18122B]/90 transition shadow-sm cursor-pointer"
          >
            + Create your first budget →
          </button>
        </div>
      ) : viewMode === "cards" ? (
        /* 3-Column Responsive Grid matching the Reference Design */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVariance.map((v) => {
            const meta = getCategoryMeta(v.category);
            const owlState = getBudgetOwlState(v.spent, v.limit);
            const remaining = v.limit - v.spent;
            const progressPct = Math.min(Math.round((v.spent / v.limit) * 100), 100);

            return (
              <div
                key={v.category}
                className="rounded-2xl border border-[#E5DAC4]/90 bg-[#FFFDF8] p-4 shadow-2xs hover:shadow-md hover:border-[#84cc16]/50 transition-all duration-300 relative group overflow-hidden flex flex-col justify-between"
              >
                {/* Top Row: Category Icon + Name + Actions */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#DDD9CF]/70 text-sm shadow-2xs ${meta.bg}`}
                    >
                      {meta.icon}
                    </div>
                    <h3 className="font-serif text-sm font-bold text-[#18122B] truncate">
                      {meta.name}
                    </h3>
                  </div>

                  {/* Actions (Edit / Delete) */}
                  <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleOpenModal(v.category, v.limit)}
                      className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-[#FAF6ED] text-[#18122B]/70 hover:text-[#18122B] transition"
                      title="Edit budget"
                    >
                      ✏️
                    </button>
                    {budgetMap[v.category] && (
                      <button
                        type="button"
                        onClick={() => setDeleteCandidate(v.category)}
                        className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-rose-50 text-rose-500 transition"
                        title="Delete budget"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>

                {/* Middle Content & Floating Owl Mascot Layout */}
                <div className="flex items-end justify-between gap-2">
                  {/* Left Financial Information (Dominant) */}
                  <div className="flex-1 min-w-0 pr-1">
                    {/* Amounts */}
                    <div className="mb-2">
                      <span className="font-mono text-lg sm:text-xl font-black text-[#18122B]">
                        {formatINR(v.spent)}
                      </span>
                      <span className="text-xs font-normal text-[#18122B]/50 ml-1">
                        of {formatINR(v.limit)}
                      </span>
                    </div>

                    {/* Progress Bar with Percentage */}
                    <div className="flex items-center gap-2 my-2">
                      <div className="h-2 flex-1 rounded-full bg-[#E5DAC4]/50 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${owlState.barColor} transition-all duration-500`}
                          style={{ width: `${Math.max(progressPct > 0 ? 4 : 0, progressPct)}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs font-bold text-[#18122B]/70 shrink-0">
                        {owlState.pct}%
                      </span>
                    </div>

                    {/* Status Line */}
                    <div className="flex items-center gap-1.5 pt-1 text-[11px] font-medium truncate">
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${owlState.barColor}`} />
                      <span className={`truncate font-bold ${owlState.statusTextColor}`}>
                        {remaining < 0
                          ? `You're ${formatINR(Math.abs(remaining))} over budget.`
                          : `You have ${formatINR(remaining)} left.`}
                      </span>
                    </div>
                  </div>

                  {/* Right: Transparent Mascot Sticker (No Box, No Card Container) */}
                  <div
                    className="relative w-24 sm:w-28 h-20 sm:h-24 shrink-0 flex items-center justify-center pointer-events-none select-none transition-transform duration-300 transform-gpu group-hover:scale-110"
                    title={`${owlState.label} (${owlState.pct}% spent)`}
                  >
                    <Image
                      src={owlState.owlImage}
                      alt={owlState.ariaLabel}
                      width={160}
                      height={140}
                      className="w-auto h-full object-contain drop-shadow-sm"
                    />
                  </div>
                </div>

                {/* Bottom subtle right arrow indicator */}
                <div className="flex items-center justify-end mt-1 text-[#18122B]/30 group-hover:text-[#18122B]/70 transition-colors">
                  <span className="text-xs">›</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View (Rows) */
        <div className="rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] divide-y divide-[#E5DAC4]/60 overflow-hidden shadow-2xs">
          {filteredVariance.map((v) => {
            const meta = getCategoryMeta(v.category);
            const owlState = getBudgetOwlState(v.spent, v.limit);
            const remaining = v.limit - v.spent;
            const progressPct = Math.min(Math.round((v.spent / v.limit) * 100), 100);

            return (
              <div
                key={v.category}
                className="p-3.5 sm:p-4 hover:bg-[#FAF6ED]/50 transition flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#DDD9CF]/70 text-sm shadow-2xs ${meta.bg}`}
                  >
                    {meta.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif text-sm font-bold text-[#18122B] truncate">
                        {meta.name}
                      </h3>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold ${owlState.pillClass}`}
                      >
                        {owlState.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="h-2 w-32 sm:w-48 rounded-full bg-[#E5DAC4]/50 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${owlState.barColor} transition-all duration-500`}
                          style={{ width: `${Math.max(progressPct > 0 ? 4 : 0, progressPct)}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs font-bold text-[#18122B]/60">
                        {owlState.pct}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right font-mono">
                    <p className="text-xs sm:text-sm font-bold text-[#18122B]">
                      {formatINR(v.spent)}{" "}
                      <span className="text-[#18122B]/50 font-normal">of {formatINR(v.limit)}</span>
                    </p>
                    <p className={`text-[11px] font-medium ${owlState.statusTextColor}`}>
                      {remaining < 0
                        ? `Over by ${formatINR(Math.abs(remaining))}`
                        : `${formatINR(remaining)} remaining`}
                    </p>
                  </div>

                  {/* Transparent Floating Owl */}
                  <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                    <Image
                      src={owlState.owlImage}
                      alt={owlState.ariaLabel}
                      width={90}
                      height={90}
                      className="w-auto h-full object-contain drop-shadow-sm select-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleOpenModal(v.category, v.limit)}
                      className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-[#FAF6ED] text-[#18122B]/70"
                    >
                      ✏️
                    </button>
                    {budgetMap[v.category] && (
                      <button
                        type="button"
                        onClick={() => setDeleteCandidate(v.category)}
                        className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-rose-50 text-rose-500"
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

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          5. THREE ANALYTICAL SUMMARY CARDS MATCHING REFERENCE
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        {/* Card 1: SPENDING INSIGHTS */}
        <div className="rounded-3xl border border-[#E5DAC4] bg-[#FFFDF8] p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-[#E5DAC4]/60 mb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-amber-500 text-sm">💡</span>
                <h3 className="font-serif text-xs sm:text-sm font-bold uppercase tracking-tight text-[#18122B]">
                  SPENDING INSIGHTS
                </h3>
              </div>
              <span className="text-[10px] font-semibold text-[#18122B]/60">This Month ▾</span>
            </div>

            {/* Smart insights list */}
            <div className="space-y-3">
              {summaryMetrics.criticalCategory && (
                <div className="flex items-start gap-2.5 text-xs">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 text-xs">
                    ↑
                  </span>
                  <div>
                    <p className="font-bold text-[#18122B]">
                      {summaryMetrics.criticalCategory.category} is over budget
                    </p>
                    <p className="text-[11px] text-[#18122B]/60 font-medium">
                      You&apos;ve spent {formatINR(summaryMetrics.criticalCategory.spent)} of your{" "}
                      {formatINR(summaryMetrics.criticalCategory.limit)} limit.
                    </p>
                  </div>
                </div>
              )}

              {summaryMetrics.closeCategory && (
                <div className="flex items-start gap-2.5 text-xs">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 text-xs">
                    ⚠️
                  </span>
                  <div>
                    <p className="font-bold text-[#18122B]">
                      {summaryMetrics.closeCategory.category} is getting close
                    </p>
                    <p className="text-[11px] text-[#18122B]/60 font-medium">
                      {Math.round((summaryMetrics.closeCategory.spent / summaryMetrics.closeCategory.limit) * 100)}% of limit utilized.
                    </p>
                  </div>
                </div>
              )}

              {summaryMetrics.healthyCategory && (
                <div className="flex items-start gap-2.5 text-xs">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs">
                    ↓
                  </span>
                  <div>
                    <p className="font-bold text-[#18122B]">
                      {summaryMetrics.healthyCategory.category} is well on track
                    </p>
                    <p className="text-[11px] text-[#18122B]/60 font-medium">
                      Great job! You have {formatINR(summaryMetrics.healthyCategory.limit - summaryMetrics.healthyCategory.spent)} left.
                    </p>
                  </div>
                </div>
              )}

              {/* Feed from backend insights if available */}
              {insights.slice(0, 1).map((ins, idx) => (
                <div key={ins.id || idx} className="flex items-start gap-2.5 text-xs">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs">
                    ✦
                  </span>
                  <div>
                    <p className="font-bold text-[#18122B]">{ins.title}</p>
                    {ins.description && (
                      <p className="text-[11px] text-[#18122B]/60 line-clamp-2">{ins.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: RECENT BUDGET TRANSACTIONS */}
        <div className="rounded-3xl border border-[#E5DAC4] bg-[#FFFDF8] p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-[#E5DAC4]/60 mb-3">
              <h3 className="font-serif text-xs sm:text-sm font-bold uppercase tracking-tight text-[#18122B]">
                RECENT BUDGET TRANSACTIONS
              </h3>
              <Link
                href="/transactions"
                className="text-[10px] font-bold text-[#18122B]/70 hover:text-[#18122B] transition flex items-center gap-0.5"
              >
                <span>View all</span>
                <span>→</span>
              </Link>
            </div>

            {/* List of recent transactions */}
            {transactions.length === 0 ? (
              <p className="text-xs text-[#18122B]/50 font-medium py-6 text-center">
                No recent transactions found.
              </p>
            ) : (
              <div className="space-y-2.5">
                {transactions.slice(0, 4).map((tx) => {
                  const meta = getCategoryMeta(tx.category);
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between gap-2 text-xs py-1"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#DDD9CF]/60 text-xs ${meta.bg}`}
                        >
                          {meta.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[#18122B] truncate text-xs">
                            {tx.description || tx.category}
                          </p>
                          <p className="text-[10px] text-[#18122B]/50 font-medium">
                            {tx.transactionDate
                              ? new Date(tx.transactionDate).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                })
                              : "Recent"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 font-mono">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold ${meta.bg} ${meta.text}`}
                        >
                          {meta.name}
                        </span>
                        <span className="font-bold text-[#18122B] text-xs">
                          - {formatINR(Math.abs(tx.amount))}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Card 3: BUDGET TIPS WITH MASCOT */}
        <div className="rounded-3xl border border-[#E5DAC4] bg-[#FFFDF8] p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-[#E5DAC4]/60 mb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-amber-500 text-xs">✨</span>
                <h3 className="font-serif text-xs sm:text-sm font-bold uppercase tracking-tight text-[#18122B]">
                  BUDGET TIPS
                </h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setTipIndex((prev) => (prev > 0 ? prev - 1 : dynamicTips.length - 1))
                  }
                  className="flex h-5 w-5 items-center justify-center rounded-md hover:bg-[#FAF6ED] text-[#18122B]/60 text-xs"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setTipIndex((prev) => (prev < dynamicTips.length - 1 ? prev + 1 : 0))
                  }
                  className="flex h-5 w-5 items-center justify-center rounded-md hover:bg-[#FAF6ED] text-[#18122B]/60 text-xs"
                >
                  ›
                </button>
              </div>
            </div>

            {/* Tip Header with Mascot */}
            <div className="flex items-center justify-between gap-3 my-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                <span>🏷️</span>
                <span>Tip for you!</span>
              </div>

              {/* Tip Mascot - Transparent */}
              <div className="relative w-14 h-12 shrink-0 flex items-center justify-center">
                <Image
                  src="/owl-budget-happy.png"
                  alt="FinSage Tip Owl"
                  width={80}
                  height={70}
                  className="w-auto h-full object-contain pointer-events-none drop-shadow-sm select-none"
                />
              </div>
            </div>

            {/* Tip Description */}
            <div className="mt-2 text-xs">
              <p className="font-bold text-[#18122B]">{dynamicTips[tipIndex]?.title}</p>
              <p className="text-[11px] text-[#18122B]/70 font-medium mt-1 leading-relaxed">
                {dynamicTips[tipIndex]?.text}
              </p>
            </div>
          </div>

          {/* Carousel Dots */}
          <div className="flex items-center justify-center gap-1.5 pt-4">
            {dynamicTips.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setTipIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  tipIndex === idx ? "w-4 bg-emerald-600" : "w-1.5 bg-[#E5DAC4]"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          MODALS: SET/EDIT & DELETE
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}

      {/* Set / Edit Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-5 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-[#E5DAC4]/60 pb-3">
              <div>
                <h3 className="font-serif text-base font-bold text-[#18122B]">
                  Set Category Budget
                </h3>
                <p className="text-[11px] text-[#18122B]/60 font-medium">
                  Give this category a designated monthly spending ceiling.
                </p>
              </div>
              <button
                type="button"
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
                  className="w-full rounded-xl border border-[#DDD9CF] bg-white px-3 py-2 text-xs font-semibold text-[#18122B] focus:border-[#18122B] focus:outline-none cursor-pointer"
                >
                  <option value="Food & Dining">🍜 Food & Dining</option>
                  <option value="Groceries">🛒 Groceries</option>
                  <option value="Shopping">🛍️ Shopping</option>
                  <option value="Housing">🏠 Housing</option>
                  <option value="Transportation">🚗 Transportation</option>
                  <option value="Utilities">⚡ Utilities</option>
                  <option value="Entertainment">🎮 Entertainment</option>
                  <option value="Travel">✈️ Travel</option>
                  <option value="Healthcare">💊 Healthcare</option>
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
                    onChange={(e) => setModalForm({ ...modalForm, monthlyLimit: e.target.value })}
                    className="w-full rounded-xl border border-[#DDD9CF] bg-white py-2 pl-7 pr-3 text-xs font-mono font-bold text-[#18122B] placeholder:text-[#18122B]/40 focus:border-[#18122B] focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-2 border-t border-[#E5DAC4]/60">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-[#DDD9CF] bg-white px-3.5 py-2 text-xs font-bold text-[#18122B]/80 hover:bg-[#FAF6ED]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !modalForm.monthlyLimit}
                  className="rounded-xl bg-[#18122B] px-4 py-2 text-xs font-bold text-white shadow hover:bg-[#18122B]/90 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Set Budget Limit →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-5 shadow-2xl text-center">
            <span className="text-2xl mb-2 block">🗑️</span>
            <h3 className="font-serif text-base font-bold text-[#18122B]">
              Remove budget for {deleteCandidate}?
            </h3>
            <p className="mt-1 text-xs text-[#18122B]/70 font-medium">
              This will remove the monthly spending ceiling for this category. Your historical transactions will remain completely intact.
            </p>

            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="rounded-xl border border-[#DDD9CF] bg-white px-4 py-2 text-xs font-bold text-[#18122B]/80 hover:bg-[#FAF6ED]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-rose-700 disabled:opacity-50"
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
