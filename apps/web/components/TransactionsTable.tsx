"use client";
import { useEffect, useState } from "react";
import { createTransaction, getTransactions } from "@/lib/api";

export function TransactionsTable({ token }: { token: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ amount: "", category: "Food", description: "" });
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const data = await getTransactions(token);
    setItems(data.items);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd() {
    if (!form.amount || !form.description) return;
    await createTransaction(token, {
      amount: Number(form.amount),
      category: form.category,
      description: form.description,
      transactionDate: new Date().toISOString(),
    });
    setForm({ amount: "", category: "Food", description: "" });
    load();
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-end gap-2">
        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="Amount"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
        />
        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <select
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          {["Food", "Transport", "Shopping", "Bills", "Entertainment", "Other"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button onClick={handleAdd} className="rounded-lg bg-teal px-4 py-2 text-sm font-medium text-white">
          Add
        </button>
      </div>

      <table className="mt-4 w-full text-left text-sm">
        <thead>
          <tr className="text-slate-500">
            <th className="py-2">Date</th>
            <th>Description</th>
            <th>Category</th>
            <th className="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={4} className="py-4 text-slate-400">Loading…</td>
            </tr>
          )}
          {!loading && items.length === 0 && (
            <tr>
              <td colSpan={4} className="py-4 text-slate-400">No transactions yet — add one above.</td>
            </tr>
          )}
          {items.map((t) => (
            <tr key={t.id} className="border-t border-slate-100">
              <td className="py-2">{new Date(t.transactionDate).toLocaleDateString()}</td>
              <td>{t.description}</td>
              <td>{t.category}</td>
              <td className="text-right">₹ {Number(t.amount).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
