"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { formatINR } from "@/lib/formatCurrency";
import {
  getMe,
  getExpenseSummary,
  getSpendingTrend,
  getInsights,
  generateInsights,
  getMissions,
  getProgress,
  getGoals,
  getTransactions,
  type TrendItem,
  type InsightItem,
  type Mission,
  type UserProgress,
} from "@/lib/api";

interface CompactDashboardProps {
  token: string;
}

// Map category names to icons and background badge colors
function getCategoryMeta(name: string) {
  const lower = (name || "").toLowerCase();
  if (lower.includes("entertain") || lower.includes("game") || lower.includes("movie") || lower.includes("fun")) {
    return { icon: "🎮", bg: "bg-pink-100 text-pink-700 border-pink-200", color: "#ec4899" };
  }
  if (lower.includes("food") || lower.includes("dining") || lower.includes("rest") || lower.includes("cafe")) {
    return { icon: "🍴", bg: "bg-amber-100 text-amber-800 border-amber-200", color: "#eab308" };
  }
  if (lower.includes("shop") || lower.includes("cloth") || lower.includes("amazon") || lower.includes("store")) {
    return { icon: "🛍️", bg: "bg-rose-100 text-rose-700 border-rose-200", color: "#f97316" };
  }
  if (lower.includes("trans") || lower.includes("uber") || lower.includes("ola") || lower.includes("travel") || lower.includes("fuel")) {
    return { icon: "🚗", bg: "bg-sky-100 text-sky-700 border-sky-200", color: "#3b82f6" };
  }
  if (lower.includes("util") || lower.includes("bill") || lower.includes("recharge") || lower.includes("electr")) {
    return { icon: "⚡", bg: "bg-violet-100 text-violet-700 border-violet-200", color: "#8b5cf6" };
  }
  return { icon: "•••", bg: "bg-stone-100 text-stone-700 border-stone-200", color: "#6b7280" };
}

