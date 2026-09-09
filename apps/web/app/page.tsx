"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootEntryPage() {
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("finsage_token") : null;
    if (token) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink border-t-transparent" />
        <p className="font-serif text-sm font-semibold text-ink">Fin <span className="text-[#84cc16]">Flip</span> AI</p>
        <p className="text-xs text-ink-muted">Opening financial workspace...</p>
      </div>
    </div>
  );
}
