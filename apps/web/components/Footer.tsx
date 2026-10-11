"use client";

import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[#E5DAC4] bg-[#F2E5CB] text-[#18122B] py-14 sm:py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="mx-auto max-w-7xl">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12 pb-12">
          
          {/* Brand Column (md:col-span-4 lg:col-span-5) */}
          <div className="md:col-span-4 lg:col-span-5 flex flex-col justify-between">
            <div>
              {/* Wordmark */}
              <Link href="/" className="inline-flex items-center gap-2 group">
                <span className="font-serif text-2xl sm:text-3xl font-black tracking-tight text-[#18122B]">
                  FinSage
                </span>
                <span className="rounded-full border border-[#84cc16]/60 bg-[#84cc16]/20 px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-[#3f6212]">
                  AI
                </span>
              </Link>

              {/* Tagline / Short Description */}
              <p className="mt-3.5 max-w-sm text-sm sm:text-[15px] leading-relaxed text-[#18122B]/75 font-normal">
                A clearer, more confident way to manage your money.
              </p>

              {/* Subtle Pillar Tags */}
              <div className="mt-5 flex flex-wrap items-center gap-2 font-mono text-[11px] font-bold text-[#18122B]/60">
                <span className="rounded-md bg-white/70 px-2 py-0.5 border border-[#18122B]/10">Smart Accounting</span>
                <span className="rounded-md bg-white/70 px-2 py-0.5 border border-[#18122B]/10">Agentic Advisory</span>
                <span className="rounded-md bg-white/70 px-2 py-0.5 border border-[#18122B]/10">Zero Anxiety</span>
              </div>
            </div>

            {/* Micro Status Chip */}
            <div className="mt-8 inline-flex items-center gap-2 self-start rounded-full border border-[#84cc16]/40 bg-white/80 px-3 py-1 text-xs font-mono font-bold text-[#3f6212] shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-[#84cc16]" />
              <span>Personal Finance Workspace</span>
            </div>
          </div>

          {/* Navigation Links Columns (md:col-span-8 lg:col-span-7) */}
          <div className="md:col-span-8 lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            
            {/* Group 1: Explore */}
            <div className="flex flex-col space-y-3">
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#18122B]/50">
                Explore
              </p>
              <ul className="space-y-2.5 text-sm font-medium text-[#18122B]/80">
                <li>
                  <a href="#features" className="transition hover:text-[#18122B] hover:underline underline-offset-4 decoration-[#84cc16]">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="transition hover:text-[#18122B] hover:underline underline-offset-4 decoration-[#84cc16]">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#privacy" className="transition hover:text-[#18122B] hover:underline underline-offset-4 decoration-[#84cc16]">
                    Privacy &amp; Trust
                  </a>
                </li>
              </ul>
            </div>

            {/* Group 2: Tools */}
            <div className="flex flex-col space-y-3">
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#18122B]/50">
                Tools
              </p>
              <ul className="space-y-2.5 text-sm font-medium text-[#18122B]/80">
                <li>
                  <Link href="/documents" className="transition hover:text-[#18122B] hover:underline underline-offset-4 decoration-[#84cc16]">
                    OCR Document Vault
                  </Link>
                </li>
                <li>
                  <Link href="/advisor" className="transition hover:text-[#18122B] hover:underline underline-offset-4 decoration-[#84cc16]">
                    AI Advisor Copilot
                  </Link>
                </li>
                <li>
                  <Link href="/household" className="transition hover:text-[#18122B] hover:underline underline-offset-4 decoration-[#84cc16]">
                    Household &amp; Split
                  </Link>
                </li>
              </ul>
            </div>

            {/* Group 3: Workspace */}
            <div className="flex flex-col space-y-3 col-span-2 sm:col-span-1">
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#18122B]/50">
                Workspace
              </p>
              <ul className="space-y-2.5 text-sm font-medium text-[#18122B]/80">
                <li>
                  <Link href="/dashboard" className="transition hover:text-[#18122B] hover:underline underline-offset-4 decoration-[#84cc16]">
                    Live Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/transactions" className="transition hover:text-[#18122B] hover:underline underline-offset-4 decoration-[#84cc16]">
                    Passbook Ledger
                  </Link>
                </li>
                <li>
                  <Link href="/budgets" className="transition hover:text-[#18122B] hover:underline underline-offset-4 decoration-[#84cc16]">
                    Envelope Budgets
                  </Link>
                </li>
                <li>
                  <Link href="/goals" className="transition hover:text-[#18122B] hover:underline underline-offset-4 decoration-[#84cc16]">
                    Savings Goals
                  </Link>
                </li>
              </ul>
            </div>

          </div>

        </div>

        {/* Bottom Bar with Thin Divider */}
        <div className="border-t border-[#18122B]/12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#18122B]/65">
          <p>
            &copy; {currentYear} FinSage. All rights reserved.
          </p>

          <div className="flex items-center gap-4 font-sans font-medium">
            <a href="#privacy" className="transition hover:text-[#18122B]">
              Privacy &amp; Data Ethics
            </a>
            <span className="text-[#18122B]/30">•</span>
            <span className="text-[#18122B]/85 font-serif italic">
              Made for real money life.
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
