"use client";

import Image from "next/image";
import { OWL_FEATURE_CARDS } from "./data";
import { FeatureCard } from "./FeatureCard";
import { ConnectorLines } from "./ConnectorLines";
import { OwlStage } from "./OwlStage";
import { OWL_ASSETS } from "@/lib/owlAssets";

export function OwlSection() {
  return (
    <section
      id="problem"
      className="relative w-full border-t border-[#E5DAC4] bg-[#FAF8F5] py-8 sm:py-12 lg:py-16 overflow-hidden"
    >
      <div className="mx-auto w-full max-w-[1672px] px-4 sm:px-6 lg:px-8">
        
        {/* ========================================================================= */}
        {/* DESKTOP LAYOUT (lg: >= 1024px) — Exact 1672 / 941 Stage Coordinate System */}
        {/* ========================================================================= */}
        <div className="hidden lg:block relative w-full aspect-[1672/941] max-w-[1672px] mx-auto overflow-visible select-none">
          
          {/* 1. SVG Connectors Loop */}
          <ConnectorLines />

          {/* 2. Central 3D Podium & Owl Character Stage */}
          <OwlStage />

          {/* 3. 7 Feature Cards Positioned at Strict Coordinates */}
          {OWL_FEATURE_CARDS.map((card) => (
            <FeatureCard key={card.id} card={card} isAbsolute={true} />
          ))}

        </div>

        {/* ========================================================================= */}
        {/* MOBILE & TABLET RESPONSIVE FALLBACK (< 1024px)                            */}
        {/* ========================================================================= */}
        <div className="lg:hidden flex flex-col gap-6 items-center w-full">
          
          {/* Centered Owl Showcase Card */}
          <div className="relative w-full max-w-sm rounded-3xl border border-[#18122B]/15 bg-[#F2E5CB] p-6 shadow-sm flex flex-col items-center text-center overflow-hidden">
            <div className="relative w-44 h-44 mb-2 flex items-center justify-center">
              <Image
                src={OWL_ASSETS.owl.original}
                alt="FinSage AI Owl Mascot"
                width={200}
                height={200}
                className="object-contain drop-shadow-md"
              />
            </div>
            <span className="font-mono text-[11px] font-black uppercase tracking-wider text-[#18122B]/60">
              AI WEALTH INTELLIGENCE
            </span>
            <h3 className="font-serif text-2xl font-black text-[#18122B] mt-1">
              Your Financial Copilot
            </h3>
            <p className="font-sans text-xs text-[#18122B]/75 mt-1.5 leading-relaxed max-w-xs">
              Continuous intelligence connecting your receipts, spending velocity, goals, and multi-agent financial guidance.
            </p>
          </div>

          {/* 7 Feature Cards in Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {OWL_FEATURE_CARDS.map((card) => (
              <div key={card.id} className="min-h-[140px]">
                <FeatureCard card={card} isAbsolute={false} />
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
