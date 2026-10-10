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
      className="relative w-full border-t border-[#E5DAC4] bg-[#FAF8F3] py-8 sm:py-12 lg:py-14 overflow-hidden"
    >
      {/* Background Faint Radial Warm Ambient Glow behind the entire center section */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(255,255,255,0.9)_0%,rgba(250,248,243,0)_75%)] select-none"
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-[1672px] px-4 sm:px-6 lg:px-8">
        
        {/* ========================================================================= */}
        {/* DESKTOP LAYOUT (lg: >= 1024px) — Container Query Inline-Size Stage        */}
        {/* ========================================================================= */}
        <div
          className="hidden lg:block relative w-full aspect-[1672/941] max-w-[1672px] mx-auto overflow-visible select-none [container-type:inline-size]"
        >
          {/* 1. SVG Connectors Loop */}
          <ConnectorLines />

          {/* 2. Central 3D Podium & Owl Character Stage */}
          <OwlStage />

          {/* 3. 7 Feature Cards Positioned at Strict Coordinates with Tints */}
          {OWL_FEATURE_CARDS.map((card) => (
            <FeatureCard key={card.id} card={card} isAbsolute={true} />
          ))}
        </div>

        {/* ========================================================================= */}
        {/* MOBILE & TABLET RESPONSIVE FALLBACK (< 1024px)                            */}
        {/* ========================================================================= */}
        <div className="lg:hidden flex flex-col gap-6 items-center w-full">
          
          {/* Centered Owl Showcase Card */}
          <div className="relative w-full max-w-sm rounded-[28px] border border-[#18122B]/15 bg-gradient-to-b from-[#FFFDF9] to-[#F5ECE0] p-6 shadow-sm flex flex-col items-center text-center overflow-hidden">
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
