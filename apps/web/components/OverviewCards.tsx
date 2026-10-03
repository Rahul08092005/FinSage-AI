"use client";

import { AuthGate } from "@/components/AuthGate";
import { CompactDashboard } from "@/components/CompactDashboard";

function AuthenticatedOverviewCards({ token }: { token: string }) {
  return <CompactDashboard token={token} />;
}

export function OverviewCards() {
  return (
    <AuthGate>
      {(token) => <AuthenticatedOverviewCards token={token} />}
    </AuthGate>
  );
}


