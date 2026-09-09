"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginUser, registerUser } from "@/lib/api";

interface AuthCardProps {
  initialMode?: "signin" | "signup";
  redirectUrl?: string;
  compact?: boolean;
}

export function AuthCard({
  initialMode = "signin",
  redirectUrl = "/dashboard",
  compact = false,
}: AuthCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawReturn = searchParams?.get("redirect") || redirectUrl;
  const returnTo = rawReturn === "/" ? "/dashboard" : rawReturn;

  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  // Restore remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("finsage_remembered_email");
    if (savedEmail && !email) {
      setEmail(savedEmail);
    }
  }, []);

  // Update mode if prop changes
  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setSuccessMsg(null);
  }, [initialMode]);

  // Quick fill demo user
  function handleFillDemo() {
    setEmail("demo@finsage.ai");
    setPassword("demo1234");
    setError(null);
  }

  // Password strength calculation
  function calculatePasswordStrength(pass: string): {
    score: number;
    label: string;
    color: string;
  } {
    if (!pass) return { score: 0, label: "Empty", color: "bg-line" };
    let s = 0;
    if (pass.length >= 6) s += 1;
    if (pass.length >= 8) s += 1;
    if (/[0-9]/.test(pass)) s += 1;
    if (/[^A-Za-z0-9]/.test(pass) || /[A-Z]/.test(pass)) s += 1;

    switch (s) {
      case 1:
        return { score: 1, label: "Weak", color: "bg-rose" };
      case 2:
        return { score: 2, label: "Fair", color: "bg-amber-500" };
      case 3:
        return { score: 3, label: "Good", color: "bg-blue-500" };
      case 4:
      default:
        return { score: 4, label: "Strong", color: "bg-teal" };
    }
  }

  const passStrength = calculatePasswordStrength(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (mode === "signup") {
      if (!name.trim()) {
        setError("Please provide your full name.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (!agreeTerms) {
        setError("Please agree to the Terms of Service to continue.");
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === "signin") {
        const data = await loginUser({ email, password });
        if (rememberMe) {
          localStorage.setItem("finsage_remembered_email", email);
        } else {
          localStorage.removeItem("finsage_remembered_email");
        }
        localStorage.setItem("finsage_token", data.token);
        setSuccessMsg("Welcome back! Redirecting to your ledger...");
        setTimeout(() => {
          window.location.href = returnTo;
        }, 600);
      } else {
        const data = await registerUser({ name, email, password });
        localStorage.setItem("finsage_token", data.token);
        setSuccessMsg("Account created! Flipping your financial dashboard...");
        setTimeout(() => {
          window.location.href = returnTo;
        }, 600);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSent(true);
  }

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Playful Ambient Halos (Fintech Energy) */}
      {!compact && (
        <>
          <div className="pointer-events-none absolute -top-10 -left-12 h-44 w-44 rounded-full bg-[#84cc16]/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -right-12 h-44 w-44 rounded-full bg-[#6366f1]/20 blur-3xl" />
          <div className="pointer-events-none absolute top-1/2 -right-8 h-28 w-28 rounded-full bg-amber-400/20 blur-2xl" />

          {/* Floating Playful Accents (Inspired by Funky Fintech Energy) */}
          <div className="pointer-events-none hidden lg:block absolute -left-20 top-8 z-10 animate-bounce duration-1000">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-paper-sheet p-2 shadow-ledger rotate-[-12deg]">
              <span className="text-xl">💰</span>
            </div>
          </div>

          <div className="pointer-events-none hidden lg:block absolute -right-20 bottom-12 z-10 animate-pulse">
            <div className="flex items-center gap-2 rounded-2xl border border-line bg-paper-sheet px-3 py-1.5 shadow-ledger rotate-[8deg]">
              <span className="h-2 w-2 rounded-full bg-[#84cc16]" />
              <span className="font-mono text-[11px] font-bold text-ink">₹ +14% APY</span>
            </div>
          </div>
        </>
      )}

      {/* Main Authentication Card */}
      <div className="relative z-20 overflow-hidden rounded-3xl border border-line bg-paper-sheet p-6 shadow-ledger sm:p-8">
        
        {/* Brand Header & Mode Switcher */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-1.5">
            <span className="font-serif text-2xl font-black tracking-tight text-ink">
              Fin <span className="text-[#84cc16]">Flip</span>
            </span>
            <span className="rounded-full border border-[#84cc16]/50 bg-[#84cc16]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink">
              AI Auth
            </span>
          </div>

          <p className="mt-1 text-xs text-ink-muted">
            {mode === "signin"
              ? "Sign in to flip the way you manage, track, and grow money"
              : "Create your personal double-entry ledger and AI wealth co-pilot"}
          </p>

          {/* Mode Switcher Tabs */}
          <div className="mt-5 grid w-full grid-cols-2 rounded-full border border-line bg-paper p-1 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError(null);
                setSuccessMsg(null);
              }}
              className={`rounded-full py-1.5 text-xs font-bold transition-all ${
                mode === "signin"
                  ? "bg-ink text-paper-sheet shadow-sm"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError(null);
                setSuccessMsg(null);
              }}
              className={`rounded-full py-1.5 text-xs font-bold transition-all ${
                mode === "signup"
                  ? "bg-ink text-paper-sheet shadow-sm"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Demo Credentials Quick-Fill Banner */}
        {mode === "signin" && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-dashed border-[#84cc16]/60 bg-[#84cc16]/10 px-3 py-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">⚡</span>
              <span className="font-medium text-ink">Quick Demo Account</span>
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              className="rounded-lg bg-ink px-2.5 py-1 text-[11px] font-bold text-paper-sheet transition-all hover:bg-ink-light active:scale-95"
            >
              Auto-fill
            </button>
          </div>
        )}

        {/* Status Alerts */}
        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose/30 bg-rose-tint p-3 text-xs font-medium text-rose animate-in fade-in">
            <svg className="h-4 w-4 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-teal/30 bg-teal-tint p-3 text-xs font-medium text-teal animate-in fade-in">
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
          {/* Name Field (Sign Up Only) */}
          {mode === "signup" && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                Full Name
              </label>
              <div className="relative mt-1">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Radhika Sharma"
                  className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-subtle transition focus:border-ink focus:bg-paper-sheet focus:outline-none focus:ring-2 focus:ring-ink/10"
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-muted">
              Email Address
            </label>
            <div className="relative mt-1">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-subtle transition focus:border-ink focus:bg-paper-sheet focus:outline-none focus:ring-2 focus:ring-ink/10"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                Password
              </label>
              {mode === "signin" && (
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setForgotSent(false);
                    setShowForgotModal(true);
                  }}
                  className="text-[11px] font-semibold text-[#6366f1] transition hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 pr-10 text-sm text-ink placeholder:text-ink-subtle transition focus:border-ink focus:bg-paper-sheet focus:outline-none focus:ring-2 focus:ring-ink/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Password Strength Meter (Sign Up Only) */}
            {mode === "signup" && password.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-semibold text-ink-muted">
                  <span>Strength: {passStrength.label}</span>
                  <span>{password.length >= 8 ? "✓ Length OK" : "Min 8 chars suggested"}</span>
                </div>
                <div className="grid grid-cols-4 gap-1 h-1.5 w-full">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-full rounded-full transition-all duration-300 ${
                        step <= passStrength.score ? passStrength.color : "bg-line"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field (Sign Up Only) */}
          {mode === "signup" && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                Confirm Password
              </label>
              <div className="relative mt-1">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full rounded-xl border px-3.5 py-2.5 pr-10 text-sm text-ink placeholder:text-ink-subtle transition focus:outline-none focus:ring-2 ${
                    confirmPassword
                      ? passwordsMatch
                        ? "border-teal bg-teal-tint/20 focus:ring-teal/20"
                        : "border-rose bg-rose-tint/20 focus:ring-rose/20"
                      : "border-line bg-paper focus:border-ink focus:ring-ink/10"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="mt-1 text-[11px] font-medium text-rose">Passwords do not match</p>
              )}
            </div>
          )}

          {/* Options: Remember Me (Sign In) or Terms Checkbox (Sign Up) */}
          {mode === "signin" ? (
            <div className="flex items-center justify-between pt-1">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-ink-muted select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-line text-ink accent-ink focus:ring-ink"
                />
                <span>Remember me on this device</span>
              </label>
            </div>
          ) : (
            <div className="pt-1">
              <label className="flex cursor-pointer items-start gap-2 text-xs font-medium text-ink-muted select-none">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-line text-ink accent-ink focus:ring-ink"
                />
                <span>
                  I agree to the <span className="font-semibold text-ink underline">Terms of Service</span> and{" "}
                  <span className="font-semibold text-ink underline">Privacy Policy</span>.
                </span>
              </label>
            </div>
          )}

          {/* Primary Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-ink py-3 text-sm font-bold text-paper-sheet shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-ink-light hover:shadow-lg active:scale-95 disabled:pointer-events-none disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin text-paper-sheet" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>{mode === "signin" ? "Signing In..." : "Creating Account..."}</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>{mode === "signin" ? "Sign In" : "Create My Account"}</span>
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
            )}
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-[#84cc16]/20 via-[#6366f1]/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
          </button>
        </form>

        {/* Alternate Navigation Switcher */}
        <div className="mt-6 border-t border-line pt-4 text-center">
          {mode === "signin" ? (
            <p className="text-xs text-ink-muted">
              Don&apos;t have an account yet?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="font-bold text-[#84cc16] hover:underline"
              >
                Sign up for free
              </button>
            </p>
          ) : (
            <p className="text-xs text-ink-muted">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="font-bold text-ink hover:underline"
              >
                Sign in here
              </button>
            </p>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl border border-line bg-paper-sheet p-6 shadow-2xl">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute right-4 top-4 rounded-full border border-line bg-paper p-1 text-ink-muted hover:text-ink"
              aria-label="Close modal"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6366f1]/10 text-[#6366f1] text-xl">
                🔑
              </div>
              <h3 className="mt-3 font-serif text-lg font-bold text-ink">Reset Password</h3>
              <p className="mt-1 text-xs text-ink-muted">
                Enter your registered email address and we&apos;ll send you a password reset simulation link.
              </p>
            </div>

            {forgotSent ? (
              <div className="mt-4 rounded-2xl border border-teal/30 bg-teal-tint p-4 text-center">
                <p className="text-xs font-semibold text-teal">
                  ✓ Reset link sent to <span className="font-bold">{forgotEmail}</span>!
                </p>
                <p className="mt-1 text-[11px] text-teal/80">
                  In this demo environment, you can also log in directly using the pre-seeded demo user.
                </p>
                <button
                  onClick={() => setShowForgotModal(false)}
                  className="mt-3 w-full rounded-xl bg-teal py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-dark"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="mt-4 space-y-3">
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-subtle transition focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
                />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-ink py-2.5 text-xs font-bold text-paper-sheet shadow transition hover:bg-ink-light active:scale-95"
                >
                  Send Reset Link
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
