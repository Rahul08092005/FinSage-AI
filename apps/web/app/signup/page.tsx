import { Suspense } from "react";
import { AuthCard } from "@/components/AuthCard";
import { Navbar } from "@/components/Navbar";

export const metadata = {
  title: "Create Account — Fin Flip AI",
  description: "Create your Fin Flip account and start tracking, understanding, splitting, and growing money with AI.",
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Navbar />

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Funky Floating Header Info */}
          <div className="mb-6 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#6366f1]/40 bg-[#6366f1]/10 px-3 py-1 text-xs font-bold text-[#6366f1] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#6366f1] animate-ping" />
              Join the Next-Gen Fintech
            </span>
            <h1 className="mt-3 font-serif text-3xl font-black tracking-tight text-ink sm:text-4xl">
              Start Flipping with <span className="text-[#84cc16]">Fin Flip</span>
            </h1>
            <p className="mt-1 text-xs text-ink-muted sm:text-sm">
              Track • Understand • Split • Grow with AI. Free forever for individuals.
            </p>
          </div>

          <Suspense
            fallback={
              <div className="flex h-96 w-full items-center justify-center rounded-3xl border border-line bg-paper-sheet">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink border-t-transparent" />
              </div>
            }
          >
            <AuthCard initialMode="signup" />
          </Suspense>

          {/* Trust Badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-[11px] font-medium text-ink-muted">
            <span className="flex items-center gap-1">
              <span>🚀</span> 10-Second Setup
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span>🧾</span> Automated Receipt OCR
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span>🔒</span> Bank-Level Security
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
