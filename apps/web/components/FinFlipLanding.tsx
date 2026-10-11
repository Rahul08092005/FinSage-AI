"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { OwlSection } from "./landing/owl-section/OwlSection";
import { HowItWorks } from "./landing/how-it-works/HowItWorks";


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
                Track every rupee. Make smarter moves. Build a money life that works for you.
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
                <span>AI MONEY INSIGHTS</span>
                <span className="text-[#84cc16] font-bold">/</span>
                <span>SMART BUDGETING</span>
                <span className="text-[#84cc16] font-bold">/</span>
                <span>GOAL TRACKING</span>
                <span className="text-[#84cc16] font-bold">/</span>
                <span>FINANCIAL PLANNING</span>
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
      {/* 2. SECTION 2 — OWL INTERACTIVE FINANCIAL HUB (REPLACED PART 2)             */}
      {/* ========================================================================= */}
      <OwlSection />


      {/* ========================================================================= */}
      {/* 3. SECTION 3 — HOW IT WORKS                                              */}
      {/* ========================================================================= */}
      <HowItWorks />


      {/* ========================================================================= */}
      {/* 4. SECTION 4 — OCR CAPTURE ("SCREENSHOT IN. EXPENSE OUT.")                 */}
      {/* ========================================================================= */}
      <section id="ocr" className="relative scroll-mt-20 border-t border-[#E5DAC4] bg-[#FAF8F5] py-20 sm:py-28 overflow-hidden">
        
        {/* Subtle grid pattern for precision financial feel */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#18122B08_1px,transparent_1px),linear-gradient(to_bottom,#18122B08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Section Header: Punchy & Conversational */}
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#18122B]/15 bg-white/95 px-4 py-1.5 font-mono text-[11px] sm:text-xs font-black uppercase tracking-widest text-[#18122B] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#84cc16]" />
              04 / OCR CAPTURE
            </span>
            <h2 className="mt-4 font-serif text-4xl sm:text-6xl lg:text-7xl font-black tracking-[-0.04em] text-[#18122B] leading-[0.94]">
              SCREENSHOT IN.<br />
              <span className="text-[#18122B]">EXPENSE OUT.</span>
            </h2>
            <p className="mt-4 text-base sm:text-xl font-bold tracking-tight text-[#18122B] leading-snug">
              Snap a payment. <span className="text-[#18122B]/65 font-medium">FinSage does the boring part.</span>
            </p>
          </div>

          {/* Conceptual Transformation Journey Rail */}
          <div className="mt-8 inline-flex flex-wrap items-center gap-2 sm:gap-3 rounded-2xl border border-[#18122B]/15 bg-white/80 p-2 text-xs font-mono font-bold shadow-sm">
            <span className="rounded-xl bg-[#18122B] px-3 py-1.5 text-white">1. PAYMENT SCREENSHOT</span>
            <span className="text-[#84cc16] font-black text-sm">&rarr;</span>
            <span className="rounded-xl bg-[#84cc16]/20 border border-[#84cc16]/40 px-3 py-1.5 text-[#3f6212]">2. OCR PARSING</span>
            <span className="text-[#84cc16] font-black text-sm">&rarr;</span>
            <span className="rounded-xl bg-[#84cc16] px-3 py-1.5 text-[#18122B] font-black">3. STRUCTURED EXPENSE</span>
          </div>

          {/* Asymmetric Dual Column: Unconstrained Breathing Asset + Interactive Transformation Workspace */}
          <div className="mt-12 lg:mt-16 grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            
            {/* Left Column (lg:col-span-7): The Unconstrained Breathing Visual with Floating Chips */}
            <div className="lg:col-span-7 relative">
              
              {/* Floating Decorative Gold Coins & Shapes */}
              <div className="absolute -top-6 -left-4 w-12 h-12 pointer-events-none drop-shadow-lg z-20 hidden sm:block">
                <Image
                  src="/brand/artifacts/coins-3d.png"
                  alt="Floating coins"
                  width={48}
                  height={48}
                  className="object-contain rotate-[-12deg]"
                />
              </div>

              {/* The Hero Visual: Natural uncropped illustration */}
              <div className="relative mx-auto max-w-lg lg:max-w-none">
                <div className="relative aspect-[16/10] sm:aspect-[16/11] w-full rounded-3xl overflow-hidden border-2 border-[#18122B]/15 bg-[#F9F6F0] shadow-[8px_8px_0px_#18122B]">
                  <Image
                    src="/brand/receipt-ocr-phone.jpg"
                    alt="FinSage OCR Receipt scanner converting payment receipts into structured expenses on phone"
                    fill
                    className="object-contain object-center scale-[1.03] transition-transform duration-500 hover:scale-105"
                  />
                  
                  {/* Floating Micro-UI Chip 1: Raw Receipt Snippet */}
                  <div className="absolute top-4 left-4 sm:top-6 sm:left-6 rounded-2xl border-2 border-[#18122B] bg-[#FCFDF9] p-3 shadow-[4px_4px_0px_#84cc16] rotate-[-2deg] transition-transform hover:rotate-0">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] font-black text-[#4d7c0f]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#84cc16] animate-pulse" />
                      📸 RECEIPT DETECTED
                    </div>
                    <div className="mt-1 font-sans text-xs font-bold text-[#18122B]">Blue Tokai • ₹ 340.00</div>
                    <div className="text-[10px] font-mono text-[#18122B]/60">Captured in 0.3s</div>
                  </div>

                  {/* Floating Micro-UI Chip 2: OCR Scanner Reticle */}
                  <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 rounded-xl border border-[#84cc16] bg-[#84cc16] px-3 py-1.5 font-mono text-[11px] font-black text-[#18122B] shadow-sm">
                    ✓ 99.4% CONFIDENCE
                  </div>

                  {/* Floating Micro-UI Chip 3: Categorized Pill */}
                  <div className="absolute top-4 right-4 sm:top-6 sm:right-6 rounded-2xl border-2 border-[#18122B] bg-white p-2.5 shadow-[4px_4px_0px_#8B5CF6] rotate-[2deg] transition-transform hover:rotate-0">
                    <span className="font-mono text-[10px] font-black text-[#6D28D9] uppercase">DINING ENVELOPE</span>
                    <div className="font-sans text-xs font-black text-[#18122B]">Auto-Categorized</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (lg:col-span-5): Compact Interactive Progression & Live Output */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Interactive 3-Stage Progress Tabs */}
              <div className="flex items-center justify-between rounded-2xl border-2 border-[#18122B] bg-white p-1.5 shadow-[4px_4px_0px_#18122B]">
                <button
                  onClick={() => setOcrStep(0)}
                  className={`flex-1 rounded-xl py-2 px-2 text-center font-mono text-xs font-black transition-all ${
                    ocrStep === 0
                      ? "bg-[#18122B] text-white shadow-sm"
                      : "text-[#18122B]/70 hover:bg-[#FAF8F5]"
                  }`}
                >
                  1. Input
                </button>
                <button
                  onClick={() => setOcrStep(1)}
                  className={`flex-1 rounded-xl py-2 px-2 text-center font-mono text-xs font-black transition-all ${
                    ocrStep === 1
                      ? "bg-[#18122B] text-white shadow-sm"
                      : "text-[#18122B]/70 hover:bg-[#FAF8F5]"
                  }`}
                >
                  2. OCR
                </button>
                <button
                  onClick={() => setOcrStep(2)}
                  className={`flex-1 rounded-xl py-2 px-2 text-center font-mono text-xs font-black transition-all ${
                    ocrStep === 2
                      ? "bg-[#84cc16] text-[#18122B] shadow-sm"
                      : "text-[#18122B]/70 hover:bg-[#FAF8F5]"
                  }`}
                >
                  3. Voucher
                </button>
              </div>

              {/* Dynamic Content Display Based on Active Step */}
              <div className="rounded-3xl border-2 border-[#18122B] bg-white p-6 shadow-[6px_6px_0px_#18122B]">
                
                {ocrStep === 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[#18122B]/10 pb-3">
                      <span className="font-mono text-xs font-black text-[#18122B] uppercase">STEP 1 • RAW INPUT</span>
                      <span className="rounded-full bg-[#FEF08A] px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#854D0E]">
                        SCREENSHOT RECEIVED
                      </span>
                    </div>
                    <p className="text-sm text-[#18122B]/80 leading-relaxed font-sans">
                      Snap or share any payment screenshot from Google Pay, PhonePe, Paytm, or paper slips. No manual transcription needed.
                    </p>
                    <div className="rounded-2xl border border-dashed border-[#18122B]/30 bg-[#FAF8F5] p-3.5 font-mono text-xs space-y-1.5">
                      <div className="flex justify-between text-[#18122B]">
                        <span>Source:</span>
                        <span className="font-bold">PhonePe UPI Share Screen</span>
                      </div>
                      <div className="flex justify-between text-[#18122B]">
                        <span>Detected Amount:</span>
                        <span className="font-black text-[#84cc16] bg-[#18122B] px-1.5 py-0.5 rounded">₹ 340.00</span>
                      </div>
                      <div className="flex justify-between text-[#18122B]/60 text-[11px]">
                        <span>Timestamp:</span>
                        <span>Today • 11:42 PM</span>
                      </div>
                    </div>
                  </div>
                )}

                {ocrStep === 1 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[#18122B]/10 pb-3">
                      <span className="font-mono text-xs font-black text-[#18122B] uppercase">STEP 2 • OCR VISION PIPELINE</span>
                      <span className="rounded-full bg-[#DCFCE7] px-2.5 py-0.5 font-mono text-[10px] font-black text-[#166534]">
                        PARSED IN 0.3s
                      </span>
                    </div>
                    <p className="text-sm text-[#18122B]/80 leading-relaxed font-sans">
                      FinSage parses merchants, timestamps, line items, and taxes with sub-second latency and 99.4% precision.
                    </p>
                    <div className="rounded-2xl border border-[#84cc16]/40 bg-[#F7FEE7] p-3.5 font-mono text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="text-[#3f6212] font-bold">MERCHANT:</span>
                        <span className="font-bold text-[#18122B]">Blue Tokai Coffee Roasters</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#3f6212] font-bold">ITEMS:</span>
                        <span className="font-bold text-[#18122B]">1x Flat White + 1x Croissant</span>
                      </div>
                      <div className="flex justify-between border-t border-dashed border-[#84cc16]/40 pt-1.5 text-[11px]">
                        <span className="text-[#854D0E]">TAX PARSED:</span>
                        <span className="font-bold text-[#18122B]">CGST + SGST ₹ 16.20</span>
                      </div>
                    </div>
                  </div>
                )}

                {ocrStep === 2 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[#18122B]/10 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#84cc16]" />
                        <span className="font-mono text-xs font-black text-[#18122B]">VOUCHER #VCH-2026-0941</span>
                      </div>
                      <span className="rounded-full bg-[#DCFCE7] px-2.5 py-0.5 font-mono text-[10px] font-black text-[#166534]">
                        ✓ BALANCED & FILED
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-xl bg-[#FAF8F5] p-2.5 border border-[#18122B]/10">
                        <span className="text-[10px] font-mono text-[#18122B]/60 uppercase">DEBIT (DR)</span>
                        <p className="font-bold text-[#18122B] mt-0.5">Food & Dining</p>
                        <p className="font-mono font-black text-[#18122B]">₹ 340.00</p>
                      </div>
                      <div className="rounded-xl bg-[#FAF8F5] p-2.5 border border-[#18122B]/10">
                        <span className="text-[10px] font-mono text-[#18122B]/60 uppercase">CREDIT (CR)</span>
                        <p className="font-bold text-[#18122B] mt-0.5">HDFC Bank UPI</p>
                        <p className="font-mono font-black text-[#18122B]">₹ 340.00</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-[#18122B]/10 flex items-center justify-between text-xs font-mono">
                      <span className="text-[#18122B]/70">Classification:</span>
                      <span className="font-bold text-[#6D28D9] bg-[#F5F3FF] px-2 py-0.5 rounded">30% Lifestyle Envelope</span>
                    </div>
                  </div>
                )}

              </div>

              {/* Bottom Quick Metric Tag */}
              <div className="flex items-center justify-between font-mono text-xs text-[#18122B]/70 px-2">
                <span>&rarr; Works with GPay, PhonePe, Paytm, SMS</span>
                <span className="font-bold text-[#4d7c0f]">0s Manual entry</span>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. SECTION 5 — AI FINANCIAL ADVISOR (FINANCIAL THOUGHT & INSIGHT SYSTEM) */}
      {/* ========================================================================= */}
      <section id="advisor" className="relative scroll-mt-20 border-t border-[#E5DAC4] bg-[#F2E5CB] py-20 sm:py-28 overflow-hidden">
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Section Header: Human, Gen-Z, Punchy */}
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#18122B]/15 bg-white/95 px-4 py-1.5 font-mono text-[11px] sm:text-xs font-black uppercase tracking-widest text-[#18122B] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#8B5CF6]" />
              05 / AI ADVISOR
            </span>
            <h2 className="mt-4 font-serif text-4xl sm:text-6xl lg:text-7xl font-black tracking-[-0.04em] text-[#18122B] leading-[0.94]">
              YOUR MONEY.<br />
              <span className="text-[#18122B]">NOW WITH A SECOND BRAIN.</span>
            </h2>
            <p className="mt-4 max-w-xl mx-auto text-base sm:text-lg font-bold tracking-tight text-[#18122B]/75 leading-snug">
              Smart money advice. Without the lecture.
            </p>
          </div>

          {/* Capability Badges: Compact editorial pills instead of bulky cards */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#F97316]/40 bg-[#FFF7ED] px-4 py-1.5 font-mono text-xs font-bold text-[#C2410C] shadow-sm rotate-[-1deg] hover:rotate-0 transition-transform">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F97316]" />
              SPENDING PATTERNS
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#84cc16]/50 bg-[#F7FEE7] px-4 py-1.5 font-mono text-xs font-bold text-[#3f6212] shadow-sm rotate-[1deg] hover:rotate-0 transition-transform">
              <span className="h-1.5 w-1.5 rounded-full bg-[#84cc16]" />
              PERSONALIZED GUIDANCE
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#8B5CF6]/40 bg-[#F5F3FF] px-4 py-1.5 font-mono text-xs font-bold text-[#6D28D9] shadow-sm rotate-[-0.5deg] hover:rotate-0 transition-transform">
              <span className="h-1.5 w-1.5 rounded-full bg-[#8B5CF6]" />
              GOAL AWARENESS
            </span>
          </div>

          {/* Asymmetric Central Stage: 3D Character with Branching Insight Notes */}
          <div className="mt-14 sm:mt-18 relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Center-Left: The 3D Gen-Z Character surrounded by floating objects */}
            <div className="lg:col-span-6 flex justify-center relative">
              <div className="relative w-full max-w-md aspect-square">
                
                {/* Floating 3D Coin Asset (Top Right) */}
                <div className="absolute -top-4 right-6 w-14 h-14 pointer-events-none drop-shadow-xl z-20 animate-bounce" style={{ animationDuration: '4s' }}>
                  <Image
                    src="/brand/artifacts/coins-3d.png"
                    alt="Floating coin"
                    width={56}
                    height={56}
                    className="object-contain"
                  />
                </div>

                {/* Floating 3D Goal Chip */}
                <div className="absolute top-8 -left-2 sm:left-4 z-20 rounded-2xl border-2 border-[#18122B] bg-white p-3 shadow-[4px_4px_0px_#84cc16] rotate-[-3deg] transition-transform hover:rotate-0">
                  <div className="font-mono text-[10px] font-black text-[#4d7c0f] uppercase">🎯 EMERGENCY GOAL</div>
                  <div className="font-sans text-xs font-black text-[#18122B]">82% Funded • On Track</div>
                  <div className="text-[10px] font-mono text-[#18122B]/60">+14 Days ahead of schedule</div>
                </div>

                {/* The 3D Character Illustration */}
                <Image
                  src="/brand/artifacts/genz-character-3d.png"
                  alt="FinSage AI Advisor companion"
                  fill
                  className="object-contain object-bottom drop-shadow-2xl scale-105"
                  priority
                />

                {/* Bottom Context Badge */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 rounded-full border border-[#18122B]/20 bg-white/95 px-4 py-1.5 font-mono text-[11px] font-bold text-[#18122B] shadow-md whitespace-nowrap">
                  💡 Zero Judgment • Pure Math & Context
                </div>
              </div>
            </div>

            {/* Right Side: The Thought / Insight System Notes */}
            <div className="lg:col-span-6 space-y-6">
              
              {/* Note 1: SPENDING PATTERN INSIGHT */}
              <div className="relative rounded-3xl border-2 border-[#8B5CF6] bg-white p-6 shadow-[6px_6px_0px_#8B5CF6] transition-all hover:shadow-[8px_8px_0px_#8B5CF6] hover:-translate-y-1">
                <div className="flex items-center justify-between border-b border-[#8B5CF6]/20 pb-3">
                  <span className="font-mono text-xs font-black text-[#6D28D9] uppercase flex items-center gap-1.5">
                    <span>📊</span> SPENDING PATTERN DETECTED
                  </span>
                  <span className="font-mono text-[10px] text-[#18122B]/60 font-bold">50/30/20 Context</span>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between rounded-xl bg-[#FAF8FF] p-3 border border-[#8B5CF6]/15 font-mono text-xs">
                    <span className="font-bold text-[#18122B]">Dining Spend (Weekend Surge)</span>
                    <span className="font-black text-[#C2410C]">↗ +18.3% vs avg</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-[#FAF8FF] p-3 border border-[#8B5CF6]/15 font-mono text-xs">
                    <span className="font-bold text-[#18122B]">Safe Liquid Runway</span>
                    <span className="font-black text-[#166534]">4.8 Months Buffer</span>
                  </div>
                </div>
              </div>

              {/* Note 2: ACTIONABLE AI RECOMMENDATION (THE EDITORIAL PAYOFF) */}
              <div className="relative rounded-3xl border-2 border-[#18122B] bg-[#18122B] p-6 text-white shadow-[6px_6px_0px_#84cc16] transition-all hover:shadow-[8px_8px_0px_#84cc16] hover:-translate-y-1">
                <div className="flex items-center justify-between border-b border-white/15 pb-3">
                  <span className="font-mono text-xs font-black text-[#84cc16] uppercase flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#84cc16] animate-pulse" />
                    SMART ADVISOR RECOMMENDATION
                  </span>
                  <span className="font-mono text-[10px] text-white/50">One-Tap Move</span>
                </div>

                <p className="mt-4 font-serif text-lg sm:text-xl font-bold text-white leading-snug">
                  &ldquo;Your dining spend is creeping up this weekend. You&apos;ve still got room in your 30% Lifestyle envelope — just don&apos;t let weekend deliveries eat the buffer.&rdquo;
                </p>

                <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-white/10">
                  <div className="font-mono text-xs text-[#84cc16]">
                    💡 Reallocate ₹ 1,200 to Goa Trip goal
                  </div>
                  <button className="rounded-xl bg-[#84cc16] px-4 py-2 font-mono text-xs font-black text-[#18122B] shadow-sm hover:scale-105 transition-transform">
                    One-Tap Rebalance &rarr;
                  </button>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. SECTION 6 — SPLITWISE / EXPENSE SHARING (SOCIAL MONEY NETWORK)         */}
      {/* ========================================================================= */}
      <section id="splitwise" className="relative scroll-mt-20 border-t border-[#E5DAC4] bg-[#FAF8F5] py-20 sm:py-28 overflow-hidden">
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Section Header: Playful, Social, Gen-Z */}
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#18122B]/15 bg-white/95 px-4 py-1.5 font-mono text-[11px] sm:text-xs font-black uppercase tracking-widest text-[#18122B] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#3B82F6]" />
              06 / SHARED EXPENSES
            </span>
            <h2 className="mt-4 font-serif text-4xl sm:text-6xl lg:text-7xl font-black tracking-[-0.04em] text-[#18122B] leading-[0.94]">
              GROUP DINNER.<br />
              <span className="text-[#18122B]">ZERO MATH DRAMA.</span>
            </h2>
            <p className="mt-4 text-base sm:text-xl font-bold tracking-tight text-[#18122B] leading-snug">
              Who owes who? <span className="text-[#18122B]/65 font-medium">FinSage knows without distorting your personal budget.</span>
            </p>
          </div>

          {/* Social Money Network Canvas */}
          <div className="mt-14 sm:mt-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left/Center Canvas (lg:col-span-7): The Visual Social Network Graph */}
            <div className="lg:col-span-7 relative">
              
              <div className="relative rounded-3xl border-2 border-[#18122B] bg-[#FFFDF9] p-6 sm:p-8 shadow-[8px_8px_0px_#18122B] overflow-hidden">
                
                {/* Canvas Banner */}
                <div className="flex items-center justify-between border-b border-[#18122B]/10 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#EFF6FF] border border-[#3B82F6]/30 px-2.5 py-0.5 font-mono text-[10px] font-black text-[#1D4ED8] uppercase">
                      👥 SPLITWISE NETWORK
                    </span>
                    <span className="font-serif text-sm font-bold text-[#18122B]">Goa Villa Weekend Trip</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#18122B]/60">4 Members</span>
                </div>

                {/* Interactive Network Diagram */}
                <div className="mt-8 relative py-4">
                  
                  {/* Central Node: YOU (Paid ₹ 4,000 for dinner) */}
                  <div className="flex justify-center mb-8">
                    <div className="relative z-10 rounded-2xl border-2 border-[#18122B] bg-[#84cc16] px-5 py-3 shadow-[4px_4px_0px_#18122B] text-center">
                      <div className="font-mono text-[10px] font-black uppercase tracking-wider text-[#18122B]">
                        YOU PAID THE BILL
                      </div>
                      <div className="font-serif text-base font-black text-[#18122B]">
                        ₹ 4,000.00 • Group Dinner
                      </div>
                      <div className="font-mono text-[10px] text-[#18122B]/75 font-semibold">
                        Your personal share: ₹ 1,000.00
                      </div>
                    </div>
                  </div>

                  {/* Radiating Connector Lines & Friends Nodes */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
                    
                    {/* Node 1: Rohan */}
                    <div className="rounded-2xl border-2 border-[#18122B] bg-white p-3.5 shadow-[3px_3px_0px_#84cc16] text-center transition-transform hover:-translate-y-1">
                      <div className="w-8 h-8 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6] mx-auto flex items-center justify-center font-mono text-xs font-black text-[#6D28D9]">
                        R
                      </div>
                      <div className="mt-2 font-sans text-xs font-bold text-[#18122B]">Rohan</div>
                      <div className="mt-1 font-mono text-xs font-black text-[#166534]">
                        owes ₹ 850
                      </div>
                      <div className="text-[10px] font-mono text-[#18122B]/50">Drinks & tapas</div>
                    </div>

                    {/* Node 2: Priya */}
                    <div className="rounded-2xl border-2 border-[#18122B] bg-white p-3.5 shadow-[3px_3px_0px_#84cc16] text-center transition-transform hover:-translate-y-1">
                      <div className="w-8 h-8 rounded-full bg-[#F97316]/20 border border-[#F97316] mx-auto flex items-center justify-center font-mono text-xs font-black text-[#C2410C]">
                        P
                      </div>
                      <div className="mt-2 font-sans text-xs font-bold text-[#18122B]">Priya</div>
                      <div className="mt-1 font-mono text-xs font-black text-[#166534]">
                        owes ₹ 1,200
                      </div>
                      <div className="text-[10px] font-mono text-[#18122B]/50">Dinner split</div>
                    </div>

                    {/* Node 3: Ananya */}
                    <div className="rounded-2xl border-2 border-[#18122B] bg-white p-3.5 shadow-[3px_3px_0px_#BE185D] text-center transition-transform hover:-translate-y-1">
                      <div className="w-8 h-8 rounded-full bg-[#EC4899]/20 border border-[#EC4899] mx-auto flex items-center justify-center font-mono text-xs font-black text-[#BE185D]">
                        A
                      </div>
                      <div className="mt-2 font-sans text-xs font-bold text-[#18122B]">Ananya</div>
                      <div className="mt-1 font-mono text-xs font-black text-rose-600">
                        you owe ₹ 450
                      </div>
                      <div className="text-[10px] font-mono text-[#18122B]/50">Morning cafe run</div>
                    </div>

                  </div>

                </div>

                {/* Collapsed Settlement Payoff Banner */}
                <div className="mt-6 rounded-2xl border-2 border-[#84cc16] bg-[#84cc16]/15 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                  <div>
                    <span className="font-mono text-[10px] font-black uppercase tracking-wider text-[#3f6212]">
                      ✓ NET SETTLEMENT COLLAPSE
                    </span>
                    <div className="font-serif text-lg font-black text-[#18122B]">
                      Net to collect: <span className="text-[#166534] font-mono">₹ 1,600.00</span>
                    </div>
                  </div>
                  <span className="rounded-xl bg-[#18122B] text-white px-3 py-1.5 font-mono text-xs font-bold shadow-sm whitespace-nowrap">
                    1 Simple Transfer
                  </span>
                </div>

              </div>

            </div>

            {/* Right Column (lg:col-span-5): The Budget Isolation Guarantee */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="rounded-3xl border-2 border-[#18122B] bg-white p-6 sm:p-7 shadow-[6px_6px_0px_#3B82F6]">
                <span className="rounded-full bg-[#EFF6FF] border border-[#3B82F6]/30 px-3 py-1 font-mono text-[10px] font-black uppercase tracking-wider text-[#1D4ED8]">
                  BUDGET PURITY RULE
                </span>
                <h3 className="mt-4 font-serif text-2xl font-black text-[#18122B] tracking-tight">
                  Never blow your dining budget on someone else&apos;s cocktail.
                </h3>
                <p className="mt-3 text-sm text-[#18122B]/80 leading-relaxed font-sans">
                  When you swipe for ₹ 4,000, traditional apps record a catastrophic ₹ 4,000 expense. FinSage isolates the <span className="font-bold text-[#18122B]">₹ 3,000 shared receivable</span> on your balance sheet — only deducting your genuine <span className="font-bold text-[#18122B]">₹ 1,000 share</span> from your 30% Lifestyle envelope.
                </p>

                <div className="mt-6 pt-4 border-t border-[#18122B]/10 space-y-2 font-mono text-xs">
                  <div className="flex justify-between text-[#18122B]">
                    <span>Personal Dining Expense:</span>
                    <span className="font-bold text-[#166534]">₹ 1,000.00 (Logged)</span>
                  </div>
                  <div className="flex justify-between text-[#18122B]/70">
                    <span>Friend Receivables:</span>
                    <span className="font-bold text-[#3B82F6]">₹ 3,000.00 (Tracked Asset)</span>
                  </div>
                </div>
              </div>

              {/* Trust Badge with 3D Card Artifact */}
              <div className="rounded-2xl border border-[#18122B]/15 bg-white/90 p-4 flex items-center gap-3 shadow-sm">
                <div className="w-10 h-10 flex-shrink-0">
                  <Image
                    src="/brand/artifacts/card-3d.png"
                    alt="Card artifact"
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
                <div className="font-mono text-xs text-[#18122B]/80">
                  <span className="font-bold text-[#18122B]">Automatic Splitwise Sync</span><br />
                  Settlements clear liabilities automatically.
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
