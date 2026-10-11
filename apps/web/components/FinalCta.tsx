"use client";

import Link from "next/link";
import Image from "next/image";

interface FinalCtaProps {
  token: string | null;
}

export function FinalCta({ token }: FinalCtaProps) {
  return (
    <section
      id="final-cta"
      className="relative scroll-mt-20 border-t border-[#E5DAC4] bg-[#FAF8F5] py-16 sm:py-20 lg:py-24 overflow-hidden"
    >
      {/* Background Subtle Editorial Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#18122B06_1px,transparent_1px),linear-gradient(to_bottom,#18122B06_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Centered Rounded Navy Hero Panel */}
        <div className="relative overflow-hidden rounded-[2.5rem] border border-[#18122B]/20 bg-[#18122B] px-6 py-12 sm:px-12 sm:py-16 lg:px-16 lg:py-20 shadow-2xl">
          
          {/* Subtle Ambient Radial Glow Accent */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#84cc16]/15 blur-3xl" />
          <div className="pointer-events-none absolute -left-24 -bottom-24 h-96 w-96 rounded-full bg-[#8B5CF6]/15 blur-3xl" />

          <div className="relative z-10 grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8 xl:gap-12">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 flex flex-col justify-center text-left">
              
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 self-start rounded-full border border-[#84cc16]/40 bg-[#84cc16]/15 px-3.5 py-1 font-mono text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#84cc16] shadow-xs">
                <span className="h-2 w-2 rounded-full bg-[#84cc16] animate-pulse" />
                <span>YOUR MONEY. YOUR MOVE.</span>
              </div>

              {/* Headline with Lime Accent and Hand-Drawn Underline */}
              <h2 className="mt-5 font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[52px] xl:text-[56px] font-black tracking-[-0.03em] text-white leading-[1.04]">
                Ready to make your money{" "}
                <span className="relative inline-block text-[#84cc16]">
                  make sense?
                  {/* Hand-drawn underline SVG */}
                  <svg
                    className="absolute -bottom-2 sm:-bottom-2.5 left-0 w-full text-[#84cc16] overflow-visible pointer-events-none"
                    viewBox="0 0 220 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 10C55 2.5 155 3 218 8"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M16 13C65 7 145 7.5 204 11"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      opacity="0.8"
                    />
                  </svg>
                </span>
              </h2>

              {/* Supporting Copy */}
              <p className="mt-5 max-w-xl text-sm sm:text-base lg:text-[16px] leading-relaxed text-white/80 font-normal">
                Bring your financial life into focus. Organize spending, uncover patterns, plan your goals, and make more confident money decisions with FinSage.
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-3.5 sm:gap-4">
                <Link
                  href={token ? "/dashboard" : "/signup"}
                  className="group inline-flex items-center gap-2 rounded-full bg-[#84cc16] px-8 py-4 text-sm sm:text-base font-black text-[#18122B] shadow-lg shadow-[#84cc16]/20 transition-all duration-200 hover:bg-[#a3e635] hover:scale-105 active:scale-95"
                >
                  <span>{token ? "Open Workspace →" : "Get Started →"}</span>
                </Link>

                <a
                  href="#features"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 sm:px-7 py-3.5 sm:py-4 text-sm sm:text-base font-bold text-white backdrop-blur-xs transition hover:border-white/50 hover:bg-white/10 active:scale-95"
                >
                  <span>Explore Features ↓</span>
                </a>
              </div>

            </div>

            {/* Right Illustration Column (Tactile 3D Financial Objects - NO OWL) */}
            <div className="lg:col-span-5 flex items-center justify-center">
              <div className="relative w-full max-w-[340px] sm:max-w-[380px] aspect-square flex items-center justify-center">
                
                {/* Ambient Soft Glow Behind Assets */}
                <div className="absolute inset-8 rounded-full bg-[#84cc16]/20 blur-2xl pointer-events-none" />

                {/* Primary Central 3D Asset: Financial Wallet & Card */}
                <div className="relative z-10 w-44 h-44 sm:w-52 sm:h-52 transition-transform duration-500 hover:scale-105">
                  <Image
                    src="/brand/artifacts/wallet-3d.png"
                    alt="FinSage Smart Financial Wallet"
                    fill
                    className="object-contain drop-shadow-2xl"
                    priority
                  />
                </div>

                {/* Floating Top-Right 3D Gold Coins */}
                <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 w-24 h-24 sm:w-28 sm:h-28 transition-transform duration-500 hover:-translate-y-1">
                  <Image
                    src="/brand/artifacts/coins-3d.png"
                    alt="Floating Gold Coins"
                    fill
                    className="object-contain drop-shadow-xl rotate-12"
                  />
                </div>

                {/* Floating Bottom-Left 3D Chart */}
                <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 z-20 w-20 h-20 sm:w-24 sm:h-24 transition-transform duration-500 hover:translate-y-1">
                  <Image
                    src="/brand/artifacts/chart-3d.png"
                    alt="Growing Financial Chart"
                    fill
                    className="object-contain drop-shadow-xl -rotate-6"
                  />
                </div>

                {/* Floating Badge */}
                <div className="absolute -bottom-3 right-6 z-30 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/95 px-3 py-1 text-[11px] font-mono font-bold text-[#18122B] shadow-md backdrop-blur-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#84cc16]" />
                  <span>Real Money Clarity</span>
                </div>

              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
