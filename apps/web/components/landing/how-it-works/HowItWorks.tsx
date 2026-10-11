"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ROW_1_STEPS, ROW_2_STEPS } from "./data";
import { StepCard } from "./StepCard";
import {
  HorizontalConnector,
  Step1To5Connector,
  Step4To7Connector,
  Step5To6Connector,
  Step6To7Connector,
  VerticalStepConnector,
} from "./FlowConnectors";
import { BenefitsBar } from "./BenefitsBar";

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    const sec = sectionRef.current;
    if (!sec) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setHasEntered(true);
          io.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    io.observe(sec);
    return () => io.disconnect();
  }, []);

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="relative w-full border-t border-[#E5DAC4] bg-[#FAF8F5] py-8 sm:py-10 lg:py-12 overflow-hidden scroll-mt-20 select-none"
    >
      {/* ========================================================================= */}
      {/* BACKGROUND DECORATIVE FLOATING 3D OBJECTS MATCHING REFERENCE              */}
      {/* ========================================================================= */}
      
      {/* 1. Top-Left: Tilted Frosted Glass Panel + Gold Coin */}
      <div
        className="pointer-events-none absolute -top-8 -left-10 w-44 h-44 rounded-3xl bg-white/40 border border-white/60 shadow-[0_20px_50px_rgba(0,0,0,0.03)] rotate-[-18deg] backdrop-blur-xs hidden lg:block"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-12 left-10 lg:left-20 w-11 lg:w-13 select-none hidden sm:block transition-transform duration-700 hover:rotate-6"
        aria-hidden="true"
      >
        <Image
          src="/landing/decor/decor-coin-1.png"
          alt=""
          width={54}
          height={54}
          className="w-full h-auto object-contain drop-shadow-md"
        />
      </div>

      {/* 2. Top-Right: Translucent Green Cube, Gem, and Large Gold Coin */}
      <div
        className="pointer-events-none absolute top-6 right-28 lg:right-44 w-12 lg:w-14 select-none hidden sm:block rotate-[12deg]"
        aria-hidden="true"
      >
        <Image
          src="/landing/decor/decor-cube.png"
          alt=""
          width={56}
          height={56}
          className="w-full h-auto object-contain drop-shadow-md"
        />
      </div>
      <div
        className="pointer-events-none absolute top-16 right-20 lg:right-32 w-7 lg:w-8 select-none hidden sm:block rotate-[-15deg]"
        aria-hidden="true"
      >
        <Image
          src="/landing/decor/decor-gem.png"
          alt=""
          width={32}
          height={32}
          className="w-full h-auto object-contain drop-shadow-sm"
        />
      </div>
      <div
        className="pointer-events-none absolute top-8 right-4 lg:right-10 w-16 lg:w-20 select-none hidden sm:block rotate-[-20deg]"
        aria-hidden="true"
      >
        <Image
          src="/landing/decor/decor-coin-2.png"
          alt=""
          width={80}
          height={80}
          className="w-full h-auto object-contain drop-shadow-lg"
        />
      </div>

      {/* 3. Bottom-Left: Tilted Purple Credit Card */}
      <div
        className="pointer-events-none absolute -bottom-6 -left-6 w-28 lg:w-36 select-none hidden sm:block rotate-[-22deg] opacity-75 blur-[0.4px]"
        aria-hidden="true"
      >
        <Image
          src="/landing/decor/decor-card.png"
          alt=""
          width={140}
          height={140}
          className="w-full h-auto object-contain drop-shadow-xl"
        />
      </div>

      {/* 4. Bottom-Right: Tilted Gold Coin */}
      <div
        className="pointer-events-none absolute -bottom-6 -right-6 w-24 lg:w-28 select-none hidden sm:block rotate-[18deg] opacity-85 blur-[0.3px]"
        aria-hidden="true"
      >
        <Image
          src="/landing/decor/decor-coin-2.png"
          alt=""
          width={110}
          height={110}
          className="w-full h-auto object-contain drop-shadow-xl"
        />
      </div>

      {/* Soft Ambient Background Glows */}
      <div
        className="pointer-events-none absolute top-6 left-1/4 h-80 w-80 rounded-full bg-[#FAF5FF] blur-3xl opacity-60"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-12 right-1/4 h-80 w-80 rounded-full bg-[#FFF7ED] blur-3xl opacity-60"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-[#F0FDF4] blur-3xl opacity-60"
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/* ========================================================================= */}
        {/* SECTION HEADER: Pill + Flanked Headline + Hand-drawn Underline + Subtitle */}
        {/* ========================================================================= */}
        <div
          className="relative mx-auto max-w-2xl flex flex-col items-center text-center z-10 mb-5 sm:mb-7 transition-all duration-600"
          style={{
            opacity: hasEntered ? 1 : 0,
            transform: hasEntered ? "translateY(0)" : "translateY(12px)",
          }}
        >
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#18122B]/10 bg-white/95 px-3.5 py-1 font-mono text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#18122B] shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-[#84CC16]" />
            HOW IT WORKS
          </div>

          {/* Headline with Flanking Accent Marks */}
          <div className="relative mt-2.5 inline-block">
            {/* Left Flanking Marks (2 green brush strokes) */}
            <div className="absolute -left-7 sm:-left-9 top-1/2 -translate-y-1/2 flex flex-col gap-1 items-end pointer-events-none select-none">
              <span className="w-4.5 sm:w-5.5 h-1 sm:h-1.5 rounded-full bg-[#84CC16] rotate-[-25deg]" />
              <span className="w-3.5 sm:w-4.5 h-1 sm:h-1.5 rounded-full bg-[#84CC16]" />
            </div>

            {/* Right Flanking Marks (2 orange brush strokes + gold sparkle) */}
            <div className="absolute -right-7 sm:-right-9 top-1/2 -translate-y-1/2 flex flex-col gap-1 items-start pointer-events-none select-none">
              <span className="w-4.5 sm:w-5.5 h-1 sm:h-1.5 rounded-full bg-[#F97316] rotate-[30deg]" />
              <span className="w-3.5 sm:w-4.5 h-1 sm:h-1.5 rounded-full bg-[#F97316] rotate-[-15deg]" />
              <span className="text-[#EAB308] text-[11px] font-black -mt-0.5 ml-1 leading-none">✦</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-[#18122B] leading-[1.08] text-center">
              Turn your financial chaos
              <br />
              into{" "}
              <span className="relative inline-block text-[#65A30D]">
                clarity.
                {/* Hand-drawn Brush Underline SVG */}
                <svg
                  viewBox="0 0 200 16"
                  fill="none"
                  className="absolute -bottom-1 sm:-bottom-1.5 left-0 w-full h-2.5 sm:h-3 text-[#84CC16]/90 pointer-events-none"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M 2 10 Q 50 14, 100 11 Q 150 8, 198 12"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h2>
          </div>

          {/* Subtitle */}
          <p className="mt-2 text-xs sm:text-sm font-medium text-[#18122B]/70 max-w-lg mx-auto leading-relaxed">
            A simple flow from capturing your data to building a smarter, wealthier you.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* DESKTOP & TABLET: 2-ROW INFOGRAPHIC WITH BENEFITS STRIP IN BETWEEN        */}
        {/* ========================================================================= */}
        <div className="hidden sm:block relative">
          {/* Connector Paths (Behind cards) */}
          <Step1To5Connector hasEntered={hasEntered} />
          <Step4To7Connector hasEntered={hasEntered} />

          {/* 1. First Row: Steps 1 to 4 (2 cols on tablet, 4 cols on desktop xl:) */}
          <div className="relative z-10">
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 xl:gap-5">
              {ROW_1_STEPS.map((step, idx) => (
                <div key={step.id} className="relative h-full">
                  <StepCard step={step} index={idx} hasEntered={hasEntered} />
                  {/* Subtle right-pointing connector between cards on desktop */}
                  {idx < 3 && (
                    <div className="hidden xl:flex absolute -right-3 xl:-right-3.5 top-1/2 -translate-y-1/2 z-30 pointer-events-none">
                      <HorizontalConnector
                        color={idx === 0 ? "#84CC16" : idx === 1 ? "#A855F7" : "#F97316"}
                        isDashed={idx === 0}
                        hasEntered={hasEntered}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 2. Benefits Strip — Positioned physically BETWEEN Row 1 and Row 2 */}
          <div className="relative z-20">
            <BenefitsBar hasEntered={hasEntered} />
          </div>

          {/* 3. Second Row: Steps 5 to 7 (3 cols on tablet & desktop) */}
          <div className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 xl:gap-5 max-w-5xl xl:max-w-none mx-auto">
              {ROW_2_STEPS.map((step, idx) => (
                <div key={step.id} className="relative h-full">
                  <StepCard step={step} index={idx + 4} hasEntered={hasEntered} />
                  {/* Connectors between cards in row 2 */}
                  {idx === 0 && (
                    <div className="hidden md:flex absolute -right-3 xl:-right-3.5 top-1/2 -translate-y-1/2 z-30 pointer-events-none">
                      <Step5To6Connector hasEntered={hasEntered} />
                    </div>
                  )}
                  {idx === 1 && (
                    <div className="hidden md:flex absolute -right-3 xl:-right-3.5 top-1/2 -translate-y-1/2 z-30 pointer-events-none">
                      <Step6To7Connector hasEntered={hasEntered} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MOBILE (<640px): 1-COLUMN STACKED WITH BENEFITS STRIP BETWEEN 4 AND 5    */}
        {/* ========================================================================= */}
        <div className="sm:hidden flex flex-col gap-3">
          {/* Steps 1 to 4 */}
          {ROW_1_STEPS.map((step, idx) => (
            <div key={step.id} className="w-full">
              <StepCard step={step} index={idx} hasEntered={hasEntered} />
              <VerticalStepConnector />
            </div>
          ))}

          {/* Benefits Strip in the middle */}
          <div className="my-1">
            <BenefitsBar hasEntered={hasEntered} />
          </div>
          <VerticalStepConnector />

          {/* Steps 5 to 7 */}
          {ROW_2_STEPS.map((step, idx) => (
            <div key={step.id} className="w-full">
              <StepCard step={step} index={idx + 4} hasEntered={hasEntered} />
              {idx < ROW_2_STEPS.length - 1 && <VerticalStepConnector />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
