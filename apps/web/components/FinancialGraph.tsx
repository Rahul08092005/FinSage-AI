"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { getMe, getExpenseSummary, getTransactions } from "@/lib/api";
import { formatINR } from "@/lib/formatCurrency";

interface FinancialGraphProps {
  token: string;
}

interface ExpenseCategorySummary {
  category: string;
  total: number;
  count: number;
}

interface TransactionItem {
  id: string;
  amount: number;
  category: string;
  description: string;
  transactionDate: string;
  type?: string;
  source?: string;
}

interface TopMerchantInfo {
  merchantName: string;
  totalSpend: number;
}

interface CategoryFlowData {
  category: string;
  total: number;
  count: number;
  topMerchant: TopMerchantInfo | null;
}

export function FinancialGraph({ token }: FinancialGraphProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data state
  const [salary, setSalary] = useState<number | null>(null);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [categoriesFlow, setCategoriesFlow] = useState<CategoryFlowData[]>([]);
  const [additionalCategoryCount, setAdditionalCategoryCount] = useState<number>(0);

  // DOM node references for dynamic SVG line calculation
  const containerRef = useRef<HTMLDivElement>(null);
  const incomeNodeRef = useRef<HTMLDivElement>(null);
  const savingsNodeRef = useRef<HTMLDivElement>(null);
  const expensesNodeRef = useRef<HTMLDivElement>(null);
  const categoryNodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const merchantNodeRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Computed lines state { x1, y1, x2, y2, key }
  interface ConnectorLine {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    key: string;
    stroke?: string;
  }
  const [lines, setLines] = useState<ConnectorLine[]>([]);
  const [svgSize, setSvgSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
      const currentMonthStr = `${currentYear}-${currentMonth}`;

      const [userRes, summaryRes, transactionsRes] = await Promise.allSettled([
        getMe(token),
        getExpenseSummary(token, currentMonthStr),
        getTransactions(token, 200),
      ]);

      // 1. Process Income / Salary
      if (userRes.status === "fulfilled" && userRes.value) {
        const rawSalary = userRes.value.monthlySalary ?? userRes.value.salary ?? null;
        const parsedSalary = rawSalary !== null && rawSalary !== undefined ? Number(rawSalary) : null;
        setSalary(parsedSalary && parsedSalary > 0 ? parsedSalary : null);
      }

      // 2. Process Expenses Summary
      let rawCategories: ExpenseCategorySummary[] = [];
      if (summaryRes.status === "fulfilled" && summaryRes.value) {
        setTotalExpenses(Number(summaryRes.value.total) || 0);
        rawCategories = Array.isArray(summaryRes.value.byCategory)
          ? summaryRes.value.byCategory.map((c: any) => ({
              category: String(c.category || "General"),
              total: Number(c.total) || 0,
              count: Number(c.count) || 0,
            }))
          : [];
      }

      // 3. Process Transactions for Top Merchant per Category (Current Month Only)
      let allTransactions: TransactionItem[] = [];
      if (transactionsRes.status === "fulfilled" && Array.isArray(transactionsRes.value)) {
        allTransactions = transactionsRes.value;
      }

      // Filter transactions for current month only
      const currentMonthTransactions = allTransactions.filter((tx) => {
        if (!tx.transactionDate) return false;
        return tx.transactionDate.startsWith(currentMonthStr);
      });

      // Sort categories by total spend descending
      const sortedCategories = [...rawCategories].sort((a, b) => b.total - a.total);
      // Reasonable max categories to display to avoid excessive width
      const maxCategories = 5;
      const topCategories = sortedCategories.slice(0, maxCategories);
      setAdditionalCategoryCount(Math.max(0, sortedCategories.length - maxCategories));

      // Calculate Top Merchant per category by highest aggregate spend
      const flowData: CategoryFlowData[] = topCategories.map((cat) => {
        const catTxList = currentMonthTransactions.filter(
          (tx) => tx.category?.toLowerCase() === cat.category.toLowerCase()
        );

        // Group by merchant / description
        const merchantTotals: Record<string, number> = {};
        for (const tx of catTxList) {
          const merchantName = (tx.description || "").trim() || "Unspecified";
          const amount = Number(tx.amount) || 0;
          if (amount > 0) {
            merchantTotals[merchantName] = (merchantTotals[merchantName] || 0) + amount;
          }
        }

        // Find merchant with max total spend
        let topMerchant: TopMerchantInfo | null = null;
        let maxSpend = 0;
        for (const [name, spend] of Object.entries(merchantTotals)) {
          if (spend > maxSpend) {
            maxSpend = spend;
            topMerchant = { merchantName: name, totalSpend: spend };
          }
        }

        return {
          category: cat.category,
          total: cat.total,
          count: cat.count,
          topMerchant,
        };
      });

      setCategoriesFlow(flowData);
    } catch (err: any) {
      console.error("[FinancialGraph] Error loading data:", err);
      setError("Couldn't load financial flow map.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived savings
  const derivedSavings = useMemo(() => {
    if (!salary || salary <= 0) return null;
    return Math.max(0, salary - totalExpenses);
  }, [salary, totalExpenses]);

  // Calculate SVG connector lines between nodes
  const calculateLines = useCallback(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    setSvgSize({
      width: containerRef.current.scrollWidth,
      height: containerRef.current.scrollHeight,
    });

    const newLines: ConnectorLine[] = [];

    const getNodePoint = (el: HTMLElement | null, anchor: "top" | "bottom") => {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const x = rect.left - containerRect.left + rect.width / 2;
      const y = anchor === "top" ? rect.top - containerRect.top : rect.bottom - containerRect.top;
      return { x, y };
    };

    const incomeBottom = getNodePoint(incomeNodeRef.current, "bottom");
    const savingsTop = getNodePoint(savingsNodeRef.current, "top");
    const expensesTop = getNodePoint(expensesNodeRef.current, "top");
    const expensesBottom = getNodePoint(expensesNodeRef.current, "bottom");

    // Tier 1 -> Tier 2 (Income -> Savings)
    if (incomeBottom && savingsTop) {
      newLines.push({
        x1: incomeBottom.x,
        y1: incomeBottom.y,
        x2: savingsTop.x,
        y2: savingsTop.y,
        key: "income-to-savings",
        stroke: "#0d9488", // teal
      });
    }

    // Tier 1 -> Tier 2 (Income -> Expenses)
    if (incomeBottom && expensesTop) {
      newLines.push({
        x1: incomeBottom.x,
        y1: incomeBottom.y,
        x2: expensesTop.x,
        y2: expensesTop.y,
        key: "income-to-expenses",
        stroke: "#d97706", // amber
      });
    }

    // Tier 2 -> Tier 3 (Expenses -> Categories)
    if (expensesBottom) {
      categoryNodeRefs.current.forEach((catNode, idx) => {
        const catTop = getNodePoint(catNode, "top");
        if (catTop) {
          newLines.push({
            x1: expensesBottom.x,
            y1: expensesBottom.y,
            x2: catTop.x,
            y2: catTop.y,
            key: `expenses-to-cat-${idx}`,
            stroke: "#cbd5e1", // neutral
          });
        }
      });
    }

    // Tier 3 -> Tier 4 (Category -> Top Merchant)
    categoryNodeRefs.current.forEach((catNode, idx) => {
      const catBottom = getNodePoint(catNode, "bottom");
      const merchantNode = merchantNodeRefs.current[idx];
      const merchantTop = getNodePoint(merchantNode, "top");
      if (catBottom && merchantTop) {
        newLines.push({
          x1: catBottom.x,
          y1: catBottom.y,
          x2: merchantTop.x,
          y2: merchantTop.y,
          key: `cat-${idx}-to-merchant`,
          stroke: "#94a3b8", // subtle slate
        });
      }
    });

    setLines(newLines);
  }, []);

  // Recalculate connector lines after rendering and on window resize
  useEffect(() => {
    if (loading || error || categoriesFlow.length === 0) return;

    const timer = setTimeout(calculateLines, 50);
    window.addEventListener("resize", calculateLines);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", calculateLines);
    };
  }, [loading, error, categoriesFlow, calculateLines]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#E5DAC4]/60 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#84cc16]/20 border border-[#84cc16]/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#3f6212]">
              ✦ MONEY FLOW
            </span>
            <span className="text-xs text-stone-500 font-medium">
              Mapping your money flow…
            </span>
          </div>
        </div>
        <div className="py-12 text-center">
          <div className="mx-auto w-8 h-8 rounded-full bg-lime-400/20 flex items-center justify-center text-sm animate-spin mb-2">
            ✦
          </div>
          <p className="text-xs text-stone-500 font-medium">Tracing income, expenses, and top merchants…</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">⚠️</span>
            <span className="text-xs font-bold text-rose-900">{error}</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="rounded-full bg-rose-700 px-3 py-1 text-[11px] font-bold text-white hover:bg-rose-800 transition cursor-pointer"
          >
            ↺ Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state: No expense categories
  if (categoriesFlow.length === 0 && totalExpenses === 0) {
    return (
      <div className="rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#E5DAC4]/60 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#84cc16]/20 border border-[#84cc16]/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#3f6212]">
              ✦ MONEY FLOW
            </span>
            <span className="text-xs text-stone-500 font-medium">follow the money 👀</span>
          </div>
        </div>
        <div className="rounded-xl border border-dashed border-[#DDD9CF] bg-[#FAF8F5] p-8 text-center">
          <div className="mx-auto w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-lg mb-2">
            🗺️
          </div>
          <h3 className="font-serif text-sm font-bold text-[#18122B]">
            NO MONEY FLOW YET ✦
          </h3>
          <p className="mt-1 text-xs text-stone-500 max-w-sm mx-auto font-medium">
            Once you record some expenses this month, your money map will automatically trace income into categories and top merchants here.
          </p>
          <Link
            href="/transactions"
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#18122B] hover:text-[#3f6212]"
          >
            <span>+ Record first transaction</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-4 sm:p-6 shadow-xs overflow-hidden">
      {/* 1. SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#E5DAC4]/60 pb-3 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#84cc16]/20 border border-[#84cc16]/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#3f6212]">
              ✦ MONEY FLOW
            </span>
            <span className="rounded-full bg-[#FAF8F5] border border-[#E5DAC4] px-2.5 py-0.5 text-[10px] font-mono text-stone-500">
              follow the money 👀
            </span>
          </div>
          <h2 className="font-serif text-lg sm:text-xl font-black tracking-tight text-[#18122B]">
            Where the money actually went.
          </h2>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            Real monthly flow traced from Income &rarr; Categories &rarr; Top Merchants.
          </p>
        </div>

        <div className="text-[11px] font-mono text-stone-500 self-start sm:self-auto">
          Current Month Flow
        </div>
      </div>

      {/* 2. CONTAINED SCROLLABLE GRAPH VIEWPORT */}
      <div className="w-full overflow-x-auto pb-4 pt-1 focus:outline-none">
        <div
          ref={containerRef}
          className="relative min-w-[580px] sm:min-w-[640px] flex flex-col items-center py-2 px-4 select-none"
        >
          {/* SVG CONNECTOR LAYER */}
          <svg
            className="absolute inset-0 pointer-events-none z-0"
            width={svgSize.width || "100%"}
            height={svgSize.height || "100%"}
          >
            <defs>
              <marker
                id="flow-arrow"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="4"
                markerHeight="4"
                orient="auto-flow"
              >
                <path d="M 0 2 L 8 5 L 0 8 z" fill="#94a3b8" />
              </marker>
            </defs>
            {lines.map((line) => (
              <line
                key={line.key}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke={line.stroke || "#cbd5e1"}
                strokeWidth="1.5"
                strokeDasharray={line.stroke === "#cbd5e1" ? "3 3" : undefined}
                markerEnd="url(#flow-arrow)"
              />
            ))}
          </svg>

          {/* ========================================================================= */}
          {/* TIER 1 — INCOME */}
          {/* ========================================================================= */}
          <div className="relative z-10 mb-8 sm:mb-10 flex justify-center">
            <div
              ref={incomeNodeRef}
              className="rounded-xl border border-[#18122B] bg-[#18122B] text-white px-5 py-3 shadow-sm min-w-[200px] text-center transition-transform hover:scale-[1.02]"
            >
              <div className="flex items-center justify-center gap-1.5 text-[9px] font-bold tracking-widest uppercase text-[#84cc16]">
                <span>💰</span>
                <span>INCOME</span>
              </div>
              <div className="font-serif text-base sm:text-lg font-black tracking-tight mt-0.5">
                {salary && salary > 0 ? (
                  formatINR(salary)
                ) : (
                  <span className="text-xs font-sans text-stone-300">
                    Set salary to map flow
                  </span>
                )}
              </div>
              <span className="text-[9px] font-mono text-stone-400 block mt-0.5">
                Baseline Monthly
              </span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TIER 2 — SAVINGS / EXPENSES */}
          {/* ========================================================================= */}
          <div className="relative z-10 mb-8 sm:mb-10 w-full max-w-lg grid grid-cols-2 gap-6 sm:gap-12 px-4">
            {/* SAVINGS NODE (Teal Accent) */}
            <div className="flex justify-center">
              <div
                ref={savingsNodeRef}
                className="rounded-xl border border-teal-300 bg-teal-50/90 text-teal-950 px-4 py-2.5 shadow-2xs w-full max-w-[190px] text-center"
              >
                <div className="flex items-center justify-center gap-1 text-[9px] font-bold tracking-wider uppercase text-teal-800">
                  <span>💎</span>
                  <span>SAVINGS</span>
                </div>
                <div className="font-serif text-sm sm:text-base font-bold text-teal-900 mt-0.5">
                  {derivedSavings !== null ? (
                    formatINR(derivedSavings)
                  ) : (
                    <span className="text-[11px] font-sans text-teal-700">Set salary first</span>
                  )}
                </div>
                <span className="text-[9px] font-mono text-teal-700/80 block mt-0.5">
                  Retained Capacity
                </span>
              </div>
            </div>

            {/* EXPENSES NODE (Gold / Amber Accent) */}
            <div className="flex justify-center">
              <div
                ref={expensesNodeRef}
                className="rounded-xl border border-amber-300 bg-amber-50/90 text-amber-950 px-4 py-2.5 shadow-2xs w-full max-w-[190px] text-center"
              >
                <div className="flex items-center justify-center gap-1 text-[9px] font-bold tracking-wider uppercase text-amber-800">
                  <span>📉</span>
                  <span>EXPENSES</span>
                </div>
                <div className="font-serif text-sm sm:text-base font-bold text-amber-900 mt-0.5">
                  {formatINR(totalExpenses)}
                </div>
                <span className="text-[9px] font-mono text-amber-700/80 block mt-0.5">
                  Current Month Total
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TIER 3 & TIER 4 — EXPENSE CATEGORIES & TOP MERCHANTS */}
          {/* ========================================================================= */}
          <div className="relative z-10 w-full flex justify-center">
            <div
              className={`grid gap-3 sm:gap-4 w-full ${
                categoriesFlow.length === 1
                  ? "max-w-[200px] grid-cols-1"
                  : categoriesFlow.length === 2
                  ? "max-w-md grid-cols-2"
                  : categoriesFlow.length === 3
                  ? "max-w-2xl grid-cols-3"
                  : categoriesFlow.length === 4
                  ? "max-w-3xl grid-cols-4"
                  : "grid-cols-5"
              }`}
            >
              {categoriesFlow.map((item, idx) => (
                <div key={item.category} className="flex flex-col items-center">
                  {/* TIER 3 — CATEGORY NODE */}
                  <div
                    ref={(el) => {
                      categoryNodeRefs.current[idx] = el;
                    }}
                    className="rounded-xl border border-[#E5DAC4] bg-white px-3 py-2 shadow-2xs w-full text-center transition-colors hover:border-[#84cc16]"
                  >
                    <div className="text-[10px] font-bold text-[#18122B] truncate" title={item.category}>
                      {item.category}
                    </div>
                    <div className="font-serif text-xs sm:text-sm font-bold text-[#18122B] mt-0.5">
                      {formatINR(item.total)}
                    </div>
                    <span className="text-[9px] font-mono text-stone-400 block">
                      {item.count} tx{item.count === 1 ? "" : "s"}
                    </span>
                  </div>

                  {/* Spacer for connector line */}
                  <div className="h-6 sm:h-8" />

                  {/* TIER 4 — TOP MERCHANT NODE */}
                  <div
                    ref={(el) => {
                      merchantNodeRefs.current[idx] = el;
                    }}
                    className="rounded-lg border border-stone-200 bg-[#FAF8F5] px-2.5 py-1.5 shadow-3xs w-full text-center"
                  >
                    <span className="text-[8px] font-bold uppercase tracking-wider text-stone-400 block">
                      TOP MERCHANT
                    </span>
                    {item.topMerchant ? (
                      <>
                        <div
                          className="text-[10px] font-semibold text-stone-800 truncate mt-0.5"
                          title={item.topMerchant.merchantName}
                        >
                          {item.topMerchant.merchantName}
                        </div>
                        <div className="font-serif text-[11px] font-bold text-[#3f6212]">
                          {formatINR(item.topMerchant.totalSpend)}
                        </div>
                      </>
                    ) : (
                      <div className="text-[9px] text-stone-400 italic mt-0.5">
                        Merchant unavailable
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional categories hint */}
          {additionalCategoryCount > 0 && (
            <div className="mt-4 text-center">
              <span className="text-[10px] font-mono text-stone-400">
                +{additionalCategoryCount} more minor categor{additionalCategoryCount === 1 ? "y" : "ies"} in full ledger
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 3. SUBTLE FOOTER STRIP */}
      <div className="mt-2 pt-2.5 border-t border-[#E5DAC4]/60 flex items-center justify-between text-[10px] text-stone-400 font-mono">
        <span>Deterministic hierarchy &middot; Aggregate spend rank</span>
        <span>Passbook Flow</span>
      </div>
    </div>
  );
}
