"use client";

import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import {
  createHousehold,
  inviteToHousehold,
  getHouseholdSummary,
  addHouseholdExpense,
  deleteHouseholdExpense,
  HouseholdSummary,
  HouseholdExpenseItem,
} from "@/lib/api";
import { formatINR } from "@/lib/formatCurrency";

const EXPENSE_CATEGORIES = [
  "Rent",
  "Utilities & Bills",
  "Groceries & Food",
  "Internet & WiFi",
  "Household Maintenance",
  "Supplies",
  "Other",
];

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
  const [inviteName, setInviteName] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Add Shared Expense Form state
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [expDescription, setExpDescription] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expCategory, setExpCategory] = useState("Rent");
  const [expDate, setExpDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [payerMemberId, setPayerMemberId] = useState("");
  const [splitMethod, setSplitMethod] = useState<"EQUAL" | "CUSTOM">("EQUAL");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [savingExpense, setSavingExpense] = useState(false);
  const [expenseError, setExpenseError] = useState<string | null>(null);

  // Deleting state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadHousehold = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHouseholdSummary(token);
      setSummary(data);
      if (data && data.memberBreakdown.length > 0) {
        // Default payer to first member if unset
        setPayerMemberId((prev) => prev || data.memberBreakdown[0].id);
        setSelectedParticipants(data.memberBreakdown.map((m) => m.id));
      }
    } catch (err: any) {
      console.error("[HouseholdPage] Load error:", err);
      setError("Failed to load household records.");
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
      await inviteToHousehold(token, summary.householdId, inviteEmail.trim(), inviteName.trim() || undefined);
      setInviteMessage(`Invitation sent to ${inviteEmail.trim()} ✨`);
      setInviteEmail("");
      setInviteName("");
      await loadHousehold();
      setTimeout(() => setInviteMessage(null), 4000);
    } catch (err: any) {
      setInviteError(err?.message || "Failed to send invitation.");
    } finally {
      setInviting(false);
    }
  }

  function handleOpenExpenseModal() {
    setExpenseError(null);
    setExpDescription("");
    setExpAmount("");
    setExpCategory("Rent");
    setExpDate(new Date().toISOString().split("T")[0]);
    if (summary && summary.memberBreakdown.length > 0) {
      setPayerMemberId(summary.memberBreakdown[0].id);
      setSelectedParticipants(summary.memberBreakdown.map((m) => m.id));
      const initialCustom: Record<string, string> = {};
      summary.memberBreakdown.forEach((m) => {
        initialCustom[m.id] = "";
      });
      setCustomSplits(initialCustom);
    }
    setSplitMethod("EQUAL");
    setIsAddingExpense(true);
  }

  async function handleSaveExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!summary?.householdId) return;
    setExpenseError(null);

    const cleanAmount = Number(expAmount.replace(/,/g, "").trim());
    if (!cleanAmount || cleanAmount <= 0 || isNaN(cleanAmount)) {
      setExpenseError("Please enter a valid positive expense amount.");
      return;
    }

    if (!expDescription.trim()) {
      setExpenseError("Please provide an expense description.");
      return;
    }

    if (!payerMemberId) {
      setExpenseError("Please choose who paid this bill.");
      return;
    }

    let splitsPayload: Array<{ memberId: string; allocatedAmount: number }> | undefined = undefined;

    if (splitMethod === "CUSTOM") {
      const splitsArray: Array<{ memberId: string; allocatedAmount: number }> = [];
      let sumCustom = 0;

      for (const member of summary.memberBreakdown) {
        const val = Number(customSplits[member.id]) || 0;
        sumCustom += val;
        splitsArray.push({ memberId: member.id, allocatedAmount: val });
      }

      if (Math.abs(sumCustom - cleanAmount) > 0.05) {
        setExpenseError(
          `Allocations total ₹${sumCustom.toLocaleString("en-IN")} but expense is ₹${cleanAmount.toLocaleString("en-IN")}. Please reconcile the difference.`
        );
        return;
      }
      splitsPayload = splitsArray;
    } else {
      if (selectedParticipants.length === 0) {
        setExpenseError("Please select at least one participating member.");
        return;
      }
    }

    setSavingExpense(true);
    try {
      await addHouseholdExpense(token, summary.householdId, {
        description: expDescription.trim(),
        amount: cleanAmount,
        category: expCategory,
        expenseDate: expDate ? new Date(expDate).toISOString() : new Date().toISOString(),
        payerMemberId,
        splitMethod,
        participatingMemberIds: splitMethod === "EQUAL" ? selectedParticipants : undefined,
        splits: splitsPayload,
      });

      setIsAddingExpense(false);
      await loadHousehold();
    } catch (err: any) {
      console.error("[HouseholdPage] Add expense error:", err);
      setExpenseError(err?.message || "Failed to record shared expense.");
    } finally {
      setSavingExpense(false);
    }
  }

  async function handleDeleteExpense(expenseId: string) {
    if (!summary?.householdId || deletingId) return;
    setDeletingId(expenseId);
    try {
      await deleteHouseholdExpense(token, summary.householdId, expenseId);
      await loadHousehold();
    } catch (err: any) {
      console.error("[HouseholdPage] Delete expense error:", err);
    } finally {
      setDeletingId(null);
    }
  }

  const numAmount = Number(expAmount.replace(/,/g, "")) || 0;
  const equalPerPerson =
    selectedParticipants.length > 0 && numAmount > 0
      ? (numAmount / selectedParticipants.length).toFixed(2)
      : "0";

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
            Record rent, utilities, groceries, and shared bills. Transparent splits for partners & roommates.
          </p>
        </div>

        {summary && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleOpenExpenseModal}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#84cc16] px-4 py-2 text-xs font-black text-[#18122B] shadow-sm hover:bg-[#a3e635] hover:scale-105 active:scale-95 transition cursor-pointer"
            >
              <span>+ Add Shared Expense</span>
            </button>
            <span className="rounded-full bg-[#FAF8F5] border border-[#E5DAC4] px-3 py-1.5 text-[11px] font-mono text-stone-600 font-bold">
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
        /* STATE B: ACTIVE HOUSEHOLD VIEW */
        <div className="space-y-6">
          {/* Top Metric Strip: Total Spend Hero & Invite Card */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Total Spend Card */}
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
              <div className="mt-4 pt-3 border-t border-[#E5DAC4]/60 flex items-center justify-between text-[11px] font-mono text-stone-500">
                <span>{summary.expenses?.length || 0} shared bill{(summary.expenses?.length || 0) === 1 ? "" : "s"}</span>
                <span>{summary.memberBreakdown.length} member{summary.memberBreakdown.length === 1 ? "" : "s"}</span>
              </div>
            </div>

            {/* Invite Form Card */}
            <div className="md:col-span-6 rounded-2xl border border-[#E5DAC4] bg-[#FAF8F5] p-5 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#18122B]/70 block mb-1">
                  ✦ INVITE A HOUSEHOLD MEMBER
                </span>
                <p className="text-xs text-stone-500 font-medium mb-3">
                  Invite a housemate or partner to split bills and share this spending ledger.
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

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <input
                      type="email"
                      placeholder="partner@example.com"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="sm:col-span-7 rounded-xl border border-[#E5DAC4] bg-white px-3.5 py-2 text-xs text-[#18122B] placeholder:text-stone-400 focus:outline-none focus:border-[#84cc16]"
                    />
                    <input
                      type="text"
                      placeholder="Name (optional)"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      className="sm:col-span-5 rounded-xl border border-[#E5DAC4] bg-white px-3.5 py-2 text-xs text-[#18122B] placeholder:text-stone-400 focus:outline-none focus:border-[#84cc16]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={inviting || !inviteEmail.trim()}
                    className="w-full rounded-xl bg-[#18122B] py-2 text-xs font-bold text-white hover:bg-stone-800 disabled:opacity-50 transition cursor-pointer"
                  >
                    {inviting ? "Inviting…" : "Send Household Invite"}
                  </button>
                </form>
              </div>

              <span className="text-[10px] text-stone-400 font-mono mt-2">
                Invited members receive shared view access to this ledger.
              </span>
            </div>
          </div>

          {/* Per-Member Breakdown & Settlement Table */}
          <div className="rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#E5DAC4]/60 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#18122B]/70 block">
                  ✦ MEMBER LEDGER & BALANCES
                </span>
                <h3 className="font-serif text-base font-bold text-[#18122B]">
                  Per-Member Spending & Settlement Status
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
                    <th className="pb-2.5 pr-4 text-right">PAID OUT OF POCKET</th>
                    <th className="pb-2.5 pr-4 text-right">ALLOCATED SHARE</th>
                    <th className="pb-2.5 pr-4 text-right">NET BALANCE</th>
                    <th className="pb-2.5 text-right">% OF TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs">
                  {summary.memberBreakdown.map((member) => {
                    const sharePct =
                      summary.totalSpend > 0
                        ? Math.round((member.spend / summary.totalSpend) * 100)
                        : 0;
                    const net = (member.paid || 0) - member.spend;

                    return (
                      <tr key={member.id} className="hover:bg-[#FAF8F5]/80 transition">
                        <td className="py-3 pr-4 font-bold text-[#18122B]">
                          <div className="flex items-center gap-1.5">
                            <span>{member.name}</span>
                            {member.role === "OWNER" && (
                              <span className="rounded-full bg-amber-100 border border-amber-200 px-1.5 py-0.2 text-[9px] font-black uppercase text-amber-800">
                                Owner
                              </span>
                            )}
                            {member.status === "PENDING" && (
                              <span className="rounded-full bg-stone-100 border border-stone-200 px-1.5 py-0.2 text-[9px] font-mono text-stone-500">
                                Pending
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 pr-4 font-mono text-stone-500 text-[11px]">
                          {member.email}
                        </td>
                        <td className="py-3 pr-4 font-serif font-bold text-[#18122B] text-right">
                          {formatINR(member.paid || 0)}
                        </td>
                        <td className="py-3 pr-4 font-serif font-bold text-[#18122B] text-right">
                          {formatINR(member.spend)}
                        </td>
                        <td className="py-3 pr-4 text-right font-mono font-bold text-[11px]">
                          {net > 0 ? (
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              + {formatINR(net)} (gets back)
                            </span>
                          ) : net < 0 ? (
                            <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              - {formatINR(Math.abs(net))} (owes)
                            </span>
                          ) : (
                            <span className="text-stone-400">Settled</span>
                          )}
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
          </div>

          {/* Shared Expenses List */}
          <div className="rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#E5DAC4]/60 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#18122B]/70 block">
                  ✦ SHARED EXPENSES
                </span>
                <h3 className="font-serif text-base font-bold text-[#18122B]">
                  Recorded Household Bills & Splits
                </h3>
              </div>
              <button
                type="button"
                onClick={handleOpenExpenseModal}
                className="text-xs font-bold text-[#3f6212] hover:underline cursor-pointer"
              >
                + Add Bill
              </button>
            </div>

            {!summary.expenses || summary.expenses.length === 0 ? (
              /* REQUIRED HONEST EMPTY STATE */
              <div className="py-10 px-4 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-[#84cc16]/15 border border-[#84cc16]/30 flex items-center justify-center text-2xl mb-3">
                  ✨
                </div>
                <h4 className="font-serif text-lg font-bold text-[#18122B]">
                  Your household ledger is fresh ✦
                </h4>
                <p className="text-xs text-stone-500 font-medium max-w-md mx-auto mt-1">
                  No shared bills recorded this month. Add rent, electricity, groceries, or another shared expense to start splitting costs.
                </p>
                <button
                  type="button"
                  onClick={handleOpenExpenseModal}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#18122B] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-stone-800 transition cursor-pointer"
                >
                  <span>+ Add Shared Expense</span>
                  <span className="text-[#84cc16]">&rarr;</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {summary.expenses.map((expense) => {
                  const d = new Date(expense.expenseDate);
                  const dateStr = d.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });

                  return (
                    <div
                      key={expense.id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:bg-[#FAF8F5]/80 transition px-2 rounded-xl"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-xl bg-[#FAF8F5] border border-[#E5DAC4] flex items-center justify-center text-base shrink-0">
                          {expense.category.toLowerCase().includes("rent")
                            ? "🏠"
                            : expense.category.toLowerCase().includes("util") || expense.category.toLowerCase().includes("bill")
                            ? "⚡"
                            : expense.category.toLowerCase().includes("food") || expense.category.toLowerCase().includes("groc")
                            ? "🛒"
                            : expense.category.toLowerCase().includes("wifi") || expense.category.toLowerCase().includes("internet")
                            ? "🌐"
                            : "🧾"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#18122B]">
                              {expense.description}
                            </span>
                            <span className="rounded-full bg-stone-100 border border-stone-200 px-2 py-0.2 text-[10px] font-medium text-stone-600">
                              {expense.category}
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-500 font-mono mt-0.5">
                            <span>Paid by {expense.payerMemberName}</span> &middot; <span>{dateStr}</span>
                          </div>
                          {expense.splits && expense.splits.length > 0 && (
                            <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                              Split: {expense.splits.map((s) => `${s.memberName}: ${formatINR(s.allocatedAmount)}`).join(" | ")}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 self-end sm:self-center">
                        <div className="text-right">
                          <div className="font-serif font-bold text-sm sm:text-base text-[#18122B]">
                            {formatINR(expense.amount)}
                          </div>
                          <div className="text-[10px] font-mono text-stone-400">
                            {expense.splitMethod === "EQUAL" ? "Equal Split" : "Custom Split"}
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={deletingId === expense.id}
                          onClick={() => handleDeleteExpense(expense.id)}
                          aria-label="Delete shared expense"
                          className="text-stone-300 hover:text-rose-600 p-1 transition cursor-pointer text-xs"
                          title="Delete expense"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-[#E5DAC4]/60 flex items-center justify-between text-[10px] text-stone-400 font-mono">
              <span>Each shared expense is counted exactly once in total outflow</span>
              <span>FinSage Shared Ledger</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. ADD SHARED EXPENSE MODAL */}
      {isAddingExpense && summary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18122B]/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E5DAC4]/60 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#3f6212] block">
                  ✦ RECORD SHARED BILL
                </span>
                <h3 className="font-serif text-lg font-bold text-[#18122B]">
                  Add Household Expense
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingExpense(false)}
                className="text-stone-400 hover:text-stone-700 text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {expenseError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 font-medium">
                {expenseError}
              </div>
            )}

            <form onSubmit={handleSaveExpense} className="space-y-3.5 text-xs">
              {/* Description */}
              <div>
                <label className="block font-bold text-[#18122B] mb-1">
                  Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. October Apartment Rent, Electricity Bill, Groceries"
                  value={expDescription}
                  onChange={(e) => setExpDescription(e.target.value)}
                  className="w-full rounded-xl border border-[#E5DAC4] bg-white px-3.5 py-2 text-xs font-medium text-[#18122B] placeholder:text-stone-400 focus:outline-none focus:border-[#84cc16]"
                />
              </div>

              {/* Amount & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#18122B] mb-1">
                    Total Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="e.g. 20000"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    className="w-full rounded-xl border border-[#E5DAC4] bg-white px-3.5 py-2 text-xs font-medium text-[#18122B] placeholder:text-stone-400 focus:outline-none focus:border-[#84cc16]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18122B] mb-1">
                    Category
                  </label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    className="w-full rounded-xl border border-[#E5DAC4] bg-white px-3.5 py-2 text-xs font-medium text-[#18122B] focus:outline-none focus:border-[#84cc16]"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Who Paid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#18122B] mb-1">
                    Expense Date
                  </label>
                  <input
                    type="date"
                    required
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full rounded-xl border border-[#E5DAC4] bg-white px-3.5 py-2 text-xs font-medium text-[#18122B] focus:outline-none focus:border-[#84cc16]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18122B] mb-1">
                    Who Paid?
                  </label>
                  <select
                    value={payerMemberId}
                    onChange={(e) => setPayerMemberId(e.target.value)}
                    className="w-full rounded-xl border border-[#E5DAC4] bg-white px-3.5 py-2 text-xs font-medium text-[#18122B] focus:outline-none focus:border-[#84cc16]"
                  >
                    {summary.memberBreakdown.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Split Method Toggle */}
              <div className="pt-2 border-t border-[#E5DAC4]/60">
                <label className="block font-bold text-[#18122B] mb-1.5">
                  Split Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSplitMethod("EQUAL")}
                    className={`rounded-xl py-2 px-3 text-xs font-bold transition ${
                      splitMethod === "EQUAL"
                        ? "bg-[#18122B] text-white"
                        : "border border-[#E5DAC4] bg-white text-stone-600 hover:bg-[#FAF8F5]"
                    }`}
                  >
                    Split Equally ({equalPerPerson > "0" ? `₹${Number(equalPerPerson).toLocaleString("en-IN")}/person` : "Equal"})
                  </button>

                  <button
                    type="button"
                    onClick={() => setSplitMethod("CUSTOM")}
                    className={`rounded-xl py-2 px-3 text-xs font-bold transition ${
                      splitMethod === "CUSTOM"
                        ? "bg-[#18122B] text-white"
                        : "border border-[#E5DAC4] bg-white text-stone-600 hover:bg-[#FAF8F5]"
                    }`}
                  >
                    Custom Amounts
                  </button>
                </div>
              </div>

              {/* Split Details */}
              {splitMethod === "EQUAL" ? (
                <div className="rounded-xl border border-[#E5DAC4] bg-[#FAF8F5] p-3 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 block">
                    Participating Members
                  </span>
                  <div className="space-y-1.5">
                    {summary.memberBreakdown.map((m) => {
                      const checked = selectedParticipants.includes(m.id);
                      return (
                        <label
                          key={m.id}
                          className="flex items-center justify-between cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedParticipants([...selectedParticipants, m.id]);
                                } else {
                                  setSelectedParticipants(
                                    selectedParticipants.filter((id) => id !== m.id)
                                  );
                                }
                              }}
                              className="rounded border-[#E5DAC4] text-[#18122B] accent-[#18122B]"
                            />
                            <span className="font-semibold text-[#18122B]">{m.name}</span>
                          </div>
                          {checked && numAmount > 0 && (
                            <span className="font-mono text-stone-500 font-bold">
                              ₹{Number(equalPerPerson).toLocaleString("en-IN")}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-[#E5DAC4] bg-[#FAF8F5] p-3 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 block">
                    Custom Member Amounts (Sum must equal ₹{numAmount.toLocaleString("en-IN")})
                  </span>
                  <div className="space-y-2">
                    {summary.memberBreakdown.map((m) => (
                      <div key={m.id} className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-xs text-[#18122B]">{m.name}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-stone-400 font-mono">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0"
                            value={customSplits[m.id] || ""}
                            onChange={(e) =>
                              setCustomSplits({ ...customSplits, [m.id]: e.target.value })
                            }
                            className="w-28 rounded-lg border border-[#E5DAC4] bg-white px-2 py-1 text-xs font-mono text-right font-bold text-[#18122B] focus:outline-none focus:border-[#84cc16]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E5DAC4]/60">
                <button
                  type="button"
                  onClick={() => setIsAddingExpense(false)}
                  className="rounded-xl border border-[#E5DAC4] px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingExpense}
                  className="rounded-xl bg-[#84cc16] px-5 py-2 text-xs font-black text-[#18122B] shadow-sm hover:bg-[#a3e635] transition disabled:opacity-50"
                >
                  {savingExpense ? "Recording…" : "Save Shared Expense"}
                </button>
              </div>
            </form>
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
