"use client";

import { BenefitItem, BENEFITS_BAR_ITEMS } from "./data";

interface BenefitsBarProps {
  hasEntered?: boolean;
}

function renderBenefitIcon(type: BenefitItem["iconType"]) {
  switch (type) {
    case "bars":
      return (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0">
          <rect x="3" y="14" width="4" height="7" rx="1.5" fill="#16A34A" />
          <rect x="10" y="8" width="4" height="13" rx="1.5" fill="#16A34A" />
          <rect x="17" y="3" width="4" height="18" rx="1.5" fill="#22C55E" />
        </svg>
      );
    case "shield":
      return (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0">
          <path
            d="M12 2L4 5.5V11.5C4 16.5 7.5 21 12 22C16.5 21 20 16.5 20 11.5V5.5L12 2Z"
            fill="#7C3AED"
          />
          <path
            d="M8.5 11.5L11 14L15.5 9.5"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "bolt":
      return (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0">
          <path
            d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
            fill="#EA580C"
          />
        </svg>
      );
    case "leaf":
      return (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 shrink-0">
          <path
            d="M20.5 3.5C13.5 3.5 6 9 6 16C6 18.5 7.5 20.5 10 20.5C17 20.5 22.5 13 22.5 6C22.5 4.6 21.9 3.5 20.5 3.5Z"
            fill="#65A30D"
          />
          <path
            d="M6 16C10 14 14 11 17 7"
            stroke="#D9F99D"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M3 21C4.5 19.5 6 18 8 17"
            stroke="#65A30D"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

export function BenefitsBar({ hasEntered = true }: BenefitsBarProps) {
  const enterStyle = {
    transition: "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s",
    opacity: hasEntered ? 1 : 0,
    transform: hasEntered ? "translateY(0)" : "translateY(8px)",
  };

  return (
    <div
      style={enterStyle}
      className="w-full max-w-4xl xl:max-w-5xl mx-auto my-3.5 lg:my-5 rounded-2xl lg:rounded-full border border-[#E5DAC4]/80 bg-white/95 px-5 py-2.5 sm:px-7 sm:py-3 shadow-[0_8px_25px_rgba(24,18,43,0.04)] backdrop-blur-md select-none"
    >
      {/* Desktop & Tablet: 4 items in a row with thin vertical dividers */}
      <div className="hidden sm:flex items-center justify-between divide-x divide-[#E5DAC4]/60">
        {BENEFITS_BAR_ITEMS.map((item) => (
          <div key={item.id} className="flex items-center gap-3 px-3.5 lg:px-5 first:pl-0 last:pr-0">
            {renderBenefitIcon(item.iconType)}
            <div className="text-left">
              <div className="font-sans text-xs lg:text-[13px] font-black text-[#18122B] leading-tight">
                {item.title}
              </div>
              <div className="font-sans text-[10px] lg:text-[11px] text-[#18122B]/60 font-medium mt-0.5 whitespace-nowrap">
                {item.subtitle}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: 2x2 grid */}
      <div className="grid grid-cols-2 gap-2.5 sm:hidden divide-y divide-[#E5DAC4]/40">
        {BENEFITS_BAR_ITEMS.map((item, idx) => (
          <div key={item.id} className={`flex items-center gap-2.5 ${idx >= 2 ? "pt-2.5" : ""}`}>
            {renderBenefitIcon(item.iconType)}
            <div className="text-left">
              <div className="font-sans text-[11px] font-bold text-[#18122B] leading-tight">
                {item.title}
              </div>
              <div className="font-sans text-[9px] text-[#18122B]/60">
                {item.subtitle}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
