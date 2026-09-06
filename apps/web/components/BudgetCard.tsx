"use client";
import { useEffect, useState } from "react";
import { deleteBudget, getBudgets, getBudgetVariance, upsertBudget } from "@/lib/api";

export function BudgetCard({ token }: { token: string }) {
  const [variance, setVariance] = useState<any[]>([]);
  const [budgetMap, setBudgetMap] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ category: "Food", monthlyLimit: "" });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  function showMessage(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(null), 2000);
  }

  async function load() {
    setLoading(true);
    try {
      const [varData, rawBudgets] = await Promise.all([
        getBudgetVariance(token),
        getBudgets(token),
      ]);
      setVariance(varData);
      const map: Record<string, string> = {};
      if (Array.isArray(rawBudgets)) {
        rawBudgets.forEach((b: any) => {
          map[b.category] = b.id;
        });
      }
      setBudgetMap(map);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave() {
    if (!form.monthlyLimit) return;
    try {
      await upsertBudget(token, { category: form.category, monthlyLimit: Number(form.monthlyLimit) });
      setForm({ ...form, monthlyLimit: "" });
      showMessage("Budget Allocated");
      load();
    } catch (e: any) {
      console.error(e);
    }
  }

  async function handleDelete(category: string) {
    const budgetId = budgetMap[category];
    if (!budgetId) return;
    try {
      await deleteBudget(token, budgetId);
      showMessage("Budget Removed");
      load();
    } catch (e: any) {
      console.error(e);
    }
  }

  const isFormValid = Boolean(form.monthlyLimit && Number(form.monthlyLimit) > 0);

  return (
    <div className="rounded-lg border border-line bg-paper-sheet p-6 shadow-subtle">
      {/* Set Budget Form */}
      <div className="border-b border-line pb-5">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          Category Limit Allocation
        </p>
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            className="rounded-md border border-line bg-paper px-3 py-2 text-sm font-medium text-ink transition focus:border-teal focus:bg-paper-sheet focus:outline-none focus:ring-1 focus:ring-teal/30"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {["Food", "Transport", "Shopping", "Bills", "Entertainment", "Other"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 font-serif text-sm font-semibold text-ink-subtle">
              ₹
            </span>
            <input
              className="w-44 rounded-md border border-line bg-paper py-2 pl-6 pr-3 text-sm text-ink placeholder:text-ink-subtle transition focus:border-teal focus:bg-paper-sheet focus:outline-none focus:ring-1 focus:ring-teal/30"
              placeholder="Monthly Limit"
              type="number"
              value={form.monthlyLimit}
              onChange={(e) => setForm({ ...form, monthlyLimit: e.target.value })}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={!isFormValid}
            className="rounded-md bg-teal px-4 py-2 text-sm font-medium text-paper-sheet shadow-subtle transition-all hover:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal"
          >
            Set Limit
          </button>

          {message && (
            <span className="inline-flex items-center gap-1 rounded border border-teal/30 bg-teal-tint px-2.5 py-1 text-xs font-medium text-teal">
              ✓ {message}
            </span>
          )}
        </div>
      </div>

      {/* Variance Ledger Items */}
      <div className="mt-4 space-y-3">
        {loading && (
          <p className="py-8 text-center font-serif text-sm italic text-ink-muted">
            Computing monthly variances…
          </p>
        )}

        {!loading && variance.length === 0 && (
          <p className="py-8 text-center font-serif text-sm italic text-ink-muted">
            No budget allocations defined yet — set one above.
          </p>
        )}

        {!loading &&
          variance.map((v) => {
            const pct = v.limit > 0 ? Math.min((v.spent / v.limit) * 100, 100) : 0;
            const over = v.spent > v.limit;
            return (
              <div
                key={v.category}
                className="rounded-md border border-line/70 bg-paper/30 p-4 transition-colors hover:bg-paper/50"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink">{v.category}</span>
                    {over && (
                      <span className="rounded border border-rose/30 bg-rose-tint px-1.5 py-0.2 text-[10px] font-semibold tracking-wider text-rose uppercase">
                        Over Budget
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`font-serif text-sm tabular-nums ${over ? "font-semibold text-rose" : "text-ink-muted"}`}>
                      <span className="font-semibold text-ink">₹ {Number(v.spent).toLocaleString("en-IN")}</span>
                      {" "}
                      <span className="text-xs text-ink-subtle">/</span>
                      {" "}
                      ₹ {Number(v.limit).toLocaleString("en-IN")}
                    </span>

                    {budgetMap[v.category] && (
                      <button
                        onClick={() => handleDelete(v.category)}
                        className="rounded border border-transparent px-2 py-0.5 text-xs font-medium text-rose transition-colors hover:border-rose/20 hover:bg-rose-tint hover:text-rose-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full border border-line/60 bg-paper">
                  <div
                    className={`h-full transition-all duration-300 ${
                      over ? "bg-rose" : "bg-teal"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
