"use client";
import { useEffect, useState } from "react";
import { createGoal, getGoals } from "@/lib/api";

export function GoalCard({ token }: { token: string }) {
  const [goals, setGoals] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", targetAmount: "", endDate: "" });

  async function load() {
    setGoals(await getGoals(token));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd() {
    if (!form.title || !form.targetAmount || !form.endDate) return;
    await createGoal(token, {
      title: form.title,
      targetAmount: Number(form.targetAmount),
      endDate: new Date(form.endDate).toISOString(),
    });
    setForm({ title: "", targetAmount: "", endDate: "" });
    load();
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-end gap-2">
        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="Goal title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="Target amount (₹)"
          value={form.targetAmount}
          onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
        />
        <input
          type="date"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={form.endDate}
          onChange={(e) => setForm({ ...form, endDate: e.target.value })}
        />
        <button onClick={handleAdd} className="rounded-lg bg-orange px-4 py-2 text-sm font-medium text-white">
          Add goal
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {goals.length === 0 && <p className="text-sm text-slate-400">No goals yet — add one above.</p>}
        {goals.map((g) => (
          <div key={g.id} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
            <span className="font-medium text-navy">{g.title}</span>
            <span className="text-slate-500">
              ₹{Number(g.targetAmount).toFixed(0)} by {new Date(g.endDate).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
