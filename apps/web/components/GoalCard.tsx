"use client";

import { useEffect, useState, useMemo } from "react";
import { createGoal, deleteGoal, getGoals } from "@/lib/api";
import { formatINR } from "@/lib/formatCurrency";

interface GoalItem {
  id: string;
  title: string;
  targetAmount: number | string;
  startDate?: string;
  endDate: string;
  createdAt?: string;
}

// Map goal titles to contextual icons and accent styles
function getGoalPersonality(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes("headphone") || lower.includes("airpod") || lower.includes("audio") || lower.includes("music")) {
    return { icon: "🎧", tag: "GEAR & AUDIO", accentBg: "bg-indigo-50/70", ringColor: "#6366f1", sticker: "🎵" };
  }
  if (lower.includes("car") || lower.includes("bike") || lower.includes("vehicle") || lower.includes("drive")) {
    return { icon: "🚗", tag: "WHEELS & RIDE", accentBg: "bg-amber-50/70", ringColor: "#f59e0b", sticker: "🏎️" };
  }
  if (lower.includes("emergency") || lower.includes("shield") || lower.includes("safety") || lower.includes("rainy")) {
    return { icon: "🛡️", tag: "SAFETY SHIELD", accentBg: "bg-emerald-50/70", ringColor: "#10b981", sticker: "🛡️" };
  }
  if (lower.includes("travel") || lower.includes("trip") || lower.includes("vacation") || lower.includes("flight") || lower.includes("japan") || lower.includes("europe")) {
    return { icon: "✈️", tag: "WANDERLUST", accentBg: "bg-cyan-50/70", ringColor: "#06b6d4", sticker: "🌏" };
  }
  if (lower.includes("laptop") || lower.includes("phone") || lower.includes("tech") || lower.includes("macbook") || lower.includes("ipad")) {
    return { icon: "💻", tag: "TECH UPGRADE", accentBg: "bg-violet-50/70", ringColor: "#8b5cf6", sticker: "⚡" };
  }
  if (lower.includes("home") || lower.includes("house") || lower.includes("rent") || lower.includes("decor") || lower.includes("flat")) {
    return { icon: "🏠", tag: "SANCTUARY", accentBg: "bg-rose-50/70", ringColor: "#f43f5e", sticker: "🪴" };
  }
  return { icon: "🎯", tag: "MONEY MISSION", accentBg: "bg-lime-50/70", ringColor: "#84cc16", sticker: "✨" };
}

// Local storage helper for client-side tracked contributions
function getGoalSaved(id: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(`finsage_goal_savings_${id}`);
    return raw ? parseFloat(raw) || 0 : 0;
  } catch {
    return 0;
  }
}

function setGoalSaved(id: string, amount: number) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`finsage_goal_savings_${id}`, String(Math.max(0, amount)));
  } catch {
    // ignore
  }
}

