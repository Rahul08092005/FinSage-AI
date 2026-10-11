"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { OwlSection } from "./landing/owl-section/OwlSection";
import { HowItWorks } from "./landing/how-it-works/HowItWorks";
import { PrivacyTrust } from "./PrivacyTrust";
import { FinalCta } from "./FinalCta";
import { Footer } from "./Footer";


export function FinFlipLanding() {
  const [token, setToken] = useState<string | null>(null);
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
                  href="#how-it-works"
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
      {/* 4. SECTION 4 — PRIVACY & TRUST                                            */}
      {/* ========================================================================= */}
      <PrivacyTrust />

      {/* ========================================================================= */}
      {/* 5. SECTION 5 — FINAL CTA                                                  */}
      {/* ========================================================================= */}
      <FinalCta token={token} />

      {/* ========================================================================= */}
      {/* 6. SECTION 6 — FOOTER                                                     */}
      {/* ========================================================================= */}
      <Footer />

    </div>
  );
}
