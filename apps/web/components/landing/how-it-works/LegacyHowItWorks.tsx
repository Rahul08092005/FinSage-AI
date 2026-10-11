"use client";

import Image from "next/image";

export function LegacyHowItWorks() {
  return (
      <section id="how-it-works" className="relative scroll-mt-20 border-t border-[#E5DAC4] bg-[#F7F3EB] py-20 sm:py-28 overflow-hidden">
        
        {/* Subtle decorative grid lines for editorial financial feel */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#18122B08_1px,transparent_1px),linear-gradient(to_bottom,#18122B08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Section Header: Punchy, Editorial, No Fluff */}
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#18122B]/15 bg-white/95 px-4 py-1.5 font-mono text-[11px] sm:text-xs font-black uppercase tracking-widest text-[#18122B] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#84cc16]" />
              03 / HOW IT WORKS
            </span>
            <h2 className="mt-4 font-serif text-4xl sm:text-6xl lg:text-7xl font-black tracking-[-0.04em] text-[#18122B] leading-[0.94]">
              FROM MONEY MESS<br />
              <span className="text-[#18122B]">TO MONEY CLARITY.</span>
            </h2>
            <p className="mt-4 max-w-xl mx-auto text-base sm:text-lg font-bold tracking-tight text-[#18122B]/75 leading-snug">
              Four simple moves. One much clearer picture of your money.
            </p>
          </div>

          {/* Connected Financial Transformation Journey */}
          <div className="relative mt-14 sm:mt-16">

            {/* Editorial Horizontal Journey Pipeline Header (Desktop) */}
            <div className="hidden lg:grid grid-cols-4 gap-4 xl:gap-6 mb-8 px-2">
              <div className="flex items-center gap-2 font-mono text-xs font-black text-[#18122B]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#84cc16] text-[#18122B] text-[11px] font-bold shadow-sm">1</span>
                <span className="tracking-wider uppercase">RAW INPUT</span>
                <span className="flex-1 h-0.5 bg-[#84cc16]/50 border-b border-dashed border-[#84cc16]" />
                <span className="text-[#84cc16] font-bold">&rarr;</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs font-black text-[#18122B]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#8B5CF6] text-white text-[11px] font-bold shadow-sm">2</span>
                <span className="tracking-wider uppercase">LEDGER SYNC</span>
                <span className="flex-1 h-0.5 bg-[#8B5CF6]/50 border-b border-dashed border-[#8B5CF6]" />
                <span className="text-[#8B5CF6] font-bold">&rarr;</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs font-black text-[#18122B]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F97316] text-white text-[11px] font-bold shadow-sm">3</span>
                <span className="tracking-wider uppercase">VELOCITY PATTERN</span>
                <span className="flex-1 h-0.5 bg-[#F97316]/50 border-b border-dashed border-[#F97316]" />
                <span className="text-[#F97316] font-bold">&rarr;</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs font-black text-[#18122B]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2563EB] text-white text-[11px] font-bold shadow-sm">4</span>
                <span className="tracking-wider uppercase text-[#2563EB]">THE PAYOFF</span>
                <span className="flex-1 h-0.5 bg-[#2563EB]/50 border-b border-dashed border-[#2563EB]" />
                <span className="text-[#84cc16] font-black">★</span>
              </div>
            </div>

            {/* The 4 Asymmetric Stages Grid */}
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-4 xl:gap-6 relative z-10 items-stretch">
              
              {/* ================================================================= */}
              {/* STAGE 01 — CAPTURE (Tactile Paper Ticket & Lime Accent)            */}
              {/* ================================================================= */}
              <div className="group relative flex flex-col justify-between rounded-3xl border-2 border-[#18122B] bg-[#FCFDF9] p-6 lg:p-4.5 xl:p-7 shadow-[6px_6px_0px_#84cc16] transition-all duration-300 hover:shadow-[8px_8px_0px_#84cc16] hover:-translate-y-2 lg:rotate-[-1deg]">
                
                {/* Visual Tape Accent */}
                <div className="absolute -top-3 left-8 h-3.5 w-12 rounded-sm bg-[#84cc16]/50 border border-[#18122B]/20 rotate-[-2deg] shadow-sm z-20 pointer-events-none" />

                {/* Desktop Flow Arrow Bridge */}
                <div className="hidden lg:flex absolute -right-3.5 top-12 z-20 items-center justify-center w-7 h-7 rounded-full bg-[#18122B] text-[#84cc16] font-mono text-xs font-black shadow-[2px_2px_0px_#84cc16] group-hover:translate-x-1 transition-transform">
                  &rarr;
                </div>

                <div>
                  {/* Top Eyebrow & Number */}
                  <div className="flex items-baseline justify-between border-b border-[#18122B]/10 pb-4">
                    <span className="font-mono text-4xl sm:text-5xl font-black text-[#84cc16] drop-shadow-sm">
                      01
                    </span>
                    <span className="rounded-full bg-[#84cc16] text-[#18122B] px-2.5 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider shadow-sm">
                      Drop it in.
                    </span>
                  </div>

                  <h3 className="mt-4 font-serif text-2xl font-black tracking-tight text-[#18122B]">
                    CAPTURE
                  </h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-[#18122B]/75 leading-relaxed">
                    Payment screenshots, messages, statements and shared expenses.
                  </p>

                  {/* Visual Artifact: Physical Receipt Slip with 3D Asset */}
                  <div className="mt-5 relative rounded-2xl border-2 border-dashed border-[#84cc16]/60 bg-[#F7FEE7] p-3 shadow-sm transition-transform duration-300 group-hover:scale-[1.02]">
                    <div className="flex items-center justify-between font-mono text-[10px] font-black text-[#3f6212] border-b border-dashed border-[#84cc16]/40 pb-2">
                      <span className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#84cc16] animate-pulse" />
                        OCR • 0.3s
                      </span>
                      <span className="text-[#854D0E]">📸 UPI RECEIPT</span>
                    </div>

                    <div className="mt-2.5 flex items-start justify-between">
                      <div>
                        <div className="font-sans text-xs font-bold text-[#18122B]">Swiggy • Bowls</div>
                        <div className="font-mono text-[10px] text-[#18122B]/60">GPay UPI Ref #9042</div>
                      </div>
                      <div className="font-mono text-xs font-black text-[#18122B]">₹ 480.00</div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-dashed border-[#84cc16]/40 flex justify-between font-mono text-[10px] text-[#4d7c0f] font-bold">
                      <span>✓ EXTRACTED</span>
                      <span>ZERO TYPING</span>
                    </div>

                    {/* 3D Receipt Floating Asset */}
                    <div className="absolute -bottom-4 -right-3 w-11 h-11 pointer-events-none drop-shadow-md transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
                      <Image
                        src="/brand/artifacts/receipt-3d.png"
                        alt="Receipt artifact"
                        width={44}
                        height={44}
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-[#18122B]/10 font-mono text-[11px] font-bold text-[#4d7c0f] flex items-center justify-between">
                  <span>&rarr; Zero manual typing</span>
                  <span className="text-[10px] text-[#18122B]/50 font-medium">Auto-forward</span>
                </div>
              </div>

              {/* Mobile Connector 1 -> 2 (visible on single-col mobile) */}
              <div className="md:hidden flex flex-col items-center py-1 text-[#18122B]">
                <div className="h-5 w-0.5 border-l-2 border-dashed border-[#18122B]/30" />
                <div className="my-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#18122B] text-[#84cc16] font-mono text-xs font-black shadow-sm">
                  &darr;
                </div>
                <div className="h-5 w-0.5 border-l-2 border-dashed border-[#18122B]/30" />
              </div>

              {/* ================================================================= */}
              {/* STAGE 02 — ORGANIZE (Lavender Folder & Double-Entry Ledger)       */}
              {/* ================================================================= */}
              <div className="group relative flex flex-col justify-between rounded-3xl border-2 border-[#8B5CF6] bg-[#FAF8FF] p-6 lg:p-4.5 xl:p-7 shadow-[6px_6px_0px_#18122B] transition-all duration-300 hover:shadow-[8px_8px_0px_#8B5CF6] hover:-translate-y-2 lg:rotate-[1deg]">
                
                {/* Desktop Flow Arrow Bridge */}
                <div className="hidden lg:flex absolute -right-3.5 top-12 z-20 items-center justify-center w-7 h-7 rounded-full bg-[#18122B] text-[#8B5CF6] font-mono text-xs font-black shadow-[2px_2px_0px_#8B5CF6] group-hover:translate-x-1 transition-transform">
                  &rarr;
                </div>

                <div>
                  {/* Top Eyebrow & Number */}
                  <div className="flex items-baseline justify-between border-b border-[#18122B]/10 pb-4">
                    <span className="font-mono text-4xl sm:text-5xl font-black text-[#8B5CF6] drop-shadow-sm">
                      02
                    </span>
                    <span className="rounded-full bg-[#8B5CF6] text-white px-2.5 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider shadow-sm">
                      Clean it up.
                    </span>
                  </div>

                  <h3 className="mt-4 font-serif text-2xl font-black tracking-tight text-[#18122B]">
                    ORGANIZE
                  </h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-[#18122B]/75 leading-relaxed">
                    Messy financial information becomes structured double-entry ledger vouchers.
                  </p>

                  {/* Visual Artifact: Vertical Transformation Pipeline */}
                  <div className="mt-5 rounded-2xl border-2 border-[#8B5CF6]/30 bg-white p-3 shadow-sm transition-transform duration-300 group-hover:scale-[1.02]">
                    
                    {/* Step A: Raw Input */}
                    <div className="flex items-center justify-between font-mono text-[10px] text-[#18122B] bg-[#F5F3FF] rounded-lg px-2 py-1 border border-[#8B5CF6]/20">
                      <span className="font-bold">PAYMENT: ₹640</span>
                      <span className="text-[#6D28D9] font-black">&rarr; Dining</span>
                    </div>

                    {/* Step B: Directional transformation indicator */}
                    <div className="my-1.5 flex justify-center font-mono text-[10px] font-black text-[#8B5CF6]">
                      &darr; STRUCTURED ENTRY
                    </div>

                    {/* Step C: Structured Double-Entry Ledger */}
                    <div className="rounded-xl bg-[#FAF8F5] p-2 border border-[#18122B]/10 font-mono text-[10px] space-y-1">
                      <div className="flex justify-between text-[#18122B]">
                        <span className="text-[#6D28D9] font-bold">DR: Food & Dining</span>
                        <span className="font-black">₹ 640.00</span>
                      </div>
                      <div className="flex justify-between text-[#18122B]/70">
                        <span>CR: HDFC Bank UPI</span>
                        <span>₹ 640.00</span>
                      </div>
                      <div className="pt-1 border-t border-dashed border-[#18122B]/15 flex justify-between text-[9px] font-black text-[#047857]">
                        <span>✓ BALANCED VOUCHER</span>
                        <span>#0941</span>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-[#18122B]/10 font-mono text-[11px] font-bold text-[#6D28D9] flex items-center justify-between">
                  <span>&rarr; Balanced ledger</span>
                  <span className="text-[10px] text-[#18122B]/50 font-medium">Audit-proof</span>
                </div>
              </div>

              {/* Mobile Connector 2 -> 3 (visible on single-col mobile) */}
              <div className="md:hidden flex flex-col items-center py-1 text-[#18122B]">
                <div className="h-5 w-0.5 border-l-2 border-dashed border-[#18122B]/30" />
                <div className="my-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#18122B] text-[#F97316] font-mono text-xs font-black shadow-sm">
                  &darr;
                </div>
                <div className="h-5 w-0.5 border-l-2 border-dashed border-[#18122B]/30" />
              </div>

              {/* ================================================================= */}
              {/* STAGE 03 — UNDERSTAND (Orange Dossier & Velocity Bar)             */}
              {/* ================================================================= */}
              <div className="group relative flex flex-col justify-between rounded-3xl border-2 border-[#F97316] bg-[#FFFBF7] p-6 lg:p-4.5 xl:p-7 shadow-[6px_6px_0px_#18122B] transition-all duration-300 hover:shadow-[8px_8px_0px_#F97316] hover:-translate-y-2 lg:rotate-[-0.5deg]">
                
                {/* Desktop Flow Arrow Bridge */}
                <div className="hidden lg:flex absolute -right-3.5 top-12 z-20 items-center justify-center w-7 h-7 rounded-full bg-[#18122B] text-[#F97316] font-mono text-xs font-black shadow-[2px_2px_0px_#F97316] group-hover:translate-x-1 transition-transform">
                  &rarr;
                </div>

                <div>
                  {/* Top Eyebrow & Number */}
                  <div className="flex items-baseline justify-between border-b border-[#18122B]/10 pb-4">
                    <span className="font-mono text-4xl sm:text-5xl font-black text-[#F97316] drop-shadow-sm">
                      03
                    </span>
                    <span className="rounded-full bg-[#F97316] text-white px-2.5 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider shadow-sm">
                      See the pattern.
                    </span>
                  </div>

                  <h3 className="mt-4 font-serif text-2xl font-black tracking-tight text-[#18122B]">
                    UNDERSTAND
                  </h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-[#18122B]/75 leading-relaxed">
                    Live velocity, category burns, and 50/30/20 budget envelope trends.
                  </p>

                  {/* Visual Artifact: Spending Velocity & Live Trend Alert */}
                  <div className="mt-5 rounded-2xl border-2 border-[#F97316]/30 bg-white p-3 shadow-sm transition-transform duration-300 group-hover:scale-[1.02]">
                    
                    {/* Category velocity bars */}
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between font-mono text-[10px] font-bold text-[#18122B]">
                          <span>Dining</span>
                          <span className="text-[#C2410C] font-black">68%</span>
                        </div>
                        <div className="mt-1 h-2 w-full rounded-full bg-[#18122B]/10 overflow-hidden">
                          <div className="h-full rounded-full bg-[#F97316] w-[68%]" />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between font-mono text-[10px] font-bold text-[#18122B]">
                          <span>Groceries</span>
                          <span className="text-[#18122B]/60">42%</span>
                        </div>
                        <div className="mt-1 h-2 w-full rounded-full bg-[#18122B]/10 overflow-hidden">
                          <div className="h-full rounded-full bg-[#18122B]/30 w-[42%]" />
                        </div>
                      </div>
                    </div>

                    {/* Insight Callout Chip */}
                    <div className="mt-3 rounded-xl border border-[#F97316]/40 bg-[#FFF7ED] p-2 font-mono text-[10px] font-bold text-[#C2410C] flex items-center gap-1.5">
                      <span className="text-sm">↗</span>
                      <span>Dining is trending up (+18%).</span>
                    </div>

                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-[#18122B]/10 font-mono text-[11px] font-bold text-[#C2410C] flex items-center justify-between">
                  <span>&rarr; 50/30/20 envelopes</span>
                  <span className="text-[10px] text-[#18122B]/50 font-medium">Live sync</span>
                </div>
              </div>

              {/* Mobile Connector 3 -> 4 (visible on single-col mobile) */}
              <div className="md:hidden flex flex-col items-center py-1 text-[#18122B]">
                <div className="h-5 w-0.5 border-l-2 border-dashed border-[#18122B]/30" />
                <div className="my-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#18122B] text-[#2563EB] font-mono text-xs font-black shadow-sm">
                  &darr;
                </div>
                <div className="h-5 w-0.5 border-l-2 border-dashed border-[#18122B]/30" />
              </div>

              {/* ================================================================= */}
              {/* STAGE 04 — FLIP (The Payoff Stage: Cobalt Blue + Lime on Plum)    */}
              {/* ================================================================= */}
              <div className="group relative flex flex-col justify-between rounded-3xl border-2 border-[#84cc16] bg-[#18122B] p-6 lg:p-4.5 xl:p-7 text-white shadow-[8px_8px_0px_#2563EB] transition-all duration-300 hover:shadow-[10px_10px_0px_#84cc16] hover:-translate-y-2 lg:scale-[1.04] lg:z-10">
                
                <div>
                  {/* Top Eyebrow & Number */}
                  <div className="flex items-baseline justify-between border-b border-white/15 pb-4">
                    <span className="font-mono text-4xl sm:text-5xl font-black text-[#84cc16] drop-shadow-sm">
                      04
                    </span>
                    <span className="rounded-full bg-[#84cc16] text-[#18122B] px-2.5 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider shadow-sm">
                      Make the move.
                    </span>
                  </div>

                  <h3 className="mt-4 font-serif text-2xl font-black tracking-tight text-white flex items-center gap-2">
                    FLIP
                    <span className="inline-block rounded bg-[#2563EB] px-1.5 py-0.5 font-mono text-[10px] text-white uppercase font-bold">
                      PAYOFF
                    </span>
                  </h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-white/75 leading-relaxed">
                    Personalized AI financial guidance. Now you know what to do.
                  </p>

                  {/* Visual Artifact: Actionable AI Rebalance Advice */}
                  <div className="mt-5 relative rounded-2xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-sm transition-transform duration-300 group-hover:scale-[1.02]">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] font-black text-[#84cc16] mb-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#84cc16] animate-pulse" />
                      PERSONALIZED GUIDANCE
                    </div>

                    <p className="font-sans text-xs sm:text-[13px] font-semibold text-white leading-snug">
                      &ldquo;Your weekend spending is up. Want to rebalance your budget?&rdquo;
                    </p>

                    {/* Simulated Interactive Action Pill */}
                    <div className="mt-3 flex items-center justify-between rounded-xl bg-[#84cc16] px-3 py-2 text-[#18122B] font-mono text-[11px] font-black shadow-sm transition-transform hover:scale-105 cursor-pointer">
                      <span>One-Tap Rebalance</span>
                      <span className="text-sm">&rarr;</span>
                    </div>

                    {/* Floating 3D Chart Asset */}
                    <div className="absolute -top-4 -right-3 w-12 h-12 pointer-events-none drop-shadow-xl transition-transform duration-300 group-hover:scale-110">
                      <Image
                        src="/brand/artifacts/chart-3d.png"
                        alt="Growth chart artifact"
                        width={48}
                        height={48}
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-white/15 font-mono text-[11px] font-bold text-[#84cc16] flex items-center justify-between">
                  <span>&rarr; Compound wealth</span>
                  <span className="text-[10px] text-white/50 font-medium">Clear next step</span>
                </div>
              </div>

            </div>

          </div>

          {/* Bottom Trust/Transformation Reassurance Pill */}
          <div className="mt-12 sm:mt-16 flex justify-center">
            <div className="inline-flex flex-wrap items-center justify-center gap-3 sm:gap-6 rounded-2xl border border-[#18122B]/15 bg-white/90 px-5 py-3 shadow-sm text-center">
              <span className="font-mono text-xs font-bold text-[#18122B]">
                Messy screenshots, PDFs & chats
              </span>
              <span className="font-mono text-sm font-black text-[#84cc16] hidden sm:inline">
                &rarr;
              </span>
              <span className="rounded-lg bg-[#84cc16] px-2.5 py-1 font-mono text-xs font-black text-[#18122B] uppercase">
                FinSage Intelligence
              </span>
              <span className="font-mono text-sm font-black text-[#84cc16] hidden sm:inline">
                &rarr;
              </span>
              <span className="font-mono text-xs font-bold text-[#18122B]">
                Actionable wealth momentum
              </span>
            </div>
          </div>

        </div>
      </section>
  );
}
