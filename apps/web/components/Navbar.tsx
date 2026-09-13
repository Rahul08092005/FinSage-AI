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

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/transactions", label: "Transactions" },
    { href: "/budgets", label: "Budgets" },
    { href: "/goals", label: "Goals" },
    { href: "/documents", label: "Documents" },
    { href: "/advisor", label: "AI Advisor", isAi: true },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[#E5DAC4] bg-[#FBF7EE]/95 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between">
        {/* Brand & Workspace Navigation */}
        <div className="flex items-center gap-8 lg:gap-10">
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
          <nav className="hidden items-center gap-6 text-xs lg:flex">
            {token && isAppRoute ? (
              <>
                {navLinks.map((link) => {
                  const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`relative py-1 transition-all ${
                        isActive
                          ? "font-bold text-[#18122B] after:absolute after:-bottom-1 after:left-0 after:right-0 after:h-[2.5px] after:rounded-full after:bg-[#84cc16]"
                          : link.isAi
                          ? "font-semibold text-[#4d7c0f] hover:text-[#18122B]"
                          : "font-medium text-[#18122B]/75 hover:text-[#18122B]"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </>
            ) : (
              <>
                <a href="#problem" className="font-medium text-[#18122B]/75 transition hover:text-[#18122B]">The Problem</a>
                <a href="#how-it-works" className="font-medium text-[#18122B]/75 transition hover:text-[#18122B]">How It Works</a>
                <a href="#ocr" className="font-medium text-[#18122B]/75 transition hover:text-[#18122B]">OCR Capture</a>
                <a href="#advisor" className="font-medium text-[#18122B]/75 transition hover:text-[#18122B]">AI Advisor</a>
                <a href="#splitwise" className="font-medium text-[#18122B]/75 transition hover:text-[#18122B]">Splitwise</a>
                <a href="#knowledge" className="font-medium text-[#18122B]/75 transition hover:text-[#18122B]">Knowledge</a>
                <a href="#showcase" className="font-medium text-[#18122B]/75 transition hover:text-[#18122B]">Product</a>
              </>
            )}
          </nav>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {token ? (
            <div className="flex items-center gap-3">
              {/* User indicator chip */}
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-[#DDD9CF] bg-white px-3 py-1 text-xs font-semibold text-[#18122B]">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#18122B] text-[10px] font-bold text-white">
                  D
                </span>
                <span>Demo User</span>
                <span className="h-2 w-2 rounded-full bg-[#84cc16]" title="Workspace Connected" />
              </div>

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
                className="rounded-full border border-[#DDD9CF] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#18122B]/80 transition hover:border-[#18122B] hover:text-[#18122B] hover:shadow-sm active:scale-95"
              >
                Logout
              </button>

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
                Get Started
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
          <div className="flex flex-col gap-2 px-2 text-xs font-semibold text-[#18122B]/80">
            {token && isAppRoute ? (
              <>
                {navLinks.map((link) => {
                  const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`py-1.5 px-2 rounded-lg transition ${
                        isActive
                          ? "bg-[#84cc16]/20 font-bold text-[#18122B]"
                          : "hover:bg-[#E5DAC4]/40 hover:text-[#18122B]"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
                <div className="my-1 border-t border-[#E5DAC4]/80" />
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="py-1.5 px-2 text-left font-bold text-[#e11d48] hover:bg-rose-50 rounded-lg"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <a href="#problem" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-[#18122B]">The Problem</a>
                <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-[#18122B]">How It Works</a>
                <a href="#ocr" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-[#18122B]">OCR Capture</a>
                <a href="#advisor" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-[#18122B]">AI Advisor</a>
                <a href="#splitwise" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-[#18122B]">Splitwise</a>
                <a href="#knowledge" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-[#18122B]">Knowledge</a>
                <a href="#showcase" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-[#18122B]">Product</a>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
