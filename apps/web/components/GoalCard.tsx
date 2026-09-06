"use client";
import { useEffect, useState } from "react";
import { createGoal, deleteGoal, getGoals } from "@/lib/api";

export function GoalCard({ token }: { token: string }) {
  const [goals, setGoals] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", targetAmount: "", endDate: "" });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  function showMessage(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(null), 2000);
  }

  async function load() {
    setLoading(true);
    try {
      const data = await getGoals(token);
      setGoals(data);
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
    if (!form.title || !form.targetAmount || !form.endDate) return;
    try {
      await createGoal(token, {
        title: form.title,
        targetAmount: Number(form.targetAmount),
        endDate: new Date(form.endDate).toISOString(),
      });
      setForm({ title: "", targetAmount: "", endDate: "" });
      showMessage("Goal Registered");
      load();
    } catch (e: any) {
      console.error(e);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteGoal(token, id);
      showMessage("Goal Removed");
      load();
    } catch (e: any) {
      console.error(e);
    }
  }

  const isFormValid = Boolean(form.title && form.targetAmount && form.endDate);

  return (
    <div className="rounded-lg border border-line bg-paper-sheet p-6 shadow-subtle">
      {/* Goal Definition Form */}
      <div className="border-b border-line pb-5">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          New Savings Target / Goal
        </p>
        <div className="flex flex-wrap items-center gap-2.5">
          <input
            className="min-w-[180px] flex-1 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-subtle transition focus:border-gold focus:bg-paper-sheet focus:outline-none focus:ring-1 focus:ring-gold/30"
            placeholder="Goal Title (e.g. Emergency Fund)"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 font-serif text-sm font-semibold text-ink-subtle">
              ₹
            </span>
            <input
              className="w-36 rounded-md border border-line bg-paper py-2 pl-6 pr-3 text-sm text-ink placeholder:text-ink-subtle transition focus:border-gold focus:bg-paper-sheet focus:outline-none focus:ring-1 focus:ring-gold/30"
              placeholder="Target Amount"
              type="number"
              value={form.targetAmount}
              onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
            />
          </div>

          <input
            type="date"
            className="rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink transition focus:border-gold focus:bg-paper-sheet focus:outline-none focus:ring-1 focus:ring-gold/30"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          />

          <button
            onClick={handleAdd}
            disabled={!isFormValid}
            className="rounded-md bg-gold px-4 py-2 text-sm font-medium text-paper-sheet shadow-subtle transition-all hover:bg-gold-dark disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold"
          >
            Create Target
          </button>

          {message && (
            <span className="inline-flex items-center gap-1 rounded border border-teal/30 bg-teal-tint px-2.5 py-1 text-xs font-medium text-teal">
              ✓ {message}
            </span>
          )}
        </div>
      </div>

      {/* Goals List */}
      <div className="mt-4 space-y-2.5">
        {loading && (
          <p className="py-8 text-center font-serif text-sm italic text-ink-muted">
            Loading savings targets…
          </p>
        )}

        {!loading && goals.length === 0 && (
          <p className="py-8 text-center font-serif text-sm italic text-ink-muted">
            No savings targets established — create your first goal above.
          </p>
        )}

        {!loading &&
          goals.map((g) => (
            <div
              key={g.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line/70 bg-paper/30 p-4 transition-colors hover:bg-paper/50"
            >
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-gold ring-4 ring-gold/15" />
                <span className="font-medium text-ink">{g.title}</span>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-serif text-sm font-semibold tabular-nums text-ink">
                  ₹ {Number(g.targetAmount).toLocaleString("en-IN")}
                </span>

                <span className="rounded border border-line bg-paper px-2 py-0.5 text-xs text-ink-muted">
                  due{" "}
                  {new Date(g.endDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>

                <button
                  onClick={() => handleDelete(g.id)}
                  className="rounded border border-transparent px-2 py-0.5 text-xs font-medium text-rose transition-colors hover:border-rose/20 hover:bg-rose-tint hover:text-rose-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
