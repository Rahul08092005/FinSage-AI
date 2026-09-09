import { Suspense } from "react";
import { AuthCard } from "@/components/AuthCard";
import { Navbar } from "@/components/Navbar";

export const metadata = {
  title: "Sign In — Fin Flip AI",
  description: "Sign in to access your personal wealth ledger, budgets, and AI financial advisor.",
};

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Navbar />

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Funky Floating Header Info */}
          <div className="mb-6 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#84cc16]/50 bg-[#84cc16]/15 px-3 py-1 text-xs font-bold text-ink shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#84cc16] animate-ping" />
              Secure Personal Ledger
            </span>
            <h1 className="mt-3 font-serif text-3xl font-black tracking-tight text-ink sm:text-4xl">
              Welcome Back to <span className="text-[#84cc16]">Fin Flip</span>
            </h1>
            <p className="mt-1 text-xs text-ink-muted sm:text-sm">
              Flip the way you handle money with AI-driven intelligence.
            </p>
          </div>

          <Suspense
            fallback={
              <div className="flex h-96 w-full items-center justify-center rounded-3xl border border-line bg-paper-sheet">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink border-t-transparent" />
              </div>
            }
          >
            <AuthCard initialMode="signin" />
          </Suspense>

          {/* Trust Badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-[11px] font-medium text-ink-muted">
            <span className="flex items-center gap-1">
              <span>🔐</span> 256-Bit Encrypted
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span>⚡</span> Real-time Double-Entry
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span>🤖</span> Groq AI Powered
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