export function CompactDashboard({ token }: CompactDashboardProps) {
  const [loading, setLoading] = useState(true);

  // Core Data
  const [userName, setUserName] = useState<string>("Demo User");
  const [salary, setSalary] = useState<number>(200000);
  const [spend, setSpend] = useState<number>(0);
  const [categories, setCategories] = useState<Array<{ category: string; total: number; count: number }>>([]);
  const [trend, setTrend] = useState<TrendItem[]>([]);
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [refreshingInsights, setRefreshingInsights] = useState(false);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showBalance, setShowBalance] = useState(true);

  // What-If interactive slider states
  const [salaryChangePct, setSalaryChangePct] = useState<number>(10); // +10% default
  const [expenseChangePct, setExpenseChangePct] = useState<number>(-20); // -20% default
  const [savingsDelta, setSavingsDelta] = useState<number>(5000); // +5000 default

  // Load all dashboard data
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
      const currentMonthStr = `${currentYear}-${currentMonth}`;

      const [
        meRes,
        summaryRes,
        trendRes,
        insightsRes,
        missionsRes,
        progressRes,
        goalsRes,
        txRes,
      ] = await Promise.allSettled([
        getMe(token),
        getExpenseSummary(token, currentMonthStr),
        getSpendingTrend(token),
        getInsights(token),
        getMissions(token),
        getProgress(token),
        getGoals(token),
        getTransactions(token, 10),
      ]);

      if (meRes.status === "fulfilled" && meRes.value) {
        if (meRes.value.name) setUserName(meRes.value.name);
        if (meRes.value.monthlySalary != null) setSalary(Number(meRes.value.monthlySalary));
      }

      if (summaryRes.status === "fulfilled" && summaryRes.value) {
        setSpend(Number(summaryRes.value.total) || 0);
        setCategories(summaryRes.value.byCategory || []);
      }

      if (trendRes.status === "fulfilled" && trendRes.value) {
        setTrend(trendRes.value);
      }

      if (insightsRes.status === "fulfilled" && Array.isArray(insightsRes.value)) {
        setInsights(insightsRes.value);
      }

      if (missionsRes.status === "fulfilled" && Array.isArray(missionsRes.value)) {
        setMissions(missionsRes.value);
      }

      if (progressRes.status === "fulfilled" && progressRes.value) {
        setProgress(progressRes.value);
      }

      if (goalsRes.status === "fulfilled" && Array.isArray(goalsRes.value)) {
        setGoals(goalsRes.value);
      }

      if (txRes.status === "fulfilled" && Array.isArray(txRes.value)) {
        setTransactions(txRes.value);
      }
    } catch (e) {
      console.error("[CompactDashboard] Error loading data:", e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle manual insights refresh
  async function handleRefreshInsights() {
    setRefreshingInsights(true);
    try {
      const fresh = await generateInsights(token);
      if (Array.isArray(fresh)) {
        setInsights(fresh);
      }
    } catch (e) {
      console.warn("[CompactDashboard] Insight refresh failed, loading existing:", e);
      try {
        const existing = await getInsights(token);
        if (Array.isArray(existing)) setInsights(existing);
      } catch {}
    } finally {
      setRefreshingInsights(false);
    }
  }

  // Dynamic greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning! ✦";
    if (hour < 17) return "Good afternoon! ✦";
    return "Good evening! ✦";
  }, []);

  // Financial calculations
  const moneyIn = salary > 0 ? salary : 200000;
  const moneyOut = spend;
  const available = Math.max(0, moneyIn - moneyOut);
  const savingsRate = moneyIn > 0 ? Math.round(((moneyIn - moneyOut) / moneyIn) * 100) : 0;

  // Month-over-Month calculation from trend
  const { momExpenseDiff, currentMonthName } = useMemo(() => {
    const now = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currMonthName = monthNames[now.getMonth()];

    if (trend.length >= 2) {
      const curr = Number(trend[trend.length - 1]?.total) || 0;
      const prev = Number(trend[trend.length - 2]?.total) || 0;
      if (prev > 0) {
        const diff = Math.round(((curr - prev) / prev) * 100);
        return {
          momExpenseDiff: `${diff >= 0 ? "+" : ""}${diff}%`,
          currentMonthName: currMonthName,
        };
      }
    }
    return { momExpenseDiff: "-100%", currentMonthName: currMonthName };
  }, [trend]);

  // Categories processing for Spending Overview
  const displayCategories = useMemo(() => {
    if (categories.length > 0) {
      const sorted = [...categories].sort((a, b) => Number(b.total) - Number(a.total));
      const totalAll = sorted.reduce((acc, c) => acc + Number(c.total), 0) || 1;
      return sorted.slice(0, 5).map((c) => ({
        name: c.category,
        total: Number(c.total),
        pct: Math.round((Number(c.total) / totalAll) * 100),
        meta: getCategoryMeta(c.category),
      }));
    }
    // Fallback display if zero categories recorded yet
    return [
      { name: "Entertainment", total: 0, pct: 0, meta: getCategoryMeta("Entertainment") },
      { name: "Food", total: 0, pct: 0, meta: getCategoryMeta("Food") },
      { name: "Shopping", total: 0, pct: 0, meta: getCategoryMeta("Shopping") },
      { name: "Transport", total: 0, pct: 0, meta: getCategoryMeta("Transport") },
      { name: "Others", total: 0, pct: 0, meta: getCategoryMeta("Others") },
    ];
  }, [categories]);

  // 3-Month Trend Dynamics for Spending Rhythm
  const threeMonthTrend = useMemo(() => {
    const monthShorts = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const currM = now.getMonth();

    // Default 3 months ending with current month
    const defaultMonths = [
      { month: monthShorts[(currM - 2 + 12) % 12], total: 0 },
      { month: monthShorts[(currM - 1 + 12) % 12], total: 0 },
      { month: monthShorts[currM], total: moneyOut },
    ];

    if (trend.length >= 3) {
      return trend.slice(-3).map((t) => {
        const parts = t.month.split("-");
        const mIdx = parts.length === 2 ? parseInt(parts[1], 10) - 1 : currM;
        return {
          month: monthShorts[mIdx] || t.month,
          total: Number(t.total) || 0,
        };
      });
    }

    if (trend.length > 0) {
      const mapped = trend.map((t) => {
        const parts = t.month.split("-");
        const mIdx = parts.length === 2 ? parseInt(parts[1], 10) - 1 : currM;
        return {
          month: monthShorts[mIdx] || t.month,
          total: Number(t.total) || 0,
        };
      });
      return [...defaultMonths.slice(0, 3 - mapped.length), ...mapped];
    }

    return defaultMonths;
  }, [trend, moneyOut]);

  const maxTrendVal = Math.max(...threeMonthTrend.map((t) => t.total), 1000);

  // Active missions
  const activeMissions = useMemo(() => {
    if (missions.length > 0) {
      return missions.filter((m) => m.status === "active").slice(0, 2);
    }
    // Default fallback missions
    return [
      { id: "m1", title: "Track food spending pace", progress: 7, target: 10, xpReward: 50, status: "active" as const },
      { id: "m2", title: "Stay within shopping allocation", progress: 3, target: 5, xpReward: 75, status: "active" as const },
    ];
  }, [missions]);

  // Active insights
  const displayInsights = useMemo(() => {
    if (insights.length > 0) {
      return insights.slice(0, 2);
    }
    return [
      {
        id: "i1",
        title: "General spending is down",
        description: "100% vs last month",
        type: "favorable" as const,
        category: "General",
      },
      {
        id: "i2",
        title: "Groceries spending is down",
        description: "100% vs last month",
        type: "favorable" as const,
        category: "Groceries",
      },
    ];
  }, [insights]);

  // Recent transactions
  const displayTransactions = useMemo(() => {
    if (transactions.length > 0) {
      return transactions.slice(0, 4);
    }
    return [
      { id: "t1", category: "Entertainment", description: "Entertainment", amount: 1060, transactionDate: "2026-10-03" },
      { id: "t2", category: "Food", description: "Zomato", amount: 0, transactionDate: "2026-09-28" },
      { id: "t3", category: "Shopping", description: "Amazon", amount: 0, transactionDate: "2026-09-25" },
      { id: "t4", category: "Transport", description: "Uber", amount: 0, transactionDate: "2026-09-20" },
    ];
  }, [transactions]);

  // Display goals
  const displayGoals = useMemo(() => {
    if (goals.length > 0) {
      return goals.slice(0, 2).map((g) => {
        const target = Number(g.targetAmount) || 100000;
        const current = Number(g.currentAmount ?? (target * 0.5));
        const pct = Math.min(100, Math.round((current / target) * 100));
        return {
          id: g.id,
          title: g.title || "Goal",
          target,
          current,
          pct,
          icon: g.title?.toLowerCase().includes("trip") || g.title?.toLowerCase().includes("travel") ? "✈️" : "💰",
          iconBg: g.title?.toLowerCase().includes("trip") ? "bg-sky-100 text-sky-700" : "bg-amber-100 text-amber-800",
          monthsLeft: g.monthsLeft ?? 12,
        };
      });
    }
    return [
      {
        id: "g1",
        title: "Emergency Fund",
        target: 100000,
        current: 50000,
        pct: 50,
        icon: "💰",
        iconBg: "bg-amber-100 text-amber-800",
        monthsLeft: 12,
      },
      {
        id: "g2",
        title: "Europe Trip",
        target: 200000,
        current: 120000,
        pct: 60,
        icon: "✈️",
        iconBg: "bg-sky-100 text-sky-700",
        monthsLeft: 18,
      },
    ];
  }, [goals]);

  return (
    <div className="flex flex-col gap-3.5 sm:gap-4 max-w-[1440px] mx-auto w-full">
      {/* ========================================================================= */}
      {/* 1. EDITORIAL GREETING (BOXLESS & COMPACT)                                  */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pt-1 pb-0.5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-[34px] font-black tracking-tight text-[#18122B] leading-tight">
              {greeting}
            </h1>
            <span className="inline-flex items-center gap-1 -rotate-2 rounded-full border border-pink-200 bg-pink-50/90 px-2.5 py-0.5 text-[11px] font-bold text-pink-700 shadow-3xs ml-1">
              <span>same you, better money</span>
              <span>💕</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-[#18122B]/70 mt-0.5">
            Your money is doing things. Let&apos;s make them count.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. THREE FINANCIAL SUMMARY CARDS (ROW 1) + PERCHED FINSAGE OWL             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-3.5 pt-2 sm:pt-3">
        {/* Card 1: Available Balance */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-4 shadow-2xs hover:border-[#84cc16]/70 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#84cc16]" />
              <span className="text-xs font-black uppercase tracking-wider text-[#3f6212]">
                Available Balance
              </span>
            </div>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="text-[#18122B]/50 hover:text-[#18122B] transition text-sm"
              title="Toggle balance visibility"
            >
              {showBalance ? "👁" : "🙈"}
            </button>
          </div>

          <div className="my-2">
            <p className="font-serif text-3xl sm:text-[34px] font-black tracking-tight text-[#18122B] tabular-nums">
              {showBalance ? formatINR(available) : "••••••"}
            </p>
            <p className="text-[11px] font-medium text-[#18122B]/60 mt-0.5">
              Net free cash
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <span className="rounded-full bg-[#84cc16]/20 border border-[#84cc16]/40 px-2 py-0.5 text-[10px] font-bold text-[#3f6212]">
              {savingsRate}% Retained
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E5DAC4]/60">
              <div
                className="h-full bg-[#84cc16] transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, savingsRate))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Money In */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-4 shadow-2xs hover:border-teal-400/70 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-teal-700 flex items-center gap-1">
              <span>↗</span> Money In
            </span>
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-teal-50 text-teal-700 text-xs">
              📊
            </span>
          </div>

          <div className="my-2">
            <p className="font-serif text-3xl sm:text-[34px] font-black tracking-tight text-[#18122B] tabular-nums">
              {formatINR(moneyIn)}
            </p>
            <p className="text-[11px] font-medium text-[#18122B]/60 mt-0.5">
              Monthly Salary Flow
            </p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-[#18122B]/50 font-medium">vs last month</span>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              +12%
            </span>
          </div>
        </div>

        {/* Card 3: Money Out with Perched FinSage Owl Mascot */}
        <div className="relative overflow-visible flex flex-col justify-between rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-4 shadow-2xs hover:border-orange-400/70 transition-all">
          {/* FinSage Owl Mascot Perched Above Money Out */}
          <div className="absolute -top-20 sm:-top-24 lg:-top-28 right-0 sm:right-2 z-20 pointer-events-none select-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/finsage-owl.png"
              alt="FinSage Owl Mascot"
              className="h-24 sm:h-28 lg:h-32 w-auto object-contain drop-shadow-sm transition-transform hover:scale-105"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-[#c2410c] flex items-center gap-1">
              <span>↘</span> Money Out
            </span>
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-orange-50 text-[#c2410c] text-xs">
              📉
            </span>
          </div>

          <div className="my-2">
            <p className="font-serif text-3xl sm:text-[34px] font-black tracking-tight text-[#18122B] tabular-nums">
              {formatINR(moneyOut)}
            </p>
            <p className="text-[11px] font-medium text-[#18122B]/60 mt-0.5">
              {currentMonthName} Debits
            </p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-[#18122B]/50 font-medium">vs last month</span>
            <span className="rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-700">
              {momExpenseDiff}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. THREE-COLUMN ANALYTICS ROW (ROW 2)                                      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-3.5">
        {/* Col 1: Spending Overview */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-4 shadow-2xs">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs">
                  🧭
                </span>
                <h2 className="font-serif text-sm sm:text-base font-bold text-[#18122B]">
                  Spending Overview
                </h2>
              </div>
              <Link
                href="/transactions"
                className="text-[11px] font-bold text-[#18122B]/70 hover:text-[#18122B] transition"
              >
                View all &rarr;
              </Link>
            </div>
            <p className="text-[11px] text-[#18122B]/55 font-medium mt-0.5">
              Where your money actually went
            </p>

            <div className="mt-3.5 space-y-2.5">
              {displayCategories.map((cat, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${cat.meta.bg}`}>
                        {cat.meta.icon}
                      </span>
                      <span className="font-semibold text-[#18122B] text-[11px]">
                        {cat.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="font-bold text-[#18122B]">{formatINR(cat.total)}</span>
                      <span className="text-[#18122B]/50 text-[10px] w-7 text-right">{cat.pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[#E5DAC4]/40 overflow-hidden">
                    <div
                      className="h-full bg-[#18122B] rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(cat.pct > 0 ? 4 : 0, cat.pct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Col 2: Spending Rhythm */}
        <div className="relative flex flex-col justify-between rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-4 shadow-2xs">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-[#c2410c] text-xs">
                  ⬇
                </span>
                <h2 className="font-serif text-sm sm:text-base font-bold text-[#18122B]">
                  Spending Rhythm
                </h2>
              </div>
              <span className="rounded-lg border border-[#DDD9CF] bg-white px-2 py-0.5 text-[10px] font-bold text-[#18122B]/70">
                Quarterly ▾
              </span>
            </div>
            <p className="text-[11px] text-[#18122B]/55 font-medium mt-0.5">
              Last 3 months dynamics
            </p>

            {/* Doodle Sticker */}
            <div className="absolute right-4 top-16 hidden sm:flex flex-col items-end pointer-events-none">
              <span className="font-serif text-[11px] italic font-bold text-[#18122B]/80 -rotate-6">
                trending down, nice! ↙
              </span>
            </div>

            {/* Vertical 3-Month Bar Chart */}
            <div className="mt-6 flex items-end justify-center gap-8 h-40 pb-2">
              {threeMonthTrend.map((t, idx) => {
                const heightPct = maxTrendVal > 0 ? Math.max(12, Math.round((t.total / maxTrendVal) * 100)) : 15;
                const isCurrent = idx === threeMonthTrend.length - 1;
                return (
                  <div key={idx} className="flex flex-col items-center gap-1.5 flex-1 max-w-[60px]">
                    <span className="font-mono text-[10px] font-bold text-[#18122B] text-center whitespace-nowrap">
                      {formatINR(t.total)}
                    </span>
                    <div className="w-full flex items-end justify-center h-28">
                      <div
                        className={`w-full rounded-t-lg transition-all duration-500 ${
                          isCurrent
                            ? "bg-[#18122B]"
                            : t.total > 0
                            ? "bg-[#84cc16]"
                            : "bg-[#E5DAC4]/80"
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-[#18122B]/70">
                      {t.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Col 3: Money Flow */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-4 shadow-2xs">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-800 text-xs">
                  📊
                </span>
                <h2 className="font-serif italic text-sm sm:text-base font-bold text-[#18122B]">
                  Money Flow
                </h2>
              </div>
              <span className="text-[10px] font-serif italic text-stone-500">
                follow the rupees 👀
              </span>
            </div>
            <p className="text-[11px] text-[#18122B]/55 font-medium mt-0.5">
              Income &rarr; Expenses &rarr; Categories
            </p>

            {/* Flow Diagram */}
            <div className="mt-3 flex flex-col items-center gap-2">
              {/* Income Node */}
              <div className="rounded-xl bg-[#18122B] px-4 py-1.5 text-center text-white shadow-2xs w-36">
                <span className="text-[9px] font-bold uppercase tracking-wider text-white/70 block">
                  INCOME
                </span>
                <span className="font-serif text-xs font-bold tabular-nums">
                  {formatINR(moneyIn)}
                </span>
              </div>

              {/* Branch Lines */}
              <div className="text-[#18122B]/30 text-xs leading-none">↓</div>

              {/* Savings & Expenses Split */}
              <div className="grid grid-cols-2 gap-2 w-full">
                <div className="rounded-xl border border-teal-200 bg-teal-50/80 p-2 text-center shadow-3xs">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-teal-800 block">
                    SAVINGS
                  </span>
                  <span className="font-serif text-xs font-bold text-teal-950 tabular-nums">
                    {formatINR(available)}
                  </span>
                </div>

                <div className="rounded-xl border border-orange-200 bg-orange-50/80 p-2 text-center shadow-3xs">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#c2410c] block">
                    EXPENSES
                  </span>
                  <span className="font-serif text-xs font-bold text-orange-950 tabular-nums">
                    {formatINR(moneyOut)}
                  </span>
                </div>
              </div>

              {/* Sub Categories Node */}
              <div className="grid grid-cols-2 gap-2 w-full pt-1">
                <div className="rounded-lg border border-[#E5DAC4] bg-white p-1.5 text-center flex items-center justify-center gap-1.5">
                  <span className="text-xs">🎮</span>
                  <div className="text-left">
                    <span className="text-[9px] font-bold text-[#18122B] block leading-none">
                      {displayCategories[0]?.name || "Entertainment"}
                    </span>
                    <span className="font-mono text-[9px] text-[#18122B]/70 font-semibold">
                      {formatINR(displayCategories[0]?.total || moneyOut)}
                    </span>
                  </div>
                </div>

                <div className="rounded-lg border border-dashed border-[#DDD9CF] bg-stone-50/80 p-1.5 text-center flex items-center justify-center">
                  <span className="text-[10px] font-semibold text-[#18122B]/60">
                    + {Math.max(0, categories.length - 1 || 4)} more categories
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MISSIONS + AI INSIGHTS ROW (ROW 3)                                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-3.5">
        {/* Left: Money Missions */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-4 shadow-2xs">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-700 text-xs">
                  🎯
                </span>
                <h2 className="font-serif text-sm sm:text-base font-bold text-[#18122B]">
                  Money Missions
                </h2>
              </div>
              <span className="text-[11px] font-bold text-[#18122B]/70">
                View all &rarr;
              </span>
            </div>
            <p className="text-[11px] text-[#18122B]/55 font-medium mt-0.5">
              Tiny wins. Keep the streak.
            </p>

            <div className="mt-3.5 space-y-2.5">
              {activeMissions.map((mission, idx) => {
                const pct = Math.min(100, Math.round((mission.progress / (mission.target || 1)) * 100));
                return (
                  <div
                    key={mission.id || idx}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[#E5DAC4]/60 bg-[#FAF8F5] p-2.5 shadow-3xs hover:border-[#84cc16]/60 transition"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#84cc16]/20 text-[#3f6212] text-xs">
                        🌱
                      </span>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-[11px] font-bold text-[#18122B] truncate">
                          {mission.title}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 max-w-[110px] rounded-full bg-[#E5DAC4]/60 overflow-hidden">
                            <div
                              className="h-full bg-[#84cc16] rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10px] text-[#18122B]/60 font-semibold">
                            {mission.progress} / {mission.target}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="rounded-full border border-[#84cc16]/50 bg-[#84cc16]/20 px-2 py-0.5 font-mono text-[10px] font-bold text-[#3f6212] shrink-0">
                      +{mission.xpReward || 50} XP
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: AI Insights with Cat Mascot */}
        <div className="relative flex flex-col justify-between rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-4 shadow-2xs overflow-hidden">
          <div className="z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-100 text-yellow-800 text-xs">
                  💡
                </span>
                <h2 className="font-serif text-sm sm:text-base font-bold text-[#18122B]">
                  AI Insights
                </h2>
              </div>
              <button
                onClick={handleRefreshInsights}
                disabled={refreshingInsights}
                className="flex items-center gap-1 rounded-full border border-[#DDD9CF] bg-white px-2.5 py-1 text-[10px] font-bold text-[#18122B] hover:border-[#18122B] transition"
              >
                <span className={refreshingInsights ? "animate-spin" : ""}>🔄</span>
                <span>Refresh</span>
              </button>
            </div>
            <p className="text-[11px] text-[#18122B]/55 font-medium mt-0.5">
              What your money is saying
            </p>

            <div className="mt-3.5 space-y-2 max-w-[280px] sm:max-w-[340px]">
              {displayInsights.map((insight, idx) => (
                <div
                  key={insight.id || idx}
                  className="flex items-center justify-between gap-2 rounded-xl border border-[#E5DAC4]/60 bg-white p-2 shadow-3xs hover:border-[#18122B]/40 transition"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-[10px]">
                      ✓
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-[#18122B] truncate">
                        {insight.title}
                      </p>
                      {insight.description && (
                        <p className="text-[10px] text-[#18122B]/60 truncate">
                          {insight.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-[#18122B]/40 shrink-0">&rarr;</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. BOTTOM THREE-COLUMN ROW (ROW 4)                                        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-3.5">
        {/* Col 1: Recent Transactions */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-4 shadow-2xs">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-800 text-xs">
                  📄
                </span>
                <h2 className="font-serif text-sm sm:text-base font-bold text-[#18122B]">
                  Recent Transactions
                </h2>
              </div>
              <Link
                href="/transactions"
                className="text-[11px] font-bold text-[#18122B]/70 hover:text-[#18122B] transition"
              >
                View all &rarr;
              </Link>
            </div>

            <div className="mt-3.5 space-y-2.5">
              {displayTransactions.map((tx, idx) => {
                const meta = getCategoryMeta(tx.category || tx.description);
                return (
                  <div key={tx.id || idx} className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] ${meta.bg}`}>
                        {meta.icon}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-[#18122B] text-[11px] truncate">
                          {tx.description || tx.category}
                        </p>
                        <p className="text-[10px] text-[#18122B]/50 font-medium">
                          1 tx • {tx.transactionDate ? new Date(tx.transactionDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Today"}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-[#c2410c] shrink-0">
                      {formatINR(Number(tx.amount) || 0)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Col 2: What-If Simulator */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-4 shadow-2xs">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-800 text-xs">
                  📈
                </span>
                <h2 className="font-serif text-sm sm:text-base font-bold text-[#18122B]">
                  What-If Simulator
                </h2>
              </div>
              <Link
                href="/what-if"
                className="rounded-full border border-[#DDD9CF] bg-white px-2 py-0.5 text-[10px] font-bold text-[#18122B] hover:border-[#18122B] transition"
              >
                Try it &rarr;
              </Link>
            </div>
            <p className="text-[11px] text-[#18122B]/55 font-medium mt-0.5">
              Change the numbers. See what happens.
            </p>

            <div className="mt-3 space-y-2.5">
              {/* Slider 1: Salary Change */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-[#18122B]">Salary Change</span>
                  <span className="font-mono font-bold text-[#18122B]">
                    {salaryChangePct >= 0 ? `+${salaryChangePct}%` : `${salaryChangePct}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="30"
                  step="5"
                  value={salaryChangePct}
                  onChange={(e) => setSalaryChangePct(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#E5DAC4]/60 rounded-lg appearance-none cursor-pointer accent-[#84cc16]"
                />
              </div>

              {/* Slider 2: Expense Change */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-[#18122B]">Expense Change (Entertainment)</span>
                  <span className="font-mono font-bold text-[#18122B]">
                    {expenseChangePct >= 0 ? `+${expenseChangePct}%` : `${expenseChangePct}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="5"
                  value={expenseChangePct}
                  onChange={(e) => setExpenseChangePct(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#E5DAC4]/60 rounded-lg appearance-none cursor-pointer accent-[#84cc16]"
                />
              </div>

              {/* Slider 3: Monthly Savings Change */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-[#18122B]">Monthly Savings Change</span>
                  <span className="font-mono font-bold text-[#18122B]">
                    {savingsDelta >= 0 ? `+₹${savingsDelta.toLocaleString("en-IN")}` : `-₹${Math.abs(savingsDelta).toLocaleString("en-IN")}`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-10000"
                  max="25000"
                  step="1000"
                  value={savingsDelta}
                  onChange={(e) => setSavingsDelta(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#E5DAC4]/60 rounded-lg appearance-none cursor-pointer accent-[#84cc16]"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/what-if"
              className="text-[10px] font-bold text-[#18122B]/70 hover:text-[#18122B] flex items-center gap-1 transition"
            >
              <span>See new savings & goal timelines instantly</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>

        {/* Col 3: Your Goals */}
        <div className="relative flex flex-col justify-between rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-4 shadow-2xs overflow-hidden">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-800 text-xs">
                  🎯
                </span>
                <h2 className="font-serif text-sm sm:text-base font-bold text-[#18122B]">
                  Your Goals
                </h2>
              </div>
              <Link
                href="/goals"
                className="text-[11px] font-bold text-[#18122B]/70 hover:text-[#18122B] transition"
              >
                View all &rarr;
              </Link>
            </div>

            <div className="mt-3.5 space-y-3">
              {displayGoals.map((g) => (
                <div key={g.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${g.iconBg}`}>
                        {g.icon}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-[#18122B] text-[11px] truncate">{g.title}</p>
                        <p className="font-mono text-[10px] text-[#18122B]/60">
                          {formatINR(g.current)} / {formatINR(g.target)}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] font-bold text-[#18122B]">{g.pct}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-[#18122B]/50 font-medium pl-8">
                    <span>{g.monthsLeft} months left</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[#E5DAC4]/60 overflow-hidden ml-8">
                    <div
                      className="h-full bg-[#84cc16] rounded-full transition-all duration-300"
                      style={{ width: `${g.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Yellow Post-it Sticker */}
          <div className="absolute right-3 bottom-2 flex flex-col items-end pointer-events-none">
            <div className="rounded-md border border-amber-300 bg-amber-100 px-2 py-1 text-center shadow-3xs rotate-3">
              <span className="font-serif font-black text-[9px] text-amber-950 uppercase tracking-tight block leading-tight">
                DREAM
              </span>
              <span className="font-serif font-black text-[9px] text-amber-950 uppercase tracking-tight block leading-tight">
                PLAN
              </span>
              <span className="font-serif font-black text-[9px] text-amber-950 uppercase tracking-tight block leading-tight">
                ACHIEVE! ✨
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
