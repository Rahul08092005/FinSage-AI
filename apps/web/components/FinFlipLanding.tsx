"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export function FinFlipLanding() {
  const [token, setToken] = useState<string | null>(null);
  const [activeShowcase, setActiveShowcase] = useState<"dashboard" | "ledger" | "budgets" | "goals" | "advisor">("dashboard");
  const [ocrStep, setOcrStep] = useState<number>(2);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("finsage_token"));
    }
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-[#FAF8F5] text-[#18122B] selection:bg-[#84cc16] selection:text-[#18122B]">
      
      {/* Active Session Notification Bar if already logged in */}
      {token && (
        <aside aria-label="Active session banner" className="sticky top-[57px] z-40 flex items-center justify-between border-b border-[#84cc16]/40 bg-[#FAF8F5] px-4 py-2 text-xs font-semibold backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#84cc16] animate-ping" />
            <span className="text-[#18122B]">Active session detected: You are currently signed in to Fin Flip.</span>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-full bg-[#84cc16] px-3.5 py-1 text-[11px] font-black text-[#18122B] shadow-sm transition hover:bg-[#a3e635] hover:scale-105"
          >
            <span>Open Workspace</span>
            <span>&rarr;</span>
          </Link>
        </aside>
      )}

      {/* ========================================================================= */}
      {/* 1. HERO SECTION                                                           */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-8 pb-20 lg:pt-14 lg:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
            
            {/* LEFT: Large Typography & Narrative */}
            <div className="lg:col-span-6">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 rounded-full border border-[#18122B]/10 bg-white px-3.5 py-1.5 text-xs font-bold tracking-wider text-[#18122B]/80 shadow-sm uppercase">
                <span className="h-2 w-2 rounded-full bg-[#84cc16]" />
                <span>FIN FLIP / PERSONAL FINANCE, FLIPPED</span>
              </div>

              {/* Bold Editorial Headline */}
              <h1 className="mt-6 font-serif text-5xl font-black tracking-tight text-[#18122B] sm:text-6xl md:text-7xl lg:text-[76px] lg:leading-[0.96]">
                YOUR MONEY.<br />
                YOUR RULES.<br />
                <span className="relative inline-block mt-2">
                  <span className="relative z-10 inline-block rounded-2xl bg-[#84cc16] px-4 py-1 text-[#18122B] shadow-sm rotate-[-1deg]">
                    FLIP IT.
                  </span>
                </span>
              </h1>

              {/* Supporting Copy */}
              <p className="mt-6 max-w-lg text-base leading-relaxed text-[#18122B]/75 sm:text-lg">
                Fin Flip is an AI-powered personal financial workspace that helps users understand spending, organize expenses, track financial activity, and receive personalized financial guidance.
              </p>

              {/* Primary & Secondary CTAs */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href={token ? "/dashboard" : "/signup"}
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-[#18122B] px-8 py-4 text-sm font-black tracking-wide text-white shadow-lg transition-all duration-200 hover:bg-[#2D1B4E] hover:scale-105 active:scale-95 sm:text-base"
                >
                  <span>{token ? "Open My Dashboard" : "Start Flipping"}</span>
                  <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>

                <a
                  href="#problem"
                  className="inline-flex items-center gap-2 rounded-full border border-[#18122B]/20 bg-white px-6 py-4 text-sm font-bold text-[#18122B] shadow-sm transition hover:border-[#18122B] hover:bg-[#FAF8F5] active:scale-95 sm:text-base"
                >
                  <span>See How It Works</span>
                  <span className="text-[#18122B]/50">&darr;</span>
                </a>
              </div>

              {/* Product Benefits Row */}
              <div className="mt-8 flex flex-wrap items-center gap-3 text-xs font-bold tracking-wider text-[#18122B]/60 uppercase">
                <span>AI-powered insights</span>
                <span className="text-[#84cc16] font-black">•</span>
                <span>Expense tracking</span>
                <span className="text-[#84cc16] font-black">•</span>
                <span>Personal financial workspace</span>
              </div>
            </div>

            {/* RIGHT: Gen-Z Character Artwork & Supporting Finance Objects */}
            <div className="relative lg:col-span-6 flex justify-center">
              
              {/* Main Character Frame */}
              <div className="relative w-full max-w-md sm:max-w-lg">
                
                {/* Editorial Colored Backdrop Pillow */}
                <div className="absolute -inset-2 rounded-[2.5rem] bg-gradient-to-br from-[#E9D5FF] via-[#FEF08A]/40 to-[#FED7AA] transform rotate-1 shadow-md" />

                {/* Hero Artwork Container */}
                <div className="relative overflow-hidden rounded-[2.2rem] border-2 border-[#18122B]/10 bg-[#18122B] shadow-2xl transition hover:rotate-0">
                  <div className="relative aspect-square w-full">
                    <Image
                      src="/brand/hero-genz-character.jpg"
                      alt="Gen-Z character checking Fin Flip personal finance workspace on phone"
                      fill
                      priority
                      className="object-cover object-center"
                    />
                  </div>
                </div>

                {/* Floating Tactile Finance Object: Live Voucher Badge */}
                <div className="absolute -bottom-6 -left-6 z-20 rounded-2xl border border-[#18122B]/10 bg-white p-3.5 shadow-xl rotate-[-4deg] transition hover:rotate-0 hover:scale-105">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#84cc16]/20 text-[#4d7c0f] font-bold text-base">
                      ⚡
                    </div>
                    <div>
                      <p className="font-mono text-[10px] font-black tracking-widest text-[#18122B]/50 uppercase">
                        VOUCHER #VCH-0941
                      </p>
                      <p className="font-serif text-xs font-bold text-[#18122B]">
                        Blinkit • ₹ 1,420 (Balanced)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Floating Tactile Finance Object: AI Insight Tag */}
                <div className="absolute -top-4 -right-4 z-20 rounded-2xl border border-[#18122B]/10 bg-[#FAF8F5] p-3 shadow-xl rotate-[3deg] transition hover:rotate-0 hover:scale-105">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#84cc16] animate-pulse" />
                    <span className="font-mono text-[11px] font-bold text-[#18122B]">
                      50/30/20 On Track (+14% saved)
                    </span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. "MONEY GETS MESSY." & "FIN FLIP CLEANS IT UP."                         */}
      {/* ========================================================================= */}
      <section id="problem" className="relative border-t border-[#E8E4DC] bg-[#F5F2EB] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl">
            <span className="inline-block rounded-full bg-[#FCE7F3] border border-[#F472B6]/40 px-3 py-1 font-mono text-xs font-bold text-[#BE185D] uppercase tracking-wider">
              01 • THE PROBLEM
            </span>
            <h2 className="mt-4 font-serif text-4xl font-black tracking-tight text-[#18122B] sm:text-5xl md:text-6xl">
              MONEY GETS MESSY.
            </h2>
            <p className="mt-4 text-base text-[#18122B]/70 sm:text-lg">
              Personal finance shouldn&apos;t feel like untangling headphones in the dark. Modern money fragments everywhere:
            </p>
          </div>

          {/* Editorial Chaos Grid */}
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-3xl border border-[#18122B]/10 bg-white p-6 shadow-sm transition hover:shadow-md">
              <span className="font-mono text-xs font-black text-[#F97316]">FRAGMENT 01</span>
              <h3 className="mt-2 font-serif text-xl font-bold text-[#18122B]">Payment screenshots.</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#18122B]/60 sm:text-sm">
                Buried deep in your camera roll next to concert videos and memes, never to be entered into a spreadsheet.
              </p>
            </div>

            <div className="rounded-3xl border border-[#18122B]/10 bg-white p-6 shadow-sm transition hover:shadow-md">
              <span className="font-mono text-xs font-black text-[#8B5CF6]">FRAGMENT 02</span>
              <h3 className="mt-2 font-serif text-xl font-bold text-[#18122B]">Bank statements.</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#18122B]/60 sm:text-sm">
                Multi-page PDFs filled with cryptic codes like <code className="bg-[#FAF8F5] px-1 py-0.5 rounded text-[#18122B] font-mono">UPI/CR/9281/ZOM</code> that make auditing exhausting.
              </p>
            </div>

            <div className="rounded-3xl border border-[#18122B]/10 bg-white p-6 shadow-sm transition hover:shadow-md">
              <span className="font-mono text-xs font-black text-[#3B82F6]">FRAGMENT 03</span>
              <h3 className="mt-2 font-serif text-xl font-bold text-[#18122B]">UPI & payment messages.</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#18122B]/60 sm:text-sm">
                Endless SMS debit alerts chiming throughout the week that vanish without giving you a cumulative picture.
              </p>
            </div>

            <div className="rounded-3xl border border-[#18122B]/10 bg-white p-6 shadow-sm transition hover:shadow-md">
              <span className="font-mono text-xs font-black text-[#10B981]">FRAGMENT 04</span>
              <h3 className="mt-2 font-serif text-xl font-bold text-[#18122B]">Split bills.</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#18122B]/60 sm:text-sm">
                Shared dinners, vacation rentals, and roommates turning into confusing IOUs scattered across WhatsApp chats.
              </p>
            </div>

            <div className="rounded-3xl border border-[#18122B]/10 bg-white p-6 shadow-sm transition hover:shadow-md">
              <span className="font-mono text-xs font-black text-[#EC4899]">FRAGMENT 05</span>
              <h3 className="mt-2 font-serif text-xl font-bold text-[#18122B]">Subscriptions.</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#18122B]/60 sm:text-sm">
                Silent monthly recurring leaks for streaming tiers, cloud storage, and apps you forgot you ever downloaded.
              </p>
            </div>

            <div className="rounded-3xl border-2 border-[#84cc16] bg-[#84cc16]/10 p-6 shadow-sm">
              <span className="font-mono text-xs font-black text-[#4d7c0f]">THE DREADED QUESTION</span>
              <h3 className="mt-2 font-serif text-xl font-black text-[#18122B]">&ldquo;Where did my money go?&rdquo;</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#18122B]/80 sm:text-sm">
                73% of people abandon traditional budgeting apps within three weeks. Manual input has too much friction.
              </p>
            </div>
          </div>

          {/* Transformation Banner */}
          <div className="mt-16 rounded-[2.5rem] border-2 border-[#18122B] bg-white p-8 lg:p-12 shadow-xl">
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <span className="font-mono text-xs font-black uppercase tracking-widest text-[#84cc16]">
                  THE TRANSFORMATION
                </span>
                <h3 className="mt-2 font-serif text-3xl font-black text-[#18122B] sm:text-4xl">
                  FIN FLIP CLEANS IT UP.
                </h3>
                <p className="mt-3 text-sm text-[#18122B]/75 leading-relaxed sm:text-base">
                  Drop in your receipts, forward SMS statements, or sync your Splitwise debts. Fin Flip ingests them, reconciles the numbers with double-entry accounting precision, and organizes everything into live 50/30/20 envelopes.
                </p>
              </div>

              <div className="lg:col-span-5 flex justify-center">
                <div className="w-full rounded-2xl bg-[#F5F2EB] p-4 border border-[#18122B]/10 font-mono text-xs space-y-2">
                  <div className="flex justify-between text-[#18122B]/60 text-[11px] pb-1 border-b border-[#18122B]/10 font-sans font-bold">
                    <span>MESSY INPUT</span>
                    <span className="text-[#84cc16] font-mono font-bold">&rarr; BALANCED LEDGER</span>
                  </div>
                  <p className="text-[#18122B] font-semibold">DR: 5100 Dining Expense (₹ 640.00)</p>
                  <p className="text-[#18122B]/80">CR: 1020 HDFC Salary Bank (₹ 640.00)</p>
                  <div className="pt-1 text-[10px] text-[#4d7c0f] font-bold">
                    ✓ Verified Voucher #VCH-2026-0941 • Reconciled
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. HOW FIN FLIP WORKS (4-STEP EDITORIAL LAYOUT)                           */}
      {/* ========================================================================= */}
      <section id="how-it-works" className="relative border-t border-[#E8E4DC] bg-[#FAF8F5] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block rounded-full bg-[#FEF08A] border border-[#CA8A04]/40 px-3 py-1 font-mono text-xs font-bold text-[#854D0E] uppercase tracking-wider">
              02 • THE WORKFLOW
            </span>
            <h2 className="mt-4 font-serif text-4xl font-black tracking-tight text-[#18122B] sm:text-5xl">
              HOW FIN FLIP WORKS.
            </h2>
            <p className="mt-4 text-base text-[#18122B]/70">
              Four clear steps from financial chaos to total wealth clarity.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            
            {/* Step 01 */}
            <div className="rounded-3xl border border-[#18122B]/10 bg-white p-6 shadow-sm transition hover:shadow-md hover:-translate-y-1">
              <span className="font-mono text-3xl font-black text-[#84cc16]">01</span>
              <h3 className="mt-4 font-serif text-xl font-black text-[#18122B] tracking-tight">CAPTURE</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#18122B]/70 sm:text-sm">
                Payment screenshots, messages, statements, and expenses come in through OCR upload or direct sync.
              </p>
              <div className="mt-4 pt-3 border-t border-[#18122B]/10 font-mono text-[11px] font-bold text-[#18122B]/50">
                &rarr; Zero manual typing
              </div>
            </div>

            {/* Step 02 */}
            <div className="rounded-3xl border border-[#18122B]/10 bg-white p-6 shadow-sm transition hover:shadow-md hover:-translate-y-1">
              <span className="font-mono text-3xl font-black text-[#8B5CF6]">02</span>
              <h3 className="mt-4 font-serif text-xl font-black text-[#18122B] tracking-tight">UNDERSTAND</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#18122B]/70 sm:text-sm">
                Fin Flip organizes and categorizes your financial activity into disciplined 50/30/20 budget envelopes.
              </p>
              <div className="mt-4 pt-3 border-t border-[#18122B]/10 font-mono text-[11px] font-bold text-[#8B5CF6]">
                &rarr; Double-entry vouchers
              </div>
            </div>

            {/* Step 03 */}
            <div className="rounded-3xl border border-[#18122B]/10 bg-white p-6 shadow-sm transition hover:shadow-md hover:-translate-y-1">
              <span className="font-mono text-3xl font-black text-[#F97316]">03</span>
              <h3 className="mt-4 font-serif text-xl font-black text-[#18122B] tracking-tight">ADVISE</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#18122B]/70 sm:text-sm">
                The AI financial advisor analyzes spending patterns and provides personalized, philosophy-grounded guidance.
              </p>
              <div className="mt-4 pt-3 border-t border-[#18122B]/10 font-mono text-[11px] font-bold text-[#F97316]">
                &rarr; Contextual co-pilot
              </div>
            </div>

            {/* Step 04 */}
            <div className="rounded-3xl border border-[#18122B]/10 bg-white p-6 shadow-sm transition hover:shadow-md hover:-translate-y-1">
              <span className="font-mono text-3xl font-black text-[#3B82F6]">04</span>
              <h3 className="mt-4 font-serif text-xl font-black text-[#18122B] tracking-tight">FLIP</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#18122B]/70 sm:text-sm">
                Users make smarter decisions with a clearer view of their money, accelerating towards financial freedom.
              </p>
              <div className="mt-4 pt-3 border-t border-[#18122B]/10 font-mono text-[11px] font-bold text-[#3B82F6]">
                &rarr; Compound wealth
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. OCR EXPENSE CAPTURE ("SCREENSHOT IN. EXPENSE OUT.")                     */}
      {/* ========================================================================= */}
      <section id="ocr" className="relative border-t border-[#E8E4DC] bg-[#F5F2EB] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            
            {/* Left: Uploaded Receipt OCR Phone Artwork */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="relative w-full max-w-md">
                <div className="overflow-hidden rounded-[2.5rem] border-2 border-[#18122B]/10 bg-white shadow-2xl transition hover:scale-[1.01]">
                  <div className="relative aspect-[3/2] w-full">
                    <Image
                      src="/brand/receipt-ocr-phone.jpg"
                      alt="Fin Flip OCR Receipt scanner converting payment receipts into structured expenses on phone"
                      fill
                      className="object-cover object-center"
                    />
                  </div>
                </div>

                {/* Floating Interactive Stepper */}
                <div className="mt-4 flex items-center justify-between rounded-2xl bg-white p-2.5 shadow-md border border-[#18122B]/10">
                  <button
                    onClick={() => setOcrStep(0)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      ocrStep === 0 ? "bg-[#18122B] text-white" : "text-[#18122B]/60 hover:text-[#18122B]"
                    }`}
                  >
                    1. Drop Receipt
                  </button>
                  <button
                    onClick={() => setOcrStep(1)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      ocrStep === 1 ? "bg-[#18122B] text-white" : "text-[#18122B]/60 hover:text-[#18122B]"
                    }`}
                  >
                    2. OCR Scan
                  </button>
                  <button
                    onClick={() => setOcrStep(2)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      ocrStep === 2 ? "bg-[#84cc16] text-[#18122B]" : "text-[#18122B]/60 hover:text-[#18122B]"
                    }`}
                  >
                    3. Live Voucher
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Narrative & Real Application UI Demonstration */}
            <div className="lg:col-span-6">
              <span className="inline-block rounded-full bg-[#DCFCE7] border border-[#84cc16]/40 px-3 py-1 font-mono text-xs font-bold text-[#166534] uppercase tracking-wider">
                03 • OCR CAPTURE
              </span>
              <h2 className="mt-4 font-serif text-4xl font-black tracking-tight text-[#18122B] sm:text-5xl">
                SCREENSHOT IN.<br />
                EXPENSE OUT.
              </h2>
              <p className="mt-4 text-base text-[#18122B]/75 leading-relaxed">
                Take a quick screenshot of any payment confirmation on GPay, PhonePe, Paytm, or your credit card. Our high-accuracy OCR pipeline parses line items, amounts, merchant identities, and timestamps in seconds.
              </p>

              {/* Real UI Component Voucher Display */}
              <div className="mt-8 rounded-2xl border border-[#18122B]/10 bg-white p-5 shadow-md">
                <div className="flex items-center justify-between border-b border-[#18122B]/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#84cc16]" />
                    <span className="font-mono text-xs font-bold text-[#18122B]">VOUCHER #VCH-2026-0941</span>
                  </div>
                  <span className="rounded-full bg-[#DCFCE7] px-2.5 py-0.5 text-[10px] font-black text-[#166534]">
                    PARSED (99.4%)
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-mono text-[#18122B]/50 uppercase">Merchant</span>
                    <p className="font-bold text-[#18122B]">Blue Tokai Coffee Roasters</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-[#18122B]/50 uppercase">Classification</span>
                    <p className="font-bold text-[#18122B]">Dining (30% Envelope)</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-[#18122B]/50 uppercase">Amount</span>
                    <p className="font-mono font-bold text-[#18122B]">₹ 340.00</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-[#18122B]/50 uppercase">Status</span>
                    <p className="font-bold text-[#84cc16]">Double-Entry Balanced</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. AI FINANCIAL ADVISOR                                                   */}
      {/* ========================================================================= */}
      <section id="advisor" className="relative border-t border-[#E8E4DC] bg-[#FAF8F5] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            
            <div className="lg:col-span-6">
              <span className="inline-block rounded-full bg-[#EDE9FE] border border-[#8B5CF6]/40 px-3 py-1 font-mono text-xs font-bold text-[#6D28D9] uppercase tracking-wider">
                04 • AI ADVISOR
              </span>
              <h2 className="mt-4 font-serif text-4xl font-black tracking-tight text-[#18122B] sm:text-5xl">
                HUMAN INTELLIGENCE.<br />
                ROOTED IN PHILOSOPHY.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#18122B]/75">
                No robotic clichés or generic budget charts. Fin Flip pairs your real cashflow numbers with proven wealth frameworks like 50/30/20, Morgan Housel&apos;s <em>Psychology of Money</em>, and Bill Perkins&apos; <em>Die with Zero</em> to provide actionable advice without judgment.
              </p>

              <div className="mt-8 space-y-3">
                <div className="rounded-2xl border border-[#18122B]/10 bg-white p-4 text-xs shadow-sm">
                  <span className="font-bold text-[#18122B]">Adaptive Purchase Affordability</span>
                  <p className="text-[#18122B]/70 mt-1">Ask &ldquo;Can I afford this ₹14,000 weekend trip?&rdquo; and receive mathematically reasoned guidance backed by your liquid runway.</p>
                </div>

                <div className="rounded-2xl border border-[#18122B]/10 bg-white p-4 text-xs shadow-sm">
                  <span className="font-bold text-[#18122B]">Behavioral Trigger Awareness</span>
                  <p className="text-[#18122B]/70 mt-1">Detects lifestyle creep and weekend delivery spikes before they derail your compounding targets.</p>
                </div>
              </div>
            </div>

            {/* AI Advisor Telemetry Card */}
            <div className="lg:col-span-6">
              <div className="rounded-[2.5rem] border-2 border-[#18122B]/10 bg-white p-7 shadow-xl">
                <div className="flex items-center justify-between border-b border-[#18122B]/10 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-3 w-3 rounded-full bg-[#84cc16]" />
                    <span className="font-serif text-sm font-bold text-[#18122B]">Fin Flip AI Co-Pilot</span>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-[#8B5CF6] uppercase">
                    GROQ LLAMA 3 • LIVE
                  </span>
                </div>

                <div className="mt-6 space-y-4 text-xs">
                  {/* Real Insight Trigger */}
                  <div className="rounded-2xl bg-[#F5F2EB] p-4 border border-[#18122B]/10">
                    <span className="font-mono text-[10px] font-bold text-[#F97316] uppercase">Cash Flow Trigger</span>
                    <p className="mt-1 font-serif text-base font-bold text-[#18122B]">
                      &ldquo;Your dining spend jumped 18% this month.&rdquo;
                    </p>
                    <p className="mt-1 text-[#18122B]/70">
                      August: ₹ 14,200 &rarr; September: ₹ 16,800.
                    </p>
                  </div>

                  {/* AI Recommendation */}
                  <div className="rounded-2xl border-2 border-[#84cc16] bg-[#84cc16]/10 p-4 space-y-1.5">
                    <p className="font-bold text-[#18122B]">Advisor Recommendation:</p>
                    <p className="text-[#18122B]/85 leading-relaxed">
                      You still have <span className="font-mono font-bold text-[#18122B]">₹ 18,400</span> remaining in your Lifestyle envelope. You are disciplined, but reallocating ₹ 4,200 towards your Emergency Goal will lock in your 3-month living expense buffer 14 days ahead of schedule.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. SPLITWISE / EXPENSE SHARING                                            */}
      {/* ========================================================================= */}
      <section id="splitwise" className="relative border-t border-[#E8E4DC] bg-[#F5F2EB] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            
            <div className="lg:col-span-6">
              <span className="inline-block rounded-full bg-[#DBEAFE] border border-[#3B82F6]/40 px-3 py-1 font-mono text-xs font-bold text-[#1D4ED8] uppercase tracking-wider">
                05 • EXPENSE SHARING
              </span>
              <h2 className="mt-4 font-serif text-4xl font-black tracking-tight text-[#18122B] sm:text-5xl">
                SHARED BILLS.<br />
                ZERO AWKWARD MATH.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#18122B]/75">
                Fin Flip seamlessly integrates shared group expenses into your personal accounting ledger. If you cover a ₹4,000 group dinner for 4 flatmates, only your ₹1,000 share impacts your monthly dining budget.
              </p>

              <div className="mt-8 space-y-3 text-xs">
                <div className="rounded-2xl border border-[#18122B]/10 bg-white p-4 shadow-sm">
                  <span className="font-bold text-[#18122B]">Debt Simplification Algorithm</span>
                  <p className="text-[#18122B]/70 mt-0.5">8 multilateral group debts are automatically reduced into 2 direct settlements.</p>
                </div>
              </div>
            </div>

            {/* Splitwise Card Composition */}
            <div className="lg:col-span-6">
              <div className="rounded-[2.5rem] border border-[#18122B]/10 bg-white p-7 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-[#18122B]/10 pb-3">
                  <span className="font-serif font-bold text-[#18122B] text-sm">Goa Trip • 4 Members</span>
                  <span className="rounded-full bg-[#DCFCE7] px-2.5 py-0.5 font-mono text-[10px] font-black text-[#166534] uppercase">
                    NET SETTLED
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between rounded-xl bg-[#FAF8F5] p-3 border border-[#18122B]/5">
                    <span className="font-semibold text-[#18122B]">Rohan owes you</span>
                    <span className="font-mono font-bold text-[#166534]">+ ₹ 850.00</span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-[#FAF8F5] p-3 border border-[#18122B]/5">
                    <span className="font-semibold text-[#18122B]">Priya owes you</span>
                    <span className="font-mono font-bold text-[#166534]">+ ₹ 1,200.00</span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-[#FAF8F5] p-3 border border-[#18122B]/5">
                    <span className="font-semibold text-[#18122B]">You owe Ananya</span>
                    <span className="font-mono font-bold text-rose-600">- ₹ 450.00</span>
                  </div>
                </div>

                <div className="rounded-2xl border-2 border-[#84cc16] bg-[#84cc16]/10 p-4 text-center">
                  <p className="text-xs font-semibold text-[#18122B]">Net balance to collect: <span className="font-mono font-black text-[#166534] text-sm">₹ 1,600.00</span></p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. KNOWLEDGE ENGINE                                                       */}
      {/* ========================================================================= */}
      <section id="knowledge" className="relative border-t border-[#E8E4DC] bg-[#FAF8F5] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            
            {/* Left: Uploaded Knowledge Books Artwork */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="relative w-full max-w-md">
                <div className="overflow-hidden rounded-[2.5rem] border-2 border-[#18122B]/10 bg-white shadow-2xl transition hover:scale-[1.01]">
                  <div className="relative aspect-[3/2] w-full">
                    <Image
                      src="/brand/knowledge-books-study.jpg"
                      alt="Fin Flip Knowledge Engine linking financial books and articles into AI advisor context"
                      fill
                      className="object-cover object-center"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Narrative */}
            <div className="lg:col-span-6">
              <span className="inline-block rounded-full bg-[#FEF08A] border border-[#CA8A04]/40 px-3 py-1 font-mono text-xs font-bold text-[#854D0E] uppercase tracking-wider">
                06 • KNOWLEDGE ENGINE
              </span>
              <h2 className="mt-4 font-serif text-4xl font-black tracking-tight text-[#18122B] sm:text-5xl">
                UPLOAD BOOKS.<br />
                ALIGN YOUR CO-PILOT.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#18122B]/75">
                Every user values different philosophies. Fin Flip lets you upload financial books or link wealth essays so your AI advisor cites your preferred models when answering questions.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                <div className="rounded-2xl border border-[#18122B]/10 bg-white p-4 shadow-sm">
                  <span className="font-mono text-[10px] font-bold text-[#8B5CF6]">MODEL 01</span>
                  <p className="font-serif font-bold text-[#18122B] mt-1">The Psychology of Money</p>
                  <p className="text-[#18122B]/60 mt-1">Morgan Housel</p>
                </div>

                <div className="rounded-2xl border border-[#18122B]/10 bg-white p-4 shadow-sm">
                  <span className="font-mono text-[10px] font-bold text-[#84cc16]">MODEL 02</span>
                  <p className="font-serif font-bold text-[#18122B] mt-1">Die with Zero</p>
                  <p className="text-[#18122B]/60 mt-1">Bill Perkins</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. PRODUCT SHOWCASE (ACTUAL APPLICATION UI)                               */}
      {/* ========================================================================= */}
      <section id="showcase" className="relative border-t border-[#E8E4DC] bg-[#F5F2EB] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block rounded-full bg-[#EDE9FE] border border-[#8B5CF6]/40 px-3 py-1 font-mono text-xs font-bold text-[#6D28D9] uppercase tracking-wider">
              07 • PRODUCT PREVIEW
            </span>
            <h2 className="mt-4 font-serif text-4xl font-black tracking-tight text-[#18122B] sm:text-5xl">
              AN ACTUAL FINANCIAL WORKSPACE.
            </h2>
            <p className="mt-4 text-base text-[#18122B]/70">
              Not marketing mockups. Explore the real double-entry ledger, budget envelopes, and advisor chat built into Fin Flip.
            </p>
          </div>

          {/* Interactive Workspace Navigation Tabs */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setActiveShowcase("dashboard")}
              className={`rounded-full px-5 py-2 text-xs font-bold transition ${
                activeShowcase === "dashboard" ? "bg-[#18122B] text-white shadow-md" : "border border-[#18122B]/10 bg-white text-[#18122B]/70 hover:text-[#18122B]"
              }`}
            >
              Dashboard Overview
            </button>
            <button
              onClick={() => setActiveShowcase("ledger")}
              className={`rounded-full px-5 py-2 text-xs font-bold transition ${
                activeShowcase === "ledger" ? "bg-[#18122B] text-white shadow-md" : "border border-[#18122B]/10 bg-white text-[#18122B]/70 hover:text-[#18122B]"
              }`}
            >
              Transactions Ledger
            </button>
            <button
              onClick={() => setActiveShowcase("budgets")}
              className={`rounded-full px-5 py-2 text-xs font-bold transition ${
                activeShowcase === "budgets" ? "bg-[#18122B] text-white shadow-md" : "border border-[#18122B]/10 bg-white text-[#18122B]/70 hover:text-[#18122B]"
              }`}
            >
              50/30/20 Budgets
            </button>
            <button
              onClick={() => setActiveShowcase("goals")}
              className={`rounded-full px-5 py-2 text-xs font-bold transition ${
                activeShowcase === "goals" ? "bg-[#18122B] text-white shadow-md" : "border border-[#18122B]/10 bg-white text-[#18122B]/70 hover:text-[#18122B]"
              }`}
            >
              Wealth Goals
            </button>
            <button
              onClick={() => setActiveShowcase("advisor")}
              className={`rounded-full px-5 py-2 text-xs font-bold transition ${
                activeShowcase === "advisor" ? "bg-[#18122B] text-white shadow-md" : "border border-[#18122B]/10 bg-white text-[#18122B]/70 hover:text-[#18122B]"
              }`}
            >
              AI Advisor Chat
            </button>
          </div>

          {/* Interactive Workspace Screen Container */}
          <div className="mt-8 rounded-[2.5rem] border-2 border-[#18122B]/10 bg-white p-6 sm:p-8 shadow-xl">
            
            {activeShowcase === "dashboard" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 animate-in fade-in">
                <div className="rounded-2xl bg-[#FAF8F5] p-5 border border-[#18122B]/5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#18122B]/50">Net Worth</p>
                  <p className="mt-1 font-mono text-2xl font-black text-[#18122B]">₹ 8,42,500</p>
                  <p className="mt-1 text-[10px] font-bold text-[#166534]">+4.2% this month</p>
                </div>

                <div className="rounded-2xl bg-[#FAF8F5] p-5 border border-[#18122B]/5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#18122B]/50">Monthly Inflow</p>
                  <p className="mt-1 font-mono text-2xl font-black text-[#166534]">₹ 1,20,000</p>
                  <p className="mt-1 text-[10px] text-[#18122B]/50">Salary + Returns</p>
                </div>

                <div className="rounded-2xl bg-[#FAF8F5] p-5 border border-[#18122B]/5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#18122B]/50">Monthly Outflow</p>
                  <p className="mt-1 font-mono text-2xl font-black text-rose-600">₹ 58,400</p>
                  <p className="mt-1 text-[10px] text-[#18122B]/50">48.6% of income</p>
                </div>

                <div className="rounded-2xl bg-[#84cc16]/15 p-5 border border-[#84cc16]/40">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#166534]">Savings Rate</p>
                  <p className="mt-1 font-mono text-2xl font-black text-[#166534]">51.4%</p>
                  <p className="mt-1 text-[10px] font-bold text-[#166534]">Compounding active</p>
                </div>
              </div>
            )}

            {activeShowcase === "ledger" && (
              <div className="space-y-3 font-mono text-xs animate-in fade-in">
                <div className="flex items-center justify-between border-b border-[#18122B]/10 pb-3 font-sans font-bold text-[#18122B]/50 uppercase text-[11px]">
                  <span>Voucher / Details</span>
                  <span>Amount & Status</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-[#FAF8F5] p-3 border border-[#18122B]/5">
                  <div>
                    <p className="font-sans font-bold text-[#18122B]">Uber Technologies India</p>
                    <p className="text-[10px] text-[#18122B]/50">Debit: Travel • Voucher #VCH-2041</p>
                  </div>
                  <span className="font-bold text-rose-600">- ₹ 380.00</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-[#FAF8F5] p-3 border border-[#18122B]/5">
                  <div>
                    <p className="font-sans font-bold text-[#18122B]">Salary Credit • Primary Employer</p>
                    <p className="text-[10px] text-[#18122B]/50">Credit: Salary Income • Voucher #VCH-2040</p>
                  </div>
                  <span className="font-bold text-[#166534]">+ ₹ 1,20,000.00</span>
                </div>
              </div>
            )}

            {activeShowcase === "budgets" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 animate-in fade-in text-xs">
                <div className="rounded-2xl border border-[#18122B]/10 bg-[#FAF8F5] p-4">
                  <span className="text-[#18122B]/60 font-medium">Essentials (50%)</span>
                  <p className="mt-1 font-mono text-xl font-bold text-[#18122B]">₹ 28,600 / ₹ 40,000</p>
                  <span className="text-[10px] text-[#166534] font-bold">71% utilized</span>
                </div>
                <div className="rounded-2xl border border-[#18122B]/10 bg-[#FAF8F5] p-4">
                  <span className="text-[#18122B]/60 font-medium">Lifestyle & Wants (30%)</span>
                  <p className="mt-1 font-mono text-xl font-bold text-[#18122B]">₹ 18,400 / ₹ 24,000</p>
                  <span className="text-[10px] text-[#166534] font-bold">76% utilized</span>
                </div>
                <div className="rounded-2xl border-2 border-[#84cc16] bg-[#84cc16]/10 p-4">
                  <span className="text-[#18122B] font-medium">Compounding & Wealth (20%)</span>
                  <p className="mt-1 font-mono text-xl font-bold text-[#166534]">₹ 24,000 / ₹ 24,000</p>
                  <span className="text-[10px] text-[#166534] font-bold">100% matched</span>
                </div>
              </div>
            )}

            {activeShowcase === "goals" && (
              <div className="space-y-3 animate-in fade-in text-xs">
                <div className="flex items-center justify-between rounded-xl bg-[#FAF8F5] p-4 border border-[#18122B]/10">
                  <div>
                    <p className="font-bold text-[#18122B]">Emergency Reserve (3 Mo Runway)</p>
                    <p className="text-[11px] text-[#18122B]/60">Target: ₹ 1,80,000 • Current: ₹ 2,04,000</p>
                  </div>
                  <span className="font-mono font-bold text-[#166534]">113% Achieved</span>
                </div>
              </div>
            )}

            {activeShowcase === "advisor" && (
              <div className="rounded-2xl border border-[#18122B]/10 bg-[#FAF8F5] p-4 space-y-2 animate-in fade-in text-xs">
                <p className="font-bold text-[#18122B]">💡 Fin Flip AI Co-Pilot:</p>
                <p className="text-[#18122B]/80 leading-relaxed">
                  &ldquo;Your emergency reserve is fully secured. With a 51.4% savings rate this month, you have the financial headroom to allocate an extra ₹15,000 toward your travel goal without touching your index fund deposits.&rdquo;
                </p>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. FINAL CTA ("READY TO FLIP YOUR MONEY?")                                */}
      {/* ========================================================================= */}
      <section className="relative border-t border-[#E8E4DC] bg-[#FAF8F5] py-28 text-center overflow-hidden">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          
          {/* Uploaded Growth Arrow Swirl Artwork Accent */}
          <div className="mx-auto mb-8 max-w-xs sm:max-w-sm">
            <div className="overflow-hidden rounded-[2.5rem] border border-[#18122B]/10 bg-white shadow-xl">
              <div className="relative aspect-[3/2] w-full">
                <Image
                  src="/brand/growth-arrow-swirl.jpg"
                  alt="Fin Flip growth and compounding wealth artwork"
                  fill
                  className="object-cover object-center"
                />
              </div>
            </div>
          </div>

          <span className="inline-block rounded-full bg-[#DCFCE7] border border-[#84cc16]/40 px-3.5 py-1 font-mono text-xs font-bold text-[#166534] uppercase tracking-wider">
            THE NEW ERA OF PERSONAL WEALTH
          </span>

          <h2 className="mt-6 font-serif text-5xl font-black tracking-tight text-[#18122B] sm:text-6xl md:text-7xl">
            READY TO<br />
            <span className="text-[#84cc16] bg-[#18122B] px-4 py-1 rounded-2xl inline-block mt-2">
              FLIP YOUR MONEY?
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-md text-base text-[#18122B]/75 sm:text-lg">
            Personal finance designed with intelligence, tactile clarity, and zero friction.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={token ? "/dashboard" : "/signup"}
              className="group inline-flex items-center gap-2 rounded-full bg-[#18122B] px-9 py-4 text-base font-black text-white shadow-xl transition hover:bg-[#2D1B4E] hover:scale-105 active:scale-95"
            >
              <span>{token ? "Go to Dashboard" : "Start Flipping Free"}</span>
              <span className="text-lg">&rarr;</span>
            </Link>

            {!token && (
              <Link
                href="/signin"
                className="inline-flex items-center rounded-full border border-[#18122B]/20 bg-white px-7 py-4 text-base font-bold text-[#18122B] shadow-sm transition hover:border-[#18122B] hover:bg-[#FAF8F5]"
              >
                Sign In to Existing Ledger
              </Link>
            )}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. MINIMAL WARM CREAM FOOTER                                             */}
      {/* ========================================================================= */}
      <footer className="border-t border-[#E8E4DC] bg-[#FAF8F5] px-4 py-12 text-xs text-[#18122B]/60 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="font-serif text-lg font-black text-[#18122B]">
              Fin <span className="text-[#84cc16]">Flip</span>
            </span>
            <span className="font-mono text-[10px] text-[#18122B]/40">| AI Wealth Workspace</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-semibold">
            <a href="#problem" className="hover:text-[#18122B] transition">The Problem</a>
            <a href="#how-it-works" className="hover:text-[#18122B] transition">How It Works</a>
            <a href="#ocr" className="hover:text-[#18122B] transition">OCR Capture</a>
            <a href="#advisor" className="hover:text-[#18122B] transition">AI Advisor</a>
            <a href="#splitwise" className="hover:text-[#18122B] transition">Splitwise</a>
            <a href="#knowledge" className="hover:text-[#18122B] transition">Knowledge</a>
            <Link href="/signin" className="hover:text-[#18122B] transition">Sign In</Link>
            <Link href="/signup" className="hover:text-[#18122B] transition">Start Flipping</Link>
          </div>

          <p>&copy; {new Date().getFullYear()} Fin Flip AI. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
