"use client";

import Image from "next/image";

/**
 * LegacyPart2Reality - Preserved backup of original Section 2 ("MONEY GETS MESSY.")
 */
export function LegacyPart2Reality() {
  return (
    <section id="problem-legacy" className="relative border-t border-[#E5DAC4] bg-[#FAF8F5] py-16 sm:py-20 lg:py-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header: Punchy, Editorial, No Fluff */}
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#18122B]/15 bg-white/90 px-3.5 py-1 font-mono text-[11px] font-black uppercase tracking-widest text-[#18122B] shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#F97316]" />
            02 / THE REALITY
          </span>
          <h2 className="mt-3.5 font-serif text-4xl sm:text-6xl md:text-7xl font-black tracking-[-0.04em] text-[#18122B] leading-[0.92]">
            MONEY<br className="hidden sm:inline" /> GETS MESSY.
          </h2>
          <p className="mt-3.5 text-base sm:text-xl md:text-2xl font-bold tracking-tight text-[#18122B] leading-snug">
            Your money lives everywhere. <br className="hidden sm:inline" />
            <span className="text-[#18122B]/60 font-medium">Your brain shouldn&apos;t have to.</span>
          </p>
        </div>

        {/* Editorial Streamer Tags */}
        <div className="mt-8 flex flex-wrap items-center gap-2 sm:gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F97316]/30 bg-[#FFF7ED] px-3 py-1 font-mono text-xs font-bold text-[#C2410C] shadow-sm rotate-[-1deg] hover:rotate-0 transition-transform">
            <span>📸</span> Payment screenshots.
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#8B5CF6]/30 bg-[#F5F3FF] px-3 py-1 font-mono text-xs font-bold text-[#6D28D9] shadow-sm rotate-[1deg] hover:rotate-0 transition-transform">
            <span>💬</span> UPI pings.
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3B82F6]/30 bg-[#EFF6FF] px-3 py-1 font-mono text-xs font-bold text-[#1D4ED8] shadow-sm rotate-[-0.5deg] hover:rotate-0 transition-transform">
            <span>📄</span> Bank PDFs.
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#10B981]/30 bg-[#ECFDF5] px-3 py-1 font-mono text-xs font-bold text-[#047857] shadow-sm rotate-[1.5deg] hover:rotate-0 transition-transform">
            <span>👥</span> Split bills.
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EC4899]/30 bg-[#FDF2F8] px-3 py-1 font-mono text-xs font-bold text-[#BE185D] shadow-sm rotate-[-1deg] hover:rotate-0 transition-transform">
            <span>⚡</span> Subscriptions.
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EAB308]/30 bg-[#FEFCE8] px-3 py-1 font-mono text-xs font-bold text-[#854D0E] shadow-sm rotate-[1deg] hover:rotate-0 transition-transform">
            <span>💸</span> Impulse buys.
          </span>
        </div>

        {/* ASYMMETRIC EDITORIAL "MONEY CHAOS" COLLAGE DESK */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
          
          {/* COLUMN 1 */}
          <div className="md:col-span-1 lg:col-span-4 flex flex-col gap-5">
            <div className="group relative rounded-2xl border border-[#18122B]/15 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:rotate-0 lg:rotate-[-2deg]">
              <div className="flex items-center justify-between pb-3 border-b border-dashed border-[#18122B]/20 font-mono text-[11px] text-[#18122B]/70">
                <span className="font-bold tracking-wider text-[#18122B] uppercase">CAFE NITRO & BITES</span>
                <span>12 SEP • 14:24</span>
              </div>
              <div className="my-3 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-[#18122B]">
                  <span>1x Nitro Oat Flat White</span>
                  <span className="font-bold">₹ 280.00</span>
                </div>
                <div className="flex justify-between text-[#18122B]">
                  <span>1x Truffle Sourdough Toast</span>
                  <span className="font-bold">₹ 420.00</span>
                </div>
                <div className="flex justify-between text-[#18122B]/60 text-[10px]">
                  <span>CGST 2.5% + SGST 2.5%</span>
                  <span>₹ 35.00</span>
                </div>
              </div>
              <div className="pt-2.5 border-t border-dashed border-[#18122B]/20 flex justify-between font-mono text-xs font-black text-[#18122B]">
                <span>TOTAL CHARGE</span>
                <span className="text-[#BE185D]">₹ 735.00 [PAID]</span>
              </div>
              <div className="mt-3 flex items-center justify-between pt-2 text-[10px] font-mono text-[#18122B]/40">
                <span>AUTH: PHONEPE-UPI-99210</span>
                <span className="text-[#F97316] font-bold">📸 Buried in gallery</span>
              </div>
              <div className="absolute -bottom-3 -right-3 w-12 h-12 pointer-events-none drop-shadow-md">
                <Image
                  src="/brand/artifacts/receipt-3d.png"
                  alt="Receipt artifact"
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
            </div>

            <div className="group relative rounded-2xl border border-[#10B981]/30 bg-[#ECFDF5]/70 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:rotate-0 lg:rotate-[1.5deg]">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-0.5 font-mono text-[10px] font-black text-[#047857] uppercase tracking-wider border border-[#10B981]/20">
                  <span>👥</span> SPLITWISE
                </span>
                <span className="font-mono text-[10px] font-bold text-[#BE185D]">14 DAYS UNSETTLED</span>
              </div>
              <h4 className="mt-2 font-sans text-sm font-black text-[#064e3b]">
                Goa Flatmates Trip • Weekend Grocery
              </h4>
              <div className="mt-1 flex items-center justify-between font-mono text-xs text-[#047857]">
                <span>Rahul paid ₹ 3,600.00</span>
                <span className="font-black text-[#BE185D]">You owe ₹ 900.00</span>
              </div>
            </div>
          </div>

          {/* COLUMN 2 */}
          <div className="md:col-span-2 lg:col-span-5 flex flex-col gap-5 md:order-first lg:order-none">
            <div className="relative rounded-3xl border-2 border-[#18122B] bg-[#F2E5CB] p-6 sm:p-7 shadow-[5px_5px_0px_#18122B] transition-transform duration-300 hover:scale-[1.01]">
              <div className="absolute -top-6 -right-4 w-16 h-16 pointer-events-none drop-shadow-md rotate-[8deg]">
                <Image
                  src="/brand/artifacts/wallet-3d.png"
                  alt="Wallet artifact"
                  width={64}
                  height={64}
                  className="object-contain"
                />
              </div>
              <span className="font-mono text-[11px] font-black tracking-widest text-[#18122B]/60 uppercase">
                THE DAILY PARADOX
              </span>
              <blockquote className="mt-3 font-serif text-3xl sm:text-4xl lg:text-[42px] font-black tracking-[-0.03em] text-[#18122B] leading-[1.05]">
                &ldquo;Six places.<br />
                <span className="relative inline-block mt-1">
                  <span className="relative z-10 rounded-xl bg-[#84cc16] px-3 py-0.5 text-[#18122B] rotate-[-1.5deg] inline-block shadow-sm">
                    One confused wallet.
                  </span>
                </span>&rdquo;
              </blockquote>
              <p className="mt-3 text-xs sm:text-sm text-[#18122B]/80 font-medium leading-relaxed">
                You tapped your phone 8 times today. Half are in UPI notifications, two are on Splitwise, one was a card auto-debit, and none are in any budget.
              </p>
              <div className="mt-4 rounded-xl border border-[#18122B]/15 bg-white p-3.5 font-mono text-[11px] space-y-1.5 shadow-inner">
                <div className="flex justify-between text-[#18122B]/50 pb-1.5 border-b border-[#18122B]/10 font-bold text-[10px]">
                  <span>HDFC_STMT_AUG2026.PDF</span>
                  <span>PASSBOOK EXTRACT</span>
                </div>
                <div className="flex justify-between text-[#18122B]">
                  <span className="truncate pr-2">UPI/CR/948201/SWIGGY-BLR</span>
                  <span className="font-bold text-[#BE185D] whitespace-nowrap">- ₹ 420.00 DR</span>
                </div>
                <div className="flex justify-between text-[#18122B]">
                  <span className="truncate pr-2">ACH/DR/ZOMATO-IND-PAY</span>
                  <span className="font-bold text-[#BE185D] whitespace-nowrap">- ₹ 680.00 DR</span>
                </div>
                <div className="flex justify-between items-center bg-[#FEF08A]/70 px-1.5 py-0.5 rounded text-[#854D0E] font-bold text-[10px]">
                  <span>POS/4921/UNRESOLVED-MUM</span>
                  <span>- ₹ 1,840.00 ?</span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] font-mono font-bold text-[#18122B]/60">
                <span>&ldquo;Where did ₹ 1,840 go?&rdquo;</span>
                <span className="text-[#BE185D] font-black">Zero context.</span>
              </div>
            </div>
          </div>

          {/* COLUMN 3 */}
          <div className="md:col-span-1 lg:col-span-3 flex flex-col gap-5">
            <div className="group relative rounded-2xl border border-[#8B5CF6]/30 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:rotate-0 lg:rotate-[2deg]">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F5F3FF] text-[#6D28D9] font-black text-xs">
                  💬
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#18122B]/50">
                    <span className="font-bold text-[#6D28D9]">BANK ALERT</span>
                    <span>Just now</span>
                  </div>
                  <p className="font-sans text-xs font-black text-[#18122B] truncate">
                    ₹ 649.00 Debited
                  </p>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-[#18122B]/75 leading-tight font-sans">
                AutoPay for <span className="font-bold text-[#18122B]">Netflix Premium</span> was completed via e-mandate.
              </p>
              <div className="mt-2.5 flex items-center justify-between border-t border-[#18122B]/10 pt-2 font-mono text-[10px] text-[#18122B]/50">
                <span>A/C XX8492</span>
                <span className="text-[#8B5CF6] font-bold">42 alerts this week</span>
              </div>
            </div>

            <div className="group relative rounded-2xl border border-[#EAB308]/30 bg-[#FEFCE8]/80 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:rotate-0 lg:rotate-[-1deg]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex-shrink-0 drop-shadow-sm">
                  <Image
                    src="/brand/artifacts/coins-3d.png"
                    alt="Coins artifact"
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
                <div>
                  <span className="font-mono text-[10px] font-black text-[#854D0E] uppercase tracking-wider">
                    IMPULSE TAP
                  </span>
                  <h5 className="font-sans text-xs font-black text-[#18122B]">
                    ₹ 180 • Evening Chai & Snack
                  </h5>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-[#18122B]/70 font-sans italic leading-tight">
                &ldquo;It was just a quick ₹ 180 tap... until it totaled ₹ 5,400 on the monthly statement.&rdquo;
              </p>
            </div>

            <div className="rounded-xl border border-[#18122B]/10 bg-white/90 p-3 flex items-center gap-2.5 shadow-sm">
              <div className="w-8 h-8 flex-shrink-0">
                <Image
                  src="/brand/artifacts/card-3d.png"
                  alt="Card artifact"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <div className="font-mono text-[10px] leading-tight text-[#18122B]/75">
                <span className="font-bold text-[#18122B]">3 Cards • 2 Wallets</span><br />
                No unified total.
              </div>
            </div>
          </div>
        </div>

        {/* THE TRANSITION: "MESSY IN. → FINSAGE OUT." */}
        <div className="mt-14 sm:mt-16 rounded-3xl sm:rounded-[2.5rem] border-2 border-[#18122B] bg-[#F2E5CB] p-6 sm:p-8 lg:p-10 shadow-[6px_6px_0px_#18122B]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#18122B]/15">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="rounded-xl bg-[#18122B] px-3.5 py-1.5 font-mono text-xs sm:text-sm font-black tracking-wider text-[#FAF8F5] uppercase">
                MESSY IN.
              </span>
              <span className="font-mono text-lg font-black text-[#18122B]">
                &rarr;
              </span>
              <span className="rounded-xl bg-[#84cc16] px-3.5 py-1.5 font-mono text-xs sm:text-sm font-black tracking-wider text-[#18122B] uppercase shadow-sm">
                FINSAGE OUT.
              </span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#18122B]/15 bg-white/80 px-3 py-1 text-xs font-mono font-bold text-[#18122B]">
              <span className="h-2 w-2 rounded-full bg-[#84cc16] animate-ping" />
              <span>REAL-TIME AI RECONCILIATION</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-5 flex flex-col gap-2.5">
              <span className="font-mono text-[11px] font-black uppercase tracking-wider text-[#18122B]/60">
                SCATTERED FINANCIAL RAW INPUTS:
              </span>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-xl border border-[#18122B]/10 bg-white/80 px-3.5 py-2 text-xs shadow-sm">
                  <span className="flex items-center gap-2 font-medium text-[#18122B]">
                    <span>📸</span> GPay Screenshot (Swiggy Delivery)
                  </span>
                  <span className="font-mono font-bold text-[#F97316]">₹ 640.00</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-[#18122B]/10 bg-white/80 px-3.5 py-2 text-xs shadow-sm">
                  <span className="flex items-center gap-2 font-medium text-[#18122B]">
                    <span>💬</span> Bank SMS: &ldquo;Debited HDFC A/C&rdquo;
                  </span>
                  <span className="font-mono font-bold text-[#8B5CF6]">Ref #9401</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-[#18122B]/10 bg-white/80 px-3.5 py-2 text-xs shadow-sm">
                  <span className="flex items-center gap-2 font-medium text-[#18122B]">
                    <span>👥</span> Splitwise: Flatmate dinner share
                  </span>
                  <span className="font-mono font-bold text-[#047857]">₹ 320.00</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-[#18122B]/75 leading-relaxed font-sans">
                Drop, forward, or sync. FinSage automatically parses merchant codes, reconciles bank balances, and organizes your life into a balanced passbook ledger with zero manual data entry.
              </p>
            </div>

            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-[#18122B]/15 bg-white p-5 sm:p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#18122B]/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#84cc16]" />
                    <span className="font-mono text-xs font-black tracking-tight text-[#18122B] uppercase">
                      BALANCED JOURNAL ENTRY #VCH-2026-0941
                    </span>
                  </div>
                  <span className="rounded-md bg-[#84cc16]/20 px-2 py-0.5 font-mono text-[10px] font-black text-[#3f6212] uppercase">
                    ✓ Auto-Reconciled
                  </span>
                </div>
                <div className="mt-3.5 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-[#18122B]/5">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-[#EFF6FF] px-1.5 py-0.5 text-[10px] font-bold text-[#2563EB]">DR</span>
                      <span className="font-semibold text-[#18122B]">5100 • Dining & Food Expense</span>
                    </div>
                    <span className="font-bold text-[#18122B]">₹ 640.00</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-[#18122B]/5">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-[#FDF2F8] px-1.5 py-0.5 text-[10px] font-bold text-[#BE185D]">CR</span>
                      <span className="text-[#18122B]/80">1020 • HDFC Salary Bank Account</span>
                    </div>
                    <span className="font-bold text-[#18122B]/80">₹ 640.00</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-[#18122B]/10 flex flex-wrap items-center justify-between gap-3 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="font-sans font-bold text-[#18122B]/60">50/30/20 Envelope:</span>
                    <span className="rounded-full bg-[#FEF08A] px-2.5 py-0.5 font-mono font-bold text-[#854D0E]">
                      Needs • Food (38% used)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-sans font-semibold text-[#166534]">
                    <span>⚡ Instant OCR Match</span>
                    <span>•</span>
                    <span>Zero manual typing</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
