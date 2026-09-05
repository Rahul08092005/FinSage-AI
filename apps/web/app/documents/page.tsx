"use client";
import { AuthGate } from "@/components/AuthGate";
import { DocumentUpload } from "@/components/DocumentUpload";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";

export default function DocumentsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8">
          <div className="border-b border-line pb-4">
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink md:text-3xl">
              Document Upload
            </h1>
            <p className="mt-1 text-xs text-ink-muted">
              Live OCR extraction, status tracking, and extraction review — Phase 3.
            </p>
          </div>
          <div className="mt-6">
            <AuthGate>{(token) => <DocumentUpload token={token} />}</AuthGate>
          </div>
        </main>
      </div>
    </div>
  );
}
