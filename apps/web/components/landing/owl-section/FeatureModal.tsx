"use client";

import React, { useEffect, useRef, useState } from "react";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { OwlFeatureCardData } from "./data";

interface FeatureModalProps {
  card: OwlFeatureCardData | null;
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export function FeatureModal({
  card,
  isOpen,
  onClose,
  triggerRef,
}: FeatureModalProps) {
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll and trap focus
  useEffect(() => {
    if (!isOpen || !card) return;

    // 1. Lock body scroll with padding compensation to avoid layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // 2. Focus first interactive element in dialog
    const timer = setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 50);

    // 3. Escape key listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      // Focus trapping
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener("keydown", handleKeyDown);

      // Return focus to trigger
      if (triggerRef?.current) {
        triggerRef.current.focus();
      }
    };
  }, [isOpen, card, onClose, triggerRef]);

  if (!mounted || !isOpen || !card) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="presentation"
    >
      {/* Backdrop with soft blur */}
      <div
        className="fixed inset-0 bg-[#18122B]/45 backdrop-blur-md transition-opacity duration-220 motion-reduce:transition-none"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog / Bottom Sheet Container */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feature-modal-title"
        aria-describedby="feature-modal-desc"
        className="relative z-10 w-full max-h-[90vh] sm:max-h-[85vh] sm:max-w-lg overflow-y-auto rounded-t-[32px] sm:rounded-[32px] border border-[#18122B]/10 bg-white shadow-[0_24px_50px_rgba(24,18,43,0.22)] transition-all duration-220 ease-out transform animate-modal-in motion-reduce:animate-fade-in"
      >
        <style jsx>{`
          @keyframes modalIn {
            0% {
              opacity: 0;
              transform: translateY(24px) scale(0.96);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          @keyframes fadeIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
          .animate-modal-in {
            animation: modalIn 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .animate-fade-in {
            animation: fadeIn 220ms ease-out forwards;
          }
        `}</style>

        {/* Card-tinted Header */}
        <div
          className={`relative border-b ${card.borderColor} ${card.cardGradient} p-6 sm:p-7 rounded-t-[32px] sm:rounded-t-[32px] flex items-start justify-between gap-4`}
        >
          {/* Icon + Title */}
          <div className="flex items-center gap-4">
            <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center">
              <div
                className={`absolute inset-0 rounded-full ${card.glowColor} blur-md opacity-90`}
                aria-hidden="true"
              />
              <Image
                src={card.iconPath}
                alt=""
                width={64}
                height={64}
                className="relative h-full w-full object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.1)]"
              />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#18122B]/60">
                FinSage Feature
              </span>
              <h2
                id="feature-modal-title"
                className="font-serif text-xl sm:text-2xl font-black text-[#18122B] tracking-tight leading-snug"
              >
                {card.title}
              </h2>
            </div>
          </div>

          {/* Close Button */}
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="rounded-full p-2 text-[#18122B]/60 hover:text-[#18122B] hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84cc16] transition-colors"
            aria-label="Close dialog"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7 space-y-6">
          {/* 2-Sentence Description */}
          <p
            id="feature-modal-desc"
            className="font-sans text-[15px] sm:text-base leading-relaxed text-[#18122B]/85"
          >
            {card.description}
          </p>

          {/* 3 Check-marked Bullets */}
          <div className="space-y-3 rounded-2xl bg-[#FAF8F5] p-4 sm:p-5 border border-[#EADBCE]/70">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#18122B]/60 mb-2">
              Key Capabilities
            </h3>
            <ul className="space-y-2.5">
              {card.bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white mt-0.5 shadow-xs"
                    style={{ backgroundColor: card.accentColor }}
                    aria-hidden="true"
                  >
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-sans text-sm font-medium text-[#18122B]/90 leading-tight">
                    {bullet}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Row: Primary CTA + Close Button */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2 border-t border-[#18122B]/10">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-[#18122B]/15 text-sm font-semibold text-[#18122B]/80 hover:bg-[#FAF8F5] hover:text-[#18122B] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#84cc16]"
            >
              Close
            </button>
            <Link
              href={card.ctaHref}
              onClick={onClose}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white shadow-sm hover:opacity-95 active:scale-[0.98] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${card.buttonBg}`}
            >
              <span>{card.ctaText}</span>
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
