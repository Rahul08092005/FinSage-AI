"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { deleteBudget, getBudgets, getBudgetVariance, upsertBudget, getInsights, type InsightItem } from "@/lib/api";
import { formatINR } from "@/lib/formatCurrency";

interface VarianceItem {
  category: string;
  limit: number;
  spent: number;
  remaining: number;
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
  Entertainment: {
    icon: "🎬",
    name: "Entertainment",
    bg: "bg-[#F5F3FF]",
    border: "border-[#DDD6FE]",
    text: "text-[#6D28D9]",
    color: "#8B5CF6",
  },
  Travel: {
    icon: "✈️",
    name: "Travel",
    bg: "bg-[#F0F9FF]",
    border: "border-[#BAE6FD]",
    text: "text-[#0369A1]",
    color: "#0284C7",
  },
  Transport: {
    icon: "🚕",
    name: "Transport",
    bg: "bg-[#F0F9FF]",
    border: "border-[#BAE6FD]",
    text: "text-[#0369A1]",
    color: "#0284C7",
  },
  Healthcare: {
    icon: "💊",
    name: "Healthcare",
    bg: "bg-[#FFF1F2]",
    border: "border-[#FECDD3]",
    text: "text-[#BE123C]",
    color: "#F43F5E",
  },
  Rent: {
    icon: "🏠",
    name: "Rent",
    bg: "bg-[#F7FEE7]",
    border: "border-[#D9F99D]",
    text: "text-[#3f6212]",
    color: "#84cc16",
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
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [sortBy, setSortBy] = useState<"progress" | "limit" | "spent" | "name">("progress");

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
      const [varData, rawBudgets, insData] = await Promise.allSettled([
        getBudgetVariance(token),
        getBudgets(token),
        getInsights(token),
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
    let nearLimitCount = 0;
    let overBudgetCount = 0;

    variance.forEach((v) => {
      const pct = v.limit > 0 ? (v.spent / v.limit) * 100 : 0;
      if (pct > 100) {
        overBudgetCount++;
      } else if (pct >= 80) {
        nearLimitCount++;
      } else {
        onTrackCount++;
      }
    });

    const criticalCategory = [...variance].find((v) => v.spent > v.limit) || null;
    const healthyCategory = [...variance].find((v) => v.limit > 0 && v.spent / v.limit < 0.5) || null;

    return {
      totalCount,
      totalLimit,
      totalSpent,
      remaining,
      overallPct,
      onTrackCount,
      nearLimitCount,
      overBudgetCount,
      criticalCategory,
      healthyCategory,
    };
  }, [variance]);

  // Derived Status for individual category tiles
  function getTileStatus(spent: number, limit: number) {
    const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;

    if (pct > 100) {
      return {
        pct,
        label: "Over Budget",
        pillClass: "border-rose-300 bg-rose-50 text-rose-700",
        barColor: "bg-rose-500",
        sticker: "⚠️",
        isOver: true,
      };
    }
    if (pct >= 80) {
      return {
        pct,
        label: "Near Limit",
        pillClass: "border-amber-300 bg-amber-50 text-amber-800",
        barColor: "bg-amber-500",
        sticker: "👀",
        isOver: false,
      };
    }
    return {
      pct,
      label: "On Track",
      pillClass: "border-emerald-300 bg-emerald-50 text-emerald-800",
      barColor: "bg-[#84cc16]",
      sticker: "✨",
      isOver: false,
    };
  }

  // Sorted Budget Tiles
  const sortedVariance = useMemo(() => {
    const list = [...variance];
    list.sort((a, b) => {
      const pctA = a.limit > 0 ? a.spent / a.limit : 0;
      const pctB = b.limit > 0 ? b.spent / b.limit : 0;

      if (sortBy === "progress") return pctB - pctA;
      if (sortBy === "limit") return b.limit - a.limit;
      if (sortBy === "spent") return b.spent - a.spent;
      if (sortBy === "name") return a.category.localeCompare(b.category);
      return 0;
    });
    return list;
  }, [variance, sortBy]);

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
          1. COMPACT BUDGETS HERO
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="relative pt-3 sm:pt-4 pb-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-100/70 px-2.5 py-0.5 text-[11px] font-bold text-emerald-900 mb-1.5">
              <span>🏷️</span>
              <span className="tracking-wide uppercase">BUDGETS</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#18122B]">
              Give every rupee a job. <span className="text-amber-500">✦</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#18122B]/60 font-medium mt-0.5">
              Set monthly category limits, dodge leaks, and fund your milestones.
            </p>
          </div>

          {/* Hero Right: Owl Mascot + Doodles + Action */}
          <div className="flex items-center gap-3 sm:gap-6 self-start md:self-center">
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="font-serif text-xs sm:text-sm font-bold italic text-[#18122B]/75">
                smart plans, better money
              </span>
              <span className="font-serif text-[11px] sm:text-xs text-[#18122B]/55 italic">
                same you, zero leaks 💖
              </span>
            </div>

            {/* Owl Mascot holding Roadmap/Map */}
            <div className="relative w-28 sm:w-36 lg:w-40 h-24 sm:h-28 lg:h-32 shrink-0 flex items-center justify-center">
              <Image
                src="/owl-budgets-map.png"
                alt="FinSage Owl Budget Roadmap Mascot"
                width={180}
                height={150}
                priority
                className="w-auto h-full object-contain pointer-events-none drop-shadow-sm select-none"
              />
            </div>

            <button
              type="button"
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#18122B] px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#18122B]/90 transition cursor-pointer"
            >
              <span>+ New Budget</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          2. FOUR SUMMARY CARDS
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-2 mb-4">
        {/* Card 1: TOTAL BUDGETS */}
        <div className="rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs">
                🎯
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#18122B]/60">
                TOTAL BUDGETS
              </span>
            </div>
            <span className="text-xs text-[#18122B]/40">›</span>
          </div>
          <div className="mt-2">
            <p className="font-mono text-lg sm:text-2xl font-black text-[#18122B]">
              {summaryMetrics.totalCount}
            </p>
            <div className="flex items-center gap-2 mt-1 text-[11px] font-medium text-[#18122B]/60">
              <span className="text-emerald-700 font-bold">{summaryMetrics.onTrackCount} on track</span>
              {summaryMetrics.overBudgetCount > 0 ? (
                <>
                  <span>•</span>
                  <span className="text-rose-600 font-bold">{summaryMetrics.overBudgetCount} over</span>
                </>
              ) : summaryMetrics.nearLimitCount > 0 ? (
                <>
                  <span>•</span>
                  <span className="text-amber-700 font-bold">{summaryMetrics.nearLimitCount} watch</span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Card 2: TOTAL ALLOCATED */}
        <div className="rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs">
                💰
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#18122B]/60">
                TOTAL ALLOCATED
              </span>
            </div>
            <span className="text-xs text-[#18122B]/40">›</span>
          </div>
          <div className="mt-2">
            <p className="font-mono text-lg sm:text-2xl font-black text-[#18122B]">
              {formatINR(summaryMetrics.totalLimit)}
            </p>
            <p className="text-[11px] font-medium text-[#18122B]/50 mt-1">
              Monthly budget ceiling
            </p>
          </div>
        </div>

        {/* Card 3: TOTAL SPENT */}
        <div className="rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-sky-700 text-xs">
                💳
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#18122B]/60">
                TOTAL SPENT
              </span>
            </div>
            <span className="text-xs text-[#18122B]/40">›</span>
          </div>
          <div className="mt-2">
            <p className="font-mono text-lg sm:text-2xl font-black text-[#18122B]">
              {formatINR(summaryMetrics.totalSpent)}
            </p>
            <p className="text-[11px] font-bold text-emerald-700 mt-1">
              {summaryMetrics.overallPct}% of allocated budget
            </p>
          </div>
        </div>

        {/* Card 4: REMAINING BUDGET */}
        <div className="rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-800 text-xs">
                ⏳
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#18122B]/60">
                REMAINING TO SPEND
              </span>
            </div>
            <span className="text-xs text-[#18122B]/40">›</span>
          </div>
          <div className="mt-2">
            <p
              className={`font-mono text-lg sm:text-2xl font-black ${
                summaryMetrics.remaining < 0 ? "text-rose-600" : "text-[#18122B]"
              }`}
            >
              {formatINR(Math.abs(summaryMetrics.remaining))}
            </p>
            <p className="text-[11px] font-medium text-[#18122B]/50 mt-1">
              {summaryMetrics.remaining < 0 ? "Exceeded monthly limit" : "Safe headroom left"}
            </p>
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          3. TWO-COLUMN MAIN CONTENT
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT COLUMN: YOUR BUDGETS (Approx 62% width -> 7/12 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5DAC4]/60 mb-3">
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-sm sm:text-base font-bold uppercase tracking-tight text-[#18122B]">
                YOUR BUDGETS
              </h2>
              <span className="rounded-full bg-[#18122B]/10 px-2 py-0.5 text-[10px] font-bold text-[#18122B]">
                {variance.length} categories
              </span>
            </div>

            {/* Sort Control */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#18122B]/50 font-bold uppercase hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-lg border border-[#DDD9CF] bg-white px-2 py-1 text-[11px] font-bold text-[#18122B]/80 focus:outline-none cursor-pointer"
              >
                <option value="progress">Utilization ▾</option>
                <option value="limit">Limit Amount</option>
                <option value="spent">Total Spent</option>
                <option value="name">Category Name</option>
              </select>
            </div>
          </div>

          {/* Budget Cards List */}
          {loading ? (
            <div className="py-12 text-center text-xs font-bold text-[#18122B]/50 animate-pulse">
              Loading category budgets...
            </div>
          ) : variance.length === 0 ? (
            <div className="py-12 text-center p-6 flex flex-col items-center">
              <span className="text-3xl mb-2">✨</span>
              <h3 className="font-serif text-base font-bold text-[#18122B]">
                Your budget book is blank.
              </h3>
              <p className="text-xs text-[#18122B]/60 font-medium max-w-sm mt-1 mb-4">
                Let&apos;s give your rupees a plan. Set monthly spending limits to prevent budget leaks.
              </p>
              <button
                type="button"
                onClick={() => handleOpenModal()}
                className="rounded-xl bg-[#18122B] text-white px-4 py-2 text-xs font-bold hover:bg-[#18122B]/90 transition shadow-sm cursor-pointer"
              >
                + Create your first budget →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedVariance.map((v) => {
                const meta = getCategoryMeta(v.category);
                const status = getTileStatus(v.spent, v.limit);
                const remaining = v.limit - v.spent;
                const progressPct = Math.min(Math.round((v.spent / v.limit) * 100), 100);

                return (
                  <div
                    key={v.category}
                    className="rounded-xl border border-[#E5DAC4]/80 bg-[#FAF6ED]/40 p-3 sm:p-3.5 hover:bg-[#FAF6ED]/90 hover:border-[#84cc16]/50 transition-all shadow-2xs group relative"
                  >
                    {/* Top Row: Icon + Category Name + Status Pill + Action Buttons */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#DDD9CF]/70 text-sm shadow-2xs ${meta.bg}`}
                        >
                          {meta.icon}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-serif text-xs sm:text-sm font-bold text-[#18122B] truncate">
                            {meta.name}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Status Pill */}
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${status.pillClass}`}
                        >
                          <span>{status.sticker}</span>
                          <span>{status.label}</span>
                        </span>

                        {/* Edit & Delete Action Buttons */}
                        <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleOpenModal(v.category, v.limit)}
                            className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-white text-[#18122B]/60 hover:text-[#18122B] transition"
                            title="Edit budget limit"
                          >
                            ✏️
                          </button>
                          {budgetMap[v.category] && (
                            <button
                              type="button"
                              onClick={() => setDeleteCandidate(v.category)}
                              className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-rose-50 text-rose-500 transition"
                              title="Delete budget limit"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle Progress Bar */}
                    <div className="my-2">
                      <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                        <span className="font-bold text-[#18122B]">
                          {formatINR(v.spent)} <span className="text-[#18122B]/50 font-normal">spent</span>
                        </span>
                        <span className="text-[#18122B]/50">
                          of {formatINR(v.limit)} limit ({status.pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[#E5DAC4]/50 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${status.barColor} transition-all duration-500`}
                          style={{ width: `${Math.max(progressPct > 0 ? 3 : 0, progressPct)}%` }}
                        />
                      </div>
                    </div>

                    {/* Bottom Row: Remaining Metadata */}
                    <div className="flex items-center justify-between pt-1.5 text-[10px] sm:text-[11px] font-medium text-[#18122B]/60">
                      <span>
                        {remaining < 0 ? (
                          <span className="text-rose-600 font-bold">
                            ⚠️ {formatINR(Math.abs(remaining))} over monthly ceiling
                          </span>
                        ) : (
                          <span className="text-emerald-800 font-bold">
                            ✓ {formatINR(remaining)} remaining this month
                          </span>
                        )}
                      </span>

                      <span className="font-mono text-[#18122B]/40">
                        {status.pct > 100 ? "100%+" : `${100 - status.pct}% headroom`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: 3 ANALYTICAL CARDS (Approx 38% width -> 5/12 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* 1. Smart Budget Insight */}
          <div className="rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-3.5 sm:p-4 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5DAC4]/60 mb-2.5">
              <div className="flex items-center gap-1.5">
                <span className="text-amber-500 text-xs">💡</span>
                <h3 className="font-serif text-xs sm:text-sm font-bold uppercase tracking-tight text-[#18122B]">
                  SMART SUGGESTION
                </h3>
              </div>
              <span className="text-[10px] font-serif italic text-emerald-800 font-bold">
                proactive AI ✦
              </span>
            </div>

            {/* Smart dynamic insight based on real data */}
            {summaryMetrics.criticalCategory ? (
              <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200 text-xs space-y-1">
                <p className="font-bold text-rose-800 flex items-center gap-1">
                  <span>⚠️</span> {summaryMetrics.criticalCategory.category} is over budget
                </p>
                <p className="text-[11px] text-[#18122B]/70 font-medium">
                  You have spent {formatINR(summaryMetrics.criticalCategory.spent)} of your{" "}
                  {formatINR(summaryMetrics.criticalCategory.limit)} limit. Consider dialing back discretionary buys in this category.
                </p>
              </div>
            ) : summaryMetrics.healthyCategory ? (
              <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-1">
                <p className="font-bold text-emerald-900 flex items-center gap-1">
                  <span>✨</span> {summaryMetrics.healthyCategory.category} is well under control
                </p>
                <p className="text-[11px] text-[#18122B]/70 font-medium">
                  You have used only {Math.round((summaryMetrics.healthyCategory.spent / summaryMetrics.healthyCategory.limit) * 100)}% of your limit, leaving {formatINR(summaryMetrics.healthyCategory.limit - summaryMetrics.healthyCategory.spent)} in safe savings headroom!
                </p>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-[#FAF6ED]/70 border border-[#E5DAC4]/60 text-xs space-y-1">
                <p className="font-bold text-[#18122B]">
                  Give every rupee a designated ceiling
                </p>
                <p className="text-[11px] text-[#18122B]/70 font-medium">
                  Setting specific category budgets prevents subconscious overspending and accelerates your savings journey.
                </p>
              </div>
            )}

            {/* Real AI Engine Insights if present */}
            {insights.length > 0 && (
              <div className="mt-2.5 pt-2 border-t border-[#E5DAC4]/40 space-y-1.5">
                <p className="text-[10px] font-bold text-[#18122B]/50 uppercase tracking-wide">
                  Intelligence Feed:
                </p>
                {insights.slice(0, 1).map((ins, idx) => (
                  <div key={ins.id || idx} className="text-xs text-[#18122B]/80 font-medium">
                    <p className="font-bold text-[#18122B] text-[11px]">{ins.title}</p>
                    {ins.description && (
                      <p className="text-[10px] text-[#18122B]/60 truncate">{ins.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Allocation Share by Category */}
          <div className="rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-3.5 sm:p-4 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5DAC4]/60 mb-2.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">📊</span>
                <h3 className="font-serif text-xs sm:text-sm font-bold uppercase tracking-tight text-[#18122B]">
                  ALLOCATION BREAKDOWN
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#18122B]/50">Monthly Limits</span>
            </div>

            {variance.length === 0 ? (
              <p className="text-xs text-[#18122B]/50 font-medium py-3 text-center">
                No budget allocations defined yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {variance.slice(0, 5).map((v) => {
                  const meta = getCategoryMeta(v.category);
                  const sharePct = summaryMetrics.totalLimit > 0 ? Math.round((v.limit / summaryMetrics.totalLimit) * 100) : 0;

                  return (
                    <div key={v.category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs">{meta.icon}</span>
                          <span className="font-bold text-[#18122B] truncate text-xs">{meta.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-xs">
                          <span className="font-bold text-[#18122B]">{formatINR(v.limit)}</span>
                          <span className="text-[#18122B]/50 text-[10px] w-7 text-right">{sharePct}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[#E5DAC4]/40 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#18122B] transition-all duration-300"
                          style={{ width: `${Math.max(4, sharePct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Quick Action Banner */}
          <div className="rounded-2xl border border-[#E5DAC4] bg-[#FAF6ED] p-3.5 sm:p-4 text-center space-y-2">
            <h4 className="font-serif text-xs sm:text-sm font-bold text-[#18122B]">
              Need to add or adjust a limit?
            </h4>
            <p className="text-[11px] text-[#18122B]/60 font-medium">
              Update monthly ceilings at any time as your spending patterns evolve.
            </p>
            <button
              type="button"
              onClick={() => handleOpenModal()}
              className="w-full rounded-xl bg-[#18122B] text-white py-2 text-xs font-bold hover:bg-[#18122B]/90 transition shadow-sm cursor-pointer"
            >
              + Add / Adjust Category Budget
            </button>
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
