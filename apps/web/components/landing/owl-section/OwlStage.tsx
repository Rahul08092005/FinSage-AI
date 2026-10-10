"use client";

import Image from "next/image";
import { OWL_ASSETS } from "@/lib/owlAssets";
import { FLOATING_DECOR } from "./data";

export function OwlStage() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex h-full w-full select-none items-center justify-center">
      {/* Central Owl & Podium Stage */}
      <div className="relative flex h-full w-full items-center justify-center">
        
        {/* CSS Elliptical 3D Podium */}
        <div
          className="absolute z-0 flex items-center justify-center"
          style={{
            left: "50%",
            top: "69%",
            width: "28%",
            height: "9%",
            transform: "translate(-50%, -50%)",
          }}
        >
          {/* Outer Ambient Glow / Ground Shadow */}
          <div className="absolute inset-0 rounded-[100%] bg-[#18122B]/10 blur-md translate-y-3 scale-105" />

          {/* Bottom Podium Step Rim */}
          <div className="absolute inset-0 rounded-[100%] border border-[#CBBBA0] bg-[#E3D3B6] shadow-[0_8px_16px_rgba(24,18,43,0.06)] translate-y-1.5" />

          {/* Top Podium Step Surface */}
          <div className="absolute inset-0 rounded-[100%] border border-[#DDD0B7] bg-gradient-to-b from-[#FAF6ED] to-[#EFE5D0] shadow-inner" />
          
          {/* Subtle concentric inner podium ring */}
          <div className="absolute inset-x-4 inset-y-1 rounded-[100%] border border-[#E2D6C0]/70" />
        </div>

        {/* Central Static Owl Character */}
        <div
          className="relative z-10 flex items-center justify-center"
          style={{
            left: "50%",
            top: "48%",
            width: "24%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <Image
            src={OWL_ASSETS.owl.original}
            alt="FinSage AI Owl Mascot"
            width={OWL_ASSETS.owl.naturalDimensions.width}
            height={OWL_ASSETS.owl.naturalDimensions.height}
            priority
            className="h-auto w-full object-contain drop-shadow-[0_12px_24px_rgba(24,18,43,0.12)]"
          />
        </div>

        {/* Floating Decor Items */}
        {FLOATING_DECOR.map((decor) => (
          <div
            key={decor.id}
            className="absolute transition-transform duration-500 hover:scale-110"
            style={{
              left: decor.style.left,
              top: decor.style.top,
              width: decor.style.width,
              transform: decor.style.transform,
              zIndex: decor.style.zIndex ?? 15,
            }}
          >
            <Image
              src={decor.imagePath}
              alt="Floating 3D Decor Object"
              width={decor.width}
              height={decor.height}
              className="h-auto w-full object-contain drop-shadow-md"
            />
          </div>
        ))}

      </div>
    </div>
  );
}
