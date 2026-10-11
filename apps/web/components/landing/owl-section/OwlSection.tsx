"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { OWL_FEATURE_CARDS, OwlFeatureCardData } from "./data";
import { FeatureCard } from "./FeatureCard";
import { FeatureModal } from "./FeatureModal";
import { ConnectorLines } from "./ConnectorLines";
import { OwlStage } from "./OwlStage";
import { OwlEyes } from "./OwlEyes";
import { useGaze } from "./useGaze";
import { OWL_ASSETS } from "@/lib/owlAssets";

export function OwlSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const desktopContainerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  
  // Desktop Eye & Mascot Refs
  const leftEyeRef = useRef<HTMLDivElement>(null);
  const rightEyeRef = useRef<HTMLDivElement>(null);
  const leftIrisRef = useRef<HTMLDivElement>(null);
  const rightIrisRef = useRef<HTMLDivElement>(null);
  const owlWrapperRef = useRef<HTMLDivElement>(null);

  // Mobile/Tablet Eye & Mascot Refs
  const mobileLeftEyeRef = useRef<HTMLDivElement>(null);
  const mobileRightEyeRef = useRef<HTMLDivElement>(null);
  const mobileLeftIrisRef = useRef<HTMLDivElement>(null);
  const mobileRightIrisRef = useRef<HTMLDivElement>(null);
  const mobileOwlWrapperRef = useRef<HTMLDivElement>(null);

  // Play entrance animation once when section intersects viewport
  const [hasEntered, setHasEntered] = useState(false);

  // Modal Dialog / Bottom Sheet State
  const [selectedCard, setSelectedCard] = useState<OwlFeatureCardData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const modalTriggerRef = useRef<HTMLElement | null>(null);

  const handleOpenModal = useCallback((card: OwlFeatureCardData, triggerEl: HTMLElement | null) => {
    modalTriggerRef.current = triggerEl;
    setSelectedCard(card);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Desktop Scaled Canvas ResizeObserver
  useEffect(() => {
    const el = desktopContainerRef.current;
    if (!el) return;

    const updateScale = () => {
      const width = el.clientWidth;
      const clamped = Math.min(width, 1672);
      setScale(clamped / 1672);
    };

    updateScale();
    const ro = new ResizeObserver(() => {
      updateScale();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setHasEntered(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Wire up gaze tracking across desktop & mobile stages with rAF loop, head tilt, and depth parallax
  // Pauses idle glances while feature modal is open
  useGaze({
    sectionRef,
    leftEyeRef,
    rightEyeRef,
    leftIrisRef,
    rightIrisRef,
    owlWrapperRef,
    mobileLeftEyeRef,
    mobileRightEyeRef,
    mobileLeftIrisRef,
    mobileRightIrisRef,
    mobileOwlWrapperRef,
    isPaused: isModalOpen,
  });

  return (
    <section
      id="showcase"
      ref={sectionRef}
      className="relative w-full border-t border-[#E5DAC4] bg-[#FAF8F3] py-12 lg:py-16 overflow-hidden"
    >
      {/* Anchors for navbar links */}
      <div id="features" className="absolute -top-20" aria-hidden="true" />
      <div id="problem" className="absolute -top-20" aria-hidden="true" />

      {/* Background Faint Radial Warm Ambient Glow behind the entire center section */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(255,255,255,0.9)_0%,rgba(250,248,243,0)_75%)] select-none"
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-[1672px] px-4 sm:px-6 lg:px-8">
        
        {/* ========================================================================= */}
        {/* DESKTOP LAYOUT (lg: >= 1024px) — Scaled 1672x941 Fixed Design Canvas       */}
        {/* ========================================================================= */}
        <div
          ref={desktopContainerRef}
          className="hidden lg:block relative w-full max-w-[1672px] mx-auto overflow-hidden select-none"
          style={{
            height: `${941 * scale}px`,
          }}
        >
          <div
            className="absolute top-0 left-0 origin-top-left"
            style={{
              width: "1672px",
              height: "941px",
              transform: `scale(${scale})`,
            }}
          >
            {/* 1. SVG Connectors Loop with Draw-in Entrance */}
            <ConnectorLines hasEntered={hasEntered} />

            {/* 2. Central 3D Podium & Owl Character Stage with Head Tilt & Depth Parallax */}
            <OwlStage
              leftEyeRef={leftEyeRef}
              rightEyeRef={rightEyeRef}
              leftIrisRef={leftIrisRef}
              rightIrisRef={rightIrisRef}
              owlWrapperRef={owlWrapperRef}
              hasEntered={hasEntered}
            />

            {/* 3. 7 Feature Cards Positioned at Strict Coordinates with Staggered Entrance */}
            {OWL_FEATURE_CARDS.map((card, idx) => (
              <FeatureCard
                key={card.id}
                card={card}
                isAbsolute={true}
                index={idx}
                hasEntered={hasEntered}
                onOpenModal={handleOpenModal}
              />
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MOBILE (<640px) & TABLET (640-1023px) RESPONSIVE STACKED LAYOUT           */}
        {/* ========================================================================= */}
        <div className="lg:hidden flex flex-col items-center w-full max-w-4xl mx-auto gap-8 sm:gap-10">
          
          {/* 1. Centered Owl & Podium Stage */}
          <div className="relative w-[65%] sm:w-[50%] max-w-[360px] aspect-[1156/1361] mx-auto select-none flex items-center justify-center">
            {/* CSS float animations */}
            <style jsx>{`
              @keyframes owlFloatSlowM {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-6px) rotate(2deg); }
              }
              @keyframes owlFloatMediumM {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-7px) rotate(-3deg); }
              }
              @keyframes owlFloatFastM {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-5px) rotate(1.5deg); }
              }
              .anim-float-slow-m { animation: owlFloatSlowM 5.8s ease-in-out infinite; }
              .anim-float-med-m { animation: owlFloatMediumM 4.6s ease-in-out infinite; }
              .anim-float-fast-m { animation: owlFloatFastM 4.0s ease-in-out infinite; }
              @media (prefers-reduced-motion: reduce) {
                .anim-float-slow-m, .anim-float-med-m, .anim-float-fast-m {
                  animation: none !important;
                }
              }
            `}</style>

            {/* Soft Ambient Radial Warm Glow */}
            <div
              className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.95)_0%,rgba(254,249,235,0.6)_45%,transparent_75%)] blur-xl pointer-events-none"
              aria-hidden="true"
            />

            {/* 3D Cream Pedestal / Cylindrical Podium */}
            <div
              className="absolute z-5 flex items-center justify-center pointer-events-none"
              style={{
                left: "50%",
                top: "88%",
                width: "90%",
                height: "20%",
                transform: "translate(-50%, -50%)",
              }}
              aria-hidden="true"
            >
              <div className="absolute inset-0 rounded-[100%] bg-[#18122B]/10 blur-lg translate-y-3 scale-105" />
              <div className="absolute inset-0 rounded-[100%] border border-[#E0D3BC] bg-gradient-to-b from-[#EFE3CF] to-[#E3D4BC] shadow-[0_8px_16px_rgba(24,18,43,0.06)] translate-y-2" />
              <div className="absolute inset-0 rounded-[100%] border border-[#EADBCE] bg-gradient-to-b from-[#FDFBF7] to-[#F3E9D9] shadow-inner" />
              <div className="absolute inset-x-2 inset-y-0.5 rounded-[100%] border border-[#EFE5D4]/80" />
            </div>

            {/* Mobile/Tablet Interactive Owl Character with Head Tilt */}
            <div
              ref={mobileOwlWrapperRef}
              className="relative z-10 w-[84%] flex items-center justify-center will-change-transform pointer-events-auto -translate-y-2"
              style={{ transformStyle: "preserve-3d" }}
            >
              <OwlEyes
                className="w-full"
                priority
                leftEyeRef={mobileLeftEyeRef}
                rightEyeRef={mobileRightEyeRef}
                leftIrisRef={mobileLeftIrisRef}
                rightIrisRef={mobileRightIrisRef}
              />
            </div>

            {/* Reduced Floating Decor: 3-4 items on Tablet, 2-3 items on Mobile */}
            <div
              className="absolute -left-2 top-4 w-10 sm:w-12 pointer-events-none select-none z-15 anim-float-slow-m"
              aria-hidden="true"
            >
              <Image src={OWL_ASSETS.decor.chart} alt="" width={48} height={48} className="w-full h-auto object-contain drop-shadow-sm" />
            </div>

            <div
              className="absolute -right-2 top-6 w-10 sm:w-12 pointer-events-none select-none z-15 anim-float-med-m"
              aria-hidden="true"
            >
              <Image src={OWL_ASSETS.decor.pie} alt="" width={48} height={48} className="w-full h-auto object-contain drop-shadow-sm" />
            </div>

            <div
              className="absolute -left-1 bottom-10 w-8 sm:w-10 pointer-events-none select-none z-15 anim-float-fast-m"
              aria-hidden="true"
            >
              <Image src={OWL_ASSETS.decor.coin2} alt="" width={40} height={40} className="w-full h-auto object-contain drop-shadow-sm" />
            </div>

            <div
              className="hidden sm:block absolute -right-3 bottom-12 w-10 pointer-events-none select-none z-15 anim-float-slow-m"
              aria-hidden="true"
            >
              <Image src={OWL_ASSETS.decor.card} alt="" width={44} height={44} className="w-full h-auto object-contain drop-shadow-sm" />
            </div>
          </div>

          {/* 2. 7 Feature Cards Grid: 1-col on Mobile (<640px), 2-col on Tablet (640-1023px) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 w-full">
            {OWL_FEATURE_CARDS.map((card, idx) => (
              <div key={`mobile-${card.id}`} className="w-full min-h-[96px] sm:min-h-[110px]">
                <FeatureCard
                  card={card}
                  isAbsolute={false}
                  index={idx}
                  hasEntered={hasEntered}
                  onOpenModal={handleOpenModal}
                />
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* Feature Details Modal Dialog / Bottom Sheet Portal */}
      <FeatureModal
        card={selectedCard}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        triggerRef={modalTriggerRef}
      />
    </section>
  );
}
