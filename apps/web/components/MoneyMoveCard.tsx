"use client";

import Link from "next/link";
import Image from "next/image";
import { formatINR } from "@/lib/formatCurrency";

interface MoneyMoveCardProps {
  salary: number | null;
  spend: number | null;
}

export function MoneyMoveCard({ salary, spend }: MoneyMoveCardProps) {
  const moneyIn = salary ?? 100000;
  const moneyOut = spend ?? 71816;
  const retained = Math.max(0, moneyIn - moneyOut);
  const savingsRate = moneyIn > 0 ? ((retained / moneyIn) * 100).toFixed(1) : "28.2";
  const recommendedBuffer = Math.round(retained * 0.55);

  return (
    <div className="relative mt-10 overflow-hidden rounded-[32px] border-2 border-[#18122B] bg-gradient-to-br from-[#84cc16] via-[#94d82d] to-[#65a30d] p-6 sm:p-8 lg:p-10 shadow-lg text-[#18122B]">
      {/* Decorative 3D card asset floating in the background */}
      <div className="pointer-events-none absolute -right-6 -bottom-10 h-64 w-64 opacity-85 transition-transform duration-500 hover:scale-105 hidden sm:block">
        <Image
          src="/brand/artifacts/card-3d.png"
          alt="FinSage 3D Card"
          width={280}
          height={280}
          className="object-contain drop-shadow-2xl"
        />
      </div>

      <div className="relative z-10 max-w-2xl">
        {/* Eyebrow badge */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#18122B] px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#84cc16]">
            ✦ YOUR MONEY MOVE
          </span>
          <span className="rounded-full bg-white/40 px-2.5 py-0.5 text-xs font-bold backdrop-blur-sm">
            AI Ledger Signal
          </span>
        </div>

        {/* Big Headline */}
        <h3 className="mt-4 font-serif text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
          {savingsRate}% NET SAVED.
          <br />
          PUT YOUR SURPLUS TO WORK.
        </h3>

        {/* Editorial Body */}
        <p className="mt-3 text-sm sm:text-base font-semibold leading-relaxed text-[#18122B]/85">
          You generated <strong className="text-[#18122B] font-black">{formatINR(retained)}</strong> in free
          cash flow this September. Deploying{" "}
          <strong className="text-[#18122B] font-black">{formatINR(recommendedBuffer)}</strong> into your
          emergency reserve protects your streak against seasonal volatility.
        </p>

        {/* Interactive Chips & CTA Button */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/goals"
            className="rounded-full bg-[#18122B] px-6 py-3 text-xs sm:text-sm font-black text-white shadow-md transition-all hover:bg-[#2d2150] hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <span>Allocate to Goals</span>
            <span>&rarr;</span>
          </Link>

          <Link
            href="/budgets"
            className="rounded-full border-2 border-[#18122B] bg-white/70 px-5 py-2.5 text-xs sm:text-sm font-black text-[#18122B] transition-all hover:bg-white hover:shadow-sm"
          >
            Check Category Limits
          </Link>

          <div className="hidden md:flex items-center gap-2 rounded-full bg-white/40 px-3.5 py-1.5 text-xs font-bold backdrop-blur-sm">
            <span>🛡️</span>
            <span>Zero Deficit Risk</span>
          </div>
        </div>
      </div>
    </div>
  );
}
