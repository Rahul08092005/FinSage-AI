"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export function PrivacyTrust() {
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsPrivacyModalOpen(false);
      }
    };
    if (isPrivacyModalOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPrivacyModalOpen]);

  return (
    <section
      id="privacy"
      className="relative scroll-mt-20 border-t border-[#E5DAC4] bg-[#FAF8F5] py-16 sm:py-20 lg:py-24 overflow-hidden"
    >
      {/* Subtle editorial grid pattern consistent with How It Works */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#18122B06_1px,transparent_1px),linear-gradient(to_bottom,#18122B06_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Main 2-Column Desktop Grid / Stacked on Mobile & Tablet */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 xl:gap-12 items-center">
          
          {/* ========================================================================= */}
          {/* LEFT COLUMN: Eyebrow, Editorial Headline, Supporting Copy & 3D Artwork    */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-[#18122B]/15 bg-white/95 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#18122B] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#84cc16]" />
              <span>PRIVACY &amp; TRUST</span>
            </div>

            {/* Headline */}
            <h2 className="mt-4 font-serif text-4xl sm:text-5xl lg:text-[52px] xl:text-[58px] font-black tracking-[-0.035em] text-[#18122B] leading-[1.03]">
              Your money.<br />
              Your data.<br />
              <span className="relative inline-block text-[#65a30d]">
                Your call.
                {/* Hand-drawn underline treatment */}
                <svg
                  className="absolute -bottom-2 sm:-bottom-2.5 left-0 w-full text-[#84cc16] overflow-visible pointer-events-none"
                  viewBox="0 0 220 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3 12C60 3.5 160 4 217 9"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M18 14.5C70 8 150 8.5 205 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity="0.8"
                  />
                </svg>
              </span>
            </h2>

            {/* Supporting Copy */}
            <p className="mt-4 sm:mt-5 max-w-md text-sm sm:text-base lg:text-[15px] xl:text-[16px] leading-relaxed text-[#18122B]/80 font-normal">
              Financial clarity starts with trust. You should always know what you share, how it’s used, and what stays in your control.
            </p>

            {/* 3D Shield & Lock Illustration with surrounding elements */}
            <div className="mt-6 sm:mt-8 relative flex items-center justify-center lg:justify-start">
              <div className="relative w-full max-w-[320px] sm:max-w-[360px] lg:max-w-[390px] xl:max-w-[410px] aspect-square flex items-center justify-center">
                {/* Subtle soft ambient glow behind 3D artwork */}
                <div className="absolute inset-4 rounded-full bg-[#84cc16]/12 blur-3xl pointer-events-none" />
                
                <Image
                  src="/brand/artifacts/privacy-shield-3d.png"
                  alt="FinSage Privacy and Trust Shield"
                  width={420}
                  height={420}
                  className="relative z-10 w-full h-full object-contain drop-shadow-xl transition-transform duration-500 hover:scale-[1.03]"
                  priority
                />
              </div>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: 2 x 2 Balanced Grid of Rounded Trust Cards                  */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5 items-stretch">
              
              {/* CARD 1 — Green Accent: Your data deserves respect */}
              <div className="group relative flex flex-col justify-between rounded-2xl border border-[#84cc16]/30 bg-[#F4F9EE] p-5 sm:p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-[#84cc16]/50">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#65a30d] border border-[#84cc16]/30 shadow-xs">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <span className="h-2 w-2 rounded-full bg-[#84cc16]" />
                  </div>

                  <h3 className="mt-4 font-serif text-lg sm:text-xl font-bold tracking-tight text-[#18122B]">
                    Your data deserves respect
                  </h3>

                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#18122B]/75 font-normal">
                    We only use your information to power FinSage and provide the features you choose. You decide what to connect and what to share.
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2 pt-3 border-t border-[#84cc16]/20">
                  <span className="inline-flex items-center rounded-full border border-[#84cc16]/35 bg-white/90 px-3 py-1 font-mono text-[11px] font-bold text-[#4d7c0f] shadow-xs">
                    Transparent data use
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsPrivacyModalOpen(true)}
                    className="inline-flex items-center gap-1 rounded-full border border-[#84cc16]/50 bg-[#84cc16]/15 px-3 py-1 font-mono text-[11px] font-bold text-[#3f6212] transition hover:bg-[#84cc16]/30 shadow-xs cursor-pointer"
                  >
                    <span>Read our Privacy Policy</span>
                    <span aria-hidden="true">&rarr;</span>
                  </button>
                </div>
              </div>

              {/* CARD 2 — Purple Accent: Security is not a side quest */}
              <div className="group relative flex flex-col justify-between rounded-2xl border border-[#8B5CF6]/30 bg-[#F8F5FE] p-5 sm:p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-[#8B5CF6]/50">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#7C3AED] border border-[#8B5CF6]/30 shadow-xs">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <span className="h-2 w-2 rounded-full bg-[#8B5CF6]" />
                  </div>

                  <h3 className="mt-4 font-serif text-lg sm:text-xl font-bold tracking-tight text-[#18122B]">
                    Security is not a side quest
                  </h3>

                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#18122B]/75 font-normal">
                    Your credentials are authenticated with salted bcrypt hashing and signed JSON Web Tokens. Database queries strictly isolate records to your authenticated account ID.
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2 pt-3 border-t border-[#8B5CF6]/20">
                  <span className="inline-flex items-center rounded-full border border-[#8B5CF6]/35 bg-white/90 px-3 py-1 font-mono text-[11px] font-bold text-[#6D28D9] shadow-xs">
                    Bcrypt &amp; JWT auth
                  </span>
                  <span className="inline-flex items-center rounded-full border border-[#8B5CF6]/40 bg-[#8B5CF6]/15 px-3 py-1 font-mono text-[11px] font-bold text-[#5B21B6] shadow-xs">
                    Isolated user records
                  </span>
                </div>
              </div>

              {/* CARD 3 — Orange Accent: You stay in control */}
              <div className="group relative flex flex-col justify-between rounded-2xl border border-[#F97316]/30 bg-[#FFF7ED] p-5 sm:p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-[#F97316]/50">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#EA580C] border border-[#F97316]/30 shadow-xs">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span className="h-2 w-2 rounded-full bg-[#F97316]" />
                  </div>

                  <h3 className="mt-4 font-serif text-lg sm:text-xl font-bold tracking-tight text-[#18122B]">
                    You stay in control
                  </h3>

                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#18122B]/75 font-normal">
                    Review and confirm parsed OCR receipts before committing to your ledger. Upload, review, or delete stored documents at any time from your workspace.
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2 pt-3 border-t border-[#F97316]/20">
                  <span className="inline-flex items-center rounded-full border border-[#F97316]/35 bg-white/90 px-3 py-1 font-mono text-[11px] font-bold text-[#C2410C] shadow-xs">
                    Document review
                  </span>
                  <Link
                    href="/documents"
                    className="inline-flex items-center gap-1 rounded-full border border-[#F97316]/45 bg-[#F97316]/15 px-3 py-1 font-mono text-[11px] font-bold text-[#9A3412] transition hover:bg-[#F97316]/30 shadow-xs"
                  >
                    <span>Manage documents</span>
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>

              {/* CARD 4 — Blue Accent: Shared finances, clear boundaries */}
              <div className="group relative flex flex-col justify-between rounded-2xl border border-[#3B82F6]/30 bg-[#EFF6FF] p-5 sm:p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-[#3B82F6]/50">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#2563EB] border border-[#3B82F6]/30 shadow-xs">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <span className="h-2 w-2 rounded-full bg-[#3B82F6]" />
                  </div>

                  <h3 className="mt-4 font-serif text-lg sm:text-xl font-bold tracking-tight text-[#18122B]">
                    Shared finances, clear boundaries
                  </h3>

                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#18122B]/75 font-normal">
                    When you share expenses with family, friends or roommates, you choose what’s shared and who can see it.
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2 pt-3 border-t border-[#3B82F6]/20">
                  <span className="inline-flex items-center rounded-full border border-[#3B82F6]/35 bg-white/90 px-3 py-1 font-mono text-[11px] font-bold text-[#1D4ED8] shadow-xs">
                    Flexible sharing
                  </span>
                  <span className="inline-flex items-center rounded-full border border-[#3B82F6]/40 bg-[#3B82F6]/15 px-3 py-1 font-mono text-[11px] font-bold text-[#1E40AF] shadow-xs">
                    Your privacy, your rules
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* BOTTOM TRUST STRIP: Slim, pill-shaped strip with 3 items & dividers       */}
        {/* ========================================================================= */}
        <div className="mt-12 sm:mt-16 w-full flex justify-center">
          <div className="inline-flex flex-col md:flex-row items-center justify-between rounded-2xl md:rounded-full border border-[#18122B]/15 bg-white/95 px-6 sm:px-8 py-3.5 sm:py-4 shadow-sm backdrop-blur-sm w-full max-w-5xl gap-3 sm:gap-4 md:gap-0">
            
            {/* Strip Item 1 */}
            <div className="flex items-center gap-2.5 text-xs sm:text-[13px] text-center md:text-left">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#84cc16]/20 text-[#4d7c0f]">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </span>
              <span>
                <strong className="font-bold text-[#18122B]">Built with care</strong>{" "}
                <span className="text-[#18122B]/70">— Designed with your privacy in mind.</span>
              </span>
            </div>

            {/* Vertical Divider 1 (Desktop) */}
            <div className="hidden md:block w-px h-5 bg-[#18122B]/15 mx-3 lg:mx-5 shrink-0" />

            {/* Strip Item 2 */}
            <div className="flex items-center gap-2.5 text-xs sm:text-[13px] text-center md:text-left">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#8B5CF6]/20 text-[#6D28D9]">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </span>
              <span>
                <strong className="font-bold text-[#18122B]">Your trust matters</strong>{" "}
                <span className="text-[#18122B]/70">— We’re committed to keeping your data safe.</span>
              </span>
            </div>

            {/* Vertical Divider 2 (Desktop) */}
            <div className="hidden md:block w-px h-5 bg-[#18122B]/15 mx-3 lg:mx-5 shrink-0" />

            {/* Strip Item 3 */}
            <div className="flex items-center gap-2.5 text-xs sm:text-[13px] text-center md:text-left">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3B82F6]/20 text-[#1D4ED8]">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </span>
              <span>
                <strong className="font-bold text-[#18122B]">Always in your control</strong>{" "}
                <span className="text-[#18122B]/70">— You decide what to share, always.</span>
              </span>
            </div>

          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* IN-APP PRIVACY POLICY MODAL (Truthful, in-page without broken route)       */}
      {/* ========================================================================= */}
      {isPrivacyModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsPrivacyModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl border border-[#18122B]/20 bg-[#FAF8F5] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#18122B]/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#84cc16]" />
                <h3 id="privacy-modal-title" className="font-serif text-lg font-black text-[#18122B]">
                  FinSage Privacy Commitment
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPrivacyModalOpen(false)}
                className="rounded-full p-1 text-[#18122B]/60 hover:bg-[#18122B]/10 hover:text-[#18122B] transition cursor-pointer"
                aria-label="Close privacy modal"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 font-sans text-xs sm:text-sm text-[#18122B]/80 leading-relaxed">
              <p>
                <strong>1. Transparent Data Usage:</strong> We only process your financial uploads, receipts, and entries to calculate your metrics, budgets, and insights within your personal workspace.
              </p>
              <p>
                <strong>2. Never Sold:</strong> We do not sell your personal or financial data to advertisers, brokers, or data aggregators.
              </p>
              <p>
                <strong>3. Full User Control:</strong> You can review OCR scans before adding them to your ledger, remove documents, and delete account records directly through your account controls.
              </p>
              <p>
                <strong>4. Account Security:</strong> All user credentials are protected using salted password hashing (bcrypt) and signed JWT token authentication.
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setIsPrivacyModalOpen(false)}
                className="rounded-full bg-[#18122B] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#2D1B4E] transition cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
