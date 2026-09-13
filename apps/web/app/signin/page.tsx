import { Suspense } from "react";
import Image from "next/image";
import { AuthCard } from "@/components/AuthCard";

export const metadata = {
  title: "Sign In — FinSage AI",
  description: "Sign in to access your personal wealth ledger, budgets, and AI financial advisor.",
};

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col justify-center bg-[#FBF7EE] text-[#18122B]">
      <main className="flex flex-1 items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-10 xl:gap-14">
            {/* LEFT COLUMN: Brand Storytelling & Editorial Collage */}
            <div className="flex flex-col justify-center lg:col-span-6 xl:col-span-7">
              {/* Eyebrow Badge */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#84cc16]/60 bg-[#84cc16]/15 px-3 py-1 text-xs font-black uppercase tracking-wider text-[#365314]">
                  <span className="h-2 w-2 rounded-full bg-[#84cc16] animate-pulse" />
                  FINSAGE AI / PERSONAL FINANCE, FLIPPED
                </span>
              </div>

              {/* Punchy Editorial Headline */}
              <h1 className="mt-3.5 font-serif text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tight text-[#18122B] leading-[1.05]">
                YOUR MONEY.<br />
                <span className="text-[#84cc16]">YOUR MOVE.</span>
              </h1>

              {/* Supporting Copy */}
              <p className="mt-2.5 max-w-lg text-xs sm:text-sm lg:text-base text-ink-muted leading-relaxed">
                One place to understand your spending, clean up the chaos, and make smarter moves with automated double-entry ledgers and proactive AI.
              </p>

              {/* Visual Collage of Real Financial Objects (Desktop & Tablet) */}
              <div className="relative mt-5 hidden sm:block">
                {/* Collage Card Container */}
                <div className="relative overflow-hidden rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-4 sm:p-5 shadow-subtle">
                  <div className="flex items-center justify-between border-b border-line pb-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                      Live Financial Workspace Telemetry
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#84cc16]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#84cc16]" />
                      Active Sync
                    </span>
                  </div>

                  {/* Collage Elements Layer */}
                  <div className="mt-3.5 flex flex-wrap items-center gap-3">
                    {/* Floating Credit Card Asset */}
                    <div className="flex items-center gap-2 rounded-xl border border-line bg-paper px-3 py-1.5 shadow-sm transition hover:scale-105">
                      <Image
                        src="/brand/artifacts/card-3d.png"
                        alt="FinSage Card"
                        width={32}
                        height={32}
                        className="object-contain"
                      />
                      <div className="text-left">
                        <div className="text-[9px] font-bold uppercase tracking-wider text-ink-muted">Smart Vault</div>
                        <div className="text-[11px] font-black text-ink">₹ 0 Hidden Fees</div>
                      </div>
                    </div>

                    {/* Floating Gold Coins Asset */}
                    <div className="flex items-center gap-2 rounded-xl border border-line bg-paper px-3 py-1.5 shadow-sm transition hover:scale-105">
                      <Image
                        src="/brand/artifacts/coins-3d.png"
                        alt="Coins"
                        width={28}
                        height={28}
                        className="object-contain"
                      />
                      <div className="text-left">
                        <div className="text-[9px] font-bold uppercase tracking-wider text-ink-muted">Velocity</div>
                        <div className="text-[11px] font-black text-[#15803d]">↗ +14.8% Net Saved</div>
                      </div>
                    </div>

                    {/* Floating Thermal Receipt Asset */}
                    <div className="flex items-center gap-2 rounded-xl border border-line bg-paper px-3 py-1.5 shadow-sm transition hover:scale-105">
                      <Image
                        src="/brand/artifacts/receipt-3d.png"
                        alt="Receipt OCR"
                        width={26}
                        height={26}
                        className="object-contain"
                      />
                      <div className="text-left">
                        <div className="text-[9px] font-bold uppercase tracking-wider text-ink-muted">Auto OCR</div>
                        <div className="text-[11px] font-black text-ink">0.3s Bill Parsing</div>
                      </div>
                    </div>
                  </div>

                  {/* Micro Checklist */}
                  <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2 border-t border-line/60 pt-2.5 text-[11px] font-semibold text-ink-muted">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#84cc16]">✓</span> Automated Ledger
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#84cc16]">✓</span> Budget Purity
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#84cc16]">✓</span> Bank-Level Encryption
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Compact Authentication Card */}
            <div className="flex items-center justify-center lg:col-span-6 xl:col-span-5">
              <Suspense
                fallback={
                  <div className="flex h-80 w-full max-w-[460px] items-center justify-center rounded-3xl border border-line bg-paper-sheet">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink border-t-transparent" />
                  </div>
                }
              >
                <AuthCard initialMode="signin" />
              </Suspense>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
