"use client";

import { useState } from "react";
import Link from "next/link";

interface CategoryItem {
  category: string;
  total: number;
  count: number;
}

interface TrendItem {
  month: string;
  total: number;
}

interface SpendingChartsProps {
  categoryData: CategoryItem[];
  trendData: TrendItem[];
  loading?: boolean;
}

const CATEGORY_BAR_COLORS: Record<string, string> = {
  Rent: "from-[#84cc16] to-[#a3e635]",
  Utilities: "from-[#18122B] to-[#3B2C58]",
  Groceries: "from-[#F97316] to-[#FB923C]",
  Shopping: "from-[#8B5CF6] to-[#A78BFA]",
  "Food & Dining": "from-[#2563EB] to-[#60A5FA]",
};

export function SpendingCharts({ categoryData, trendData, loading = false }: SpendingChartsProps) {
  const [hoveredTrendIdx, setHoveredTrendIdx] = useState<number | null>(null);

  // Active categories sorted by spend
  const activeCategories = categoryData
    .filter((c) => Number(c.total) > 0)
    .sort((a, b) => Number(b.total) - Number(a.total));

  const totalExpense = activeCategories.reduce((acc, cur) => acc + Number(cur.total), 0) || 71816;
  const topCategories = activeCategories.slice(0, 5);
  const maxCategoryAmount = topCategories.length > 0 ? Number(topCategories[0].total) : 40000;

  // Trend data setup
  const maxTrendAmount = Math.max(...trendData.map((t) => Number(t.total) || 0), 100000);

  // Calculate September vs August diff
  let momDiff = "27.2%";
  if (trendData.length >= 2) {
    const sep = trendData[trendData.length - 1]?.total || 71816;
    const aug = trendData[trendData.length - 2]?.total || 98678;
    if (aug > 0) {
      const diff = Math.round(((aug - sep) / aug) * 100);
      momDiff = `${Math.abs(diff)}%`;
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
      {/* 1. LEFT: WHERE YOUR MONEY WENT (Top 5 Categories, 58% width) */}
      <div className="lg:col-span-7 rounded-2xl border border-[#DDD9CF] bg-[#FFFDF8] p-3.5 sm:p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-[#E5DAC4]/60 pb-2 mb-2">
          <div>
            <h3 className="font-serif text-base sm:text-lg font-black tracking-tight text-[#18122B]">
              WHERE YOUR MONEY WENT
            </h3>
            <p className="text-[11px] text-[#18122B]/60">
              Top 5 spending heads • ₹ {totalExpense.toLocaleString("en-IN")} total
            </p>
          </div>

          <Link
            href="/transactions"
            className="text-[11px] font-bold text-[#3f6212] hover:text-[#18122B] hover:underline transition"
          >
            View all ({activeCategories.length}) &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="py-10 text-center text-xs text-[#18122B]/50">Loading allocations...</div>
        ) : topCategories.length === 0 ? (
          <div className="py-10 text-center text-xs text-[#18122B]/50">No expense records found.</div>
        ) : (
          <div className="flex flex-col gap-2.5 flex-1 justify-around">
            {topCategories.map((item, idx) => {
              const amount = Number(item.total);
              const percentage = ((amount / totalExpense) * 100).toFixed(0);
              const barWidth = Math.max(8, Math.round((amount / maxCategoryAmount) * 100));
              const isTop = idx === 0;
              const gradient = CATEGORY_BAR_COLORS[item.category] || "from-gray-700 to-gray-500";

              return (
                <div key={item.category} className="group/cat">
                  <div className="flex items-center justify-between text-xs font-bold text-[#18122B] mb-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded text-[10px] font-black ${
                          isTop ? "bg-[#84cc16] text-[#18122B]" : "bg-[#18122B]/10 text-[#18122B]"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="truncate">{item.category}</span>
                      {isTop && (
                        <span className="rounded-full bg-[#84cc16]/25 px-1.5 py-0.2 text-[9px] font-black uppercase text-[#3f6212]">
                          #1 Outflow
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1.5 tabular-nums">
                      <span className="font-serif font-bold text-xs sm:text-sm">
                        ₹ {amount.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] text-[#18122B]/50 font-medium">({percentage}%)</span>
                    </div>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="h-2 w-full rounded-full bg-[#E5DAC4]/40 p-0.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-500`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. RIGHT: YOUR SPENDING RHYTHM (Compact Chart + Small Insight, 42% width) */}
      <div className="lg:col-span-5 rounded-2xl border border-[#DDD9CF] bg-[#FFFDF8] p-3.5 sm:p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-[#E5DAC4]/60 pb-2 mb-2">
          <div>
            <h3 className="font-serif text-base sm:text-lg font-black tracking-tight text-[#18122B]">
              YOUR SPENDING RHYTHM
            </h3>
            <p className="text-[11px] text-[#18122B]/60">Last 3 months dynamics</p>
          </div>
          <span className="rounded-full bg-[#18122B]/10 px-2 py-0.5 text-[10px] font-bold text-[#18122B]">
            Quarterly
          </span>
        </div>

        {/* Compact Bar Chart Visual */}
        <div className="relative flex h-32 items-end justify-around gap-4 rounded-xl bg-[#FAF6ED]/70 px-4 pt-4 pb-2 border border-[#E5DAC4]/60 my-1">
          {/* Subtle horizontal dashed guidelines */}
          <div className="pointer-events-none absolute inset-x-4 top-1/3 border-b border-dashed border-[#DDD9CF]/70" />
          <div className="pointer-events-none absolute inset-x-4 top-2/3 border-b border-dashed border-[#DDD9CF]/70" />

          {trendData.map((item, idx) => {
            const amount = Number(item.total);
            const heightPercent = Math.max(20, Math.round((amount / maxTrendAmount) * 85));
            const isCurrentMonth = idx === trendData.length - 1;
            const isHovered = hoveredTrendIdx === idx;

            return (
              <div
                key={item.month}
                onMouseEnter={() => setHoveredTrendIdx(idx)}
                onMouseLeave={() => setHoveredTrendIdx(null)}
                className="relative flex flex-1 flex-col items-center justify-end h-full cursor-pointer group/bar"
              >
                {/* Value tooltip */}
                <div
                  className={`absolute -top-7 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-bold font-serif transition-all ${
                    isHovered || isCurrentMonth
                      ? "bg-[#18122B] text-white opacity-100"
                      : "opacity-0 pointer-events-none"
                  }`}
                >
                  ₹{(amount / 1000).toFixed(1)}k
                </div>

                {/* The Bar */}
                <div
                  className={`w-full max-w-[48px] rounded-t-xl transition-all duration-300 shadow-sm ${
                    isCurrentMonth
                      ? "bg-gradient-to-t from-[#84cc16] to-[#a3e635] border border-[#84cc16]"
                      : isHovered
                      ? "bg-[#18122B]"
                      : "bg-[#18122B]/75 hover:bg-[#18122B]"
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />

                {/* Month label */}
                <span
                  className={`mt-1.5 text-[11px] font-bold ${
                    isCurrentMonth ? "text-[#3f6212] font-black" : "text-[#18122B]/70"
                  }`}
                >
                  {item.month}
                </span>
              </div>
            );
          })}
        </div>

        {/* Small Insight Strip */}
        <div className="mt-2 rounded-xl border border-[#84cc16]/40 bg-[#F8FCF0] px-3 py-1.5 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-black text-[#18122B]">✦ MONEY MOVE:</span>
            <span className="text-[#18122B]/80 font-medium truncate">
              September spending is down {momDiff} from August.
            </span>
          </div>
          <span className="text-[#3f6212] font-bold shrink-0 ml-2">↓ Favorable</span>
        </div>
      </div>
    </div>
  );
}
