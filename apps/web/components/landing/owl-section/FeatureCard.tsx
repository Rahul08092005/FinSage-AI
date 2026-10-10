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

  const content = (
    <div className="group relative flex h-full w-full flex-col justify-between rounded-2xl sm:rounded-3xl border border-[#18122B]/15 bg-white/95 p-4 sm:p-5 shadow-[0_2px_8px_rgba(24,18,43,0.04)] backdrop-blur-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#18122B]/30 hover:shadow-[0_8px_20px_rgba(24,18,43,0.08)]">
      {/* Top row: Icon + Arrow Action */}
      <div className="flex items-start justify-between gap-3">
        <div className={`relative flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl ${card.iconBg} p-1.5 shadow-2xs transition-transform duration-200 group-hover:scale-105`}>
          <Image
            src={card.iconPath}
            alt={card.title}
            width={44}
            height={44}
            className="h-full w-full object-contain drop-shadow-xs"
          />
        </div>

        {card.linkTarget ? (
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full border border-[#18122B]/10 bg-[#FAF8F5] text-xs font-black text-[#18122B] shadow-2xs transition-all duration-200 group-hover:border-[#18122B] group-hover:bg-[#18122B] group-hover:text-white"
            aria-label={`Go to ${card.title}`}
          >
            <span className="translate-x-px text-[11px]">&rarr;</span>
          </div>
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#18122B]/5 bg-[#FAF8F5]/60 text-xs font-bold text-[#18122B]/40">
            <span className="text-[11px]">&rarr;</span>
          </div>
        )}
      </div>

      {/* Text Details */}
      <div className="mt-2.5 flex flex-col justify-end">
        <h3 className="font-serif text-sm sm:text-base xl:text-[17px] font-black tracking-tight text-[#18122B] leading-tight group-hover:text-[#0C1829]">
          {card.title}
        </h3>
        <p className="mt-1 font-sans text-[11px] sm:text-xs xl:text-[12.5px] font-normal leading-snug text-[#18122B]/75 line-clamp-2">
          {card.body}
        </p>
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
          <Link href={card.linkTarget} className="block h-full w-full outline-none focus-visible:ring-2 focus-visible:ring-[#84cc16] rounded-2xl sm:rounded-3xl">
            {content}
          </Link>
        ) : (
          content
        )}
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      {card.linkTarget ? (
        <Link href={card.linkTarget} className="block h-full w-full outline-none focus-visible:ring-2 focus-visible:ring-[#84cc16] rounded-2xl sm:rounded-3xl">
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
}
