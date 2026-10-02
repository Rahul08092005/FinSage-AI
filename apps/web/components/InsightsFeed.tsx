"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  getInsights,
  generateInsights,
  dismissInsight,
  type InsightItem,
  type InsightType,
} from "@/lib/api";
import { formatINR } from "@/lib/formatCurrency";

interface InsightsFeedProps {
  token: string;
  onInsightsLoaded?: (insights: InsightItem[]) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Type-Specific Theme Configurations
// ---------------------------------------------------------------------------
interface TypeConfig {
  label: string;
  icon: string;
  sticker: string;
  badgeClass: string;
  borderClass: string;
  bgClass: string;
  textClass: string;
}

const TYPE_CONFIGS: Record<string, TypeConfig> = {
  pattern: {
    label: "PATTERN",
    icon: "🔍",
    sticker: "spotted 👀",
    badgeClass: "bg-teal-100/90 text-teal-900 border-teal-200",
    borderClass: "border-teal-200/90 hover:border-teal-400/80",
    bgClass: "bg-gradient-to-br from-[#F4FAF8] to-[#FFFFFF]",
    textClass: "text-teal-950",
  },
  subscription: {
    label: "SUBSCRIPTION",
    icon: "🔄",
    sticker: "again?!",
    badgeClass: "bg-amber-100/90 text-amber-900 border-amber-200",
    borderClass: "border-amber-200/90 hover:border-amber-400/80",
    bgClass: "bg-gradient-to-br from-[#FCF9F0] to-[#FFFFFF]",
    textClass: "text-amber-950",
  },
  leak: {
    label: "MONEY LEAK",
    icon: "💸",
    sticker: "money leak 🚨",
    badgeClass: "bg-rose-100/90 text-rose-900 border-rose-200",
    borderClass: "border-rose-200/90 hover:border-rose-400/80",
    bgClass: "bg-gradient-to-br from-[#FDF4F5] to-[#FFFFFF]",
    textClass: "text-rose-950",
  },
  warning: {
    label: "HEADS UP",
    icon: "⚠️",
    sticker: "tiny red flag 🚩",
    badgeClass: "bg-rose-200/90 text-rose-950 border-rose-300 font-black",
    borderClass: "border-rose-300 hover:border-rose-500/80 ring-1 ring-rose-200/60",
    bgClass: "bg-gradient-to-br from-[#FFF1F2] to-[#FFFFFF]",
    textClass: "text-rose-950",
  },
};

const DEFAULT_CONFIG: TypeConfig = {
  label: "INTEL",
  icon: "✦",
  sticker: "pattern unlocked ✦",
  badgeClass: "bg-indigo-100/90 text-indigo-900 border-indigo-200",
  borderClass: "border-indigo-200/90 hover:border-indigo-400/80",
  bgClass: "bg-gradient-to-br from-[#F7F7FD] to-[#FFFFFF]",
  textClass: "text-indigo-950",
};

// ---------------------------------------------------------------------------
// Helper: Format Evidence Key/Values into Clean Ledger Rows
// ---------------------------------------------------------------------------
function formatEvidenceKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

function formatEvidenceValue(key: string, val: unknown): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "boolean") return val ? "Yes" : "No";

  const lowerKey = key.toLowerCase();
  const isMoney =
    lowerKey.includes("amount") ||
    lowerKey.includes("total") ||
    lowerKey.includes("spend") ||
    lowerKey.includes("cost") ||
    lowerKey.includes("price") ||
    lowerKey.includes("income") ||
    lowerKey.includes("currentmonth") ||
    lowerKey.includes("previousmonth") ||
    lowerKey.includes("diff");

  if (typeof val === "number") {
    if (isMoney) return formatINR(val);
    if (lowerKey.includes("percent") || lowerKey.includes("rate") || lowerKey.includes("change")) {
      const formatted = (val * (Math.abs(val) <= 1 ? 100 : 1)).toFixed(1);
      return `${val > 0 ? "+" : ""}${formatted}%`;
    }
    return val.toLocaleString("en-IN");
  }

  if (typeof val === "string") {
    const num = Number(val);
    if (!isNaN(num) && isMoney) {
      return formatINR(num);
    }
    return val;
  }

  if (Array.isArray(val)) {
    return `${val.length} item${val.length === 1 ? "" : "s"}`;
  }

  if (typeof val === "object") {
    try {
      return JSON.stringify(val);
    } catch {
      return "—";
    }
  }

  return String(val);
}

