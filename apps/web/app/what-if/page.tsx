"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";

function WhatIfRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/experiments");
  }, [router]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 text-center">
      <div className="mx-auto w-10 h-10 rounded-full bg-lime-400/20 flex items-center justify-center text-sm animate-spin mb-3">
        ✦
      </div>
      <p className="text-xs font-semibold text-[#18122B]/70">
        Redirecting to Unified Experiments Workspace…
      </p>
    </div>
  );
}

export default function WhatIfPage() {
  return (
    <AppShell hideHeader={true}>
      {() => <WhatIfRedirect />}
    </AppShell>
  );
}
