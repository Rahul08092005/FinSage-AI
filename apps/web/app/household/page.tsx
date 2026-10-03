"use client";

import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import {
  createHousehold,
  inviteToHousehold,
  getHouseholdSummary,
  HouseholdSummary,
} from "@/lib/api";
import { formatINR } from "@/lib/formatCurrency";

function HouseholdContent({ token }: { token: string }) {
  const [summary, setSummary] = useState<HouseholdSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Creation form state
  const [householdName, setHouseholdName] = useState("");
  const [creatingHousehold, setCreatingHousehold] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const loadHousehold = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHouseholdSummary(token);
      setSummary(data);
    } catch (err: any) {
      console.error("[HouseholdPage] Load error:", err);
      setError("Failed to load household summary.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadHousehold();
  }, [loadHousehold]);

  async function handleCreateHousehold(e: React.FormEvent) {
    e.preventDefault();
    if (!householdName.trim()) return;
    setCreatingHousehold(true);
    setCreateError(null);
    try {
      await createHousehold(token, householdName.trim());
      setHouseholdName("");
      await loadHousehold();
    } catch (err: any) {
      setCreateError(err?.message || "Failed to create household.");
    } finally {
      setCreatingHousehold(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim() || !summary?.householdId) return;
    setInviting(true);
    setInviteError(null);
    setInviteMessage(null);
    try {
      await inviteToHousehold(token, summary.householdId, inviteEmail.trim());
      setInviteMessage(`Invitation sent to ${inviteEmail.trim()} ✨`);
      setInviteEmail("");
      await loadHousehold();
      setTimeout(() => setInviteMessage(null), 3500);
    } catch (err: any) {
      setInviteError(err?.message || "Failed to send invitation.");
    } finally {
      setInviting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E5DAC4] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#84cc16]/20 border border-[#84cc16]/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#3f6212]">
              ✦ HOUSEHOLD MONEY
            </span>
            <span className="text-[11px] font-mono text-stone-500">
              One ledger, shared view.
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-black tracking-tight text-[#18122B]">
            SHARED HOUSEHOLD SPENDING
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 font-medium mt-0.5">
            Household members share this spending view to track collective monthly outflow.
          </p>
        </div>

        {summary && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="rounded-full bg-[#FAF8F5] border border-[#E5DAC4] px-3 py-1 text-[11px] font-mono text-stone-600">
              {summary.memberBreakdown.length} Member{summary.memberBreakdown.length === 1 ? "" : "s"}
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-8 text-center">
          <div className="mx-auto w-8 h-8 rounded-full bg-lime-400/20 flex items-center justify-center text-sm animate-spin mb-2">
            ✦
          </div>
          <p className="text-xs text-stone-500 font-medium">Loading household records…</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
          <p className="text-xs font-bold text-rose-800">{error}</p>
          <button
            type="button"
            onClick={loadHousehold}
            className="mt-3 inline-flex items-center gap-1 rounded-full bg-rose-700 px-3.5 py-1 text-xs font-bold text-white hover:bg-rose-800"
          >
            ↺ Retry
          </button>
        </div>
      ) : !summary ? (
        /* STATE A: NO HOUSEHOLD YET */
        <div className="rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-6 sm:p-8 shadow-xs max-w-xl mx-auto">
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 rounded-full bg-[#84cc16]/20 border border-[#84cc16]/30 flex items-center justify-center text-2xl mb-3">
              🏡
            </div>
            <h2 className="font-serif text-xl font-bold text-[#18122B]">
              Create Your Shared Household
            </h2>
            <p className="text-xs text-stone-500 font-medium max-w-sm mx-auto mt-1">
              Combine shared expenses and track household member contributions in one unified ledger view.
            </p>
          </div>

          <form onSubmit={handleCreateHousehold} className="space-y-4">
            {createError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                {createError}
              </div>
            )}

            <div>
              <label
                htmlFor="household-name-input"
                className="block text-xs font-bold text-[#18122B] mb-1.5"
              >
                Household Name
              </label>
              <input
                id="household-name-input"
                type="text"
                placeholder="e.g. Bangalore Apartment, The Sharma House"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                className="w-full rounded-xl border border-[#E5DAC4] bg-white px-4 py-2.5 text-xs font-medium text-[#18122B] placeholder:text-stone-400 focus:border-[#84cc16] focus:outline-none shadow-2xs"
              />
            </div>

            <button
              type="submit"
              disabled={creatingHousehold || !householdName.trim()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#18122B] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-stone-800 disabled:opacity-50 transition cursor-pointer"
            >
              {creatingHousehold ? (
                <>
                  <span className="animate-spin text-xs">✦</span>
                  <span>Creating Household…</span>
                </>
              ) : (
                <>
                  <span>Create Household</span>
                  <span className="text-[#84cc16]">&rarr;</span>
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        /* STATE B: ACTIVE HOUSEHOLD SUMMARY & INVITE VIEW */
        <div className="space-y-6">
          {/* Top Metric Strip: Total Spend Hero */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-6 rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-5 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#18122B]/70 block mb-1">
                  ✦ {summary.name || "SHARED HOUSEHOLD"}
                </span>
                <span className="text-xs text-stone-500 font-medium">Total Household Monthly Spend</span>
                <div className="font-serif text-3xl sm:text-4xl font-black text-[#18122B] mt-1 tracking-tight">
                  {formatINR(summary.totalSpend)}
                </div>
              </div>
              <p className="text-[11px] text-stone-400 mt-3 font-mono">
                Aggregated across {summary.memberBreakdown.length} registered member{summary.memberBreakdown.length === 1 ? "" : "s"}
              </p>
            </div>

            {/* Invite Form Card */}
            <div className="md:col-span-6 rounded-2xl border border-[#E5DAC4] bg-[#FAF8F5] p-5 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#18122B]/70 block mb-1">
                  ✦ INVITE A HOUSEHOLD MEMBER
                </span>
                <p className="text-xs text-stone-500 font-medium mb-3">
                  Invite a housemate or partner to share this spending ledger.
                </p>

                <form onSubmit={handleInvite} className="space-y-2">
                  {inviteMessage && (
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs text-emerald-800 font-medium">
                      {inviteMessage}
                    </div>
                  )}
                  {inviteError && (
                    <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-1.5 text-xs text-rose-800">
                      {inviteError}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="partner@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="flex-1 rounded-xl border border-[#E5DAC4] bg-white px-3.5 py-2 text-xs text-[#18122B] placeholder:text-stone-400 focus:outline-none focus:border-[#84cc16]"
                    />
                    <button
                      type="submit"
                      disabled={inviting || !inviteEmail.trim()}
                      className="rounded-xl bg-[#18122B] px-4 py-2 text-xs font-bold text-white hover:bg-stone-800 disabled:opacity-50 transition cursor-pointer shrink-0"
                    >
                      {inviting ? "Inviting…" : "Invite"}
                    </button>
                  </div>
                </form>
              </div>

              <span className="text-[10px] text-stone-400 font-mono mt-3">
                Household members share this spending view.
              </span>
            </div>
          </div>

          {/* Per-Member Breakdown Table */}
          <div className="rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#E5DAC4]/60 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#18122B]/70 block">
                  ✦ MEMBER LEDGER
                </span>
                <h3 className="font-serif text-base font-bold text-[#18122B]">
                  Per-Member Spending Breakdown
                </h3>
              </div>
              <span className="text-[10px] font-mono text-stone-400">
                Shared View
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5DAC4]/80 text-[10px] font-black uppercase tracking-wider text-stone-400">
                    <th className="pb-2.5 pr-4">MEMBER</th>
                    <th className="pb-2.5 pr-4">EMAIL</th>
                    <th className="pb-2.5 pr-4 text-right">SPEND</th>
                    <th className="pb-2.5 text-right">% OF TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs">
                  {summary.memberBreakdown.map((member) => {
                    const sharePct = summary.totalSpend > 0 ? Math.round((member.spend / summary.totalSpend) * 100) : 0;

                    return (
                      <tr key={member.id} className="hover:bg-[#FAF8F5]/80 transition">
                        <td className="py-3 pr-4 font-bold text-[#18122B]">
                          {member.name}
                        </td>
                        <td className="py-3 pr-4 font-mono text-stone-500 text-[11px]">
                          {member.email}
                        </td>
                        <td className="py-3 pr-4 font-serif font-bold text-[#18122B] text-right">
                          {formatINR(member.spend)}
                        </td>
                        <td className="py-3 text-right font-mono font-semibold text-stone-600">
                          {sharePct}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E5DAC4]/60 flex items-center justify-between text-[10px] text-stone-400 font-mono">
              <span>One ledger &middot; Transparent household totals</span>
              <span>FinSage Shared Ledger</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HouseholdPage() {
  return (
    <AppShell hideHeader={true}>
      {(token) => <HouseholdContent token={token} />}
    </AppShell>
  );
}