// ---------------------------------------------------------------------------
// Component: InsightsFeed
// ---------------------------------------------------------------------------
export function InsightsFeed({ token, onInsightsLoaded, className = "" }: InsightsFeedProps) {
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedEvidence, setExpandedEvidence] = useState<Record<string, boolean>>({});
  const [dismissingIds, setDismissingIds] = useState<Record<string, boolean>>({});

  // Fetch active insights
  const fetchInsights = useCallback(async () => {
    setError(null);
    try {
      const data = await getInsights(token);
      const active = (data || []).filter((i) => !i.dismissed);
      setInsights(active);
      onInsightsLoaded?.(active);
    } catch (err: any) {
      console.error("[InsightsFeed] Load error:", err);
      setError(
        err?.message && !err.message.includes("[object")
          ? err.message
          : "Insights are taking a coffee break."
      );
    } finally {
      setLoading(false);
    }
  }, [token, onInsightsLoaded]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  // Generate / Refresh Insights
  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      await generateInsights(token);
      await fetchInsights();
    } catch (err: any) {
      console.error("[InsightsFeed] Generate error:", err);
      setError(
        err?.message && !err.message.includes("[object")
          ? err.message
          : "Couldn't refresh insights right now. Please try again."
      );
    } finally {
      setRefreshing(false);
    }
  };

  // Dismiss Insight
  const handleDismiss = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (dismissingIds[id]) return;

    setDismissingIds((prev) => ({ ...prev, [id]: true }));

    try {
      await dismissInsight(token, id);
      setInsights((prev) => {
        const next = prev.filter((item) => item.id !== id);
        onInsightsLoaded?.(next);
        return next;
      });
    } catch (err: any) {
      console.error("[InsightsFeed] Dismiss error:", err);
      setError("Failed to dismiss insight. Please try again.");
    } finally {
      setDismissingIds((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
  };

  const toggleEvidence = (id: string) => {
    setExpandedEvidence((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter out any dismissed items in memory
  const visibleInsights = useMemo(() => {
    return insights.filter((i) => !i.dismissed);
  }, [insights]);

  return (
    <section
      id="insights-feed"
      aria-label="Pattern Intelligence Feed"
      className={`rounded-2xl border border-[#DDD9CF] bg-[#FFFDF8] p-3.5 sm:p-5 shadow-sm transition-all ${className}`}
    >
      {/* 1. EDITORIAL HEADER & STICKER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5DAC4]/60 pb-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#18122B] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
              <span>✦</span>
              <span>MONEY INTEL</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-900 shadow-2xs">
              <span>money tea</span>
              <span>☕</span>
            </span>
            {refreshing && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#84cc16] animate-pulse">
                <span>Finding the tea…</span>
                <span className="animate-spin">✦</span>
              </span>
            )}
          </div>
          <h2 className="font-serif text-lg sm:text-xl font-black tracking-tight text-[#18122B]">
            WHAT YOUR MONEY IS SAYING
          </h2>
          <p className="text-xs text-[#18122B]/65 font-medium mt-0.5">
            Patterns, leaks, subscriptions &amp; little red flags — all in one place.
          </p>
        </div>

        {/* Refresh Action Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            aria-label="Refresh insights"
            className="group inline-flex items-center justify-center gap-1.5 rounded-full border border-[#DDD9CF] bg-white px-3.5 py-1.5 text-xs font-bold text-[#18122B] shadow-2xs hover:bg-[#FAF7F2] hover:border-[#18122B]/40 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <span className={`transition-transform duration-500 ${refreshing ? "animate-spin" : "group-hover:rotate-180"}`}>
              ↺
            </span>
            <span>{refreshing ? "Refreshing…" : "Refresh insights"}</span>
          </button>
        </div>
      </div>

      {/* 2. ERROR ALERT */}
      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span className="font-medium">{error}</span>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="rounded-lg bg-rose-700 px-3 py-1 text-xs font-bold text-white hover:bg-rose-800 transition cursor-pointer shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* 3. LOADING SKELETON (NON-BLOCKING) */}
      {loading ? (
        <div className="space-y-3 py-2">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="rounded-xl border border-[#E5DAC4]/60 bg-[#FAF8F5] p-4 animate-pulse"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="h-4 w-28 rounded-full bg-stone-200" />
                <div className="h-4 w-4 rounded-full bg-stone-200" />
              </div>
              <div className="h-4 w-3/4 rounded bg-stone-200 mb-2" />
              <div className="h-3 w-1/2 rounded bg-stone-200" />
            </div>
          ))}
        </div>
      ) : visibleInsights.length === 0 ? (
        /* 4. EMPTY STATE */
        <div className="rounded-xl border border-dashed border-[#DDD9CF] bg-[#FAF8F5] p-8 text-center shadow-2xs my-2">
          <div className="mx-auto w-10 h-10 rounded-full bg-amber-400/20 flex items-center justify-center text-lg mb-2">
            👀
          </div>
          <h3 className="font-serif text-base font-bold text-[#18122B]">
            NO MONEY TEA YET ✦
          </h3>
          <p className="text-xs text-[#18122B]/60 max-w-sm mx-auto mt-1 font-medium">
            Your wallet is being suspiciously quiet. Run the pattern detector to uncover spending rhythms.
          </p>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-[#18122B] px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-stone-800 transition active:scale-95 cursor-pointer"
          >
            <span>{refreshing ? "Finding patterns…" : "Refresh insights"}</span>
            <span className="text-[#84cc16]">→</span>
          </button>
        </div>
      ) : (
        /* 5. ACTIVE INSIGHTS GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {visibleInsights.map((insight) => {
            const typeKey = (insight.type || "pattern").toLowerCase();
            const config = TYPE_CONFIGS[typeKey] || DEFAULT_CONFIG;
            const isExpanded = !!expandedEvidence[insight.id];
            const isDismissing = !!dismissingIds[insight.id];
            const evidence = insight.evidence;
            const hasEvidence =
              evidence &&
              (typeof evidence === "object"
                ? Object.keys(evidence).length > 0
                : String(evidence).trim().length > 0);

            return (
              <div
                key={insight.id}
                className={`relative rounded-xl border p-4 shadow-2xs transition-all duration-200 flex flex-col justify-between ${config.borderClass} ${config.bgClass} ${
                  isDismissing ? "opacity-40 scale-98 pointer-events-none" : "hover:shadow-sm"
                }`}
              >
                <div>
                  {/* Top Bar: Type Badge, Sticker Pill & Dismiss Action */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black tracking-wider uppercase ${config.badgeClass}`}
                      >
                        <span>{config.icon}</span>
                        <span>{config.label}</span>
                      </span>

                      <span className="inline-flex items-center rounded-full bg-white/90 border border-stone-200/80 px-2 py-0.5 text-[9px] font-bold text-stone-700 shadow-2xs">
                        {config.sticker}
                      </span>
                    </div>

                    {/* Dismiss Button */}
                    <button
                      type="button"
                      onClick={(e) => handleDismiss(insight.id, e)}
                      disabled={isDismissing}
                      aria-label={`Dismiss insight: ${insight.title}`}
                      className="rounded-full p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <span className="text-xs font-bold leading-none">&times;</span>
                    </button>
                  </div>

                  {/* Title & Primary Description */}
                  <h4 className="font-serif text-sm sm:text-base font-bold text-[#18122B] leading-tight tracking-tight">
                    {insight.title}
                  </h4>

                  {(insight.message || insight.description) && (
                    <p className="mt-1 text-xs text-[#18122B]/75 leading-relaxed font-medium">
                      {insight.message || insight.description}
                    </p>
                  )}

                  {/* Category Tag if available */}
                  {insight.category && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-stone-500 font-mono">
                      <span className="font-semibold uppercase tracking-wider text-stone-400">Category:</span>
                      <span className="rounded bg-white/80 border border-stone-200/60 px-1.5 py-0.2 font-bold text-[#18122B]">
                        {insight.category}
                      </span>
                    </div>
                  )}
                </div>

                {/* Evidence Section */}
                {hasEvidence && (
                  <div className="mt-3 pt-2.5 border-t border-stone-200/60">
                    <button
                      type="button"
                      onClick={() => toggleEvidence(insight.id)}
                      aria-expanded={isExpanded}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#18122B]/70 hover:text-[#18122B] transition cursor-pointer"
                    >
                      <span>{isExpanded ? "Hide evidence" : "Show evidence"}</span>
                      <span className="text-[10px] transition-transform duration-200">
                        {isExpanded ? "▲" : "▼"}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="mt-2 rounded-lg bg-white/90 border border-stone-200/70 p-2.5 text-xs shadow-2xs animate-in fade-in">
                        <span className="text-[9px] font-black uppercase tracking-wider text-stone-400 block mb-1.5">
                          ✦ EVIDENCE LEDGER
                        </span>

                        {typeof evidence === "object" && !Array.isArray(evidence) ? (
                          <div className="space-y-1 text-[11px]">
                            {Object.entries(evidence).map(([key, val]) => (
                              <div
                                key={key}
                                className="flex items-center justify-between gap-2 border-b border-stone-100 pb-0.5 last:border-b-0"
                              >
                                <span className="text-stone-500 font-medium truncate">
                                  {formatEvidenceKey(key)}
                                </span>
                                <span className="font-serif font-bold text-[#18122B] tabular-nums shrink-0">
                                  {formatEvidenceValue(key, val)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : Array.isArray(evidence) ? (
                          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#18122B]/80">
                            {evidence.map((item, idx) => (
                              <li key={idx} className="truncate">
                                {typeof item === "object" ? JSON.stringify(item) : String(item)}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[11px] text-[#18122B]/80 font-mono">
                            {String(evidence)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
