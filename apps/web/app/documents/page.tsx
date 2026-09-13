"use client";

import { AppShell } from "@/components/AppShell";
import { DocumentUpload } from "@/components/DocumentUpload";

export default function DocumentsPage() {
  return (
    <AppShell
      title="The FinSage Vault"
      subtitle="Drop the paperwork. Let FinSage make sense of it."
      hideHeader={true}
    >
      {(token) => <DocumentUpload token={token} />}
    </AppShell>
  );
}
