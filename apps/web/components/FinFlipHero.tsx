"use client";

import { useState } from "react";
import Link from "next/link";
import { useToken } from "./AuthGate";

export function FinFlipHero() {
  const token = useToken();
  const [showHowModal, setShowHowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"track" | "understand" | "split" | "grow">("track");

  function handleStartFlipping() {
    if (token) {
      // User is logged in -> jump to transactions or scroll down to overview
      const el = document.getElementById("dashboard-overview");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      } else {
        window.location.href = "/transactions";
      }
    } else {
      // User not logged in -> scroll down to sign in / register
      const el = document.getElementById("auth-section") || document.getElementById("dashboard-overview");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  }

  return (
    <>
      <section className="relative w-full overflow-hidden border-b border-line bg-[#f7f6db]">
        {/* Hero Graphic Container with natural 16:9 aspect bounds */}
        <div className="relative mx-auto max-w-7xl">
          <div
            className="relative flex min-h-[480px] w-full items-center justify-center bg-contain bg-center bg-no-repeat sm:min-h-[540px] md:min-h-[600px] lg:min-h-[660px]"
            style={{
              backgroundImage: "url('/finflip-hero.jpg')",
              backgroundPosition: "center top",
            }}
          >
            {/* Soft edge fade for seamless blending into the page */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#f7f6db]/30 via-transparent to-[#f7f6db]/70" />

            {/* Centered Hero Content Block positioned precisely in the artwork's open space */}
            <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col items-center px-4 pt-28 text-center sm:pt-36 md:pt-40 lg:max-w-2xl lg:pt-48">
              
              {/* Optional Mobile Frosted Scrim for crisp readability on smaller displays */}
              <div className="flex w-full flex-col items-center rounded-2xl bg-[#f7f6db]/80 p-4 backdrop-blur-[2px] sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
                
                {/* Headline: Flip the way you handle money */}
                <h1 className="font-serif text-3xl font-black tracking-tight text-ink drop-shadow-sm sm:text-4xl md:text-5xl lg:text-[54px] lg:leading-[1.12]">
                  Flip the way you handle{" "}
                  <span className="relative inline-block text-ink">
                    money.
                    <span className="absolute -bottom-1 left-0 h-1.5 w-full rounded-full bg-[#84cc16]/70" />
                  </span>
                </h1>

                {/* Tagline: Track • Understand • Split • Grow with AI */}
                <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-ink/10 bg-white/80 px-4 py-1.5 text-xs font-semibold text-ink-muted shadow-sm backdrop-blur-sm sm:mt-5 sm:text-sm md:text-base">
                  <span className="text-ink">Track</span>
                  <span className="font-black text-[#84cc16]">•</span>
                  <span className="text-ink">Understand</span>
                  <span className="font-black text-[#84cc16]">•</span>
                  <span className="text-ink">Split</span>
                  <span className="font-black text-[#6366f1]">•</span>
                  <span className="font-bold text-[#6366f1]">Grow with AI</span>
                </div>

                {/* Call To Action Buttons */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:mt-7 sm:gap-4">
                  {/* Start Flipping Button */}
                  <button
                    onClick={handleStartFlipping}
                    className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-ink px-6 py-3 text-sm font-bold tracking-wide text-paper-sheet shadow-md transition-all duration-200 hover:scale-105 hover:bg-ink-light hover:shadow-lg active:scale-95 sm:px-7 sm:py-3.5 sm:text-base"
                  >
                    <span className="relative z-10 flex items-center gap-1.5">
                      <span>Start Flipping</span>
                      <svg
                        className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-[#84cc16]/20 via-[#6366f1]/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                  </button>

                  {/* See how Button */}
                  <button
                    onClick={() => setShowHowModal(true)}
                    className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-white/90 px-6 py-3 text-sm font-semibold text-ink shadow-sm backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:border-ink/40 hover:bg-white hover:shadow active:scale-95 sm:px-7 sm:py-3.5 sm:text-base"
                  >
                    <svg
                      className="h-4 w-4 text-ink-muted"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>See how</span>
                  </button>
                </div>

                {/* Sub-label showing quick login shortcut if unauthenticated */}
                {!token && (
                  <p className="mt-3 text-[11px] font-medium text-ink-muted">
                    Pre-seeded with demo data • Instant login with{" "}
                    <code className="rounded bg-white/60 px-1 py-0.5 font-mono text-ink">demo@finsage.ai</code>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* "See How" Interactive Walkthrough Modal */}
      {showHowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-2xl border border-line bg-paper-sheet p-6 shadow-2xl sm:p-8">
            {/* Close button */}
            <button
              onClick={() => setShowHowModal(false)}
              className="absolute right-4 top-4 rounded-full border border-line bg-paper p-1.5 text-ink-muted transition-colors hover:bg-line/40 hover:text-ink"
              aria-label="Close modal"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Header */}
            <div className="border-b border-line pb-4">
              <span className="rounded border border-[#84cc16]/40 bg-[#84cc16]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink">
                How Fin Flip Works
              </span>
              <h2 className="mt-2 font-serif text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                Flip the way you handle money
              </h2>
              <p className="mt-1 text-xs text-ink-muted sm:text-sm">
                Fin Flip combines automated double-entry ledgering, OCR document processing, and AI advisory to streamline your wealth.
              </p>
            </div>

            {/* 4 Feature Tabs: Track • Understand • Split • Grow with AI */}
            <div className="mt-6 flex flex-wrap gap-2 border-b border-line pb-3">
              {[
                { id: "track", label: "Track", badge: "Ledger & OCR" },
                { id: "understand", label: "Understand", badge: "Health Score" },
                { id: "split", label: "Split", badge: "Smart Budgets" },
                { id: "grow", label: "Grow with AI", badge: "Advisor" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    activeTab === tab.id
                      ? "border border-ink bg-ink text-paper-sheet"
                      : "border border-line bg-paper text-ink-muted hover:border-line-dark hover:text-ink"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded text-[10px] px-1 py-0.2 ${
                      activeTab === tab.id ? "bg-white/20 text-paper-sheet" : "bg-ink/5 text-ink-subtle"
                    }`}
                  >
                    {tab.badge}
                  </span>
                </button>
              ))}
            </div>

            {/* Tab Details */}
            <div className="mt-5 rounded-xl border border-line bg-paper p-5">
              {activeTab === "track" && (
                <div>
                  <h3 className="font-serif text-lg font-bold text-ink">1. Automated Tracking & OCR Processing</h3>
                  <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                    No more manual spreadsheets. Upload your grocery receipts, utility bills, or bank statements. Our
                    OCR engine extracts dates, merchants, and amounts in seconds with human-in-the-loop review.
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs font-medium text-teal">
                    <span className="h-2 w-2 rounded-full bg-teal" />
                    <span>Live passbook ledger + Document upload on port 3000/documents</span>
                  </div>
                </div>
              )}

              {activeTab === "understand" && (
                <div>
                  <h3 className="font-serif text-lg font-bold text-ink">2. Understand Your Financial Pulse</h3>
                  <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                    Instant visibility into monthly burn rate, categorical spend distribution, and an AI-calculated
                    Financial Health Score (0-100) reflecting savings discipline and debt-to-income balance.
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs font-medium text-teal">
                    <span className="h-2 w-2 rounded-full bg-teal" />
                    <span>Real-time charts, salary tracking, and spending trends</span>
                  </div>
                </div>
              )}

              {activeTab === "split" && (
                <div>
                  <h3 className="font-serif text-lg font-bold text-ink">3. Split & Budget Effectively</h3>
                  <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                    Set monthly limits per category (Groceries, Housing, Dining, Entertainment). Fin Flip automatically
                    warns when you approach 80% and lets you split complex shared transactions seamlessly.
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs font-medium text-teal">
                    <span className="h-2 w-2 rounded-full bg-teal" />
                    <span>Configurable budget caps and milestone goals</span>
                  </div>
                </div>
              )}

              {activeTab === "grow" && (
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#6366f1]">4. Grow with AI Advisor</h3>
                  <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                    Chat with your personal wealth advisor powered by high-speed Groq LLMs. Query your historical
                    spending, test "what if" retirement scenarios, and get personalized advice via real-time SSE streaming.
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs font-medium text-[#6366f1]">
                    <span className="h-2 w-2 rounded-full bg-[#6366f1]" />
                    <span>Full conversational streaming intelligence at /advisor</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
              <span className="text-xs text-ink-muted">Ready to explore?</span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowHowModal(false);
                    handleStartFlipping();
                  }}
                  className="rounded-lg bg-ink px-4 py-2 text-xs font-bold text-paper-sheet shadow transition-all hover:bg-ink-light"
                >
                  Start Flipping Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
