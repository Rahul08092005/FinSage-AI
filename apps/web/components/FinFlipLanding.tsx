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
      {/* ========================================================================= */}
      {/* 2. SECTION 2 — THE REALITY ("MONEY GETS MESSY.")                          */}
      {/* ========================================================================= */}
      <section id="problem" className="relative border-t border-[#E5DAC4] bg-[#FAF8F5] py-16 sm:py-20 lg:py-24 overflow-hidden">
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

          {/* Editorial Streamer Tags (Fast-reading Gen-Z short phrases) */}
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

          {/* ========================================================================= */}
          {/* ASYMMETRIC EDITORIAL "MONEY CHAOS" COLLAGE DESK                           */}
          {/* ========================================================================= */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
            
            {/* COLUMN 1 (Desktop: 4 cols, Tablet: 1 col): Thermal Paper Receipt + Splitwise IOU Chip */}
            <div className="md:col-span-1 lg:col-span-4 flex flex-col gap-5">
              
              {/* Artifact 1: Thermal Receipt Slip (Authentic Paper Aesthetic with jagged tear) */}
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

                {/* Receipt bottom dashed/barcode accent */}
                <div className="mt-3 flex items-center justify-between pt-2 text-[10px] font-mono text-[#18122B]/40">
                  <span>AUTH: PHONEPE-UPI-99210</span>
                  <span className="text-[#F97316] font-bold">📸 Buried in gallery</span>
                </div>

                {/* Floating 3D Receipt Badge */}
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

              {/* Artifact 2: Splitwise Group IOU Chip */}
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

            {/* COLUMN 2 (Desktop: 5 cols, Tablet: 2 cols featured at top): Dominant Editorial Focus */}
            <div className="md:col-span-2 lg:col-span-5 flex flex-col gap-5 md:order-first lg:order-none">
              
              {/* Central Dominant Feature: The Confused Wallet Punchline */}
              <div className="relative rounded-3xl border-2 border-[#18122B] bg-[#F2E5CB] p-6 sm:p-7 shadow-[5px_5px_0px_#18122B] transition-transform duration-300 hover:scale-[1.01]">
                
                {/* Floating 3D Wallet Icon in top right */}
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

                {/* Bank Statement Code Snippet */}
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

            {/* COLUMN 3 (Desktop: 3 cols, Tablet: 1 col): UPI Notification + Impulse Tap Bubble */}
            <div className="md:col-span-1 lg:col-span-3 flex flex-col gap-5">
              
              {/* Artifact 3: Modern UPI / Phone Push Notification Alert */}
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

              {/* Artifact 4: Impulse Buy Mini-Bubble with 3D Coin stack */}
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

              {/* Artifact 5: Small Card Accent */}
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

          {/* ========================================================================= */}
          {/* THE TRANSITION: "MESSY IN. → FINSAGE OUT."                               */}
          {/* ========================================================================= */}
          <div className="mt-14 sm:mt-16 rounded-3xl sm:rounded-[2.5rem] border-2 border-[#18122B] bg-[#F2E5CB] p-6 sm:p-8 lg:p-10 shadow-[6px_6px_0px_#18122B]">
            
            {/* Header Transition Banner */}
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

            {/* The Visual Transformation: Raw Chaos Inputs → Structured Double-Entry Ledger */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              
              {/* Left Column: Raw scattered inputs */}
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

              {/* Right Column: Clean Ledger Voucher Preview */}
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

                  {/* Ledger Table Rows */}
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

                  {/* Envelope allocation preview */}
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

      {/* ========================================================================= */}
      {/* 3. SECTION 3 — HOW IT WORKS (CONNECTIVE FINANCIAL JOURNEY)                */}
      {/* ========================================================================= */}
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
