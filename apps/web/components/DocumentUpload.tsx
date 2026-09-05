"use client";
import { useEffect, useRef, useState } from "react";
import { confirmDocument, getDocuments, getDocumentStatus, uploadDocument } from "@/lib/api";

const CATEGORIES = ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Other"];

interface DocumentItem {
  id: string;
  title: string;
  docType: string;
  status: string;
  confidence: number | null;
  uploadedAt: string;
  extractedJson?: any;
}

interface EditableTransactionRow {
  amount: string | number;
  description: string;
  category: string;
  transactionDate: string;
  accountId?: string;
}

export function DocumentUpload({ token }: { token: string }) {
  // 1. Upload Form state
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<"receipt" | "bank_statement">("receipt");
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 2. Active Polling & Current Document state
  const [currentDoc, setCurrentDoc] = useState<DocumentItem | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 3. Past documents state
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  // 4. Review Section state (for status === NEEDS_REVIEW)
  const [reviewDoc, setReviewDoc] = useState<DocumentItem | null>(null);
  const [reviewRows, setReviewRows] = useState<EditableTransactionRow[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  function stopPolling() {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }

  // Clear polling interval on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  // Fetch past documents
  async function loadDocuments() {
    setLoadingDocs(true);
    try {
      const docs = await getDocuments(token);
      if (Array.isArray(docs)) {
        setDocuments(docs);
      }
    } catch (e: any) {
      console.error("[loadDocuments] error:", e.message);
    } finally {
      setLoadingDocs(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  // Initialize review rows from extractedJson
  function setupReviewSection(doc: DocumentItem) {
    setReviewDoc(doc);
    setReviewError(null);
    setReviewSuccess(null);

    let rawList: any[] = [];
    if (Array.isArray(doc.extractedJson)) {
      rawList = doc.extractedJson;
    } else if (doc.extractedJson && Array.isArray(doc.extractedJson.transactions)) {
      rawList = doc.extractedJson.transactions;
    }

    if (rawList.length > 0) {
      setReviewRows(
        rawList.map((r) => ({
          amount: r.amount ?? "",
          description: r.description ?? r.narration ?? r.vendor ?? r.title ?? "Extracted item",
          category: r.category && CATEGORIES.includes(r.category) ? r.category : "Food",
          transactionDate: r.transactionDate || r.transaction_date || r.date
            ? new Date(r.transactionDate || r.transaction_date || r.date).toISOString().slice(0, 10)
            : new Date().toISOString().slice(0, 10),
          accountId: r.accountId,
        }))
      );
    } else {
      setReviewRows([
        {
          amount: "",
          description: doc.title.replace(/\.[^/.]+$/, ""),
          category: "Food",
          transactionDate: new Date().toISOString().slice(0, 10),
        },
      ]);
    }
  }

  // Polling logic for uploaded document
  function startPolling(id: string) {
    stopPolling();
    pollIntervalRef.current = setInterval(async () => {
      try {
        const doc = await getDocumentStatus(token, id);
        setCurrentDoc(doc);

        if (doc.status !== "QUEUED" && doc.status !== "PROCESSING") {
          stopPolling();
          loadDocuments();

          if (doc.status === "NEEDS_REVIEW") {
            setupReviewSection(doc);
          }
        }
      } catch (err: any) {
        console.error("[polling error]:", err.message);
        stopPolling();
      }
    }, 2000);
  }

  // Handle file selection
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadError(null);
      setUploadMessage(null);
    }
  }

  // Handle upload
  async function handleUpload() {
    if (!file) {
      setUploadError("Please select a file first");
      return;
    }

    setUploadError(null);
    setUploadMessage(null);
    setUploading(true);

    try {
      const res = await uploadDocument(token, file, docType);
      setUploadMessage("Uploaded successfully. Processing queued.");

      const initialDoc: DocumentItem = {
        id: res.documentId,
        title: file.name,
        docType: docType,
        status: res.status || "QUEUED",
        confidence: null,
        uploadedAt: new Date().toISOString(),
      };
      setCurrentDoc(initialDoc);

      // Reset file input
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Start polling every 2 seconds until no longer QUEUED/PROCESSING
      startPolling(res.documentId);
      loadDocuments();
    } catch (e: any) {
      setUploadError(e.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  }

  // Review row editing
  function handleRowChange(index: number, field: keyof EditableTransactionRow, value: string) {
    setReviewRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function handleAddRow() {
    setReviewRows((prev) => [
      ...prev,
      {
        amount: "",
        description: "",
        category: "Food",
        transactionDate: new Date().toISOString().slice(0, 10),
      },
    ]);
  }

  function handleRemoveRow(index: number) {
    if (reviewRows.length <= 1) return;
    setReviewRows((prev) => prev.filter((_, i) => i !== index));
  }

  // Confirm all extracted rows
  async function handleConfirmAll() {
    if (!reviewDoc) return;

    const invalid = reviewRows.some(
      (r) => !r.description?.trim() || isNaN(parseFloat(String(r.amount))) || parseFloat(String(r.amount)) <= 0
    );

    if (invalid) {
      setReviewError("Each row must have a valid positive amount and description.");
      return;
    }

    setConfirming(true);
    setReviewError(null);

    try {
      const formatted = reviewRows.map((r) => ({
        amount: parseFloat(String(r.amount)),
        category: r.category || "Other",
        transactionDate: new Date(r.transactionDate || Date.now()).toISOString(),
        description: r.description.trim(),
        accountId: r.accountId,
      }));

      await confirmDocument(token, reviewDoc.id, formatted);
      setReviewSuccess("Transactions confirmed and recorded in ledger.");

      // Refresh documents list
      await loadDocuments();

      // Update currentDoc if same
      if (currentDoc && currentDoc.id === reviewDoc.id) {
        setCurrentDoc({ ...currentDoc, status: "COMPLETED" });
      }

      // Close review section after brief confirmation
      setTimeout(() => {
        setReviewDoc(null);
        setReviewSuccess(null);
      }, 1500);
    } catch (e: any) {
      setReviewError(e.message || "Failed to confirm document");
    } finally {
      setConfirming(false);
    }
  }

  // Load a past document into review
  async function openReviewForDoc(doc: DocumentItem) {
    try {
      const full = await getDocumentStatus(token, doc.id);
      setupReviewSection(full);
    } catch (e) {
      setupReviewSection(doc);
    }
  }

  // Status badge helper using existing color tokens
  function renderStatusBadge(status: string) {
    switch (status) {
      case "QUEUED":
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1 rounded border border-gold/40 bg-gold/15 px-2.5 py-0.5 text-xs font-semibold text-gold-dark uppercase tracking-wider">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
            {status}
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 rounded border border-teal/30 bg-teal-tint px-2.5 py-0.5 text-xs font-semibold text-teal uppercase tracking-wider">
            ✓ {status}
          </span>
        );
      case "NEEDS_REVIEW":
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 rounded border border-rose/30 bg-rose-tint px-2.5 py-0.5 text-xs font-semibold text-rose uppercase tracking-wider">
            ⚠ {status}
          </span>
        );
      default:
        return (
          <span className="rounded border border-line bg-paper px-2.5 py-0.5 text-xs font-semibold text-ink-muted uppercase tracking-wider">
            {status}
          </span>
        );
    }
  }

  return (
    <div className="rounded-lg border border-line bg-paper-sheet p-6 shadow-subtle">
      {/* 1. Document Upload Form (styled consistently with TransactionsTable's add-form) */}
      <div className="border-b border-line pb-5">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          New Document Voucher
        </p>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.csv"
            onChange={handleFileChange}
            className="rounded-md border border-line bg-paper px-3 py-1.5 text-sm text-ink file:mr-3 file:rounded file:border-0 file:bg-ink file:px-3 file:py-1 file:text-xs file:font-medium file:text-paper-sheet hover:file:bg-ink-light focus:border-teal focus:bg-paper-sheet focus:outline-none focus:ring-1 focus:ring-teal/30"
          />

          {/* DocType Select */}
          <select
            className="rounded-md border border-line bg-paper px-3 py-2 text-sm font-medium text-ink transition focus:border-teal focus:bg-paper-sheet focus:outline-none focus:ring-1 focus:ring-teal/30"
            value={docType}
            onChange={(e) => setDocType(e.target.value as "receipt" | "bank_statement")}
          >
            <option value="receipt">receipt</option>
            <option value="bank_statement">bank_statement</option>
          </select>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="rounded-md bg-teal px-4 py-2 text-sm font-medium text-paper-sheet shadow-subtle transition-all hover:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal"
          >
            {uploading ? "Uploading…" : "Upload Document"}
          </button>

          {uploadMessage && (
            <span className="inline-flex items-center gap-1 rounded border border-teal/30 bg-teal-tint px-2.5 py-1 text-xs font-medium text-teal">
              ✓ {uploadMessage}
            </span>
          )}

          {uploadError && (
            <span className="inline-flex items-center gap-1 rounded border border-rose/30 bg-rose-tint px-2.5 py-1 text-xs font-medium text-rose">
              ⚠ {uploadError}
            </span>
          )}
        </div>

        {/* 3. Current Processing Status Badge */}
        {currentDoc && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md border border-line/70 bg-paper/40 p-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              Current Document Status:
            </span>
            <span className="font-mono text-xs font-semibold text-ink">{currentDoc.title}</span>
            <span className="inline-block rounded border border-line bg-paper px-2 py-0.5 text-[11px] text-ink-muted uppercase">
              {currentDoc.docType}
            </span>
            {renderStatusBadge(currentDoc.status)}
            {currentDoc.confidence != null && (
              <span className="font-serif text-xs tabular-nums text-ink-muted">
                Confidence: {Math.round(currentDoc.confidence * 100)}%
              </span>
            )}
          </div>
        )}
      </div>

      {/* 5. Review Section (Rendered when document status is NEEDS_REVIEW) */}
      {reviewDoc && (
        <div className="my-6 rounded-md border border-gold/40 bg-gold/10 p-5">
          <div className="flex flex-wrap items-center justify-between border-b border-gold/30 pb-3 gap-2">
            <div>
              <span className="rounded border border-rose/30 bg-rose-tint px-2 py-0.5 text-[10px] font-semibold text-rose uppercase tracking-wider">
                Needs Review
              </span>
              <h3 className="mt-1 font-serif text-lg font-semibold text-ink">
                Review Extracted Transactions — {reviewDoc.title}
              </h3>
              <p className="text-xs text-ink-muted">
                Low-confidence or automated extraction requires ledger verification before confirmation.
              </p>
            </div>

            <button
              onClick={() => setReviewDoc(null)}
              className="rounded border border-line bg-paper px-2.5 py-1 text-xs font-medium text-ink-muted transition hover:bg-paper-sheet hover:text-ink"
            >
              Close Review
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                  <th className="w-36 py-2">Date</th>
                  <th className="py-2">Description</th>
                  <th className="w-40 py-2">Category</th>
                  <th className="w-32 py-2 pr-2 text-right">Amount (₹)</th>
                  <th className="w-10 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {reviewRows.map((row, idx) => (
                  <tr key={idx} className="transition-colors hover:bg-paper/30">
                    <td className="py-2 pr-2">
                      <input
                        type="date"
                        className="w-full rounded border border-line bg-paper px-2 py-1.5 text-xs text-ink transition focus:border-teal focus:bg-paper-sheet focus:outline-none focus:ring-1 focus:ring-teal/30"
                        value={row.transactionDate}
                        onChange={(e) => handleRowChange(idx, "transactionDate", e.target.value)}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        type="text"
                        placeholder="Description"
                        className="w-full rounded border border-line bg-paper px-2.5 py-1.5 text-xs text-ink transition focus:border-teal focus:bg-paper-sheet focus:outline-none focus:ring-1 focus:ring-teal/30"
                        value={row.description}
                        onChange={(e) => handleRowChange(idx, "description", e.target.value)}
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <select
                        className="w-full rounded border border-line bg-paper px-2 py-1.5 text-xs font-medium text-ink transition focus:border-teal focus:bg-paper-sheet focus:outline-none focus:ring-1 focus:ring-teal/30"
                        value={row.category}
                        onChange={(e) => handleRowChange(idx, "category", e.target.value)}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-2">
                      <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 font-serif text-xs font-semibold text-ink-subtle">
                          ₹
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="w-full rounded border border-line bg-paper py-1.5 pl-5 pr-2 text-right font-serif text-xs font-semibold tabular-nums text-ink transition focus:border-teal focus:bg-paper-sheet focus:outline-none focus:ring-1 focus:ring-teal/30"
                          value={row.amount}
                          onChange={(e) => handleRowChange(idx, "amount", e.target.value)}
                        />
                      </div>
                    </td>
                    <td className="py-2 text-center">
                      {reviewRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          className="rounded px-1.5 py-1 text-xs text-rose transition hover:bg-rose-tint"
                          title="Remove item"
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleAddRow}
              className="rounded border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-paper-sheet focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal"
            >
              + Add Row
            </button>

            <div className="flex items-center gap-3">
              {reviewError && (
                <span className="text-xs font-medium text-rose">⚠ {reviewError}</span>
              )}
              {reviewSuccess && (
                <span className="text-xs font-medium text-teal">✓ {reviewSuccess}</span>
              )}
              <button
                type="button"
                onClick={handleConfirmAll}
                disabled={confirming}
                className="rounded-md bg-teal px-5 py-2 text-xs font-semibold text-paper-sheet shadow-subtle transition-all hover:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal"
              >
                {confirming ? "Confirming…" : "Confirm all"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Past Documents List (same hairline-row style as TransactionsTable) */}
      <div className="mt-6 overflow-x-auto">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Past Documents Ledger
          </p>
          <button
            onClick={loadDocuments}
            className="rounded border border-line bg-paper px-2.5 py-1 text-xs font-medium text-ink transition-colors hover:bg-paper-sheet focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal"
          >
            ↻ Refresh
          </button>
        </div>

        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              <th className="py-2.5 pl-1 font-semibold">Date Uploaded</th>
              <th className="py-2.5 font-semibold">Title / Particulars</th>
              <th className="py-2.5 font-semibold">Type</th>
              <th className="py-2.5 font-semibold">Status</th>
              <th className="py-2.5 font-semibold">Confidence</th>
              <th className="py-2.5 pr-1 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {loadingDocs && (
              <tr>
                <td colSpan={6} className="py-8 text-center font-serif text-sm italic text-ink-muted">
                  Retrieving ledger records…
                </td>
              </tr>
            )}

            {!loadingDocs && documents.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center font-serif text-sm italic text-ink-muted">
                  No documents in ledger — upload a document above.
                </td>
              </tr>
            )}

            {!loadingDocs &&
              documents.map((d) => (
                <tr
                  key={d.id}
                  className="border-b border-line/60 transition-colors hover:bg-paper/40"
                >
                  <td className="py-3 pl-1 text-xs text-ink-muted">
                    {new Date(d.uploadedAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-3 font-mono text-xs font-medium text-ink">
                    {d.title}
                  </td>
                  <td className="py-3">
                    <span className="inline-block rounded border border-line bg-paper px-2 py-0.5 text-[11px] font-medium text-ink-muted uppercase">
                      {d.docType.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3">{renderStatusBadge(d.status)}</td>
                  <td className="py-3 font-serif text-xs tabular-nums text-ink">
                    {d.confidence != null ? `${Math.round(d.confidence * 100)}%` : "—"}
                  </td>
                  <td className="py-3 pr-1 text-right">
                    {d.status === "NEEDS_REVIEW" ? (
                      <button
                        onClick={() => openReviewForDoc(d)}
                        className="rounded border border-rose/30 bg-rose-tint px-2.5 py-1 text-xs font-semibold text-rose transition hover:bg-rose hover:text-paper-sheet focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose"
                      >
                        Review
                      </button>
                    ) : d.status === "COMPLETED" ? (
                      <span className="text-xs text-teal font-medium">Reconciled</span>
                    ) : (
                      <span className="text-xs text-ink-subtle italic">Processing</span>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
