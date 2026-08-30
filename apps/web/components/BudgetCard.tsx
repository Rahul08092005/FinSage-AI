"use client";
import { useEffect, useState } from "react";
import { getBudgetVariance, upsertBudget } from "@/lib/api";

export function BudgetCard({ token }: { token: string }) {
  const [variance, setVariance] = useState<any[]>([]);
  const [form, setForm] = useState({ category: "Food", monthlyLimit: "" });

  async function load() {
    setVariance(await getBudgetVariance(token));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave() {
    if (!form.monthlyLimit) return;
    await upsertBudget(token, { category: form.category, monthlyLimit: Number(form.monthlyLimit) });
    setForm({ ...form, monthlyLimit: "" });
    load();
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-end gap-2">
        <select
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          {["Food", "Transport", "Shopping", "Bills", "Entertainment", "Other"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="Monthly limit (₹)"
          value={form.monthlyLimit}
          onChange={(e) => setForm({ ...form, monthlyLimit: e.target.value })}
        />
        <button onClick={handleSave} className="rounded-lg bg-teal px-4 py-2 text-sm font-medium text-white">
          Set budget
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {variance.length === 0 && <p className="text-sm text-slate-400">No budgets set yet.</p>}
        {variance.map((v) => {
          const pct = v.limit > 0 ? Math.min((v.spent / v.limit) * 100, 100) : 0;
          const over = v.spent > v.limit;
          return (
            <div key={v.category}>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-navy">{v.category}</span>
                <span className={over ? "text-red-600" : "text-slate-500"}>
                  ₹{v.spent.toFixed(0)} / ₹{v.limit.toFixed(0)}
                </span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-slate-100">
                <div
                  className={`h-2 rounded-full ${over ? "bg-red-500" : "bg-teal"}`}
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