export function GoalCard({ token }: { token: string }) {
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<GoalItem | null>(null);
  const [contributionInput, setContributionInput] = useState("");

  // New goal form state
  const [form, setForm] = useState({ title: "", targetAmount: "", endDate: "" });
  const [creating, setCreating] = useState(false);

  // Local savings version tracker to trigger re-renders on contribution updates
  const [savingsVersion, setSavingsVersion] = useState(0);

  function showMessage(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(null), 2500);
  }

  async function load() {
    setLoading(true);
    try {
      const data = await getGoals(token);
      if (Array.isArray(data)) {
        setGoals(data);
      }
    } catch (e) {
      console.error("[GoalCard load] error:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  async function handleCreate() {
    if (!form.title || !form.targetAmount || !form.endDate) return;
    setCreating(true);
    try {
      await createGoal(token, {
        title: form.title.trim(),
        targetAmount: Number(form.targetAmount),
        endDate: new Date(form.endDate).toISOString(),
      });
      setForm({ title: "", targetAmount: "", endDate: "" });
      setIsNewModalOpen(false);
      showMessage("Mission Established ✨");
      load();
    } catch (e: any) {
      console.error(e);
      showMessage("Failed to create mission");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteGoal(token, id);
      if (selectedGoal?.id === id) {
        setSelectedGoal(null);
      }
      showMessage("Mission Retired");
      load();
    } catch (e: any) {
      console.error(e);
      showMessage("Failed to delete mission");
    }
  }

  function handleAddContribution(goalId: string, delta: number) {
    const current = getGoalSaved(goalId);
    const next = current + delta;
    setGoalSaved(goalId, next);
    setSavingsVersion((v) => v + 1);
    showMessage(`Added ${formatINR(delta)} to mission!`);
    setContributionInput("");
  }

  // Summary statistics calculated from real goals data
  const summary = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _v = savingsVersion; // dependency
    let totalTarget = 0;
    let totalSaved = 0;
    let urgentGoals = 0;
    const now = Date.now();

    goals.forEach((g) => {
      const t = Number(g.targetAmount) || 0;
      totalTarget += t;
      const s = getGoalSaved(g.id);
      totalSaved += s;

      const diffDays = Math.ceil((new Date(g.endDate).getTime() - now) / (1000 * 60 * 60 * 24));
      if (diffDays <= 14 && diffDays >= 0) {
        urgentGoals += 1;
      }
    });

    const remaining = Math.max(0, totalTarget - totalSaved);
    const overallPct = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

    return {
      totalGoals: goals.length,
      totalTarget,
      totalSaved,
      remaining,
      overallPct,
      urgentGoals,
    };
  }, [goals, savingsVersion]);

  // Insight sticker derived from real goals
  const insightText = useMemo(() => {
    if (goals.length === 0) return null;
    const now = Date.now();
    // find goal with closest deadline
    const sorted = [...goals].sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
    const closest = sorted[0];
    const diffDays = Math.ceil((new Date(closest.endDate).getTime() - now) / (1000 * 60 * 60 * 24));
    const saved = getGoalSaved(closest.id);
    const target = Number(closest.targetAmount) || 0;
    const diff = Math.max(0, target - saved);

    if (diffDays < 0) {
      return `"${closest.title}" is past its target date. Time for a quick reset!`;
    }
    if (saved > 0 && diff > 0) {
      return `You're ${formatINR(diff)} away from your "${closest.title}" mission.`;
    }
    return `Next milestone: "${closest.title}" target date arrives in ${diffDays} days.`;
  }, [goals, savingsVersion]);

  return (
    <div className="space-y-4">
      {/* 1. EDITORIAL HERO HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-200/80 pb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-lime-400/25 border border-lime-500/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#18122B]">
              ✦ YOUR NEXT MOVE
            </span>
            {message && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 animate-in fade-in">
                ✓ {message}
              </span>
            )}
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#18122B]">
            MONEY MISSIONS.
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 font-medium">
            Give your money somewhere to go. Set targets, fund milestones, and celebrate the wins.
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full bg-[#18122B] px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-stone-800 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
        >
          <span>✦</span>
          <span>+ New Goal</span>
          <span className="text-lime-400 font-bold">→</span>
        </button>
      </div>

      {/* 2. SAVINGS SNAPSHOT CARD */}
      <div className="rounded-[22px] border border-stone-200/90 bg-[#FFFDF8] p-4 sm:p-5 shadow-sm transition">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 flex-1">
            <div>
              <p className="text-[10px] font-bold tracking-wider uppercase text-stone-400">
                TOTAL MISSIONS
              </p>
              <p className="font-serif text-2xl sm:text-3xl font-bold text-[#18122B] mt-0.5">
                {summary.totalGoals}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold tracking-wider uppercase text-stone-400">
                TOTAL TARGET
              </p>
              <p className="font-serif text-xl sm:text-2xl font-bold text-[#18122B] mt-0.5">
                {formatINR(summary.totalTarget)}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold tracking-wider uppercase text-stone-400">
                FUNDS ALLOCATED
              </p>
              <p className="font-serif text-xl sm:text-2xl font-bold text-lime-700 mt-0.5">
                {formatINR(summary.totalSaved)}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold tracking-wider uppercase text-stone-400">
                REMAINING TO GO
              </p>
              <p className="font-serif text-xl sm:text-2xl font-bold text-stone-600 mt-0.5">
                {formatINR(summary.remaining)}
              </p>
            </div>
          </div>

          {/* Smart Insight Sticker */}
          {insightText && (
            <div className="self-stretch lg:self-center flex items-center gap-2 rounded-[16px] bg-amber-50/80 border border-amber-200/80 px-3.5 py-2.5 lg:max-w-md">
              <span className="text-sm">⚡</span>
              <p className="text-xs font-semibold text-amber-900 leading-tight">
                <span className="font-bold tracking-wide uppercase text-amber-800 text-[10px] mr-1 block sm:inline">
                  ✦ MONEY MOVE:
                </span>
                {insightText}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3. GOALS GRID OR EMPTY STATE */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-[#18122B] border-t-transparent mb-3" />
          <p className="font-serif text-sm italic text-stone-500">
            Summoning your active money missions…
          </p>
        </div>
      ) : goals.length === 0 ? (
        /* 10. PLAYFUL EMPTY STATE */
        <div className="rounded-[24px] border border-dashed border-stone-300 bg-[#FFFDF8] p-8 sm:p-12 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-lime-400/30 flex items-center justify-center text-2xl mb-4 shadow-sm">
            🎯
          </div>
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#18122B] tracking-tight">
            YOUR MONEY NEEDS A MISSION.
          </h3>
          <p className="mt-1.5 text-xs sm:text-sm text-stone-500 max-w-md mx-auto font-medium">
            Set your first target and give those rupees somewhere to go. From dream gadgets to emergency shields, track it all in one view.
          </p>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#18122B] px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-stone-800 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
          >
            <span>+ Create your first goal</span>
            <span className="text-lime-400 font-bold">✨</span>
          </button>
        </div>
      ) : (
        /* 3. COLLECTIBLE GOAL CARDS GRID */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((g) => {
            const personality = getGoalPersonality(g.title);
            const target = Number(g.targetAmount) || 0;
            const saved = getGoalSaved(g.id);
            const remaining = Math.max(0, target - saved);

            // Progress percentage: if saved is recorded use (saved/target), else calculate timeline progress
            const now = Date.now();
            const end = new Date(g.endDate).getTime();
            const start = g.startDate ? new Date(g.startDate).getTime() : now - 1000 * 60 * 60 * 24 * 7;
            const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

            let pct = 0;
            if (saved > 0 && target > 0) {
              pct = Math.min(100, Math.round((saved / target) * 100));
            } else if (end > start) {
              const elapsed = now - start;
              const total = end - start;
              pct = Math.max(5, Math.min(95, Math.round((elapsed / total) * 100)));
            } else {
              pct = 30;
            }

            // Playful status label logic
            let statusBadge = {
              pill: "✦ ON TRACK",
              micro: "You're cooking.",
              bg: "bg-lime-400/25 border-lime-500/40 text-lime-900",
            };
            if (diffDays < 0) {
              statusBadge = {
                pill: "OVERDUE",
                micro: "Okay... we need a reset.",
                bg: "bg-rose-50 border-rose-200 text-rose-800",
              };
            } else if (pct >= 100) {
              statusBadge = {
                pill: "COMPLETED",
                micro: "Mission complete.",
                bg: "bg-emerald-50 border-emerald-300 text-emerald-800",
              };
            } else if (diffDays <= 14 && pct < 50) {
              statusBadge = {
                pill: "WATCH",
                micro: "Getting a little close.",
                bg: "bg-amber-50 border-amber-300 text-amber-800",
              };
            } else if (saved === 0) {
              statusBadge = {
                pill: "STANDBY",
                micro: "Needs a tiny push.",
                bg: "bg-purple-50 border-purple-200 text-purple-800",
              };
            }

            // Deadline badge calculation
            let deadlineText = "";
            let deadlineStyle = "text-stone-500 bg-stone-100/80 border-stone-200";
            if (diffDays < 0) {
              deadlineText = "! PAST TARGET";
              deadlineStyle = "text-rose-700 bg-rose-50 border-rose-200 font-bold";
            } else if (diffDays <= 14) {
              deadlineText = `⚡ ${diffDays} DAYS LEFT`;
              deadlineStyle = "text-amber-800 bg-amber-50 border-amber-200 font-bold";
            } else {
              const formattedDate = new Date(g.endDate)
                .toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
                .toUpperCase();
              deadlineText = `${formattedDate} · ${diffDays}D LEFT`;
            }

            return (
              <div
                key={g.id}
                onClick={() => setSelectedGoal(g)}
                className="group relative flex flex-col justify-between rounded-[22px] border border-stone-200/80 bg-[#FFFDF8] p-4 sm:p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:border-stone-300 cursor-pointer overflow-hidden"
              >
                {/* Top Bar: Tag, Icon, Sticker */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg p-1.5 rounded-xl bg-stone-100/90 shadow-2xs">
                        {personality.icon}
                      </span>
                      <span className="text-[10px] font-bold tracking-wider uppercase text-stone-500">
                        {personality.tag}
                      </span>
                    </div>

                    <span className="text-xs opacity-70 group-hover:scale-110 transition duration-150">
                      {personality.sticker}
                    </span>
                  </div>

                  {/* Goal Title */}
                  <h3 className="font-serif text-lg font-bold text-[#18122B] tracking-tight line-clamp-1">
                    {g.title}
                  </h3>

                  {/* Circular Progress & Target Breakdown */}
                  <div className="mt-4 flex items-center justify-between gap-3">
                    {/* SVG Circular Progress Ring */}
                    <div className="relative flex items-center justify-center shrink-0">
                      <svg className="h-16 w-16 -rotate-90 transform" viewBox="0 0 64 64">
                        <circle
                          cx="32"
                          cy="32"
                          r="26"
                          stroke="currentColor"
                          strokeWidth="6"
                          className="text-stone-100"
                          fill="transparent"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="26"
                          stroke={personality.ringColor}
                          strokeWidth="6"
                          strokeDasharray={2 * Math.PI * 26}
                          strokeDashoffset={2 * Math.PI * 26 * (1 - Math.min(100, Math.max(0, pct)) / 100)}
                          strokeLinecap="round"
                          className="transition-all duration-700 ease-out"
                          fill="transparent"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="font-serif text-sm font-bold text-[#18122B]">
                          {pct}%
                        </span>
                      </div>
                    </div>

                    {/* Financial Amounts */}
                    <div className="text-right flex-1">
                      <p className="font-serif text-xl sm:text-2xl font-bold text-[#18122B] tabular-nums">
                        {formatINR(target)}
                      </p>
                      <p className="text-[11px] font-medium text-stone-500">
                        {saved > 0 ? (
                          <>
                            <span className="text-lime-700 font-semibold">{formatINR(saved)}</span> saved
                          </>
                        ) : (
                          `${formatINR(0)} allocated`
                        )}
                      </p>
                      <p className="text-[10px] font-semibold text-stone-400 mt-0.5">
                        {formatINR(remaining)} to go
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Bar: Status Pill, Deadline, Action Arrow */}
                <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusBadge.bg}`}
                    >
                      {statusBadge.pill}
                    </span>
                    <span className="text-[10px] text-stone-400 italic mt-0.5 pl-0.5">
                      {statusBadge.micro}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] uppercase font-semibold ${deadlineStyle}`}
                    >
                      {deadlineText}
                    </span>
                    <span className="h-6 w-6 rounded-full bg-stone-100 flex items-center justify-center text-xs text-stone-600 group-hover:bg-[#18122B] group-hover:text-white transition">
                      →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 7. NEW GOAL MODAL */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-[26px] border border-stone-200/80 bg-[#FAF7F2] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
              <div>
                <span className="text-[10px] font-bold tracking-widest uppercase text-lime-800 bg-lime-400/25 px-2 py-0.5 rounded-full border border-lime-500/30">
                  ✦ NEW TARGET
                </span>
                <h3 className="mt-1 font-serif text-xl font-bold text-[#18122B]">
                  ESTABLISH MONEY MISSION
                </h3>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="rounded-full p-1.5 text-stone-400 hover:bg-stone-200/60 hover:text-[#18122B] transition"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Mission Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Noise Cancelling Headphones, Roadtrip..."
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm text-[#18122B] placeholder:text-stone-400 focus:border-[#18122B] focus:outline-none focus:ring-1 focus:ring-[#18122B]/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Target Amount (₹)
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 font-serif font-bold text-stone-400 text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    value={form.targetAmount}
                    onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                    className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-7 pr-3 text-sm text-[#18122B] font-serif font-bold placeholder:text-stone-400 focus:border-[#18122B] focus:outline-none focus:ring-1 focus:ring-[#18122B]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Target Date
                </label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm text-[#18122B] focus:border-[#18122B] focus:outline-none focus:ring-1 focus:ring-[#18122B]/20"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-stone-200/80">
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={!form.title || !form.targetAmount || !form.endDate || creating}
                className="rounded-full bg-[#18122B] px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-stone-800 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1.5"
              >
                {creating ? "Establishing…" : "Create Mission →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. GOAL DETAIL & INTERACTION MODAL */}
      {selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-[26px] border border-stone-200/80 bg-[#FAF7F2] p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl p-2 rounded-2xl bg-white shadow-xs">
                  {getGoalPersonality(selectedGoal.title).icon}
                </span>
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-stone-400">
                    {getGoalPersonality(selectedGoal.title).tag}
                  </span>
                  <h3 className="font-serif text-xl font-bold text-[#18122B]">
                    {selectedGoal.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedGoal(null)}
                className="rounded-full p-1.5 text-stone-400 hover:bg-stone-200/60 hover:text-[#18122B] transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            {(() => {
              const target = Number(selectedGoal.targetAmount) || 0;
              const saved = getGoalSaved(selectedGoal.id);
              const remaining = Math.max(0, target - saved);
              const pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
              const now = Date.now();
              const end = new Date(selectedGoal.endDate).getTime();
              const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

              return (
                <div className="mt-4 space-y-4">
                  {/* Big Circular Progress Visual */}
                  <div className="flex items-center justify-around rounded-2xl bg-white p-4 border border-stone-200/70">
                    <div className="relative flex items-center justify-center">
                      <svg className="h-20 w-20 -rotate-90 transform" viewBox="0 0 64 64">
                        <circle
                          cx="32"
                          cy="32"
                          r="26"
                          stroke="currentColor"
                          strokeWidth="6"
                          className="text-stone-100"
                          fill="transparent"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="26"
                          stroke={getGoalPersonality(selectedGoal.title).ringColor}
                          strokeWidth="6"
                          strokeDasharray={2 * Math.PI * 26}
                          strokeDashoffset={2 * Math.PI * 26 * (1 - pct / 100)}
                          strokeLinecap="round"
                          className="transition-all duration-700 ease-out"
                          fill="transparent"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="font-serif text-base font-bold text-[#18122B]">
                          {pct}%
                        </span>
                        <span className="text-[9px] font-bold text-stone-400 uppercase">
                          SAVED
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div>
                        <span className="text-[10px] font-bold text-stone-400 uppercase">
                          TARGET AMOUNT
                        </span>
                        <p className="font-serif text-xl font-bold text-[#18122B]">
                          {formatINR(target)}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-stone-400 uppercase">
                          STASHED SO FAR
                        </span>
                        <p className="font-serif text-lg font-bold text-lime-700">
                          {formatINR(saved)}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-stone-400 uppercase">
                          DEADLINE
                        </span>
                        <p className="text-xs font-semibold text-stone-600">
                          {new Date(selectedGoal.endDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}{" "}
                          ({diffDays > 0 ? `${diffDays} days left` : "Past target"})
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Add Money Interactive Section */}
                  <div className="rounded-2xl bg-white p-4 border border-stone-200/70">
                    <p className="text-[11px] font-bold tracking-wider uppercase text-[#18122B] mb-2">
                      ✦ ADD SAVINGS TO THIS MISSION
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {[500, 1000, 2500, 5000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => handleAddContribution(selectedGoal.id, amt)}
                          className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-semibold text-[#18122B] hover:bg-lime-400/30 hover:border-lime-500/40 transition cursor-pointer"
                        >
                          + {formatINR(amt)}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 font-serif font-bold text-stone-400 text-xs">
                          ₹
                        </span>
                        <input
                          type="number"
                          placeholder="Custom amount"
                          value={contributionInput}
                          onChange={(e) => setContributionInput(e.target.value)}
                          className="w-full rounded-xl border border-stone-200 bg-[#FAF7F2] py-1.5 pl-6 pr-3 text-xs text-[#18122B] font-serif font-semibold focus:border-[#18122B] focus:outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const val = parseFloat(contributionInput);
                          if (!isNaN(val) && val > 0) {
                            handleAddContribution(selectedGoal.id, val);
                          }
                        }}
                        disabled={!contributionInput || parseFloat(contributionInput) <= 0}
                        className="rounded-xl bg-[#18122B] px-4 py-1.5 text-xs font-semibold text-white hover:bg-stone-800 disabled:opacity-40 transition cursor-pointer"
                      >
                        Add Money →
                      </button>
                    </div>
                  </div>

                  {/* Modal Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-stone-200/80">
                    <button
                      type="button"
                      onClick={() => handleDelete(selectedGoal.id)}
                      className="rounded-full border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                    >
                      Delete Mission
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedGoal(null)}
                      className="rounded-full bg-[#18122B] px-5 py-1.5 text-xs font-semibold text-white hover:bg-stone-800 transition cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
