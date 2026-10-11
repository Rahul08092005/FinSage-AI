"use client";

import Image from "next/image";
import { HowItWorksStep, StackedPill } from "./data";

interface StepCardProps {
  step: HowItWorksStep;
  index: number;
  hasEntered?: boolean;
}

function renderPillIcon(type: StackedPill["iconType"], color: string) {
  switch (type) {
    case "food":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5">
          <path d="M18 2v6a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V2" />
          <path d="M12 11v11" />
          <path d="M8 2v4" />
          <path d="M16 2v4" />
        </svg>
      );
    case "shopping":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      );
    case "transport":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2.1 11.2 2 11.6 2 12v4c0 .6.4 1 1 1h2" />
          <circle cx="7" cy="17" r="2" />
          <path d="M9 17h6" />
          <circle cx="17" cy="17" r="2" />
        </svg>
      );
    case "chat":
      return (
        <svg viewBox="0 0 24 24" fill={color} className="w-2.5 h-2.5">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
        </svg>
      );
    case "bulb":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5">
          <path d="M9 18h6" />
          <path d="M10 22h4" />
          <path d="M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.7 3.5 6h7c2-1.3 3.5-3.5 3.5-6a7 7 0 0 0-7-7z" />
        </svg>
      );
    case "sparkle":
      return (
        <svg viewBox="0 0 24 24" fill={color} className="w-2.5 h-2.5">
          <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z" />
        </svg>
      );
    case "bars":
      return (
        <svg viewBox="0 0 24 24" fill={color} className="w-2.5 h-2.5">
          <path d="M4 19h4V9H4v10zm6 0h4V5h-4v14zm6 0h4v-7h-4v7z" />
        </svg>
      );
    case "calendar":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5">
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
          <line x1="16" x2="16" y1="2" y2="6" />
          <line x1="8" x2="8" y1="2" y2="6" />
          <line x1="3" x2="21" y1="10" y2="10" />
        </svg>
      );
    case "star":
      return (
        <svg viewBox="0 0 24 24" fill={color} className="w-2.5 h-2.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    default:
      return null;
  }
}

