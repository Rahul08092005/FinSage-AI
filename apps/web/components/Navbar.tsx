"use client";
import { useEffect, useState } from "react";

export function Navbar() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem("finsage_token"));
  }, []);

  function handleLogout() {
    localStorage.removeItem("finsage_token");
    window.location.reload();
  }

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-ink/40 bg-ink/95 px-6 py-3.5 shadow-subtle backdrop-blur-md">
      <div className="flex items-center gap-4">
        <a href={token ? "/dashboard" : "/login"} className="flex items-center transition-opacity hover:opacity-90">
          <span className="font-serif text-xl font-black tracking-tight text-paper-sheet">
            Fin <span className="text-[#a3e635]">Flip</span>
          </span>
          <span className="ml-1.5 rounded border border-[#84cc16]/50 bg-[#84cc16]/20 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-[#a3e635] uppercase">
            AI
          </span>
        </a>
        <span className="hidden text-xs text-ink-subtle md:inline-block">/</span>
        <span className="hidden font-serif text-xs italic text-ink-subtle lg:inline-block">
          Personal Wealth Workspace
        </span>

        {/* Quick Nav Links */}
        <nav className="hidden items-center gap-4 pl-2 md:flex text-xs font-medium text-paper-sheet/80">
          <a href="/dashboard" className="transition-colors hover:text-[#a3e635]">Dashboard</a>
          <a href="/transactions" className="transition-colors hover:text-[#a3e635]">Transactions</a>
          <a href="/budgets" className="transition-colors hover:text-[#a3e635]">Budgets</a>
          <a href="/goals" className="transition-colors hover:text-[#a3e635]">Goals</a>
          <a href="/documents" className="transition-colors hover:text-[#a3e635]">Documents</a>
          <a href="/advisor" className="transition-colors hover:text-[#a3e635] text-indigo-300 font-semibold">AI Advisor</a>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-teal/40 bg-teal/15 px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-teal-light">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-light"></span>
          Live Core
        </span>
        {token ? (
          <button
            onClick={handleLogout}
            className="rounded-md border border-line-dark/30 bg-ink-light/80 px-3 py-1.5 text-xs font-medium text-paper-sheet transition-colors hover:border-line hover:bg-ink-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal"
          >
            Logout
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <a
              href="/signin"
              className="rounded-full border border-paper-sheet/30 bg-transparent px-3.5 py-1 text-xs font-bold text-paper-sheet transition-all hover:bg-paper-sheet/10"
            >
              Sign In
            </a>
            <a
              href="/signup"
              className="rounded-full bg-[#84cc16] px-3.5 py-1 text-xs font-bold text-ink shadow-sm transition-all hover:bg-[#a3e635] hover:scale-105 active:scale-95"
            >
              Sign Up
            </a>
          </div>
        )}
      </div>
    </header>
  );
}
