"use client";
import { Suspense, useEffect, useState } from "react";
import { AuthCard } from "@/components/AuthCard";

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

  if (!token) {
    return (
      <div id="auth-section" className="mx-auto mt-6 max-w-md scroll-mt-24">
        <Suspense
          fallback={
            <div className="flex h-96 w-full items-center justify-center rounded-3xl border border-line bg-paper-sheet">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink border-t-transparent" />
            </div>
          }
        >
          <AuthCard compact initialMode="signin" />
        </Suspense>
      </div>
    );
  }

  return <>{children(token)}</>;
}
