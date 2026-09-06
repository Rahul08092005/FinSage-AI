"use client";
// Person 4 owns this file. Minimal client-side session handling so the
// Phase 2 pages (Transactions/Budgets/Goals) can call authenticated BFF
// routes. A real session/JWT-refresh flow is a later-phase concern —
// this just proves the auth token round-trips correctly end to end.
import { useEffect, useState } from "react";

const BFF_URL = process.env.NEXT_PUBLIC_BFF_URL || "http://localhost:4000";

export function useToken() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem("finsage_token"));
  }, []);

  return token;
}

export function AuthGate({ children }: { children: (token: string) => React.ReactNode }) {
  const token = useToken();
  const [email, setEmail] = useState("demo@finsage.ai");
  const [password, setPassword] = useState("demo1234");
  const [name, setName] = useState("Demo User");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleAuth(mode: "login" | "register") {
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch(`${BFF_URL}/api/v1/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "register" ? { name, email, password } : { email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.formErrors?.join(", ") || "Auth failed");
      localStorage.setItem("finsage_token", data.token);
      window.location.reload();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="mx-auto mt-12 max-w-md rounded-lg border border-line bg-paper-sheet p-8 shadow-ledger">
        <div className="border-b border-line pb-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-widest text-ink-subtle uppercase">
              Account Authentication
            </span>
            <span className="rounded border border-teal/30 bg-teal-tint px-2 py-0.5 text-[10px] font-semibold text-teal">
              Secure Ledger
            </span>
          </div>
          <h2 className="mt-2 font-serif text-xl font-semibold tracking-tight text-ink">
            Sign in to your Ledger
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">
            Enter your credentials below. Register once to create your personal wealth database.
          </p>
        </div>

        <div className="mt-6 space-y-3.5">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              Account Holder Name <span className="text-ink-subtle font-normal">(Register only)</span>
            </label>
            <input
              className="mt-1.5 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-subtle transition focus:border-teal focus:bg-paper-sheet focus:outline-none focus:ring-1 focus:ring-teal/30"
              placeholder="e.g. Radhika Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              Email Address
            </label>
            <input
              className="mt-1.5 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-subtle transition focus:border-teal focus:bg-paper-sheet focus:outline-none focus:ring-1 focus:ring-teal/30"
              placeholder="name@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              Password
            </label>
            <input
              className="mt-1.5 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-subtle transition focus:border-teal focus:bg-paper-sheet focus:outline-none focus:ring-1 focus:ring-teal/30"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-rose/30 bg-rose-tint p-3 text-xs font-medium text-rose">
            ⚠ {error}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => handleAuth("register")}
            disabled={isLoading}
            className="flex-1 rounded-md bg-teal px-4 py-2.5 text-sm font-medium text-paper-sheet shadow-subtle transition-all hover:bg-teal-dark disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal"
          >
            {isLoading ? "Processing…" : "Register"}
          </button>
          <button
            onClick={() => handleAuth("login")}
            disabled={isLoading}
            className="flex-1 rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-paper-sheet shadow-subtle transition-all hover:bg-ink-light disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink"
          >
            {isLoading ? "Processing…" : "Sign In"}
          </button>
        </div>
      </div>
    );
  }

  return <>{children(token)}</>;
}
