"use client";
import { useEffect, useState } from "react";
import { getMe, updateMonthlySalary } from "@/lib/api";

export function SalaryCard({ token }: { token: string }) {
  const [salary, setSalary] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await getMe(token);
      setSalary(data.monthlySalary);
      if (data.monthlySalary !== null) {
        setInputVal(String(data.monthlySalary));
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  async function handleSave() {
    const num = Number(inputVal);
    if (!inputVal || isNaN(num) || num <= 0) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateMonthlySalary(token, num);
      setSalary(updated.monthlySalary);
      setIsEditing(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="group rounded-lg border border-line bg-paper-sheet p-5 shadow-subtle transition-all hover:border-line-dark/60">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          Monthly Salary
        </p>
        <div className="flex items-center gap-2">
          {salary !== null && !isEditing && (
            <button
              onClick={() => {
                setInputVal(String(salary));
                setIsEditing(true);
              }}
              className="text-[11px] font-medium text-teal hover:text-teal-dark hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal rounded"
            >
              Edit
            </button>
          )}
          <span className="h-2 w-2 rounded-full bg-teal/80 ring-4 ring-teal/15" />
        </div>
      </div>

      <div className="my-3 border-b border-line/70" />

      {loading ? (
        <p className="py-1 font-serif text-sm italic text-ink-muted">Loading…</p>
      ) : salary === null || isEditing ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 font-serif text-sm font-semibold text-ink-subtle">
                ₹
              </span>
              <input
                className="w-full rounded-md border border-line bg-paper py-1.5 pl-6 pr-2 text-sm text-ink placeholder:text-ink-subtle transition focus:border-teal focus:bg-paper-sheet focus:outline-none focus:ring-1 focus:ring-teal/30"
                placeholder="Enter salary"
                type="number"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                autoFocus={isEditing}
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving || !inputVal || Number(inputVal) <= 0}
              className="rounded-md bg-teal px-3 py-1.5 text-xs font-medium text-paper-sheet shadow-subtle transition-all hover:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            {isEditing && salary !== null && (
              <button
                onClick={() => {
                  setInputVal(String(salary));
                  setIsEditing(false);
                }}
                className="rounded-md border border-line px-2.5 py-1.5 text-xs font-medium text-ink-muted hover:bg-paper"
              >
                Cancel
              </button>
            )}
          </div>
          {error && <span className="text-[11px] text-rose">{error}</span>}
        </div>
      ) : (
        <p className="font-serif text-2xl font-semibold tracking-tight text-ink tabular-nums lg:text-3xl">
          ₹ {Number(salary).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
        </p>
      )}
    </div>
  );
}
