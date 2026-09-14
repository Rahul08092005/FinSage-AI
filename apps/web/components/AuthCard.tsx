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
        setSuccessMsg("Welcome back! Entering your workspace...");
        setTimeout(() => {
          window.location.href = returnTo;
        }, 500);
      } else {
        const data = await registerUser({ name, email, password });
        localStorage.setItem("finsage_token", data.token);
        setSuccessMsg("Account created! Redirecting to your ledger...");
        setTimeout(() => {
          window.location.href = returnTo;
        }, 500);
      }
    } catch (err: any) {
      if (err.message === "Failed to fetch" || err.message?.includes("fetch")) {
        setError(
          "Cannot connect to the FinSage BFF backend. Please ensure the backend service is running and accessible."
        );
      } else {
        setError(err.message || "Authentication failed. Please check your credentials.");
      }
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
    <div className="relative w-full max-w-[460px] mx-auto">
      {/* Subtle Ambient Glow (Fintech Energy) */}
      {!compact && (
        <>
          <div className="pointer-events-none absolute -top-8 -left-8 h-32 w-32 rounded-full bg-[#84cc16]/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-[#8B5CF6]/15 blur-3xl" />
        </>
      )}

      {/* Main Authentication Card */}
      <div className="relative z-20 overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E5DAC4] bg-[#FFFDF8] p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-serif text-2xl font-black tracking-tight text-[#18122B]">
              {mode === "signin" ? "Welcome to FinSage" : "Create your account"}
            </h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              {mode === "signin"
                ? "Your money workspace starts here."
                : "Set up your intelligent ledger in seconds."}
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-[#84cc16]/60 bg-[#84cc16]/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#365314]">
            AI
          </span>
        </div>

        {/* Segmented Mode Switcher */}
        <div className="mt-3.5 grid w-full grid-cols-2 rounded-full border border-line bg-paper p-1">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setError(null);
              setSuccessMsg(null);
            }}
            className={`rounded-full py-1.5 text-xs font-bold transition-all ${
              mode === "signin"
                ? "bg-[#18122B] text-white shadow-sm"
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
                ? "bg-[#18122B] text-white shadow-sm"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Quick Demo Credentials Row (Sign In Only - Compact) */}
        {mode === "signin" && (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-[#84cc16]/60 bg-[#84cc16]/10 px-3 py-1.5 text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs">⚡</span>
              <span className="font-semibold text-ink text-[11px] truncate">
                <span className="text-ink-muted font-normal">Try Demo:</span> demo@finsage.ai
              </span>
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              className="shrink-0 rounded-lg bg-[#18122B] px-2 py-1 text-[10px] font-bold text-white transition-all hover:bg-[#2e234e] active:scale-95"
            >
              Auto-fill
            </button>
          </div>
        )}

        {/* Status Alerts */}
        {error && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose/30 bg-rose-tint px-3 py-2 text-xs font-medium text-rose animate-in fade-in">
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
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-teal/30 bg-teal-tint px-3 py-2 text-xs font-medium text-teal animate-in fade-in">
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
        <form onSubmit={handleSubmit} className="mt-3 space-y-2.5">
          {/* Name Field (Sign Up Only) */}
          {mode === "signup" && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                Full Name
              </label>
              <div className="relative mt-1">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Radhika Sharma"
                  className="h-10 sm:h-11 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-subtle transition focus:border-[#84cc16] focus:bg-paper-sheet focus:outline-none focus:ring-2 focus:ring-[#84cc16]/20"
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-muted">
              Email Address
            </label>
            <div className="relative mt-1">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-10 sm:h-11 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-subtle transition focus:border-[#84cc16] focus:bg-paper-sheet focus:outline-none focus:ring-2 focus:ring-[#84cc16]/20"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-muted">
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
                  className="text-[11px] font-semibold text-[#8B5CF6] transition hover:underline"
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
                placeholder="••••••••••••"
                className="h-10 sm:h-11 w-full rounded-xl border border-line bg-paper px-3 py-2 pr-10 text-sm text-ink placeholder:text-ink-subtle transition focus:border-[#84cc16] focus:bg-paper-sheet focus:outline-none focus:ring-2 focus:ring-[#84cc16]/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink p-1"
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
              <div className="mt-1.5 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-semibold text-ink-muted">
                  <span>Strength: {passStrength.label}</span>
                  <span>{password.length >= 8 ? "✓ Length OK" : "Min 8 chars suggested"}</span>
                </div>
                <div className="grid grid-cols-4 gap-1 h-1 w-full">
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
              <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                Confirm Password
              </label>
              <div className="relative mt-1">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={`h-10 sm:h-11 w-full rounded-xl border px-3 py-2 pr-10 text-sm text-ink placeholder:text-ink-subtle transition focus:outline-none focus:ring-2 ${
                    confirmPassword
                      ? passwordsMatch
                        ? "border-teal bg-teal-tint/20 focus:ring-teal/20"
                        : "border-rose bg-rose-tint/20 focus:ring-rose/20"
                      : "border-line bg-paper focus:border-[#84cc16] focus:ring-[#84cc16]/20"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink p-1"
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
                <p className="mt-1 text-[10px] font-medium text-rose">Passwords do not match</p>
              )}
            </div>
          )}

          {/* Options: Remember Me (Sign In) or Terms Checkbox (Sign Up) */}
          {mode === "signin" ? (
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-ink-muted select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-line text-ink accent-[#18122B] focus:ring-0"
                />
                <span className="text-[11px]">Remember me on this device</span>
              </label>
            </div>
          ) : (
            <div className="pt-0.5">
              <label className="flex cursor-pointer items-start gap-2 text-xs font-medium text-ink-muted select-none">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-line text-ink accent-[#18122B] focus:ring-0"
                />
                <span className="text-[11px]">
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
            className="group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#84cc16] hover:bg-[#74b810] text-[#18122B] py-2.5 sm:py-3 text-sm font-black shadow-sm transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin text-[#18122B]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>{mode === "signin" ? "Signing In..." : "Creating Account..."}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <span>{mode === "signin" ? "Sign In" : "Create Account"}</span>
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
          </button>
        </form>

        {/* Alternate Navigation Switcher & Trust Microcopy */}
        <div className="mt-3.5 pt-3 border-t border-line/70 text-center space-y-1.5">
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
                className="font-bold text-[#18122B] hover:text-[#84cc16] transition hover:underline"
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
                className="font-bold text-[#18122B] hover:text-[#84cc16] transition hover:underline"
              >
                Sign in here
              </button>
            </p>
          )}
          <p className="text-[10px] text-ink-subtle">
            🔒 Private by design • Your financial data stays yours
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18122B]/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl border border-[#E5DAC4] bg-[#FFFDF8] p-6 shadow-2xl">
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
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8B5CF6]/10 text-[#8B5CF6] text-xl">
                🔑
              </div>
              <h3 className="mt-3 font-serif text-lg font-bold text-[#18122B]">Reset Password</h3>
              <p className="mt-1 text-xs text-ink-muted">
                Enter your registered email address to receive password reset instructions.
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
                  className="h-10 w-full rounded-xl border border-line bg-paper px-3.5 py-2 text-sm text-ink placeholder:text-ink-subtle transition focus:border-[#84cc16] focus:outline-none focus:ring-2 focus:ring-[#84cc16]/20"
                />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#18122B] py-2.5 text-xs font-bold text-white shadow transition hover:bg-[#2d234d] active:scale-95"
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
