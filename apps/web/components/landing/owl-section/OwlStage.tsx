"use client";

import React from "react";
import Image from "next/image";
import { OwlEyes } from "./OwlEyes";
import { FLOATING_DECOR } from "./data";

interface OwlStageProps {
  leftEyeRef?: React.Ref<HTMLDivElement>;
  rightEyeRef?: React.Ref<HTMLDivElement>;
  leftIrisRef?: React.Ref<HTMLDivElement>;
  rightIrisRef?: React.Ref<HTMLDivElement>;
  owlWrapperRef?: React.Ref<HTMLDivElement>;
  hasEntered?: boolean;
}

export function OwlStage({
  leftEyeRef,
  rightEyeRef,
  leftIrisRef,
  rightIrisRef,
  owlWrapperRef,
  hasEntered = true,
}: OwlStageProps = {}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex h-full w-full select-none items-center justify-center">
      {/* CSS Keyframe Animations for Floating 3D Decor & Pop Entrance */}
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
        @keyframes owlPopIn {
          0% {
            opacity: 0;
            transform: translateY(40px) scale(0.85);
          }
          65% {
            transform: translateY(-6px) scale(1.025);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
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
        .anim-owl-entrance {
          animation: owlPopIn 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .anim-float-slow,
          .anim-float-medium,
          .anim-float-fast,
          .anim-owl-entrance {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>

      {/* Central Owl & Podium Stage */}
      <div className="relative flex h-full w-full items-center justify-center">
        
        {/* Soft Radial Ambient Warm Glow centered behind the owl */}
        <div
          className="absolute z-0 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.95)_0%,rgba(254,249,235,0.6)_45%,transparent_75%)] blur-2xl pointer-events-none"
          style={{
            left: "50%",
            top: "580px",
            width: "600px",
            height: "450px",
            transform: "translate(-50%, -50%)",
          }}
          aria-hidden="true"
        />

        {/* 3D Cream Pedestal / Cylindrical Podium */}
        <div
          className={`absolute z-5 flex items-center justify-center transition-all duration-700 ease-out pointer-events-none ${
            hasEntered ? "opacity-100 scale-100" : "opacity-0 scale-90"
          }`}
          style={{
            left: "50%",
            top: "755px",
            width: "460px",
            height: "95px",
            transform: "translateX(-50%)",
          }}
          aria-hidden="true"
        >
          {/* Deep Diffuse Ground Drop Shadow */}
          <div className="absolute inset-0 rounded-[100%] bg-[#18122B]/10 blur-xl translate-y-6 scale-110" />

          {/* Cylindrical Pedestal Base */}
          <div className="absolute inset-0 rounded-[100%] border border-[#E0D3BC] bg-gradient-to-b from-[#EFE3CF] to-[#E3D4BC] shadow-[0_12px_24px_rgba(24,18,43,0.07)] translate-y-3" />

          {/* Pedestal Top Surface */}
          <div className="absolute inset-0 rounded-[100%] border border-[#EADBCE] bg-gradient-to-b from-[#FDFBF7] to-[#F3E9D9] shadow-inner" />
          
          {/* Concentric Inner Surface Inset Ring */}
          <div className="absolute inset-x-5 inset-y-1 rounded-[100%] border border-[#EFE5D4]/80" />
        </div>

        {/* Central Layered Owl Mascot Character with Animated Eyes & Head Tilt */}
        <div
          className="absolute z-10 pointer-events-auto"
          style={{
            left: "50%",
            top: "324px",
            width: "384px",
            height: "452px",
            transform: "translateX(-50%)",
          }}
        >
          <div className={hasEntered ? "anim-owl-entrance w-full h-full" : "opacity-0 w-full h-full"}>
            <div
              ref={owlWrapperRef}
              className="w-full h-full will-change-transform"
              style={{
                transformStyle: "preserve-3d",
              }}
            >
              <OwlEyes
                className="w-full h-full"
                priority
                leftEyeRef={leftEyeRef}
                rightEyeRef={rightEyeRef}
                leftIrisRef={leftIrisRef}
                rightIrisRef={rightIrisRef}
              />
            </div>
          </div>
        </div>

        {/* Floating 3D Decor Objects with Independent Animations & Depth Parallax */}
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
              className={`absolute pointer-events-none select-none z-15 transition-opacity duration-700 ${
                hasEntered ? "opacity-100" : "opacity-0"
              }`}
              style={{
                left: decor.style.left,
                top: decor.style.top,
                width: decor.style.width,
                transform: `translate3d(calc(var(--decor-parallax-x, 0px) * ${decor.depth}), calc(var(--decor-parallax-y, 0px) * ${decor.depth}), 0)`,
              }}
              data-owl-decor-depth={decor.depth}
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
