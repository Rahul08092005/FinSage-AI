"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function FinFlipLanding() {
  const [token, setToken] = useState<string | null>(null);
  const [activeShowcase, setActiveShowcase] = useState<"ledger" | "budgets" | "goals" | "advisor">("ledger");
  const [ocrDemoState, setOcrDemoState] = useState<"raw" | "scanning" | "parsed">("parsed");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("finsage_token"));
    }
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-[#060B12] text-[#F7F6F2] selection:bg-[#84cc16] selection:text-[#060B12]">
      {/* Active Session Notification Bar if already logged in */}
      {token && (
        <aside aria-label="Active session banner" className="sticky top-[57px] z-40 flex items-center justify-between border-b border-[#84cc16]/30 bg-[#0C1829]/95 px-4 py-2 text-xs font-semibold backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#84cc16] animate-ping" />
            <span className="text-[#84cc16]">Active session detected: You are currently signed in.</span>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-full bg-[#84cc16] px-3.5 py-1 text-[11px] font-black text-[#060B12] shadow-sm transition hover:bg-[#a3e635] hover:scale-105"
          >
            <span>Open Workspace</span>
            <span>&rarr;</span>
          </Link>
        </aside>
      )}

      {/* ========================================================================= */}
      {/* 1. HERO SECTION: TYPOGRAPHY + ORIGINAL PRODUCT UI COMPOSITION             */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-32">
        {/* Subtle geometric background grid */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Main Grid: Left Typography / Right Floating Product Snapshot */}
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
            
            {/* Left Column: Bold Editorial Statements */}
            <div className="lg:col-span-6">
              {/* Product Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-[#84cc16] animate-pulse" />
                <span className="tracking-wide text-[11px] uppercase">Fin Flip • AI Wealth Workspace</span>
              </div>

              {/* Enormous Editorial Headline */}
              <h1 className="mt-6 font-serif text-5xl font-black tracking-tight text-[#F7F6F2] sm:text-6xl md:text-7xl lg:text-[76px] lg:leading-[0.95]">
                YOUR MONEY.<br />
                <span className="relative inline-block mt-2">
                  <span className="relative z-10 text-[#84cc16] selection:text-[#060B12]">FLIPPED.</span>
                  <span className="absolute -bottom-1 left-0 z-0 h-3 w-full bg-[#84cc16]/20 rounded-sm" />
                </span>
              </h1>

              {/* Supporting Copy */}
              <p className="mt-6 max-w-lg text-base leading-relaxed text-white/70 sm:text-lg">
                Fin Flip is an AI-powered personal financial workspace that helps you understand spending, organize expenses, and receive personalized financial guidance.
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href={token ? "/dashboard" : "/signup"}
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-[#84cc16] px-8 py-4 text-sm font-black text-[#060B12] shadow-lg shadow-[#84cc16]/10 transition-all duration-200 hover:bg-[#a3e635] hover:scale-105 active:scale-95 sm:text-base"
                >
                  <span>{token ? "Go to Dashboard" : "Start Flipping"}</span>
                  <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>

                <a
                  href="#problem"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-4 text-sm font-bold text-white transition hover:border-white/30 hover:bg-white/10 active:scale-95 sm:text-base"
                >
                  <span>See How It Works</span>
                  <span className="text-white/40">&darr;</span>
                </a>
              </div>

              {/* Concise Product Benefits Row */}
              <div className="mt-8 flex flex-wrap items-center gap-3 text-xs font-semibold tracking-wider text-white/50 uppercase">
                <span>AI-powered insights</span>
                <span className="text-[#84cc16]">/</span>
                <span>Expense tracking</span>
                <span className="text-[#84cc16]">/</span>
                <span>Personal financial workspace</span>
              </div>
            </div>

            {/* Right Column: Original Product UI Snapshot (No Illustrations) */}
            <div className="relative lg:col-span-6">
              {/* Subtle ambient light halo */}
              <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-gradient-to-tr from-[#84cc16]/10 to-transparent blur-2xl" />

              {/* Product UI Composition with slight editorial tilt */}
              <div className="relative rounded-3xl border border-white/10 bg-[#0C1829]/90 p-6 shadow-2xl backdrop-blur-xl transition hover:rotate-0 sm:p-7 md:rotate-[-1.5deg]">
                
                {/* Header Tag */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#84cc16]" />
                    <span className="font-mono text-[10px] font-bold tracking-widest uppercase text-white/60">
                      LIVE FINANCIAL TELEMETRY • DEMO SNAPSHOT
                    </span>
                  </div>
                  <span className="rounded-full bg-white/5 px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#84cc16]">
                    DOUBLE-ENTRY
                  </span>
                </div>

                {/* Monthly Cash Flow Numbers */}
                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                    <span className="text-[11px] font-medium text-white/50 uppercase">Monthly Outflow</span>
                    <p className="mt-1 font-mono text-2xl font-black text-white sm:text-3xl">₹ 58,400</p>
                    <span className="mt-1.5 inline-block text-[11px] font-semibold text-[#84cc16]">
                      &darr; 8.4% vs last month
                    </span>
                  </div>

                  <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                    <span className="text-[11px] font-medium text-white/50 uppercase">Savings Velocity</span>
                    <p className="mt-1 font-mono text-2xl font-black text-[#84cc16] sm:text-3xl">51.4%</p>
                    <span className="mt-1.5 inline-block text-[11px] font-medium text-white/50">
                      ₹ 61,600 compounding
                    </span>
                  </div>
                </div>

                {/* 50/30/20 Category Utilization Bars */}
                <div className="mt-5 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white/80">50/30/20 Budget Health</span>
                    <span className="font-mono text-[11px] text-[#84cc16]">Envelope Protected</span>
                  </div>

                  <div className="mt-3 space-y-2 text-[11px]">
                    <div>
                      <div className="flex justify-between text-white/60 mb-1">
                        <span>Essentials (50%)</span>
                        <span className="font-mono">₹ 28,600 / ₹ 40,000</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-white/80 rounded-full" style={{ width: "71%" }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-white/60 mb-1">
                        <span>Lifestyle & Wants (30%)</span>
                        <span className="font-mono">₹ 18,400 / ₹ 24,000</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-[#84cc16] rounded-full" style={{ width: "76%" }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Real Transaction Voucher */}
                <div className="mt-4 flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="rounded-lg bg-white/10 px-2 py-1 font-mono text-[10px] font-bold text-white/80">
                      #VCH-0941
                    </span>
                    <div>
                      <p className="font-bold text-white">Blinkit Commerce</p>
                      <p className="text-[10px] text-white/50">Debit: Groceries • Credit: HDFC</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-white">- ₹ 1,420.00</span>
                </div>

                {/* Live AI Insight Pill */}
                <div className="mt-4 rounded-xl border border-[#84cc16]/30 bg-[#84cc16]/10 p-3 text-xs">
                  <p className="font-bold text-[#84cc16]">💡 Fin Flip AI Advisor:</p>
                  <p className="mt-0.5 text-white/80 text-[11px] leading-relaxed">
                    &ldquo;You stayed ₹3,200 under your Wants envelope this week. Ready to reallocate into broad index equities?&rdquo;
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. "MONEY IS MESSY." (THE REALITY CHECK)                                   */}
      {/* ========================================================================= */}
      <section id="problem" className="relative border-t border-white/10 bg-[#080F1A] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="font-mono text-xs font-bold tracking-widest text-[#84cc16] uppercase">
              01 • THE PROBLEM
            </span>
            <h2 className="mt-4 font-serif text-4xl font-black tracking-tight text-white sm:text-5xl md:text-6xl">
              Money is messy.
            </h2>
            <p className="mt-4 text-base text-white/70 sm:text-lg">
              Every day your financial life fragments across multiple channels. None of them talk to each other, and manual spreadsheets always get abandoned.
            </p>
          </div>

          {/* Relatable Editorial Pain Point Cards */}
          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition hover:border-white/20">
              <span className="font-mono text-3xl font-black text-white/30">01</span>
              <h3 className="mt-4 font-serif text-xl font-bold text-white">&ldquo;UPI screenshots.&rdquo;</h3>
              <p className="mt-2 text-xs leading-relaxed text-white/60 sm:text-sm">
                You snap payment confirmations, and they sit buried in your camera roll alongside 3,000 photos until tax season panic sets in.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition hover:border-white/20">
              <span className="font-mono text-3xl font-black text-white/30">02</span>
              <h3 className="mt-4 font-serif text-xl font-bold text-white">&ldquo;Split bills.&rdquo;</h3>
              <p className="mt-2 text-xs leading-relaxed text-white/60 sm:text-sm">
                Shared dinners and trips turn into messy math across Splitwise and WhatsApp, leaving unresolved IOUs that leak money.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition hover:border-white/20">
              <span className="font-mono text-3xl font-black text-white/30">03</span>
              <h3 className="mt-4 font-serif text-xl font-bold text-white">&ldquo;Bank statements.&rdquo;</h3>
              <p className="mt-2 text-xs leading-relaxed text-white/60 sm:text-sm">
                30-page PDF statements with cryptic merchant codes like <code className="text-[#84cc16]">UPI/CR/9281/ZOM</code> that make auditing nearly impossible.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition hover:border-white/20">
              <span className="font-mono text-3xl font-black text-white/30">04</span>
              <h3 className="mt-4 font-serif text-xl font-bold text-white">&ldquo;Random subscriptions.&rdquo;</h3>
              <p className="mt-2 text-xs leading-relaxed text-white/60 sm:text-sm">
                Auto-debits renew unnoticed in the background. You pay monthly for software, gym passes, and streaming tiers you haven&apos;t opened in months.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition hover:border-white/20 sm:col-span-2 lg:col-span-2">
              <span className="font-mono text-3xl font-black text-[#84cc16]">05</span>
              <h3 className="mt-4 font-serif text-xl font-bold text-white">&ldquo;Where did my money go?&rdquo;</h3>
              <p className="mt-2 text-xs leading-relaxed text-white/60 sm:text-sm">
                The dreaded question at the end of the month. 73% of people abandon manual budgeting spreadsheets because manual typing is high friction. You deserve clarity without the accounting headache.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. "FIN FLIP CLEANS IT UP." (THE TRANSFORMATION)                          */}
      {/* ========================================================================= */}
      <section className="relative border-t border-white/10 bg-[#060B12] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="font-mono text-xs font-bold tracking-widest text-[#84cc16] uppercase">
              02 • THE SOLUTION
            </span>
            <h2 className="mt-4 font-serif text-4xl font-black tracking-tight text-white sm:text-5xl">
              Fin Flip cleans it up.
            </h2>
            <p className="mt-4 text-base text-white/70">
              We turn fragmented financial inputs into balanced double-entry vouchers and organized wealth telemetry.
            </p>
          </div>

          {/* Transformation Visual: Messy Inputs -> Processing Engine -> Clean Intelligence */}
          <div className="mt-16 grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            
            {/* Left: Messy Inputs */}
            <div className="lg:col-span-4 space-y-3">
              <p className="font-mono text-xs font-bold tracking-wider uppercase text-white/40">Fragmented Inputs</p>
              
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs">
                <div className="flex items-center justify-between text-white/50">
                  <span>UPI Payment Screenshot</span>
                  <span className="font-mono text-[10px]">PNG / JPG</span>
                </div>
                <p className="mt-1 font-mono font-medium text-white/80">Screenshot_20260910_2104.png</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs">
                <div className="flex items-center justify-between text-white/50">
                  <span>Cryptic Bank SMS</span>
                  <span className="font-mono text-[10px]">SMS / PDF</span>
                </div>
                <p className="mt-1 font-mono text-[11px] text-white/60 truncate">
                  A/c XX1020 debited INR 640.00 on 10-SEP-26 UPI/610294...
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs">
                <div className="flex items-center justify-between text-white/50">
                  <span>Splitwise Group Bill</span>
                  <span className="font-mono text-[10px]">API Sync</span>
                </div>
                <p className="mt-1 font-mono font-medium text-white/80">Dinner at Burma Burma • 4 shares</p>
              </div>
            </div>

            {/* Center: Processing Engine */}
            <div className="lg:col-span-4 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-[#84cc16]/40 bg-[#84cc16]/10 text-3xl text-[#84cc16] shadow-lg shadow-[#84cc16]/10">
                &rarr;
              </div>
              <p className="mt-4 font-serif text-lg font-bold text-white">Multimodal Ledger Engine</p>
              <p className="mt-1 text-xs text-white/50">OCR Vision • Rule Mapping • Reconciled Balances</p>
            </div>

            {/* Right: Clean Intelligence */}
            <div className="lg:col-span-4 space-y-3">
              <p className="font-mono text-xs font-bold tracking-wider uppercase text-[#84cc16]">Unified Ledger Output</p>
              
              <div className="rounded-xl border border-[#84cc16]/30 bg-[#84cc16]/5 p-4 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Voucher #VCH-2026-0941</span>
                  <span className="font-mono text-[10px] font-bold text-[#84cc16]">BALANCED</span>
                </div>
                <div className="text-[11px] font-mono text-white/70 space-y-1">
                  <p>DR: 5100 Dining Expense (₹ 640.00)</p>
                  <p>CR: 1020 HDFC Bank A/c (₹ 640.00)</p>
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between text-[10px] text-white/50">
                  <span>Category: Lifestyle (30%)</span>
                  <span>Auto-reconciled</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. AI FINANCIAL ADVISOR                                                   */}
      {/* ========================================================================= */}
      <section id="advisor" className="relative border-t border-white/10 bg-[#080F1A] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            
            <div className="lg:col-span-6">
              <span className="font-mono text-xs font-bold tracking-widest text-[#84cc16] uppercase">
                03 • AI ADVISOR
              </span>
              <h2 className="mt-4 font-serif text-4xl font-black tracking-tight text-white sm:text-5xl">
                Personalized guidance grounded in philosophy.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-white/70">
                Fin Flip pairs your actual transaction numbers with proven financial frameworks like 50/30/20, Morgan Housel&apos;s <em>Psychology of Money</em>, and Bill Perkins&apos; <em>Die with Zero</em>. It advises without judgment.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <span className="font-mono text-base font-black text-[#84cc16]">01</span>
                  <div>
                    <h4 className="font-bold text-white text-sm">Real Cash Flow Context</h4>
                    <p className="text-xs text-white/60">Understands your salary timing, recurring obligations, and liquid runway.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <span className="font-mono text-base font-black text-[#84cc16]">02</span>
                  <div>
                    <h4 className="font-bold text-white text-sm">Purchase Affordability Checks</h4>
                    <p className="text-xs text-white/60">Ask &ldquo;Can I afford this?&rdquo; and receive mathematically reasoned guidance.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Conversational AI Insight Card */}
            <div className="lg:col-span-6">
              <div className="rounded-3xl border border-white/10 bg-[#0C1829] p-6 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#84cc16] animate-pulse" />
                    <span className="font-serif text-sm font-bold text-white">Fin Flip Intelligence</span>
                  </div>
                  <span className="font-mono text-[10px] text-white/40">GROQ LLAMA 3 ENGINE</span>
                </div>

                <div className="mt-6 space-y-4 text-xs">
                  {/* Insight Prompt */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <span className="font-mono text-[10px] font-bold text-[#84cc16] uppercase">Monthly Trigger</span>
                    <p className="mt-1 font-serif text-base font-bold text-white">
                      &ldquo;Your spending changed this month.&rdquo;
                    </p>
                    <p className="mt-1 text-white/60">
                      Dining and weekend deliveries increased by 14% compared to August.
                    </p>
                  </div>

                  {/* AI Recommendation */}
                  <div className="rounded-2xl border border-[#84cc16]/30 bg-[#84cc16]/5 p-4 space-y-2">
                    <p className="font-bold text-[#84cc16]">Advisor Recommendation:</p>
                    <p className="text-white/80 leading-relaxed">
                      You have <span className="font-mono font-bold text-white">₹ 18,400</span> left in your Lifestyle envelope. You are fully on track, but allocating ₹ 4,200 towards your Emergency Goal right now will complete your 3-month living expense buffer 2 weeks ahead of schedule.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. EXPENSE CAPTURE / OCR                                                  */}
      {/* ========================================================================= */}
      <section id="ocr" className="relative border-t border-white/10 bg-[#060B12] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="font-mono text-xs font-bold tracking-widest text-[#84cc16] uppercase">
              04 • EXPENSE CAPTURE & OCR
            </span>
            <h2 className="mt-4 font-serif text-4xl font-black tracking-tight text-white sm:text-5xl">
              Turn payment screenshots into structured vouchers.
            </h2>
            <p className="mt-4 text-base text-white/70">
              No manual typing. Take a screenshot of any GPay, PhonePe, Paytm, or credit card receipt and drop it in.
            </p>
          </div>

          {/* Interactive OCR Extraction Simulation */}
          <div className="mt-12 rounded-3xl border border-white/10 bg-[#080F1A] p-6 lg:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#84cc16]">PIPELINE SIMULATION</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOcrDemoState("raw")}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                    ocrDemoState === "raw" ? "bg-white text-black" : "bg-white/5 text-white/60 hover:text-white"
                  }`}
                >
                  1. Raw Image
                </button>
                <button
                  onClick={() => setOcrDemoState("scanning")}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                    ocrDemoState === "scanning" ? "bg-white text-black" : "bg-white/5 text-white/60 hover:text-white"
                  }`}
                >
                  2. OCR Vision
                </button>
                <button
                  onClick={() => setOcrDemoState("parsed")}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                    ocrDemoState === "parsed" ? "bg-[#84cc16] text-[#060B12]" : "bg-white/5 text-white/60 hover:text-white"
                  }`}
                >
                  3. Categorized Voucher
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
              {/* Left Display Box */}
              <div className="rounded-2xl border border-white/10 bg-[#0C1829] p-6">
                {ocrDemoState === "raw" && (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <span className="font-mono text-xs text-white/50">[ RECEIPT SCREENSHOT CAPTURED ]</span>
                    <p className="mt-3 font-serif text-lg font-bold text-white">Blue Tokai Coffee Roasters</p>
                    <p className="mt-1 font-mono text-2xl font-black text-[#84cc16]">₹ 340.00</p>
                    <p className="mt-1 font-mono text-[11px] text-white/40">UPI Ref: 42091840291</p>
                  </div>
                )}

                {ocrDemoState === "scanning" && (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#84cc16] border-t-transparent" />
                    <p className="mt-4 font-mono text-xs font-bold text-[#84cc16]">DETECTING BOUNDING BOXES...</p>
                    <p className="mt-1 text-xs text-white/60">Merchant, amount, and timestamp extracted with 99.4% confidence.</p>
                  </div>
                )}

                {ocrDemoState === "parsed" && (
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span className="text-white/50">Classification</span>
                      <span className="font-bold text-[#84cc16]">Dining & Coffee</span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span className="text-white/50">Merchant</span>
                      <span className="font-bold text-white">Blue Tokai Roasters</span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span className="text-white/50">Amount Reconciled</span>
                      <span className="font-mono font-bold text-white">₹ 340.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Ledger Entry</span>
                      <span className="font-mono text-[#84cc16]">Auto-Posted to Voucher</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Explanation */}
              <div className="space-y-4 text-sm text-white/70">
                <h3 className="font-serif text-2xl font-bold text-white">No manual bookkeeping required.</h3>
                <p>
                  Our OCR models process images client-side and through secure vision endpoints. In seconds, raw screenshot pixels become structured double-entry vouchers without exposing your data to third parties.
                </p>
                <div className="flex items-center gap-4 text-xs font-mono text-white/60 pt-2">
                  <span>✓ 0.8s Scan Latency</span>
                  <span>•</span>
                  <span>✓ Multi-Currency Ready</span>
                  <span>•</span>
                  <span>✓ Tax Isolation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. SPLITWISE / EXPENSE SHARING                                            */}
      {/* ========================================================================= */}
      <section id="splitwise" className="relative border-t border-white/10 bg-[#080F1A] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            
            <div className="lg:col-span-6">
              <span className="font-mono text-xs font-bold tracking-widest text-[#84cc16] uppercase">
                05 • EXPENSE SHARING
              </span>
              <h2 className="mt-4 font-serif text-4xl font-black tracking-tight text-white sm:text-5xl">
                Shared bills unified with your personal ledger.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-white/70">
                Connect Splitwise or log group expenses directly. Fin Flip separates what you actually spent from what your friends owe you, keeping your personal budget completely accurate.
              </p>

              <div className="mt-8 space-y-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs">
                  <span className="font-bold text-white">Debt Simplification Algorithm</span>
                  <p className="text-white/60 mt-0.5">8 multilateral group IOUs automatically reduced into 2 direct settlements.</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs">
                  <span className="font-bold text-white">Accurate Budget Attribution</span>
                  <p className="text-white/60 mt-0.5">If you pay a ₹4,000 dinner for 4 friends, only your ₹1,000 share impacts your dining budget.</p>
                </div>
              </div>
            </div>

            {/* Splitwise Card Composition */}
            <div className="lg:col-span-6">
              <div className="rounded-3xl border border-white/10 bg-[#0C1829] p-6 shadow-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="font-serif font-bold text-white text-sm">Goa Trip • 4 Members</span>
                  <span className="font-mono text-[10px] text-[#84cc16] font-bold uppercase">NET SETTLED</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between rounded-xl bg-white/[0.02] p-3 border border-white/5">
                    <span className="text-white/80">Kabir Sharma owes you</span>
                    <span className="font-mono font-bold text-[#84cc16]">+ ₹ 850.00</span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-white/[0.02] p-3 border border-white/5">
                    <span className="text-white/80">Priya Nair owes you</span>
                    <span className="font-mono font-bold text-[#84cc16]">+ ₹ 1,200.00</span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-white/[0.02] p-3 border border-white/5">
                    <span className="text-white/80">You owe Ananya</span>
                    <span className="font-mono font-bold text-rose-400">- ₹ 450.00</span>
                  </div>
                </div>

                <div className="rounded-xl border border-[#84cc16]/30 bg-[#84cc16]/10 p-3 text-center">
                  <p className="text-xs text-white/70">Net balance to collect: <span className="font-mono font-bold text-[#84cc16] text-sm">₹ 1,600.00</span></p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. KNOWLEDGE ENGINE                                                       */}
      {/* ========================================================================= */}
      <section id="knowledge" className="relative border-t border-white/10 bg-[#060B12] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="font-mono text-xs font-bold tracking-widest text-[#84cc16] uppercase">
              06 • KNOWLEDGE ENGINE
            </span>
            <h2 className="mt-4 font-serif text-4xl font-black tracking-tight text-white sm:text-5xl">
              Upload books. Align your AI co-pilot.
            </h2>
            <p className="mt-4 text-base text-white/70">
              Personalize your advisor with the exact financial literature you respect. Fin Flip uses retrieval-augmented generation to cite your preferred philosophies when advising on major decisions.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition hover:border-white/20">
              <span className="font-mono text-xs font-bold text-[#84cc16]">PHILOSOPHY 01</span>
              <h3 className="mt-3 font-serif text-lg font-bold text-white">The Psychology of Money</h3>
              <p className="mt-1 text-xs text-white/50">Morgan Housel</p>
              <p className="mt-3 text-xs leading-relaxed text-white/60">
                Flags ego-driven lifestyle creep and prioritizes peace of mind over hyper-optimization.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition hover:border-white/20">
              <span className="font-mono text-xs font-bold text-[#84cc16]">PHILOSOPHY 02</span>
              <h3 className="mt-3 font-serif text-lg font-bold text-white">Die with Zero</h3>
              <p className="mt-1 text-xs text-white/50">Bill Perkins</p>
              <p className="mt-3 text-xs leading-relaxed text-white/60">
                Recommends peak experiential spending at optimal life stages rather than blind hoarding.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition hover:border-white/20">
              <span className="font-mono text-xs font-bold text-[#84cc16]">CUSTOM CONTEXT</span>
              <h3 className="mt-3 font-serif text-lg font-bold text-white">Linked Articles & Essays</h3>
              <p className="mt-1 text-xs text-white/50">Your Curated Vault</p>
              <p className="mt-3 text-xs leading-relaxed text-white/60">
                Paste personal finance articles or PDF notes. Fin Flip extracts key heuristics for your plan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. PRODUCT SHOWCASE                                                       */}
      {/* ========================================================================= */}
      <section id="features" className="relative border-t border-white/10 bg-[#080F1A] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="font-mono text-xs font-bold tracking-widest text-[#84cc16] uppercase">
              07 • APPLICATION WORKSPACE
            </span>
            <h2 className="mt-4 font-serif text-4xl font-black tracking-tight text-white sm:text-5xl">
              Inside the Fin Flip workspace.
            </h2>
            <p className="mt-4 text-base text-white/70">
              Built on institutional accounting principles with an intuitive, modern interface.
            </p>
          </div>

          {/* Showcase Tabs */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setActiveShowcase("ledger")}
              className={`rounded-full px-5 py-2 text-xs font-bold transition ${
                activeShowcase === "ledger" ? "bg-[#84cc16] text-[#060B12]" : "border border-white/10 bg-white/5 text-white/70 hover:text-white"
              }`}
            >
              Transactions Ledger
            </button>
            <button
              onClick={() => setActiveShowcase("budgets")}
              className={`rounded-full px-5 py-2 text-xs font-bold transition ${
                activeShowcase === "budgets" ? "bg-[#84cc16] text-[#060B12]" : "border border-white/10 bg-white/5 text-white/70 hover:text-white"
              }`}
            >
              50/30/20 Budgets
            </button>
            <button
              onClick={() => setActiveShowcase("goals")}
              className={`rounded-full px-5 py-2 text-xs font-bold transition ${
                activeShowcase === "goals" ? "bg-[#84cc16] text-[#060B12]" : "border border-white/10 bg-white/5 text-white/70 hover:text-white"
              }`}
            >
              Wealth Goals
            </button>
            <button
              onClick={() => setActiveShowcase("advisor")}
              className={`rounded-full px-5 py-2 text-xs font-bold transition ${
                activeShowcase === "advisor" ? "bg-[#84cc16] text-[#060B12]" : "border border-white/10 bg-white/5 text-white/70 hover:text-white"
              }`}
            >
              AI Advisor
            </button>
          </div>

          {/* Tab Screen Display */}
          <div className="mt-8 rounded-3xl border border-white/10 bg-[#0C1829] p-6 sm:p-8">
            {activeShowcase === "ledger" && (
              <div className="space-y-3 font-mono text-xs animate-in fade-in">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 font-sans font-bold text-white/50 uppercase text-[11px]">
                  <span>Voucher / Details</span>
                  <span>Debit / Credit Amount</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white/[0.02] p-3 border border-white/5">
                  <div>
                    <p className="font-sans font-bold text-white">Uber Technologies India</p>
                    <p className="text-[10px] text-white/50">Debit: Travel • Voucher #VCH-2041</p>
                  </div>
                  <span className="font-bold text-rose-400">- ₹ 380.00</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white/[0.02] p-3 border border-white/5">
                  <div>
                    <p className="font-sans font-bold text-white">Salary Credit • Tech Corp</p>
                    <p className="text-[10px] text-white/50">Credit: Salary Income • Voucher #VCH-2040</p>
                  </div>
                  <span className="font-bold text-[#84cc16]">+ ₹ 1,20,000.00</span>
                </div>
              </div>
            )}

            {activeShowcase === "budgets" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 animate-in fade-in text-xs">
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <span className="text-white/50 font-medium">Essentials (50%)</span>
                  <p className="mt-1 font-mono text-xl font-bold text-white">₹ 28,600 / ₹ 40,000</p>
                  <span className="text-[10px] text-[#84cc16]">Healthy • 71% used</span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <span className="text-white/50 font-medium">Wants (30%)</span>
                  <p className="mt-1 font-mono text-xl font-bold text-white">₹ 18,400 / ₹ 24,000</p>
                  <span className="text-[10px] text-[#84cc16]">On track • 76% used</span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                  <span className="text-white/50 font-medium">Compounding (20%)</span>
                  <p className="mt-1 font-mono text-xl font-bold text-[#84cc16]">₹ 24,000 / ₹ 24,000</p>
                  <span className="text-[10px] text-[#84cc16]">100% completed</span>
                </div>
              </div>
            )}

            {activeShowcase === "goals" && (
              <div className="space-y-3 animate-in fade-in text-xs">
                <div className="flex items-center justify-between rounded-xl bg-white/[0.02] p-4 border border-white/5">
                  <div>
                    <p className="font-bold text-white">Emergency Fund (3 Months Living Expenses)</p>
                    <p className="text-[11px] text-white/50">Target: ₹ 1,80,000 • Current: ₹ 2,04,000</p>
                  </div>
                  <span className="font-mono font-bold text-[#84cc16]">113% Achieved</span>
                </div>
              </div>
            )}

            {activeShowcase === "advisor" && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-2 animate-in fade-in text-xs">
                <p className="font-bold text-[#84cc16]">💡 Fin Flip AI Co-Pilot</p>
                <p className="text-white/80 leading-relaxed">
                  &ldquo;Your emergency reserve is fully funded. At your current savings rate of 51.4%, you have enough liquidity to allocate an additional ₹15,000 toward your Japan trip fund without borrowing from your investment envelope.&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. FINAL CTA (HUGE EDITORIAL STATEMENT)                                   */}
      {/* ========================================================================= */}
      <section className="relative border-t border-white/10 bg-[#060B12] py-32 text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <span className="font-mono text-xs font-bold tracking-widest text-[#84cc16] uppercase">
            JOIN THE NEW ERA
          </span>

          <h2 className="mt-6 font-serif text-5xl font-black tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl leading-none">
            FLIP THE WAY<br />
            <span className="text-[#84cc16]">YOU THINK</span> ABOUT MONEY.
          </h2>

          <p className="mx-auto mt-8 max-w-lg text-base text-white/70 sm:text-lg">
            Personal wealth management designed with intelligence, precision, and zero friction.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={token ? "/dashboard" : "/signup"}
              className="group inline-flex items-center gap-2 rounded-full bg-[#84cc16] px-9 py-4 text-base font-black text-[#060B12] shadow-xl shadow-[#84cc16]/10 transition hover:bg-[#a3e635] hover:scale-105 active:scale-95"
            >
              <span>{token ? "Go to Dashboard" : "Start Flipping"}</span>
              <span className="text-lg">&rarr;</span>
            </Link>

            {!token && (
              <Link
                href="/signin"
                className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-7 py-4 text-base font-bold text-white transition hover:border-white/40 hover:bg-white/10"
              >
                Sign In to Existing Ledger
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. MINIMAL DARK FOOTER                                                   */}
      {/* ========================================================================= */}
      <footer className="border-t border-white/10 bg-[#060B12] px-4 py-12 text-xs text-white/50 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="font-serif text-lg font-black text-white">
              Fin <span className="text-[#84cc16]">Flip</span>
            </span>
            <span className="font-mono text-[10px] text-white/40">| AI Wealth Workspace</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#ocr" className="hover:text-white transition">OCR Capture</a>
            <a href="#splitwise" className="hover:text-white transition">Splitwise</a>
            <a href="#knowledge" className="hover:text-white transition">Knowledge</a>
            <Link href="/signin" className="hover:text-white transition">Sign In</Link>
            <Link href="/signup" className="hover:text-white transition">Start Flipping</Link>
          </div>

          <p>&copy; {new Date().getFullYear()} Fin Flip AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
