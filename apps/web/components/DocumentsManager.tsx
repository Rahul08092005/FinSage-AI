"use client";
import { useEffect, useRef, useState } from "react";
import { getDocuments, getDocumentStatus, uploadDocument } from "@/lib/api";
import { DocumentReviewModal, ReviewDocument } from "./DocumentReviewModal";

interface DocumentItem {
  id: string;
  title: string;
  docType: string;
  status: "QUEUED" | "PROCESSING" | "NEEDS_REVIEW" | "COMPLETED" | "FAILED" | string;
  confidence: number | null;
  uploadedAt: string;
  extractedJson?: any;
}

export function DocumentsManager({ token }: { token: string }) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>("receipt");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Review Modal state
  const [reviewDoc, setReviewDoc] = useState<ReviewDocument | null>(null);
  const [isLoadingReview, setIsLoadingReview] = useState(false);

  // Load document list
  async function loadDocuments(quiet = false) {
    if (!quiet) setIsLoading(true);
    try {
      const data = await getDocuments(token);
      if (Array.isArray(data)) {
        setDocuments(data);
      }
    } catch (e: any) {
      console.error("[loadDocuments] Error:", e.message);
    } finally {
      if (!quiet) setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  // Automated polling: poll every 2.5s if any document is QUEUED or PROCESSING
  const hasPending = documents.some(
    (d) => d.status === "QUEUED" || d.status === "PROCESSING"
  );

  useEffect(() => {
    if (!hasPending) return;

    const interval = setInterval(() => {
      loadDocuments(true);
    }, 2500);

    return () => clearInterval(interval);
  }, [hasPending, documents]);

  // Handle file selection
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadError(null);
      setUploadSuccess(null);
    }
  }

  // Handle document upload
  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError("Please choose a file to upload.");
      return;
    }

    setUploadError(null);
    setUploadSuccess(null);
    setIsUploading(true);

    try {
      const res = await uploadDocument(token, selectedFile, docType);
      setUploadSuccess(`Document "${selectedFile.name}" submitted to processing queue.`);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      // Immediate refresh
      await loadDocuments(true);
    } catch (e: any) {
      setUploadError(e.message || "Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  }

  // Open review modal by fetching full document (which includes extractedJson)
  async function handleOpenReview(doc: DocumentItem) {
    setIsLoadingReview(true);
    try {
      const fullDoc = await getDocumentStatus(token, doc.id);
      setReviewDoc(fullDoc);
    } catch (e: any) {
      console.error("Failed to load document details for review:", e.message);
      // Fallback to existing item
      setReviewDoc(doc);
    } finally {
      setIsLoadingReview(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Voucher Section */}
      <div className="rounded-lg border border-line bg-paper-sheet p-6 shadow-subtle">
        <div className="border-b border-line pb-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-widest text-ink-subtle uppercase">
              Archival Intake Voucher
            </span>
            <span className="rounded border border-teal/30 bg-teal-tint px-2 py-0.5 text-[10px] font-semibold text-teal">
              OCR & AI Extraction
            </span>
          </div>
          <h2 className="mt-1 font-serif text-lg font-semibold tracking-tight text-ink">
            Submit Financial Document
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Upload digital receipts, invoices, or bank statements. Our parser extracts itemized
            transactions for ledger entry.
          </p>
        </div>

        <form onSubmit={handleUpload} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* File Input */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                Document File (PDF, PNG, JPG, CSV)
              </label>
              <div className="mt-1.5 flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.csv"
                  onChange={handleFileChange}
                  className="w-full rounded-md border border-line bg-paper px-3 py-2 text-xs text-ink file:mr-3 file:rounded file:border-0 file:bg-ink file:px-3 file:py-1 file:text-xs file:font-medium file:text-paper-sheet hover:file:bg-ink-light focus:border-teal focus:bg-paper-sheet focus:outline-none focus:ring-1 focus:ring-teal/30"
                />
              </div>
              {selectedFile && (
                <p className="mt-1 text-[11px] text-ink-muted">
                  Selected: <span className="font-mono font-medium text-ink">{selectedFile.name}</span>{" "}
                  ({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {/* Document Type */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                Document Type
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-line bg-paper px-3 py-2 text-xs font-medium text-ink transition focus:border-teal focus:bg-paper-sheet focus:outline-none focus:ring-1 focus:ring-teal/30"
              >
                <option value="receipt">Receipt (Expense Slip)</option>
                <option value="bank_statement">Bank Statement</option>
                <option value="other">Other Financial Document</option>
              </select>
            </div>
          </div>

          {/* Feedback Messages */}
          {uploadError && (
            <div className="rounded-md border border-rose/30 bg-rose-tint p-3 text-xs font-medium text-rose">
              ⚠ {uploadError}
            </div>
          )}

          {uploadSuccess && (
            <div className="rounded-md border border-teal/30 bg-teal-tint p-3 text-xs font-medium text-teal">
              ✓ {uploadSuccess}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-ink-subtle">
              Allowed types: receipt, bank_statement, other
            </span>
            <button
              type="submit"
              disabled={!selectedFile || isUploading}
              className="rounded-md bg-teal px-5 py-2 text-xs font-medium text-paper-sheet shadow-subtle transition-all hover:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal"
            >
              {isUploading ? "Uploading Document…" : "Upload & Begin Processing"}
            </button>
          </div>
        </form>
      </div>

      {/* Live Processing Status Ledger */}
      <div className="rounded-lg border border-line bg-paper-sheet p-6 shadow-subtle">
        <div className="flex flex-wrap items-center justify-between border-b border-line pb-4 gap-2">
          <div>
            <p className="text-[10px] font-bold tracking-widest text-ink-subtle uppercase">
              Extraction Processing Registry
            </p>
            <h3 className="mt-1 font-serif text-lg font-semibold tracking-tight text-ink">
              Submitted Documents & Live Extraction Status
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {hasPending && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/15 px-2.5 py-0.5 text-[11px] font-medium text-gold-dark">
                <span className="h-1.5 w-1.5 animate-ping rounded-full bg-gold"></span>
                Processing Live…
              </span>
            )}
            <button
              onClick={() => loadDocuments()}
              className="rounded-md border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-paper-sheet focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal"
            >
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Documents Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                <th className="py-2.5 pl-1 font-semibold">Date Uploaded</th>
                <th className="py-2.5 font-semibold">Document Title</th>
                <th className="py-2.5 font-semibold">Doc Type</th>
                <th className="py-2.5 font-semibold">Status</th>
                <th className="py-2.5 font-semibold">Confidence</th>
                <th className="py-2.5 pr-1 text-right font-semibold">Ledger Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="py-8 text-center font-serif text-sm italic text-ink-muted">
                    Retrieving document registry…
                  </td>
                </tr>
              )}

              {!isLoading && documents.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center font-serif text-sm italic text-ink-muted">
                    No documents uploaded yet. Upload a receipt or statement above to begin extraction.
                  </td>
                </tr>
              )}

              {!isLoading &&
                documents.map((doc) => {
                  const confPct =
                    doc.confidence != null ? Math.round(doc.confidence * 100) : null;
                  const isLowConf = confPct !== null && confPct < 85;

                  return (
                    <tr
                      key={doc.id}
                      className="transition-colors hover:bg-paper/40"
                    >
                      {/* Date */}
                      <td className="py-3 pl-1 text-xs text-ink-muted">
                        {new Date(doc.uploadedAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      {/* Title */}
                      <td className="py-3 font-medium text-ink">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold">{doc.title}</span>
                        </div>
                      </td>

                      {/* Doc Type */}
                      <td className="py-3">
                        <span className="inline-block rounded border border-line bg-paper px-2 py-0.5 text-[11px] font-medium text-ink-muted uppercase">
                          {doc.docType.replace("_", " ")}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3">
                        {doc.status === "QUEUED" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-2.5 py-0.5 text-[10px] font-semibold text-ink-muted uppercase tracking-wider">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-subtle"></span>
                            Queued
                          </span>
                        )}

                        {doc.status === "PROCESSING" && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/15 px-2.5 py-0.5 text-[10px] font-semibold text-gold-dark uppercase tracking-wider">
                            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-gold"></span>
                            Extracting…
                          </span>
                        )}

                        {doc.status === "NEEDS_REVIEW" && (
                          <span className="inline-flex items-center gap-1 rounded border border-gold/40 bg-gold-tint px-2 py-0.5 text-[10px] font-semibold text-gold-dark uppercase tracking-wider">
                            ⚠ Needs Review
                          </span>
                        )}

                        {doc.status === "COMPLETED" && (
                          <span className="inline-flex items-center gap-1 rounded border border-teal/30 bg-teal-tint px-2 py-0.5 text-[10px] font-semibold text-teal uppercase tracking-wider">
                            ✓ Reconciled
                          </span>
                        )}

                        {doc.status === "FAILED" && (
                          <span className="inline-flex items-center gap-1 rounded border border-rose/30 bg-rose-tint px-2 py-0.5 text-[10px] font-semibold text-rose uppercase tracking-wider">
                            ✕ Failed
                          </span>
                        )}
                      </td>

                      {/* Confidence */}
                      <td className="py-3">
                        {confPct !== null ? (
                          <span
                            className={`inline-block rounded px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
                              isLowConf
                                ? "border border-gold/40 bg-gold-tint text-gold-dark"
                                : "border border-teal/30 bg-teal-tint text-teal"
                            }`}
                          >
                            {confPct}% {isLowConf ? "(Low)" : "(High)"}
                          </span>
                        ) : (
                          <span className="text-xs text-ink-subtle">—</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 pr-1 text-right">
                        {doc.status === "NEEDS_REVIEW" ? (
                          <button
                            onClick={() => handleOpenReview(doc)}
                            disabled={isLoadingReview}
                            className="rounded-md bg-gold px-3 py-1.5 text-xs font-semibold text-paper-sheet shadow-subtle transition-all hover:bg-gold-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold"
                          >
                            Review Extractions
                          </button>
                        ) : doc.status === "COMPLETED" ? (
                          <button
                            onClick={() => handleOpenReview(doc)}
                            disabled={isLoadingReview}
                            className="rounded border border-line bg-paper px-2.5 py-1 text-xs font-medium text-ink-muted transition-colors hover:bg-paper-sheet hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal"
                          >
                            View Entries
                          </button>
                        ) : doc.status === "FAILED" ? (
                          <span className="text-xs text-rose">Check file</span>
                        ) : (
                          <span className="font-serif text-xs italic text-ink-subtle">
                            Processing…
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {reviewDoc && (
        <DocumentReviewModal
          token={token}
          document={reviewDoc}
          onClose={() => setReviewDoc(null)}
          onConfirmed={() => {
            loadDocuments(true);
          }}
        />
      )}
    </div>
  );
}
