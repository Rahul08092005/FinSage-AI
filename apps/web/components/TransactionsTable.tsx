"use client";
import { useEffect, useState } from "react";
import { createTransaction, deleteTransaction, getTransactions } from "@/lib/api";

export function TransactionsTable({ token }: { token: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ amount: "", category: "Food", description: "" });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  function showMessage(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(null), 2000);
  }

  async function load() {
    setLoading(true);
    try {
      const data = await getTransactions(token);
      setItems(data.items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd() {
    if (!form.amount || !form.description) return;
    try {
      await createTransaction(token, {
        amount: Number(form.amount),
        category: form.category,
        description: form.description,
        transactionDate: new Date().toISOString(),
      });
      setForm({ amount: "", category: "Food", description: "" });
      showMessage("Added");
      load();
    } catch (e: any) {
      console.error(e);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteTransaction(token, id);
      showMessage("Deleted");
      load();
    } catch (e: any) {
      console.error(e);
    }
  }

  const isFormValid = Boolean(form.amount && form.description);

  return (
    <div className="rounded-lg border border-line bg-paper-sheet p-6 shadow-subtle">
      {/* Entry Voucher Form */}
      <div className="border-b border-line pb-5">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          New Entry Voucher
        </p>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 font-serif text-sm font-semibold text-ink-subtle">
              ₹
            </span>
            <input
              className="w-32 rounded-md border border-line bg-paper py-2 pl-6 pr-3 text-sm text-ink placeholder:text-ink-subtle transition focus:border-teal focus:bg-paper-sheet focus:outline-none focus:ring-1 focus:ring-teal/30"
              placeholder="Amount"
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </div>

          <input
            className="min-w-[180px] flex-1 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-subtle transition focus:border-teal focus:bg-paper-sheet focus:outline-none focus:ring-1 focus:ring-teal/30"
            placeholder="Description (e.g. Groceries, Fuel)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <select
            className="rounded-md border border-line bg-paper px-3 py-2 text-sm font-medium text-ink transition focus:border-teal focus:bg-paper-sheet focus:outline-none focus:ring-1 focus:ring-teal/30"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {["Food", "Transport", "Shopping", "Bills", "Entertainment", "Other"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <button
            onClick={handleAdd}
            disabled={!isFormValid}
            className="rounded-md bg-teal px-4 py-2 text-sm font-medium text-paper-sheet shadow-subtle transition-all hover:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal"
          >
            Record Entry
          </button>

          {message && (
            <span className="inline-flex items-center gap-1 rounded border border-teal/30 bg-teal-tint px-2.5 py-1 text-xs font-medium text-teal">
              ✓ {message}
            </span>
          )}
        </div>
      </div>

      {/* Passbook Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              <th className="py-2.5 pl-1 font-semibold">Date</th>
              <th className="py-2.5 font-semibold">Particulars / Description</th>
              <th className="py-2.5 font-semibold">Head / Category</th>
              <th className="py-2.5 pr-4 text-right font-semibold">Debit Amount</th>
              <th className="py-2.5 pr-1 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="py-8 text-center font-serif text-sm italic text-ink-muted">
                  Retrieving ledger records…
                </td>
              </tr>
            )}

            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center font-serif text-sm italic text-ink-muted">
                  No records in ledger — record a voucher above.
                </td>
              </tr>
            )}

            {!loading &&
              items.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-line/60 transition-colors hover:bg-paper/40"
                >
                  <td className="py-3 pl-1 text-xs text-ink-muted">
                    {new Date(t.transactionDate).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-3 font-medium text-ink">
                    {t.description}
                  </td>
                  <td className="py-3">
                    <span className="inline-block rounded border border-line bg-paper px-2 py-0.5 text-[11px] font-medium text-ink-muted">
                      {t.category}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right font-serif text-sm font-semibold tabular-nums text-ink">
                    ₹ {Number(t.amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 pr-1 text-right">
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="rounded border border-transparent px-2 py-1 text-xs font-medium text-rose transition-colors hover:border-rose/20 hover:bg-rose-tint hover:text-rose-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
