"use client";

import Image from "next/image";
import { OWL_ASSETS } from "@/lib/owlAssets";
import { FLOATING_DECOR } from "./data";

export function OwlStage() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex h-full w-full select-none items-center justify-center">
      {/* CSS Keyframe Animations for Floating 3D Decor */}
      <style jsx>{`
        @keyframes owlFloatSlow {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-8px) rotate(2deg);
          }
        }
        @keyframes owlFloatMedium {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-10px) rotate(-3deg);
          }
        }
        @keyframes owlFloatFast {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-7px) rotate(1.5deg);
          }
        }
        .anim-float-slow {
          animation: owlFloatSlow 5.8s ease-in-out infinite;
        }
        .anim-float-medium {
          animation: owlFloatMedium 4.6s ease-in-out infinite;
        }
        .anim-float-fast {
          animation: owlFloatFast 4.0s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .anim-float-slow,
          .anim-float-medium,
          .anim-float-fast {
            animation: none !important;
          }
        }
      `}</style>

      {/* Central Owl & Podium Stage */}
      <div className="relative flex h-full w-full items-center justify-center">
        
        {/* Soft Radial Ambient Warm Glow centered behind the owl */}
        <div
          className="absolute z-0 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.95)_0%,rgba(254,249,235,0.6)_40%,transparent_75%)] blur-2xl pointer-events-none"
          style={{
            left: "50%",
            top: "50%",
            width: "38%",
            height: "46%",
            transform: "translate(-50%, -50%)",
          }}
          aria-hidden="true"
        />

        {/* 3D Cream Pedestal / Cylindrical Podium (Matching reference) */}
        <div
          className="absolute z-5 flex items-center justify-center"
          style={{
            left: "50%",
            top: "84.5%",
            width: "27%",
            height: "9%",
            transform: "translate(-50%, -50%)",
          }}
          aria-hidden="true"
        >
          {/* Deep Diffuse Ground Drop Shadow */}
          <div className="absolute inset-0 rounded-[100%] bg-[#18122B]/10 blur-xl translate-y-4 scale-110" />

          {/* Cylindrical Pedestal Base */}
          <div className="absolute inset-0 rounded-[100%] border border-[#E0D3BC] bg-gradient-to-b from-[#EFE3CF] to-[#E3D4BC] shadow-[0_10px_20px_rgba(24,18,43,0.06)] translate-y-2.5" />

          {/* Pedestal Top Surface */}
          <div className="absolute inset-0 rounded-[100%] border border-[#EADBCE] bg-gradient-to-b from-[#FDFBF7] to-[#F3E9D9] shadow-inner" />
          
          {/* Concentric Inner Surface Inset Ring */}
          <div className="absolute inset-x-3 inset-y-0.5 rounded-[100%] border border-[#EFE5D4]/80" />
        </div>

        {/* Central Static Owl Mascot Character */}
        <div
          className="relative z-10 flex items-center justify-center"
          style={{
            left: "50%",
            top: "54%",
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
            className="h-auto w-full object-contain drop-shadow-[0_16px_28px_rgba(24,18,43,0.14)]"
          />
        </div>

        {/* Floating 3D Decor Objects with Independent Animations */}
        {FLOATING_DECOR.map((decor) => {
          const animClass =
            decor.animType === "slow"
              ? "anim-float-slow"
              : decor.animType === "medium"
              ? "anim-float-medium"
              : "anim-float-fast";

          return (
            <div
              key={decor.id}
              className="absolute pointer-events-none select-none z-15"
              style={{
                left: decor.style.left,
                top: decor.style.top,
                width: decor.style.width,
              }}
              aria-hidden="true"
            >
              <div
                className={`w-full ${animClass}`}
                style={{
                  transform: decor.style.transform,
                  animationDelay: decor.animDelay,
                }}
              >
                <Image
                  src={decor.imagePath}
                  alt=""
                  width={decor.width}
                  height={decor.height}
                  className="h-auto w-full object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.08)]"
                />
              </div>
            </div>
          );
        })}

      </div>
    </div>
  );
}
