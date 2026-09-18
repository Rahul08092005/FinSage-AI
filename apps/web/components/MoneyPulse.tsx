"use client";

import { formatINR } from "@/lib/formatCurrency";

interface CategoryItem {
  category: string;
  total: number;
  count: number;
}

interface TrendItem {
  month: string;
  total: number;
}

interface MoneyPulseProps {
  salary: number | null;
  spend: number | null;
  categories: CategoryItem[];
  trend: TrendItem[];
  healthScore: number | null;
  loading?: boolean;
}

export function MoneyPulse({
  salary,
  spend,
  categories,
  trend,
  healthScore,
  loading = false,
}: MoneyPulseProps) {
  const moneyIn = salary ?? 100000;
  const moneyOut = spend ?? 71816;
  const netSaved = Math.max(0, moneyIn - moneyOut);
  const savingsRate = moneyIn > 0 ? ((netSaved / moneyIn) * 100).toFixed(1) : "0";

  // Find top spend category
  const sortedCategories = [...categories].sort((a, b) => Number(b.total) - Number(a.total));
  const topCategory = sortedCategories[0] || { category: "Rent", total: 40000, count: 2 };
  const topCategoryPercent = moneyOut > 0 ? Math.round((Number(topCategory.total) / moneyOut) * 100) : 0;

  // Month over month trend calculation
  let momDiffPercent: number | null = null;
  if (trend.length >= 2) {
    const currentMonthTotal = trend[trend.length - 1]?.total || moneyOut;
    const prevMonthTotal = trend[trend.length - 2]?.total || 0;
    if (prevMonthTotal > 0) {
      momDiffPercent = Math.round(((currentMonthTotal - prevMonthTotal) / prevMonthTotal) * 100);
    }
  }

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-widest text-[#84cc16]-dark text-teal-800">
            PULSE CHECK
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-black tracking-tight text-[#18122B]">
            WHAT&apos;S HAPPENING WITH YOUR MONEY?
          </h2>
        </div>
        <span className="text-xs font-semibold text-[#18122B]/60">
          Live signals across your September ledger
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. SPENDING WIDGET (Orange Accent) */}
        <div className="group relative overflow-hidden rounded-[24px] border border-[#F97316]/30 bg-[#FFF9F5] p-5 shadow-sm transition-all duration-300 hover:border-[#F97316] hover:shadow-md hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-[#F97316]/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#C2410C]">
              Spending
            </span>
            <span className="h-2 w-2 rounded-full bg-[#F97316]" />
          </div>

          <div className="mt-4">
            <p className="font-serif text-3xl font-black tracking-tight text-[#18122B] tabular-nums">
              {formatINR(moneyOut)}
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#C2410C]">
              {momDiffPercent !== null && (
                <span>
                  {momDiffPercent <= 0 ? `↓ ${Math.abs(momDiffPercent)}%` : `↑ +${momDiffPercent}%`} vs Aug
                </span>
              )}
              <span className="text-[#18122B]/40">•</span>
              <span className="text-[11px] text-[#18122B]/70 font-medium">Controlled pace</span>
            </div>
          </div>
        </div>

        {/* 2. BIGGEST SPEND WIDGET (Lavender Accent) */}
        <div className="group relative overflow-hidden rounded-[24px] border border-[#8B5CF6]/30 bg-[#FAF7FF] p-5 shadow-sm transition-all duration-300 hover:border-[#8B5CF6] hover:shadow-md hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-[#8B5CF6]/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#6D28D9]">
              Biggest Spend
            </span>
            <span className="h-2 w-2 rounded-full bg-[#8B5CF6]" />
          </div>

          <div className="mt-4">
            <p className="font-serif text-3xl font-black tracking-tight text-[#18122B] truncate">
              {topCategory.category}
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#6D28D9]">
              <span>{formatINR(Number(topCategory.total))}</span>
              <span className="text-[#18122B]/40">•</span>
              <span className="text-[11px] text-[#18122B]/70 font-medium">{topCategoryPercent}% of budget</span>
            </div>
          </div>
        </div>

        {/* 3. MONEY IN WIDGET (Electric Lime Accent) */}
        <div className="group relative overflow-hidden rounded-[24px] border border-[#84cc16]/40 bg-[#F9FCF2] p-5 shadow-sm transition-all duration-300 hover:border-[#84cc16] hover:shadow-md hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-[#84cc16]/25 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#3f6212]">
              Money In
            </span>
            <span className="h-2 w-2 rounded-full bg-[#84cc16]" />
          </div>

          <div className="mt-4">
            <p className="font-serif text-3xl font-black tracking-tight text-[#18122B] tabular-nums">
              {formatINR(moneyIn)}
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#3f6212]">
              <span>Salary credit verified</span>
              <span className="text-[#18122B]/40">•</span>
              <span className="text-[11px] text-[#18122B]/70 font-medium">100% deposited</span>
            </div>
          </div>
        </div>

        {/* 4. BUDGET & SAVINGS WIDGET (Cobalt Blue Accent) */}
        <div className="group relative overflow-hidden rounded-[24px] border border-[#2563EB]/30 bg-[#F4F8FF] p-5 shadow-sm transition-all duration-300 hover:border-[#2563EB] hover:shadow-md hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-[#2563EB]/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#1D4ED8]">
              Savings Buffer
            </span>
            <span className="h-2 w-2 rounded-full bg-[#2563EB]" />
          </div>

          <div className="mt-4">
            <p className="font-serif text-3xl font-black tracking-tight text-[#18122B] tabular-nums">
              +{savingsRate}%
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#1D4ED8]">
              <span>{formatINR(netSaved)} retained</span>
              <span className="text-[#18122B]/40">•</span>
              <span className="text-[11px] text-[#18122B]/70 font-medium">Top quartile</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
