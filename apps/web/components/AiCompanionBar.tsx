"use client";

import Link from "next/link";

interface AiCompanionBarProps {
  customPrompt?: string;
}

export function AiCompanionBar({ customPrompt }: AiCompanionBarProps) {
  return (
    <Link
      href="/advisor"
      className="group relative flex items-center justify-between gap-3 overflow-hidden rounded-xl border border-[#E5DAC4] bg-[#FFFDF8] py-2 px-3 sm:px-4 shadow-sm transition-all duration-200 hover:border-[#84cc16] hover:bg-white hover:shadow hover:-translate-y-0.5"
    >
      {/* Left: Robot companion & teaser */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* Minimal friendly robot face */}
        <div className="relative flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-[#18122B] shadow-inner transition-transform duration-200 group-hover:scale-105">
          {/* Antenna */}
          <span className="absolute -top-1 h-1 w-0.5 bg-[#84cc16] rounded-full" />
          {/* Eyes */}
          <div className="flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-[#84cc16] shadow-[0_0_4px_#84cc16]" />
            <span className="h-1 w-1 rounded-full bg-[#84cc16] shadow-[0_0_4px_#84cc16]" />
          </div>
          {/* Mouth */}
          <span className="absolute bottom-1.5 h-0.5 w-2 rounded-full bg-white/40 group-hover:bg-[#84cc16]/70 transition-colors" />
        </div>

        {/* Companion Copy */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <span className="font-serif text-xs font-bold text-[#18122B] shrink-0">FinSage AI</span>
          <span className="h-1 w-1 rounded-full bg-[#84cc16] animate-pulse shrink-0" />
          <span className="text-[#18122B]/30 hidden sm:inline shrink-0">•</span>
          <p className="text-xs font-medium text-[#18122B]/85 group-hover:text-[#18122B] transition-colors truncate hidden sm:block">
            {customPrompt || '"Your money has something to say."'}
          </p>
        </div>
      </div>

      {/* Right: Interactive CTA */}
      <div className="flex items-center gap-1 shrink-0 rounded-full bg-[#84cc16]/20 px-2.5 py-1 text-[11px] font-black text-[#3f6212] transition-all group-hover:bg-[#84cc16] group-hover:text-[#18122B]">
        <span>Ask FinSage</span>
        <span className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
      </div>
    </Link>
  );
}
