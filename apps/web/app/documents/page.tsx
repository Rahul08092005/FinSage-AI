"use client";

import { AppShell } from "@/components/AppShell";
import { DocumentUpload } from "@/components/DocumentUpload";

export default function DocumentsPage() {
  return (
    <AppShell
      title="Document Upload"
      subtitle="Live OCR extraction, status tracking, and extraction review — Phase 3."
    >
      {(token) => <DocumentUpload token={token} />}
    </AppShell>
  );
}
