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
    <header className="flex items-center justify-between border-b border-ink/40 bg-ink px-6 py-3.5 shadow-subtle">
      <div className="flex items-center gap-3">
        <div className="flex items-center">
          <span className="font-serif text-lg font-semibold tracking-tight text-paper-sheet">
            FinSage
          </span>
          <span className="ml-1.5 rounded border border-gold/40 bg-gold/15 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-gold-light uppercase">
            AI
          </span>
        </div>
        <span className="hidden text-xs text-ink-subtle md:inline-block">/</span>
        <span className="hidden font-serif text-xs italic text-ink-subtle md:inline-block">
          Personal Wealth Ledger
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/40 bg-teal/15 px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-teal-light">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-light"></span>
          Phase 2 — Core
        </span>
        {token && (
          <button
            onClick={handleLogout}
            className="rounded-md border border-line-dark/30 bg-ink-light/80 px-2.5 py-1 text-xs font-medium text-paper-sheet transition-colors hover:border-line hover:bg-ink-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal"
          >
            Logout
          </button>
        )}
      </div>
    </header>
  );
}
