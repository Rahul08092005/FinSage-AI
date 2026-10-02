"use client";

import { useState } from "react";
import { updateMonthlySalary } from "@/lib/api";
import { formatINR } from "@/lib/formatCurrency";

interface DominantBalanceHeroProps {
  token: string;
  salary: number | null;
  spend: number | null;
  topCategory?: { category: string; total: number } | null;
  loading?: boolean;
  onSalaryUpdated: (newSalary: number) => void;
}

export function DominantBalanceHero({
  token,
  salary,
  spend,
  loading = false,
  onSalaryUpdated,
}: DominantBalanceHeroProps) {
  const [isEditingSalary, setIsEditingSalary] = useState(false);
  const [salaryInput, setSalaryInput] = useState(String(salary || ""));
  const [savingSalary, setSavingSalary] = useState(false);
  const [salaryError, setSalaryError] = useState<string | null>(null);

  const moneyIn = salary ?? 100000;
  const moneyOut = spend ?? 0;
  const available = Math.max(0, moneyIn - moneyOut);
  const savingsRate = moneyIn > 0 ? Math.round(((moneyIn - moneyOut) / moneyIn) * 100) : 0;
  const isPositive = moneyIn >= moneyOut;

  async function handleSaveSalary() {
    const num = Number(salaryInput);
    if (!salaryInput || isNaN(num) || num <= 0) return;
    setSavingSalary(true);
    setSalaryError(null);
    try {
      const res = await updateMonthlySalary(token, num);
      onSalaryUpdated(res.monthlySalary);
      setIsEditingSalary(false);
    } catch (e: any) {
      setSalaryError(e.message || "Failed to update salary");
    } finally {
      setSavingSalary(false);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
      {/* 1. Dominant: AVAILABLE BALANCE (Col 1-6) */}
      <div className="md:col-span-6 rounded-2xl border-2 border-[#18122B]/15 bg-gradient-to-br from-[#FFFDF8] via-[#FAF6ED] to-[#F5EEDF] p-3.5 sm:p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#84cc16]" />
            <span className="text-[11px] font-black uppercase tracking-wider text-[#18122B]/70">
              AVAILABLE BALANCE
            </span>
          </div>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
              isPositive
                ? "bg-[#84cc16]/25 text-[#3f6212] border border-[#84cc16]/50"
                : "bg-rose-100 text-rose-700 border border-rose-200"
            }`}
          >
            <span>{isPositive ? "↗" : "↘"}</span>
            <span>{savingsRate}% Retained</span>
          </span>
        </div>

        <div className="my-1.5 flex items-baseline gap-2">
          {loading ? (
            <div className="h-9 w-44 animate-pulse rounded-lg bg-[#E5DAC4]/50" />
          ) : (
            <h2 className="font-serif text-3xl sm:text-4xl font-black tracking-tight text-[#18122B] tabular-nums">
              {formatINR(available, { maximumFractionDigits: 2 })}
            </h2>
          )}
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#18122B]/50">
            Net Free Cash
          </span>
        </div>

        <p className="text-[11px] font-medium text-[#18122B]/70 truncate">
          {isPositive ? "Healthy cash reserves remaining this billing cycle." : "Spending exceeds inflow."}
        </p>
      </div>

      {/* 2. MONEY IN (Col 7-9) */}
      <div className="md:col-span-3 rounded-2xl border border-[#DDD9CF] bg-[#FFFDF8] p-3.5 sm:p-4 shadow-sm flex flex-col justify-between hover:border-[#84cc16] transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-[#3f6212]">
            Money In &rarr;
          </span>
          {!isEditingSalary && (
            <button
              onClick={() => {
                setSalaryInput(String(salary || 100000));
                setIsEditingSalary(true);
              }}
              className="rounded px-1.5 py-0.5 text-[10px] font-bold text-[#3f6212] hover:bg-[#84cc16]/20 transition"
              title="Edit monthly salary"
            >
              Edit
            </button>
          )}
        </div>

        {isEditingSalary ? (
          <div className="my-1 flex flex-col gap-1">
            <div className="relative">
              <span className="absolute inset-y-0 left-2 flex items-center font-serif text-xs font-bold text-[#18122B]/60">
                ₹
              </span>
              <input
                type="number"
                value={salaryInput}
                onChange={(e) => setSalaryInput(e.target.value)}
                className="w-full rounded-lg border border-[#84cc16] bg-white py-0.5 pl-6 pr-1 text-sm font-bold text-[#18122B] focus:outline-none"
                autoFocus
              />
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleSaveSalary}
                disabled={savingSalary || !salaryInput || Number(salaryInput) <= 0}
                className="rounded bg-[#84cc16] px-2 py-0.5 text-[10px] font-bold text-[#18122B] hover:bg-[#74b810] disabled:opacity-40"
              >
                {savingSalary ? "..." : "Save"}
              </button>
              <button
                onClick={() => setIsEditingSalary(false)}
                className="rounded border border-[#DDD9CF] px-2 py-0.5 text-[10px] font-medium text-[#18122B]/70 hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
            {salaryError && <span className="text-[10px] text-rose-600">{salaryError}</span>}
          </div>
        ) : (
          <p className="my-1.5 font-serif text-2xl font-black tracking-tight text-[#18122B] tabular-nums">
            {formatINR(moneyIn)}
          </p>
        )}

        <span className="text-[11px] font-semibold text-[#3f6212]">
          Monthly Salary Flow
        </span>
      </div>

      {/* 3. MONEY OUT (Col 10-12) */}
      <div className="md:col-span-3 rounded-2xl border border-[#DDD9CF] bg-[#FFFDF8] p-3.5 sm:p-4 shadow-sm flex flex-col justify-between hover:border-[#F97316] transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-[#C2410C]">
            Money Out &rarr;
          </span>
          <span className="h-2 w-2 rounded-full bg-[#F97316]" />
        </div>

        <p className="my-1.5 font-serif text-2xl font-black tracking-tight text-[#18122B] tabular-nums">
          {formatINR(moneyOut)}
        </p>

        <span className="text-[11px] font-semibold text-[#C2410C]">
          September Debits
        </span>
      </div>
    </div>
  );
}
