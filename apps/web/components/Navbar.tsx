"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const [token, setToken] = useState<string | null>(null);
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
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-white/10 bg-[#060B12]/90 px-6 py-3.5 backdrop-blur-md">
      {/* Brand & Section Navigation */}
      <div className="flex items-center gap-8">
        <Link
          href={token ? "/dashboard" : "/"}
          className="flex items-center gap-2 group transition-opacity"
        >
          <span className="font-serif text-xl font-black tracking-tight text-white">
            Fin <span className="text-[#84cc16] transition-colors group-hover:text-[#a3e635]">Flip</span>
          </span>
          <span className="rounded-full border border-[#84cc16]/40 bg-[#84cc16]/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#84cc16]">
            AI
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden items-center gap-6 text-xs font-medium text-white/70 md:flex">
          {token && isAppRoute ? (
            <>
              <Link href="/dashboard" className="transition hover:text-white">Dashboard</Link>
              <Link href="/transactions" className="transition hover:text-white">Transactions</Link>
              <Link href="/budgets" className="transition hover:text-white">Budgets</Link>
              <Link href="/goals" className="transition hover:text-white">Goals</Link>
              <Link href="/documents" className="transition hover:text-white">Documents</Link>
              <Link href="/advisor" className="text-[#84cc16] font-semibold transition hover:text-white">AI Advisor</Link>
            </>
          ) : (
            <>
              <a href="#features" className="transition hover:text-white">Features</a>
              <a href="#ocr" className="transition hover:text-white">OCR Capture</a>
              <a href="#splitwise" className="transition hover:text-white">Splitwise</a>
              <a href="#knowledge" className="transition hover:text-white">Knowledge Engine</a>
              <a href="#how-it-works" className="transition hover:text-white">How It Works</a>
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
                className="rounded-full bg-[#84cc16] px-4 py-1.5 text-xs font-bold text-[#060B12] shadow-sm transition hover:bg-[#a3e635] hover:scale-105 active:scale-95"
              >
                Dashboard &rarr;
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/80 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/signin"
              className="px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-[#84cc16] px-4 py-1.5 text-xs font-bold text-[#060B12] shadow-sm transition hover:bg-[#a3e635] hover:scale-105 active:scale-95"
            >
              Start Flipping
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
