"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

export function FinFlipLanding() {
  const [token, setToken] = useState<string | null>(null);
  const [activeShowcase, setActiveShowcase] = useState<"dashboard" | "ledger" | "budgets" | "goals" | "advisor">("dashboard");
  const [ocrStep, setOcrStep] = useState<number>(2);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("finsage_token"));
    }
  }, []);

  // Ensure video autoplays cleanly across browsers
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay policy fallback: muted autoplay is guaranteed
      });
    }
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-[#F2E5CB] text-[#18122B] selection:bg-[#84cc16] selection:text-[#18122B]">
      
      {/* Active Session Notification Bar if already logged in */}
      {token && (
        <aside
          aria-label="Active session banner"
          className="sticky top-[57px] z-40 flex items-center justify-between border-b border-[#84cc16]/40 bg-[#F2E5CB]/95 px-4 py-2 text-xs font-semibold backdrop-blur-md sm:px-8"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#84cc16] animate-ping" />
            <span className="text-[#18122B]">Active session detected: You are currently signed in to FinSage AI.</span>
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
      {/* 1. HERO SECTION — TWO-COLUMN ABOVE-THE-FOLD BALANCED HERO                  */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden bg-[#F2E5CB] lg:min-h-[calc(100vh-65px)] lg:max-h-[840px] flex items-center py-4 sm:py-6 lg:py-6">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 w-full">
          <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12 lg:gap-4 xl:gap-8">
            
            {/* LEFT COLUMN: Compact, High-Impact Typography & CTAs (Guaranteed Above-the-Fold) */}
            <div className="lg:col-span-5 xl:col-span-5 z-10 flex flex-col justify-center">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 self-start rounded-full border border-[#18122B]/15 bg-[#FAF8F5]/90 px-3.5 py-1 text-xs font-black tracking-wider text-[#18122B]/85 shadow-sm uppercase">
                <span className="h-2 w-2 rounded-full bg-[#84cc16]" />
                <span>FINSAGE AI / PERSONAL FINANCE, FLIPPED</span>
              </div>

              {/* Headline (Proportional, impactful, tightly spaced) */}
              <h1 className="mt-2.5 sm:mt-3.5 font-serif text-4xl sm:text-5xl lg:text-[50px] xl:text-[58px] font-black tracking-[-0.03em] text-[#18122B] leading-[0.95]">
                YOUR MONEY.<br />
                YOUR RULES.<br />
                <span className="relative inline-block mt-1 sm:mt-2">
                  <span className="relative z-10 inline-block rounded-xl lg:rounded-2xl bg-[#84cc16] px-3.5 sm:px-5 py-1 text-[#18122B] shadow-sm rotate-[-1.5deg] text-3xl sm:text-4xl lg:text-[42px] xl:text-[48px] leading-none tracking-tight hover:rotate-0 transition-transform">
                    FLIP IT.
                  </span>
                </span>
              </h1>

              {/* Supporting Copy (Compact, readable, well-paced) */}
              <p className="mt-3 sm:mt-4 max-w-lg text-sm sm:text-base lg:text-[15px] xl:text-[16px] leading-relaxed text-[#18122B]/80 font-normal">
                An AI-powered personal financial workspace that helps you understand spending, organize expenses, track financial activity, and get personalized financial guidance.
              </p>

              {/* Primary & Secondary CTAs (Prominently visible above the fold) */}
              <div className="mt-4 sm:mt-5 flex flex-wrap items-center gap-3 sm:gap-4">
                <Link
                  href={token ? "/dashboard" : "/signup"}
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-[#18122B] px-6 sm:px-7 py-3 sm:py-3.5 text-sm sm:text-base font-black tracking-wide text-white shadow-lg transition-all duration-200 hover:bg-[#2D1B4E] hover:scale-105 active:scale-95"
                >
                  <span>{token ? "Open My Dashboard" : "Start Flipping →"}</span>
                </Link>

                <a
                  href="#problem"
                  className="inline-flex items-center gap-2 rounded-full border border-[#18122B]/25 bg-[#FAF8F5]/90 px-5 sm:px-6 py-3 sm:py-3.5 text-sm sm:text-base font-bold text-[#18122B] shadow-sm transition hover:border-[#18122B] hover:bg-white active:scale-95"
                >
                  <span>See How It Works ↓</span>
                </a>
              </div>

              {/* Subtle Product-Value Row */}
              <div className="mt-3.5 sm:mt-4 flex flex-wrap items-center gap-2 text-[10px] sm:text-[11px] font-black tracking-wider text-[#18122B]/60 uppercase">
                <span>AI-POWERED INSIGHTS</span>
                <span className="text-[#84cc16] font-bold">/</span>
                <span>EXPENSE TRACKING</span>
                <span className="text-[#84cc16] font-bold">/</span>
                <span>PERSONAL FINANCIAL WORKSPACE</span>
              </div>
            </div>

            {/* RIGHT COLUMN: Dominant Animated Video Visual Shifted Toward Left (Center / Center-Right) */}
            <div className="lg:col-span-7 xl:col-span-7 flex items-center justify-center lg:justify-start w-full lg:-translate-x-[12%] xl:-translate-x-[15%]">
              <div className="relative w-full max-w-2xl lg:max-w-none flex items-center justify-center lg:justify-start overflow-visible">
                <div className="relative w-full h-[320px] sm:h-[420px] md:h-[480px] lg:h-[calc(100vh-140px)] lg:max-h-[580px] xl:max-h-[640px] flex items-center justify-center lg:justify-start">
                  <video
                    ref={videoRef}
                    src="/brand/hero-loop.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    controls={false}
                    className="w-full h-full object-contain object-center scale-100 lg:scale-[1.30] xl:scale-[1.35] pointer-events-none transition-transform"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. SECTION 2 — THE PROBLEM ("MONEY GETS MESSY.")                          */}
      {/* ========================================================================= */}
      <section id="problem" className="relative border-t border-[#E5DAC4] bg-[#FAF8F5] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl">
            <span className="inline-block rounded-full bg-[#FCE7F3] border border-[#F472B6]/40 px-3.5 py-1 font-mono text-xs font-bold text-[#BE185D] uppercase tracking-wider">
              SECTION 02 • THE REALITY
            </span>
            <h2 className="mt-4 font-serif text-4xl font-black tracking-tight text-[#18122B] sm:text-5xl md:text-6xl">
              MONEY GETS MESSY.
            </h2>
            <p className="mt-4 text-base text-[#18122B]/75 sm:text-lg">
              Everyday financial life doesn&apos;t arrive in a tidy spreadsheet. Modern money is scattered across apps, chats, screenshots, and alert pings:
            </p>
          </div>

          {/* Playful Editorial Scatter / Financial Chaos Grid */}
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            
            {/* Fragment 01: Payment Screenshots */}
            <div className="relative rounded-3xl border border-[#18122B]/10 bg-white p-6 shadow-sm transition hover:shadow-md hover:-translate-y-1">
              <span className="font-mono text-xs font-black text-[#F97316] uppercase tracking-wider">01 • PAYMENT SCREENSHOTS</span>
              <h3 className="mt-2 font-serif text-xl font-bold text-[#18122B]">Camera roll graveyard.</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#18122B]/70 sm:text-sm">
                Screenshots of GPay, PhonePe, or Paytm confirmations buried beside concert clips and memes, never accounted for in any monthly ledger.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#FFF7ED] px-2.5 py-1 font-mono text-[10px] font-bold text-[#C2410C]">
                <span>📸 screenshot_20260912_1420.png</span>
              </div>
            </div>

            {/* Fragment 02: UPI/Payment Messages */}
            <div className="relative rounded-3xl border border-[#18122B]/10 bg-white p-6 shadow-sm transition hover:shadow-md hover:-translate-y-1">
              <span className="font-mono text-xs font-black text-[#8B5CF6] uppercase tracking-wider">02 • UPI & SMS ALERTS</span>
              <h3 className="mt-2 font-serif text-xl font-bold text-[#18122B]">Endless debit pings.</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#18122B]/70 sm:text-sm">
                Continuous SMS alerts chime throughout the day. By Friday, forty micro-transactions have slipped through the cracks with no category context.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#F5F3FF] px-2.5 py-1 font-mono text-[10px] font-bold text-[#6D28D9]">
                <span>💬 Debited INR 340.00 at Swiggy</span>
              </div>
            </div>

            {/* Fragment 03: Bank Statements */}
            <div className="relative rounded-3xl border border-[#18122B]/10 bg-white p-6 shadow-sm transition hover:shadow-md hover:-translate-y-1">
              <span className="font-mono text-xs font-black text-[#3B82F6] uppercase tracking-wider">03 • BANK STATEMENTS</span>
              <h3 className="mt-2 font-serif text-xl font-bold text-[#18122B]">Cryptic PDF code.</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#18122B]/70 sm:text-sm">
                Six-page monthly statements filled with indecipherable merchant handles like <code className="bg-[#FAF8F5] px-1 py-0.5 rounded text-[#18122B] font-mono">UPI/CR/9281/ZOM</code> that make auditing painful.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#EFF6FF] px-2.5 py-1 font-mono text-[10px] font-bold text-[#1D4ED8]">
                <span>📄 HDFC_STMT_AUG2026.pdf</span>
              </div>
            </div>

            {/* Fragment 04: Split Expenses */}
            <div className="relative rounded-3xl border border-[#18122B]/10 bg-white p-6 shadow-sm transition hover:shadow-md hover:-translate-y-1">
              <span className="font-mono text-xs font-black text-[#10B981] uppercase tracking-wider">04 • SPLIT EXPENSES</span>
              <h3 className="mt-2 font-serif text-xl font-bold text-[#18122B]">Group IOU confusion.</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#18122B]/70 sm:text-sm">
                Shared dinners, vacation Airbnbs, and flatmate utilities spread over WhatsApp chats and Splitwise tabs, distorting your true net spend.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#ECFDF5] px-2.5 py-1 font-mono text-[10px] font-bold text-[#047857]">
                <span>👥 &ldquo;Who owes what for dinner?&rdquo;</span>
              </div>
            </div>

            {/* Fragment 05: Financial Documents */}
            <div className="relative rounded-3xl border border-[#18122B]/10 bg-white p-6 shadow-sm transition hover:shadow-md hover:-translate-y-1">
              <span className="font-mono text-xs font-black text-[#EC4899] uppercase tracking-wider">05 • FINANCIAL DOCS</span>
              <h3 className="mt-2 font-serif text-xl font-bold text-[#18122B]">Tax files & receipts.</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#18122B]/70 sm:text-sm">
                Rent receipts, medical bills, investment declarations, and insurance invoices scattered across downloads folders when tax season hits.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#FDF2F8] px-2.5 py-1 font-mono text-[10px] font-bold text-[#BE185D]">
                <span>📁 rent_receipt_80gg.pdf</span>
              </div>
            </div>

            {/* Fragment 06: Everyday Spending */}
            <div className="relative rounded-3xl border border-[#18122B]/10 bg-white p-6 shadow-sm transition hover:shadow-md hover:-translate-y-1">
              <span className="font-mono text-xs font-black text-[#CA8A04] uppercase tracking-wider">06 • EVERYDAY SPENDING</span>
              <h3 className="mt-2 font-serif text-xl font-bold text-[#18122B]">Silent cash leaks.</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#18122B]/70 sm:text-sm">
                Quick coffees, cabs, and impulse checkouts that make you ask the universal question at month&apos;s end: <em>&ldquo;Where did it all go?&rdquo;</em>
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#FEFCE8] px-2.5 py-1 font-mono text-[10px] font-bold text-[#854D0E]">
                <span>☕ ₹ 280 Quick Tap</span>
              </div>
            </div>

          </div>

          {/* TRANSITION: "FINSAGE CLEANS IT UP." */}
          <div className="mt-16 rounded-[2.5rem] border-2 border-[#18122B] bg-[#F2E5CB] p-8 lg:p-12 shadow-xl">
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <span className="inline-block font-mono text-xs font-black uppercase tracking-widest text-[#4d7c0f] bg-[#84cc16]/20 px-3 py-1 rounded-full">
                  THE TRANSFORMATION
                </span>
                <h3 className="mt-3 font-serif text-3xl font-black text-[#18122B] sm:text-4xl">
                  FINSAGE CLEANS IT UP.
                </h3>
                <p className="mt-3 text-sm text-[#18122B]/80 leading-relaxed sm:text-base">
                  Drop in your messy payment screenshots, forward SMS alerts, or sync your Splitwise debts. FinSage ingests them, reconciles the numbers with double-entry accounting precision, and automatically allocates everything into live 50/30/20 envelopes.
                </p>
              </div>

              <div className="lg:col-span-5 flex justify-center">
                <div className="w-full rounded-2xl bg-white p-5 border border-[#18122B]/15 font-mono text-xs space-y-2.5 shadow-sm">
                  <div className="flex justify-between text-[#18122B]/60 text-[11px] pb-2 border-b border-[#18122B]/10 font-sans font-bold">
                    <span>MESSY SCREENSHOT</span>
                    <span className="text-[#4d7c0f] font-mono font-bold">&rarr; BALANCED LEDGER</span>
                  </div>
                  <p className="text-[#18122B] font-semibold">DR: 5100 Dining Expense (₹ 640.00)</p>
                  <p className="text-[#18122B]/80">CR: 1020 HDFC Salary Bank (₹ 640.00)</p>
                  <div className="pt-2 text-[11px] text-[#166534] font-bold flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#84cc16]" />
                    <span>Verified Voucher #VCH-2026-0941 • Reconciled</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SECTION 3 — HOW IT WORKS (4-STEP EDITORIAL WORKFLOW)                   */}
      {/* ========================================================================= */}
      <section id="how-it-works" className="relative border-t border-[#E5DAC4] bg-[#F2E5CB] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block rounded-full bg-[#FEF08A] border border-[#CA8A04]/40 px-3.5 py-1 font-mono text-xs font-bold text-[#854D0E] uppercase tracking-wider">
              SECTION 03 • HOW IT WORKS
            </span>
            <h2 className="mt-4 font-serif text-4xl font-black tracking-tight text-[#18122B] sm:text-5xl">
              FOUR STEPS TO MONEY CLARITY.
            </h2>
            <p className="mt-4 text-base text-[#18122B]/75 sm:text-lg">
              From everyday financial clutter to disciplined personal wealth momentum.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            
            {/* Step 01 — CAPTURE */}
            <div className="relative rounded-3xl border border-[#18122B]/10 bg-white p-7 shadow-sm transition hover:shadow-lg hover:-translate-y-1">
              <span className="font-mono text-4xl font-black text-[#84cc16]">01</span>
              <h3 className="mt-4 font-serif text-2xl font-black text-[#18122B] tracking-tight">CAPTURE</h3>
              <p className="mt-3 text-xs leading-relaxed text-[#18122B]/75 sm:text-sm">
                Capture payment screenshots, payment messages, statements, and expense information through high-accuracy OCR or live sync.
              </p>
              <div className="mt-6 pt-3 border-t border-[#18122B]/10 font-mono text-[11px] font-bold text-[#4d7c0f]">
                &rarr; Zero manual typing
              </div>
            </div>

            {/* Step 02 — ORGANIZE */}
            <div className="relative rounded-3xl border border-[#18122B]/10 bg-white p-7 shadow-sm transition hover:shadow-lg hover:-translate-y-1">
              <span className="font-mono text-4xl font-black text-[#8B5CF6]">02</span>
              <h3 className="mt-4 font-serif text-2xl font-black text-[#18122B] tracking-tight">ORGANIZE</h3>
              <p className="mt-3 text-xs leading-relaxed text-[#18122B]/75 sm:text-sm">
                Turn messy financial information into structured expenses and a clean financial workspace using double-entry ledger vouchers.
              </p>
              <div className="mt-6 pt-3 border-t border-[#18122B]/10 font-mono text-[11px] font-bold text-[#8B5CF6]">
                &rarr; Balanced double-entry
              </div>
            </div>

            {/* Step 03 — UNDERSTAND */}
            <div className="relative rounded-3xl border border-[#18122B]/10 bg-white p-7 shadow-sm transition hover:shadow-lg hover:-translate-y-1">
              <span className="font-mono text-4xl font-black text-[#F97316]">03</span>
              <h3 className="mt-4 font-serif text-2xl font-black text-[#18122B] tracking-tight">UNDERSTAND</h3>
              <p className="mt-3 text-xs leading-relaxed text-[#18122B]/75 sm:text-sm">
                Analyze spending patterns, detect lifestyle creep, and track cashflow activity across disciplined 50/30/20 budget envelopes.
              </p>
              <div className="mt-6 pt-3 border-t border-[#18122B]/10 font-mono text-[11px] font-bold text-[#F97316]">
                &rarr; 50/30/20 allocation
              </div>
            </div>

            {/* Step 04 — FLIP */}
            <div className="relative rounded-3xl border border-[#18122B]/10 bg-white p-7 shadow-sm transition hover:shadow-lg hover:-translate-y-1">
              <span className="font-mono text-4xl font-black text-[#3B82F6]">04</span>
              <h3 className="mt-4 font-serif text-2xl font-black text-[#18122B] tracking-tight">FLIP</h3>
              <p className="mt-3 text-xs leading-relaxed text-[#18122B]/75 sm:text-sm">
                Receive personalized financial guidance and make better-informed money decisions that accelerate your savings and freedom goals.
              </p>
              <div className="mt-6 pt-3 border-t border-[#18122B]/10 font-mono text-[11px] font-bold text-[#3B82F6]">
                &rarr; Compound wealth
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SECTION 4 — OCR CAPTURE ("SCREENSHOT IN. EXPENSE OUT.")                 */}
      {/* ========================================================================= */}
      <section id="ocr" className="relative border-t border-[#E5DAC4] bg-[#FAF8F5] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            
            {/* Left Column: Phone OCR Visual + Interactive Stepper */}
            <div className="lg:col-span-6 flex flex-col items-center">
              <div className="relative w-full max-w-md">
                {/* Phone OCR Scan Image Container */}
                <div className="overflow-hidden rounded-[2.5rem] border-2 border-[#18122B]/15 bg-white shadow-xl">
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src="/brand/receipt-ocr-phone.jpg"
                      alt="FinSage OCR Receipt scanner converting payment receipts into structured expenses on phone"
                      fill
                      className="object-cover object-center"
                    />
                  </div>
                </div>

                {/* Interactive Stepper to Demonstrate Real Transformation */}
                <div className="mt-4 flex items-center justify-between rounded-2xl bg-white p-2.5 shadow-md border border-[#18122B]/10">
                  <button
                    onClick={() => setOcrStep(0)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      ocrStep === 0 ? "bg-[#18122B] text-white" : "text-[#18122B]/60 hover:text-[#18122B]"
                    }`}
                  >
                    1. Screenshot In
                  </button>
                  <button
                    onClick={() => setOcrStep(1)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      ocrStep === 1 ? "bg-[#18122B] text-white" : "text-[#18122B]/60 hover:text-[#18122B]"
                    }`}
                  >
                    2. OCR Extraction
                  </button>
                  <button
                    onClick={() => setOcrStep(2)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      ocrStep === 2 ? "bg-[#84cc16] text-[#18122B]" : "text-[#18122B]/60 hover:text-[#18122B]"
                    }`}
                  >
                    3. Balanced Voucher
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Narrative & Transformation UI */}
            <div className="lg:col-span-6">
              <span className="inline-block rounded-full bg-[#DCFCE7] border border-[#84cc16]/40 px-3.5 py-1 font-mono text-xs font-bold text-[#166534] uppercase tracking-wider">
                SECTION 04 • OCR CAPTURE
              </span>
              <h2 className="mt-4 font-serif text-4xl font-black tracking-tight text-[#18122B] sm:text-5xl">
                SCREENSHOT IN.<br />
                EXPENSE OUT.
              </h2>
              
              {/* Conceptual Transformation Badge */}
              <div className="mt-4 flex items-center gap-2 font-mono text-xs font-bold text-[#18122B]/70 flex-wrap">
                <span className="bg-[#FAF8F5] border border-[#18122B]/15 px-2.5 py-1 rounded-lg">PAYMENT SCREENSHOT</span>
                <span className="text-[#84cc16] font-black">&rarr;</span>
                <span className="bg-[#FAF8F5] border border-[#18122B]/15 px-2.5 py-1 rounded-lg">OCR PIPELINE</span>
                <span className="text-[#84cc16] font-black">&rarr;</span>
                <span className="bg-[#84cc16]/20 border border-[#84cc16]/50 text-[#3f6212] px-2.5 py-1 rounded-lg">STRUCTURED EXPENSE</span>
              </div>

              <p className="mt-5 text-base text-[#18122B]/80 leading-relaxed">
                Snap or share any payment screenshot from Google Pay, PhonePe, Paytm, or credit card slips. FinSage&apos;s OCR parses line items, merchants, timestamps, and amounts in seconds, producing an audited double-entry voucher automatically.
              </p>

              {/* Realistic Parsed Voucher UI Demo */}
              <div className="mt-8 rounded-2xl border border-[#18122B]/15 bg-white p-5 shadow-md">
                <div className="flex items-center justify-between border-b border-[#18122B]/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#84cc16]" />
                    <span className="font-mono text-xs font-bold text-[#18122B]">VOUCHER #VCH-2026-0941</span>
                  </div>
                  <span className="rounded-full bg-[#DCFCE7] px-2.5 py-0.5 text-[10px] font-black text-[#166534]">
                    PARSED (99.4% CONFIDENCE)
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
                    <span className="text-[10px] font-mono text-[#18122B]/50 uppercase">Ledger Status</span>
                    <p className="font-bold text-[#4d7c0f]">Double-Entry Balanced</p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. SECTION 5 — AI FINANCIAL ADVISOR (SOPHISTICATED PRODUCT INTELLIGENCE)  */}
      {/* ========================================================================= */}
      <section id="advisor" className="relative border-t border-[#E5DAC4] bg-[#F2E5CB] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            
            <div className="lg:col-span-6">
              <span className="inline-block rounded-full bg-[#EDE9FE] border border-[#8B5CF6]/40 px-3.5 py-1 font-mono text-xs font-bold text-[#6D28D9] uppercase tracking-wider">
                SECTION 05 • AI ADVISOR
              </span>
              <h2 className="mt-4 font-serif text-4xl font-black tracking-tight text-[#18122B] sm:text-5xl">
                HUMAN-DESIGNED INTELLIGENCE.<br />
                ROOTED IN PHILOSOPHY.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#18122B]/80">
                No gimmicky chatbot clichés or generic budget charts. FinSage pairs your real cashflow numbers with proven wealth philosophies like 50/30/20, Morgan Housel&apos;s <em>Psychology of Money</em>, and Bill Perkins&apos; <em>Die with Zero</em> to provide actionable guidance without judgment.
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

            {/* AI Advisor Real Product UI Demonstration */}
            <div className="lg:col-span-6">
              <div className="rounded-[2.5rem] border-2 border-[#18122B]/15 bg-white p-7 shadow-xl">
                <div className="flex items-center justify-between border-b border-[#18122B]/10 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-3 w-3 rounded-full bg-[#84cc16]" />
                    <span className="font-serif text-sm font-bold text-[#18122B]">FinSage AI Co-Pilot</span>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-[#8B5CF6] uppercase">
                    GROQ LLAMA 3 • LIVE CONTEXT
                  </span>
                </div>

                <div className="mt-6 space-y-4 text-xs">
                  {/* Real Insight Trigger */}
                  <div className="rounded-2xl bg-[#FAF8F5] p-4 border border-[#18122B]/10">
                    <span className="font-mono text-[10px] font-bold text-[#F97316] uppercase">Spending Pattern Detected</span>
                    <p className="mt-1 font-serif text-base font-bold text-[#18122B]">
                      &ldquo;Your dining spend is trending higher this month.&rdquo;
                    </p>
                    <p className="mt-1 text-[#18122B]/70">
                      August: ₹ 14,200 &rarr; September: ₹ 16,800 (+18.3% increase).
                    </p>
                  </div>

                  {/* Supporting Guidance */}
                  <div className="rounded-2xl border-2 border-[#84cc16] bg-[#84cc16]/15 p-4 space-y-1.5">
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
      {/* 6. SECTION 6 — SPLITWISE / EXPENSE SHARING                                */}
      {/* ========================================================================= */}
      <section id="splitwise" className="relative border-t border-[#E5DAC4] bg-[#FAF8F5] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            
            <div className="lg:col-span-6">
              <span className="inline-block rounded-full bg-[#DBEAFE] border border-[#3B82F6]/40 px-3.5 py-1 font-mono text-xs font-bold text-[#1D4ED8] uppercase tracking-wider">
                SECTION 06 • SHARED EXPENSES
              </span>
              <h2 className="mt-4 font-serif text-4xl font-black tracking-tight text-[#18122B] sm:text-5xl">
                SHARED BILLS.<br />
                ZERO AWKWARD MATH.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#18122B]/80">
                FinSage seamlessly incorporates shared group expenses into your broader financial picture. If you cover a ₹4,000 group dinner for four friends, only your ₹1,000 personal share impacts your monthly dining budget, while outstanding receivables stay tracked.
              </p>

              <div className="mt-8 space-y-3 text-xs">
                <div className="rounded-2xl border border-[#18122B]/10 bg-white p-4 shadow-sm">
                  <span className="font-bold text-[#18122B]">Debt Simplification Engine</span>
                  <p className="text-[#18122B]/70 mt-0.5">Multilateral group balances are simplified into minimal settlement transfers.</p>
                </div>
              </div>
            </div>

            {/* Splitwise Card Composition */}
            <div className="lg:col-span-6">
              <div className="rounded-[2.5rem] border border-[#18122B]/15 bg-white p-7 shadow-xl space-y-3">
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
      {/* 7. SECTION 7 — KNOWLEDGE ENGINE (BOOKS & ARTICLES)                        */}
      {/* ========================================================================= */}
      <section id="knowledge" className="relative border-t border-[#E5DAC4] bg-[#F2E5CB] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            
            {/* Left: Uploaded Knowledge Books Artwork */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="relative w-full max-w-md">
                <div className="overflow-hidden rounded-[2.5rem] border-2 border-[#18122B]/15 bg-white shadow-xl">
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src="/brand/knowledge-books-study.jpg"
                      alt="FinSage Knowledge Engine linking financial books and articles into AI advisor context"
                      fill
                      className="object-cover object-center"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Narrative */}
            <div className="lg:col-span-6">
              <span className="inline-block rounded-full bg-[#FEF08A] border border-[#CA8A04]/40 px-3.5 py-1 font-mono text-xs font-bold text-[#854D0E] uppercase tracking-wider">
                SECTION 07 • KNOWLEDGE ENGINE
              </span>
              <h2 className="mt-4 font-serif text-4xl font-black tracking-tight text-[#18122B] sm:text-5xl">
                YOUR FINANCIAL KNOWLEDGE,<br />
                CONNECTED TO YOUR MONEY.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#18122B]/80">
                Everyone values different financial philosophies. FinSage enables you to upload foundational books, link articles, and build custom financial context so your advisor provides guidance aligned with your own chosen principles.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                <div className="rounded-2xl border border-[#18122B]/10 bg-white p-4 shadow-sm">
                  <span className="font-mono text-[10px] font-bold text-[#8B5CF6]">KNOWLEDGE SOURCE 01</span>
                  <p className="font-serif font-bold text-[#18122B] mt-1">The Psychology of Money</p>
                  <p className="text-[#18122B]/60 mt-0.5">Morgan Housel • Active Context</p>
                </div>

                <div className="rounded-2xl border border-[#18122B]/10 bg-white p-4 shadow-sm">
                  <span className="font-mono text-[10px] font-bold text-[#4d7c0f]">KNOWLEDGE SOURCE 02</span>
                  <p className="font-serif font-bold text-[#18122B] mt-1">Die with Zero</p>
                  <p className="text-[#18122B]/60 mt-0.5">Bill Perkins • Active Context</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. SECTION 8 — PRODUCT SHOWCASE (REAL INTERFACE & COMPONENTS)              */}
      {/* ========================================================================= */}
      <section id="showcase" className="relative border-t border-[#E5DAC4] bg-[#FAF8F5] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block rounded-full bg-[#EDE9FE] border border-[#8B5CF6]/40 px-3.5 py-1 font-mono text-xs font-bold text-[#6D28D9] uppercase tracking-wider">
              SECTION 08 • PRODUCT SHOWCASE
            </span>
            <h2 className="mt-4 font-serif text-4xl font-black tracking-tight text-[#18122B] sm:text-5xl">
              AN ACTUAL FINANCIAL WORKSPACE.
            </h2>
            <p className="mt-4 text-base text-[#18122B]/75 sm:text-lg">
              Explore the real double-entry ledger, budget envelopes, goals, and advisor co-pilot built inside FinSage.
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
              Dashboard
            </button>
            <button
              onClick={() => setActiveShowcase("ledger")}
              className={`rounded-full px-5 py-2 text-xs font-bold transition ${
                activeShowcase === "ledger" ? "bg-[#18122B] text-white shadow-md" : "border border-[#18122B]/10 bg-white text-[#18122B]/70 hover:text-[#18122B]"
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveShowcase("budgets")}
              className={`rounded-full px-5 py-2 text-xs font-bold transition ${
                activeShowcase === "budgets" ? "bg-[#18122B] text-white shadow-md" : "border border-[#18122B]/10 bg-white text-[#18122B]/70 hover:text-[#18122B]"
              }`}
            >
              Budgets
            </button>
            <button
              onClick={() => setActiveShowcase("goals")}
              className={`rounded-full px-5 py-2 text-xs font-bold transition ${
                activeShowcase === "goals" ? "bg-[#18122B] text-white shadow-md" : "border border-[#18122B]/10 bg-white text-[#18122B]/70 hover:text-[#18122B]"
              }`}
            >
              Goals
            </button>
            <button
              onClick={() => setActiveShowcase("advisor")}
              className={`rounded-full px-5 py-2 text-xs font-bold transition ${
                activeShowcase === "advisor" ? "bg-[#18122B] text-white shadow-md" : "border border-[#18122B]/10 bg-white text-[#18122B]/70 hover:text-[#18122B]"
              }`}
            >
              AI Advisor
            </button>
          </div>

          {/* Interactive Workspace Screen Container */}
          <div className="mt-8 rounded-[2.5rem] border-2 border-[#18122B]/15 bg-white p-6 sm:p-8 shadow-xl">
            
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
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#3f6212]">Savings Rate</p>
                  <p className="mt-1 font-mono text-2xl font-black text-[#166534]">51.4%</p>
                  <p className="mt-1 text-[10px] font-bold text-[#166534]">Compounding active</p>
                </div>
              </div>
            )}

            {activeShowcase === "ledger" && (
              <div className="space-y-3 font-mono text-xs animate-in fade-in">
                <div className="flex items-center justify-between border-b border-[#18122B]/10 pb-3 font-sans font-bold text-[#18122B]/50 uppercase text-[11px]">
                  <span>Voucher / Details</span>
                  <span>Amount & Ledger Status</span>
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
                <p className="font-bold text-[#18122B]">💡 FinSage AI Co-Pilot:</p>
                <p className="text-[#18122B]/80 leading-relaxed">
                  &ldquo;Your emergency reserve is fully secured. With a 51.4% savings rate this month, you have the financial headroom to allocate an extra ₹15,000 toward your travel goal without touching your index fund deposits.&rdquo;
                </p>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. SECTION 9 — BRAND MOMENT ("LESS MONEY ANXIETY. MORE MONEY CLARITY.")    */}
      {/* ========================================================================= */}
      <section className="relative border-t border-[#E5DAC4] bg-[#F2E5CB] py-28 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            
            <div className="lg:col-span-7">
              <span className="inline-block rounded-full bg-[#FEF08A] border border-[#CA8A04]/40 px-3.5 py-1 font-mono text-xs font-bold text-[#854D0E] uppercase tracking-wider">
                SECTION 09 • THE ETHOS
              </span>
              <h2 className="mt-6 font-serif text-5xl font-black tracking-tight text-[#18122B] sm:text-6xl lg:text-7xl lg:leading-[1.02]">
                LESS MONEY ANXIETY.<br />
                <span className="text-[#3f6212] bg-[#84cc16]/30 px-3 py-0.5 rounded-2xl inline-block mt-2">
                  MORE MONEY CLARITY.
                </span>
              </h2>
              <p className="mt-6 max-w-xl text-base text-[#18122B]/80 leading-relaxed sm:text-lg">
                Financial confidence isn&apos;t about rigid spreadsheets or depriving yourself. It&apos;s having continuous clarity on where you stand, zero awkward debt conversations, and an AI co-pilot that keeps you aligned with your long-term goals.
              </p>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-sm">
                <div className="overflow-hidden rounded-[2.5rem] border-2 border-[#18122B]/15 bg-white shadow-xl">
                  <div className="relative aspect-square w-full">
                    <Image
                      src="/brand/finance-objects-set.png"
                      alt="FinSage tactile fintech objects"
                      fill
                      className="object-contain p-6"
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. SECTION 10 — FINAL CTA ("READY TO FLIP YOUR MONEY?")                  */}
      {/* ========================================================================= */}
      <section className="relative border-t border-[#E5DAC4] bg-[#FAF8F5] py-28 text-center overflow-hidden">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          
          {/* Growth Artwork Accent */}
          <div className="mx-auto mb-8 max-w-xs sm:max-w-sm">
            <div className="overflow-hidden rounded-[2.5rem] border-2 border-[#18122B]/15 bg-white shadow-xl">
              <div className="relative aspect-[3/2] w-full">
                <Image
                  src="/brand/growth-arrow-swirl.jpg"
                  alt="FinSage compounding wealth artwork"
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
            <span className="text-[#84cc16] bg-[#18122B] px-5 py-1.5 rounded-2xl inline-block mt-3">
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
              <span>{token ? "Go to Dashboard" : "Start Flipping →"}</span>
            </Link>

            {!token && (
              <Link
                href="/signin"
                className="inline-flex items-center rounded-full border border-[#18122B]/20 bg-white px-7 py-4 text-base font-bold text-[#18122B] shadow-sm transition hover:border-[#18122B] hover:bg-[#FAF8F5]"
              >
                Sign In
              </Link>
            )}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. MINIMAL WARM CREAM FOOTER                                             */}
      {/* ========================================================================= */}
      <footer className="border-t border-[#E5DAC4] bg-[#F2E5CB] px-4 py-12 text-xs text-[#18122B]/60 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="font-serif text-lg font-black text-[#18122B]">
              FinSage <span className="text-[#65a30d]">AI</span>
            </span>
            <span className="font-mono text-[10px] text-[#18122B]/40">| AI Wealth Workspace</span>
          </div>

          <div className="flex flex-wrap items-center gap-5 font-semibold text-[#18122B]/75">
            <a href="#problem" className="hover:text-[#18122B] transition">The Problem</a>
            <a href="#how-it-works" className="hover:text-[#18122B] transition">How It Works</a>
            <a href="#ocr" className="hover:text-[#18122B] transition">OCR Capture</a>
            <a href="#advisor" className="hover:text-[#18122B] transition">AI Advisor</a>
            <a href="#splitwise" className="hover:text-[#18122B] transition">Splitwise</a>
            <a href="#knowledge" className="hover:text-[#18122B] transition">Knowledge</a>
            <a href="#showcase" className="hover:text-[#18122B] transition">Product</a>
            <Link href="/signin" className="hover:text-[#18122B] transition">Sign In</Link>
            <Link href="/signup" className="hover:text-[#18122B] transition">Start Flipping</Link>
          </div>

          <p>&copy; {new Date().getFullYear()} FinSage AI. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