export function StepCard({ step, index, hasEntered = true }: StepCardProps) {
  const enterStyle = {
    transition: `opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${0.08 + index * 0.05}s, transform 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${0.08 + index * 0.05}s`,
    opacity: hasEntered ? 1 : 0,
    transform: hasEntered ? "translateY(0)" : "translateY(12px)",
  };

  const isRow2 = step.id >= 5;

  return (
    <article
      style={{
        background: step.cardBg,
        borderColor: step.cardBorder,
        boxShadow: step.cardShadow,
        ...enterStyle,
      }}
      className={`group relative rounded-2xl lg:rounded-3xl border p-3.5 sm:p-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg h-full min-h-[185px] sm:min-h-[195px] select-none ${step.tilt || ""}`}
    >
      {/* 1. Step Badge (overlapping top-left) */}
      <div
        className="absolute -top-3 -left-3 z-20 flex h-7 w-7 sm:h-7.5 sm:w-7.5 items-center justify-center rounded-full border-2 border-white shadow-xs transition-transform duration-300 group-hover:scale-110"
        style={{
          backgroundColor: step.badgeBg,
          color: step.badgeText,
        }}
      >
        <span className="font-mono text-xs font-black leading-none">{step.stepNumber}</span>
      </div>

      {/* ===================================================================== */}
      {/* CARD BODY: ROW 1 (Steps 1-4)                                          */}
      {/* ===================================================================== */}
      {!isRow2 && (
        <div className="flex flex-col justify-between h-full">
          <div className="flex items-start justify-between gap-2.5">
            {/* Left Column: Title & Description */}
            <div className="flex-1 min-w-0 pr-1">
              <h3 className="font-serif text-sm sm:text-base font-black tracking-tight text-[#18122B] leading-tight">
                {step.title}
              </h3>
              <p className="mt-1 text-[11px] sm:text-xs text-[#18122B]/75 leading-relaxed">
                {step.description}
              </p>
            </div>

            {/* Right Column: Illustration */}
            <div className="relative shrink-0 flex items-center justify-center">
              {/* Step 1: Capture */}
              {step.illustrationType === "capture" && (
                <div className="relative w-16 h-16 sm:w-18 sm:h-18 flex items-center justify-center pointer-events-none transition-transform duration-300 group-hover:scale-105 shrink-0">
                  <Image
                    src="/landing/icons/icon-capture.png"
                    alt="Receipt scroll"
                    width={90}
                    height={90}
                    className="w-full h-full object-contain drop-shadow-md"
                  />
                  {/* Scan Frame Badge */}
                  <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-md bg-[#16A34A] border-2 border-white shadow-xs">
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5">
                      <path d="M4 8V6a2 2 0 0 1 2-2h2" />
                      <path d="M16 4h2a2 2 0 0 1 2 2v2" />
                      <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
                      <path d="M8 20H6a2 2 0 0 1-2-2v-2" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Step 2: Organize */}
              {step.illustrationType === "organize" && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center pointer-events-none transition-transform duration-300 group-hover:scale-105 shrink-0">
                    {/* Protruding card tabs */}
                    <div className="absolute -top-1 left-2.5 z-0 flex flex-col gap-0.5 rounded border border-[#18122B]/10 bg-white p-0.5 shadow-2xs rotate-[-8deg]">
                      <div className="h-0.5 w-2.5 rounded bg-[#9333EA]/60" />
                      <div className="h-0.5 w-1.5 rounded bg-[#9333EA]/40" />
                    </div>
                    <div className="absolute -top-1.5 left-4.5 z-0 flex flex-col gap-0.5 rounded border border-[#18122B]/10 bg-white p-0.5 shadow-2xs rotate-[4deg]">
                      <div className="h-0.5 w-2 rounded bg-[#3B82F6]/60" />
                    </div>
                    {/* Mini chat icon */}
                    <div className="absolute -top-1 right-2.5 z-0 h-2.5 w-2.5 rounded-full bg-[#2563EB] border border-white shadow-2xs flex items-center justify-center">
                      <span className="h-0.5 w-0.5 rounded-full bg-white" />
                    </div>
                    <Image
                      src="/landing/icons/icon-track.png"
                      alt="Wallet"
                      width={80}
                      height={80}
                      className="w-full h-full object-contain drop-shadow-md relative z-10"
                    />
                  </div>

                  {/* Category Pills Stack */}
                  {step.stackedPills && (
                    <div className="flex flex-col gap-1 shrink-0">
                      {step.stackedPills.map((pill) => (
                        <div
                          key={pill.label}
                          className="inline-flex items-center gap-1 rounded-full border border-[#18122B]/10 bg-white/95 px-1.5 py-0.5 text-[8.5px] font-bold text-[#18122B] shadow-2xs"
                        >
                          {renderPillIcon(pill.iconType, pill.iconColor)}
                          <span>{pill.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Understand */}
              {step.illustrationType === "understand" && (
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center pointer-events-none transition-transform duration-300 group-hover:scale-105 shrink-0">
                  <Image
                    src="/landing/icons/icon-plan.png"
                    alt="Bar chart"
                    width={90}
                    height={90}
                    className="w-full h-full object-contain drop-shadow-md"
                  />
                  {/* Floating metric chip */}
                  <div className="absolute -bottom-1 -left-1 z-20 flex flex-col items-center justify-center rounded-md border border-[#18122B]/10 bg-white px-1.5 py-0.5 text-[8px] font-black text-[#18122B] shadow-xs leading-tight">
                    <span className="text-[#EA580C]">↑ 18%</span>
                    <span className="text-[#18122B]/60 font-medium text-[7px]">this month</span>
                  </div>
                </div>
              )}

              {/* Step 4: Goals */}
              {step.illustrationType === "goals" && (
                <div className="relative w-16 h-16 sm:w-18 sm:h-18 flex items-center justify-center pointer-events-none transition-transform duration-300 group-hover:scale-105 shrink-0">
                  <Image
                    src="/landing/icons/icon-goals.png"
                    alt="Target with arrow"
                    width={90}
                    height={90}
                    className="w-full h-full object-contain drop-shadow-md"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Bottom Tags / Chips */}
          <div className="mt-2.5 pt-1.5 border-t border-[#18122B]/5 flex flex-wrap items-center gap-1.5">
            {step.tags && step.tags.length > 0 && (
              <div className="inline-flex items-center gap-1.5 text-[9px] font-bold text-[#18122B]/80">
                {step.tags.map((tag, tIdx) => (
                  <span key={tag} className="inline-flex items-center gap-1.5">
                    <span className="rounded-full border border-[#18122B]/10 bg-white/95 px-2 py-0.5 shadow-2xs">
                      {tag}
                    </span>
                    {tIdx < (step.tags?.length ?? 0) - 1 && (
                      <span className="h-1 w-1 rounded-full bg-[#18122B]/30" />
                    )}
                  </span>
                ))}
              </div>
            )}

            {step.chips && step.chips.length > 0 && (
              <div className="inline-flex flex-wrap items-center gap-1.5 rounded-full border border-[#18122B]/10 bg-white/95 px-2 py-0.5 shadow-2xs">
                {step.chips.map((chip) => (
                  <span key={chip.label} className="inline-flex items-center gap-1 text-[9px] font-bold text-[#18122B]">
                    <span
                      className="flex h-2.5 w-2.5 items-center justify-center rounded-full"
                      style={{ backgroundColor: chip.circleColor }}
                    >
                      <svg viewBox="0 0 16 16" fill="currentColor" className="w-1.5 h-1.5 text-white">
                        <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <span>{chip.label}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* CARD BODY: ROW 2 (Steps 5-7)                                          */}
      {/* ===================================================================== */}
      {isRow2 && (
        <div className="flex flex-col justify-between h-full">
          {/* Step 5: Manage Shared Expenses */}
          {step.illustrationType === "shared" && (
            <div className="flex flex-col justify-between h-full">
              <div className="flex items-center gap-3">
                {/* 3D Avatars + Receipt on Left */}
                <div className="relative w-16 h-16 sm:w-18 sm:h-18 flex items-center justify-center shrink-0 pointer-events-none transition-transform duration-300 group-hover:scale-105">
                  <Image
                    src="/landing/icons/icon-household.png"
                    alt="Two avatars"
                    width={90}
                    height={90}
                    className="w-full h-full object-contain drop-shadow-md"
                  />
                  <div className="absolute -bottom-1 -left-1 w-6.5 drop-shadow-xs rotate-[-8deg]">
                    <Image
                      src="/landing/icons/icon-capture.png"
                      alt=""
                      width={32}
                      height={32}
                      className="w-full h-auto object-contain"
                    />
                  </div>
                </div>

                {/* Text on Right */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif text-sm sm:text-base font-black tracking-tight text-[#18122B] leading-tight">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-[11px] sm:text-xs text-[#18122B]/75 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Bottom Tags */}
              <div className="mt-2.5 pt-1.5 border-t border-[#18122B]/5 flex flex-wrap items-center gap-1.5">
                {step.tags && (
                  <div className="inline-flex items-center gap-1.5 text-[9px] font-bold text-[#18122B]/80">
                    {step.tags.map((tag, tIdx) => (
                      <span key={tag} className="inline-flex items-center gap-1.5">
                        <span className="rounded-full border border-[#18122B]/10 bg-white/95 px-2 py-0.5 shadow-2xs">
                          {tag}
                        </span>
                        {tIdx < (step.tags?.length ?? 0) - 1 && (
                          <span className="h-1 w-1 rounded-full bg-[#F43F5E]/40" />
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 6: Get AI Guidance */}
          {step.illustrationType === "ai" && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 h-full my-auto">
              {/* Left: 3D Robot Head + Purple Speech Bubble */}
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center shrink-0 pointer-events-none transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/landing/icons/icon-ai.png"
                  alt="AI Robot"
                  width={85}
                  height={85}
                  className="w-full h-full object-contain drop-shadow-md"
                />
                {/* 3D Purple Speech Bubble */}
                <div className="absolute -bottom-1 -right-1 flex items-center justify-center rounded-lg bg-[#7C3AED] px-1.5 py-1 shadow-xs border border-white">
                  <div className="flex flex-col gap-0.5">
                    <div className="h-0.5 w-3 rounded-full bg-white" />
                    <div className="h-0.5 w-2 rounded-full bg-white/80" />
                  </div>
                </div>
              </div>

              {/* Center: Title & Description */}
              <div className="flex-1 min-w-0 px-1 text-center sm:text-left">
                <h3 className="font-serif text-sm sm:text-base font-black tracking-tight text-[#18122B] leading-tight">
                  {step.title}
                </h3>
                <p className="mt-1 text-[11px] sm:text-xs text-[#18122B]/75 leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Right: Stacked Action Pills */}
              {step.stackedPills && (
                <div className="flex flex-col gap-1 shrink-0">
                  {step.stackedPills.map((pill) => (
                    <div
                      key={pill.label}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#18122B]/10 bg-white/95 px-2 py-0.5 text-[8.5px] font-bold text-[#18122B] shadow-2xs"
                    >
                      {renderPillIcon(pill.iconType, pill.iconColor)}
                      <span>{pill.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 7: Grow Your Financial Life */}
          {step.illustrationType === "grow" && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 h-full my-auto">
              {/* Left: Coin Stacks + Glossy Sprout */}
              <div className="relative w-17 h-16 sm:w-19 sm:h-18 flex items-center justify-center shrink-0 pointer-events-none transition-transform duration-300 group-hover:scale-105">
                <div className="relative h-14 w-16 overflow-visible mx-auto">
                  {/* Left column coins */}
                  <div className="absolute bottom-[2px] left-[2px] w-7.5 z-10">
                    <Image src="/landing/decor/decor-coin-2.png" alt="" width={30} height={30} className="w-full h-auto drop-shadow-2xs" />
                  </div>
                  <div className="absolute bottom-[8px] left-[3px] w-7.5 z-12">
                    <Image src="/landing/decor/decor-coin-2.png" alt="" width={30} height={30} className="w-full h-auto drop-shadow-2xs" />
                  </div>
                  <div className="absolute bottom-[14px] left-[2px] w-7.5 z-14">
                    <Image src="/landing/decor/decor-coin-2.png" alt="" width={30} height={30} className="w-full h-auto drop-shadow-2xs" />
                  </div>
                  <div className="absolute bottom-[20px] left-[3px] w-7.5 z-16">
                    <Image src="/landing/decor/decor-coin-2.png" alt="" width={30} height={30} className="w-full h-auto drop-shadow-2xs" />
                  </div>

                  {/* Right column coins */}
                  <div className="absolute bottom-[0px] right-[2px] w-7.5 z-10">
                    <Image src="/landing/decor/decor-coin-2.png" alt="" width={30} height={30} className="w-full h-auto drop-shadow-2xs" />
                  </div>
                  <div className="absolute bottom-[7px] right-[3px] w-7.5 z-12">
                    <Image src="/landing/decor/decor-coin-2.png" alt="" width={30} height={30} className="w-full h-auto drop-shadow-2xs" />
                  </div>
                  <div className="absolute bottom-[13px] right-[2px] w-7.5 z-14">
                    <Image src="/landing/decor/decor-coin-2.png" alt="" width={30} height={30} className="w-full h-auto drop-shadow-2xs" />
                  </div>
                  <div className="absolute bottom-[19px] right-[3px] w-7.5 z-16">
                    <Image src="/landing/decor/decor-coin-2.png" alt="" width={30} height={30} className="w-full h-auto drop-shadow-2xs" />
                  </div>
                  <div className="absolute bottom-[25px] right-[2px] w-7.5 z-18">
                    <Image src="/landing/decor/decor-coin-2.png" alt="" width={30} height={30} className="w-full h-auto drop-shadow-2xs" />
                  </div>

                  {/* Lush green sprout */}
                  <div className="absolute bottom-[21px] -left-1.5 z-30 pointer-events-none">
                    <svg viewBox="0 0 100 110" fill="none" className="w-10 h-12 drop-shadow-xs overflow-visible">
                      <defs>
                        <linearGradient id={`stemGrad_${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#4ADE80" />
                          <stop offset="100%" stopColor="#15803D" />
                        </linearGradient>
                        <linearGradient id={`leafGrad1_${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#86EFAC" />
                          <stop offset="40%" stopColor="#22C55E" />
                          <stop offset="100%" stopColor="#15803D" />
                        </linearGradient>
                        <linearGradient id={`leafGrad2_${index}`} x1="100%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#BEF264" />
                          <stop offset="40%" stopColor="#4ADE80" />
                          <stop offset="100%" stopColor="#166534" />
                        </linearGradient>
                      </defs>
                      <path d="M 52 102 C 50 82, 46 68, 44 48" stroke={`url(#stemGrad_${index})`} strokeWidth="7" strokeLinecap="round" />
                      <path d="M 44 60 C 18 56, 8 36, 16 22 C 34 26, 42 46, 44 60 Z" fill={`url(#leafGrad1_${index})`} />
                      <path d="M 44 58 Q 28 38, 17 24" stroke="#DCFCE7" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
                      <path d="M 44 50 C 66 42, 82 22, 70 8 C 52 14, 46 34, 44 50 Z" fill={`url(#leafGrad2_${index})`} />
                      <path d="M 44 48 Q 58 28, 68 10" stroke="#FEF08A" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Center: Title & Description */}
              <div className="flex-1 min-w-0 px-1 text-center sm:text-left">
                <h3 className="font-serif text-sm sm:text-base font-black tracking-tight text-[#18122B] leading-tight">
                  {step.title}
                </h3>
                <p className="mt-1 text-[11px] sm:text-xs text-[#18122B]/75 leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Right: Stacked Feature Pills */}
              {step.stackedPills && (
                <div className="flex flex-col gap-1 shrink-0">
                  {step.stackedPills.map((pill) => (
                    <div
                      key={pill.label}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#18122B]/10 bg-white/95 px-2 py-0.5 text-[8.5px] font-bold text-[#18122B] shadow-2xs"
                    >
                      {renderPillIcon(pill.iconType, pill.iconColor)}
                      <span>{pill.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
