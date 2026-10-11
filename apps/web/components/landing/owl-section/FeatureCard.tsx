"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { OwlFeatureCardData } from "./data";

interface FeatureCardProps {
  readonly card: OwlFeatureCardData;
  readonly isAbsolute?: boolean;
  readonly index?: number;
  readonly hasEntered?: boolean;
  readonly onOpenModal?: (card: OwlFeatureCardData, triggerEl: HTMLElement | null) => void;
}

export function FeatureCard({
  card,
  isAbsolute = true,
  index = 0,
  hasEntered = true,
  onOpenModal,
}: FeatureCardProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const containerStyle = isAbsolute
    ? {
        left: card.position.left,
        top: card.position.top,
        width: card.position.width,
        height: card.position.height,
        transition: "opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1), transform 0.75s cubic-bezier(0.16, 1, 0.3, 1)",
        transitionDelay: `${index * 75 + 150}ms`,
        opacity: hasEntered ? 1 : 0,
        transform: hasEntered ? "translateY(0)" : "translateY(24px)",
      }
    : undefined;

  const handleOpen = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (onOpenModal) {
      onOpenModal(card, buttonRef.current || cardRef.current);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      handleOpen(e);
    }
  };

  const cardInner = (
    <div
      ref={cardRef}
      tabIndex={0}
      role="button"
      aria-label={`${card.title}: ${card.body}. Press Enter to view details.`}
      onClick={() => handleOpen()}
      onKeyDown={handleKeyDown}
      className={`group relative flex h-full w-full cursor-pointer select-none items-center rounded-[24px] lg:rounded-[28px] border ${card.borderColor} ${card.cardGradient} p-3.5 sm:p-4 shadow-[0_4px_20px_rgba(24,18,43,0.04)] transition-all duration-300 ease-out hover:-translate-y-[4px] hover:shadow-[0_16px_36px_rgba(24,18,43,0.10)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84cc16] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF8F5] motion-reduce:transition-none motion-reduce:transform-none`}
    >
      {/* LEFT COLUMN: 3D Icon with soft colored glow backdrop */}
      <div className="relative flex shrink-0 items-center justify-center pr-3 sm:pr-3.5">
        {/* Soft Colored Radial Ambient Glow */}
        <div
          className={`absolute inset-0 -m-2 rounded-full ${card.glowColor} blur-md transition-opacity duration-300 group-hover:opacity-100 opacity-80`}
          aria-hidden="true"
        />

        {/* 3D Icon Asset */}
        <div className="relative flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:scale-105 motion-reduce:transform-none">
          <Image
            src={card.iconPath}
            alt=""
            width={64}
            height={64}
            className="h-full w-full object-contain drop-shadow-[0_3px_6px_rgba(0,0,0,0.08)]"
          />
        </div>
      </div>

      {/* RIGHT COLUMN: Title, Body Text, and Bottom-Right Circular Button */}
      <div className="flex flex-1 flex-col justify-center min-w-0 pr-7 sm:pr-8">
        <h3 className="font-serif font-black tracking-tight text-[#18122B] text-base sm:text-[17.5px] leading-tight group-hover:text-[#0C1829]">
          {card.title}
        </h3>
        <p className="mt-1 font-sans font-normal leading-snug text-[#18122B]/75 text-xs sm:text-[13px]">
          {card.body}
        </p>
      </div>

      {/* Solid Round Accent Arrow Button at Bottom-Right */}
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Open details for ${card.title}`}
        onClick={(e) => handleOpen(e)}
        className={`absolute bottom-3 right-3 sm:bottom-3.5 sm:right-3.5 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full ${card.buttonBg} text-white shadow-xs transition-transform duration-200 ease-out hover:scale-110 active:scale-95 group-hover:translate-x-0.5 group-hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white motion-reduce:transform-none`}
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </button>
    </div>
  );

  if (isAbsolute) {
    return (
      <div
        className="absolute z-20 transition-all duration-300 motion-reduce:opacity-100 motion-reduce:transform-none"
        style={containerStyle}
        data-owl-card="true"
        data-card-id={card.id}
      >
        {cardInner}
      </div>
    );
  }

  return (
    <div
      className="h-full w-full"
      data-owl-card="true"
      data-card-id={card.id}
    >
      {cardInner}
    </div>
  );
}
