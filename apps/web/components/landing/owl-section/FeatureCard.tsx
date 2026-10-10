"use client";

import Image from "next/image";
import Link from "next/link";
import { OwlFeatureCardData } from "./data";

interface FeatureCardProps {
  readonly card: OwlFeatureCardData;
  readonly isAbsolute?: boolean;
}

export function FeatureCard({ card, isAbsolute = true }: FeatureCardProps) {
  const containerStyle = isAbsolute
    ? {
        left: card.position.left,
        top: card.position.top,
        width: card.position.width,
        height: card.position.height,
      }
    : undefined;

  const cardInner = (
    <div
      className={`group relative flex h-full w-full items-center rounded-[24px] lg:rounded-[28px] border ${card.borderColor} ${card.cardGradient} p-3 sm:p-3.5 xl:p-4 shadow-[0_4px_20px_rgba(24,18,43,0.04)] transition-all duration-300 ease-out hover:-translate-y-[4px] hover:shadow-[0_16px_36px_rgba(24,18,43,0.10)] motion-reduce:transition-none motion-reduce:transform-none`}
    >
      {/* LEFT COLUMN: 3D Icon with soft colored glow backdrop */}
      <div className="relative flex shrink-0 items-center justify-center pr-2.5 sm:pr-3">
        {/* Soft Colored Radial Ambient Glow */}
        <div
          className={`absolute inset-0 -m-2 rounded-full ${card.glowColor} blur-md transition-opacity duration-300 group-hover:opacity-100 opacity-80`}
          aria-hidden="true"
        />

        {/* 3D Icon Asset */}
        <div className="relative flex h-11 w-11 sm:h-13 sm:w-13 xl:h-15 xl:w-15 shrink-0 items-center justify-center transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:scale-105 motion-reduce:transform-none">
          <Image
            src={card.iconPath}
            alt=""
            width={60}
            height={60}
            className="h-full w-full object-contain drop-shadow-[0_3px_6px_rgba(0,0,0,0.08)]"
          />
        </div>
      </div>

      {/* RIGHT COLUMN: Title, Body Text, and Bottom-Right Circular Button */}
      <div className="flex flex-1 flex-col justify-center min-w-0 pr-6 sm:pr-7 xl:pr-8">
        <h3
          className="font-serif font-black tracking-tight text-[#18122B] leading-tight group-hover:text-[#0C1829]"
          style={{ fontSize: "clamp(13px, 1.02cqw, 17.5px)" }}
        >
          {card.title}
        </h3>
        <p
          className="mt-0.5 font-sans font-normal leading-snug text-[#18122B]/70 line-clamp-2"
          style={{ fontSize: "clamp(9.5px, 0.72cqw, 12px)" }}
        >
          {card.body}
        </p>
      </div>

      {/* Solid Round Accent Arrow Button at Bottom-Right */}
      <div
        className={`absolute bottom-3 right-3 sm:bottom-3.5 sm:right-3.5 flex h-6 w-6 sm:h-7 sm:w-7 xl:h-7.5 xl:w-7.5 items-center justify-center rounded-full ${card.buttonBg} text-white shadow-xs transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:scale-105 motion-reduce:transform-none`}
        aria-hidden="true"
      >
        <svg
          className="h-3 w-3 sm:h-3.5 sm:w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </div>
    </div>
  );

  if (isAbsolute) {
    return (
      <div
        className="absolute z-20 transition-all duration-300"
        style={containerStyle}
      >
        {card.linkTarget ? (
          <Link
            href={card.linkTarget}
            className="block h-full w-full rounded-[24px] lg:rounded-[28px] outline-none focus-visible:ring-2 focus-visible:ring-[#84cc16] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF8F5]"
            aria-label={`${card.title}: ${card.body}`}
          >
            {cardInner}
          </Link>
        ) : (
          cardInner
        )}
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      {card.linkTarget ? (
        <Link
          href={card.linkTarget}
          className="block h-full w-full rounded-[24px] lg:rounded-[28px] outline-none focus-visible:ring-2 focus-visible:ring-[#84cc16] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF8F5]"
          aria-label={`${card.title}: ${card.body}`}
        >
          {cardInner}
        </Link>
      ) : (
        cardInner
      )}
    </div>
  );
}
