"use client";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

const CATEGORY_COLORS: Record<string, string> = {
  Food: "#0D6E6E", // teal
  Transport: "#B87B28", // gold
  Shopping: "#0C1829", // navy
  Bills: "#B33939", // rose
  Entertainment: "#128B8B", // teal-light
  Other: "#8A99AD", // ink-subtle
};

const FALLBACK_PALETTE = ["#0D6E6E", "#B87B28", "#182C48", "#B33939", "#128B8B", "#CD8E38", "#4A5568"];

function CustomPieTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="rounded-md border border-line bg-paper-sheet px-3 py-2 shadow-subtle">
        <p className="text-[10px] font-bold tracking-wider text-ink-subtle uppercase">
          {data.name}
        </p>
        <p className="font-serif text-sm font-semibold tabular-nums text-ink">
          ₹ {Number(data.value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
}

function CustomBarTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="rounded-md border border-line bg-paper-sheet px-3 py-2 shadow-subtle">
        <p className="text-[10px] font-bold tracking-wider text-ink-subtle uppercase">
          Month of {label}
        </p>
        <p className="font-serif text-sm font-semibold tabular-nums text-teal">
          ₹ {Number(data.value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
}

export function SpendingCharts({ categoryData, trendData, loading }: SpendingChartsProps) {
  const filteredCategories = categoryData.filter((c) => Number(c.total) > 0);

  return (
    <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* 1. Category Breakdown Donut Chart */}
      <div className="flex flex-col rounded-lg border border-line bg-paper-sheet p-6 shadow-subtle">
        <div className="border-b border-line pb-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-widest text-ink-subtle uppercase">
              Ledger Allocation
            </span>
            <span className="rounded border border-teal/30 bg-teal-tint px-2 py-0.5 text-[10px] font-semibold text-teal">
              Current Cycle
            </span>
          </div>
          <h3 className="mt-1 font-serif text-lg font-semibold tracking-tight text-ink">
            Category Breakdown
          </h3>
          <p className="mt-0.5 text-xs text-ink-muted">
            Proportional expense distribution across active spending heads.
          </p>
        </div>

        <div className="mt-4 flex flex-1 flex-col items-center justify-center min-h-[260px]">
          {loading ? (
            <p className="py-12 font-serif text-xs italic text-ink-muted">
              Loading category breakdown…
            </p>
          ) : filteredCategories.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-serif text-xs italic text-ink-muted">
                No expense records found for this period.
              </p>
              <p className="mt-1 text-[11px] text-ink-subtle">
                Record transactions to visualize category allocations.
              </p>
            </div>
          ) : (
            <div className="flex w-full flex-col sm:flex-row items-center justify-around gap-4">
              <div className="h-56 w-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={filteredCategories}
                      dataKey="total"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      stroke="#FAFAF7"
                      strokeWidth={2}
                    >
                      {filteredCategories.map((entry, index) => {
                        const fill =
                          CATEGORY_COLORS[entry.category] ||
                          FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
                        return <Cell key={`cell-${index}`} fill={fill} />;
                      })}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend with tabular nums */}
              <div className="flex flex-col gap-2 max-w-[180px] text-xs">
                {filteredCategories.map((item, idx) => {
                  const color =
                    CATEGORY_COLORS[item.category] ||
                    FALLBACK_PALETTE[idx % FALLBACK_PALETTE.length];
                  return (
                    <div key={item.category} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="truncate text-ink-muted font-medium">{item.category}</span>
                      </div>
                      <span className="font-serif font-semibold tabular-nums text-ink shrink-0">
                        ₹ {Number(item.total).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Monthly Spending Trend Chart */}
      <div className="flex flex-col rounded-lg border border-line bg-paper-sheet p-6 shadow-subtle">
        <div className="border-b border-line pb-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-widest text-ink-subtle uppercase">
              Temporal Velocity
            </span>
            <span className="rounded border border-gold/40 bg-gold/15 px-2 py-0.5 text-[10px] font-semibold text-gold-dark">
              Last 3 Months
            </span>
          </div>
          <h3 className="mt-1 font-serif text-lg font-semibold tracking-tight text-ink">
            Monthly Spending Trend
          </h3>
          <p className="mt-0.5 text-xs text-ink-muted">
            Aggregated debit comparison across the trailing quarterly window.
          </p>
        </div>

        <div className="mt-4 flex-1 min-h-[260px]">
          {loading ? (
            <p className="py-12 text-center font-serif text-xs italic text-ink-muted">
              Loading expenditure trend…
            </p>
          ) : (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 20, right: 15, left: -10, bottom: 5 }}>
                  <CartesianGrid stroke="#DDD9CF" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="#8A99AD"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "#DDD9CF" }}
                  />
                  <YAxis
                    stroke="#8A99AD"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: "#DDD9CF" }}
                    tickFormatter={(val) =>
                      val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`
                    }
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar
                    dataKey="total"
                    fill="#0D6E6E"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
