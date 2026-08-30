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

  async function handleAuth(mode: "login" | "register") {
    setError(null);
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
    }
  }

  if (!token) {
    return (
      <div className="mx-auto mt-10 max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-navy">Sign in to continue</h2>
        <p className="mt-1 text-xs text-slate-500">
          Phase 1 demo credentials work here — register once, then reuse the same email/password.
        </p>
        <div className="mt-4 space-y-2">
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Name (register only)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => handleAuth("register")}
            className="flex-1 rounded-lg bg-teal px-3 py-2 text-sm font-medium text-white hover:bg-teal-light"
          >
            Register
          </button>
          <button
            onClick={() => handleAuth("login")}
            className="flex-1 rounded-lg bg-navy px-3 py-2 text-sm font-medium text-white hover:bg-navy-light"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return <>{children(token)}</>;
}
