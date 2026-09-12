"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const [token, setToken] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("finsage_token"));
    }
  }, []);

  function handleLogout() {
    localStorage.removeItem("finsage_token");
    window.location.href = "/";
  }

  const isAppRoute =
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/transactions") ||
    pathname?.startsWith("/budgets") ||
    pathname?.startsWith("/goals") ||
    pathname?.startsWith("/documents") ||
    pathname?.startsWith("/advisor");

  return (
    <header className="sticky top-0 z-50 border-b border-[#E5DAC4] bg-[#F4E8D3]/90 px-4 py-3.5 backdrop-blur-md sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Brand & Section Navigation */}
        <div className="flex items-center gap-8">
          <Link
            href={token ? "/dashboard" : "/"}
            className="flex items-center gap-2 group transition-opacity"
          >
            <span className="font-serif text-2xl font-black tracking-tight text-[#18122B]">
              FinSage
            </span>
            <span className="rounded-full border border-[#84cc16]/60 bg-[#84cc16]/20 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-[#3f6212]">
              AI
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-6 text-xs font-semibold text-[#18122B]/75 lg:flex">
            {token && isAppRoute ? (
              <>
                <Link href="/dashboard" className="transition hover:text-[#18122B]">Dashboard</Link>
                <Link href="/transactions" className="transition hover:text-[#18122B]">Transactions</Link>
                <Link href="/budgets" className="transition hover:text-[#18122B]">Budgets</Link>
                <Link href="/goals" className="transition hover:text-[#18122B]">Goals</Link>
                <Link href="/documents" className="transition hover:text-[#18122B]">Documents</Link>
                <Link href="/advisor" className="text-[#4d7c0f] font-bold transition hover:text-[#18122B]">AI Advisor</Link>
              </>
            ) : (
              <>
                <a href="#problem" className="transition hover:text-[#18122B]">The Problem</a>
                <a href="#how-it-works" className="transition hover:text-[#18122B]">How It Works</a>
                <a href="#ocr" className="transition hover:text-[#18122B]">OCR Capture</a>
                <a href="#advisor" className="transition hover:text-[#18122B]">AI Advisor</a>
                <a href="#splitwise" className="transition hover:text-[#18122B]">Splitwise</a>
                <a href="#knowledge" className="transition hover:text-[#18122B]">Knowledge</a>
                <a href="#showcase" className="transition hover:text-[#18122B]">Product</a>
              </>
            )}
          </nav>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {token ? (
            <div className="flex items-center gap-3">
              {!isAppRoute && (
                <Link
                  href="/dashboard"
                  className="rounded-full bg-[#84cc16] px-4 py-1.5 text-xs font-black text-[#18122B] shadow-sm transition hover:bg-[#a3e635] hover:scale-105 active:scale-95"
                >
                  Dashboard &rarr;
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="rounded-full border border-[#DDD9CF] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#18122B]/80 transition hover:border-[#18122B] hover:text-[#18122B]"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/signin"
                className="px-3 py-1.5 text-xs font-bold text-[#18122B]/80 transition hover:text-[#18122B]"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-[#84cc16] px-4 py-1.5 text-xs font-black text-[#18122B] shadow-sm transition hover:bg-[#a3e635] hover:scale-105 active:scale-95"
              >
                Start Flipping
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
                className="ml-1 rounded-lg p-1.5 text-[#18122B]/70 hover:bg-[#E5DAC4]/60 lg:hidden"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="mt-3 border-t border-[#E5DAC4] pt-3 pb-2 lg:hidden">
          <div className="flex flex-col gap-2.5 px-2 text-xs font-bold text-[#18122B]/80">
            <a href="#problem" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-[#18122B]">The Problem</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-[#18122B]">How It Works</a>
            <a href="#ocr" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-[#18122B]">OCR Capture</a>
            <a href="#advisor" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-[#18122B]">AI Advisor</a>
            <a href="#splitwise" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-[#18122B]">Splitwise</a>
            <a href="#knowledge" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-[#18122B]">Knowledge</a>
            <a href="#showcase" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-[#18122B]">Product</a>
          </div>
        </div>
      )}
    </header>
  );
}
