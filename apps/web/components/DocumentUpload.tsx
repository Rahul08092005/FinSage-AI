"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { confirmDocument, getDocuments, getDocumentStatus, uploadDocument } from "@/lib/api";
import { formatINR } from "@/lib/formatCurrency";

const CATEGORIES = ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Other"];

interface DocumentItem {
  id: string;
  title: string;
  docType: string;
  status: string;
  confidence: number | null;
  uploadedAt: string;
  extractedJson?: any;
  ocrError?: string | null;
  processing_error?: string | null;
  error?: string | null;
  errorMessage?: string | null;
  detail?: string | null;
  [key: string]: any;
}

export function getDocumentError(doc: any): string | null {
  if (!doc) return null;

  const candidates = [
    doc.error,
    doc.ocrError,
    doc.processing_error,
    doc.errorMessage,
    doc.detail,
    doc.extractedJson?.error,
  ];

  for (const c of candidates) {
    if (typeof c === "string" && c.trim().length > 0) {
      return c.trim();
    }
    if (typeof c === "object" && c !== null) {
      if (typeof c.message === "string" && c.message.trim().length > 0) {
        return c.message.trim();
      }
      if (typeof c.error === "string" && c.error.trim().length > 0) {
        return c.error.trim();
      }
      if (typeof c.detail === "string" && c.detail.trim().length > 0) {
        return c.detail.trim();
      }
    }
  }

  if (doc.status === "FAILED") {
    return "Document processing failed. Please try again.";
  }

  return null;
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
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 2. Active Polling & Current Document state
  const [currentDoc, setCurrentDoc] = useState<DocumentItem | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 3. Past documents state
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  // 4. Preview / Review Modal state
  const [inspectDoc, setInspectDoc] = useState<DocumentItem | null>(null);
  const [reviewRows, setReviewRows] = useState<EditableTransactionRow[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [expandedErrors, setExpandedErrors] = useState<Record<string, boolean>>({});

  function stopPolling() {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }

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
  }, [token]);

  // Setup review rows from doc or extractedJson
  function setupReviewSection(doc: any) {
    setInspectDoc(doc);
    setReviewError(null);
    setReviewSuccess(null);

    let rawList: any[] = [];
    if (Array.isArray(doc.extractedJson)) {
      rawList = doc.extractedJson;
    } else if (doc.extractedJson && Array.isArray(doc.extractedJson.transactions)) {
      rawList = doc.extractedJson.transactions;
    } else if (doc.extractedJson && typeof doc.extractedJson === "object" && (doc.extractedJson.amount != null || doc.extractedJson.merchant != null)) {
      rawList = [doc.extractedJson];
    } else if (doc.amount != null || doc.merchant != null) {
      rawList = [{
        amount: doc.amount,
        merchant: doc.merchant,
        description: doc.description,
        category: doc.category,
        date: doc.date,
      }];
    }

    if (rawList.length > 0) {
      setReviewRows(
        rawList.map((r) => ({
          amount: r.amount != null && !isNaN(Number(r.amount)) && Number(r.amount) > 0 ? Number(r.amount) : "",
          description: r.description ?? r.merchant ?? r.narration ?? r.vendor ?? r.title ?? "Extracted item",
          category: r.category && CATEGORIES.includes(r.category) ? r.category : (CATEGORIES.includes("Other") ? "Other" : "Food"),
          transactionDate: r.transactionDate || r.transaction_date || r.date
            ? new Date(r.transactionDate || r.transaction_date || r.date).toISOString().slice(0, 10)
            : new Date().toISOString().slice(0, 10),
          accountId: r.accountId,
        }))
      );
    } else {
      setReviewRows([
        {
          amount: doc.amount != null && !isNaN(Number(doc.amount)) && Number(doc.amount) > 0 ? Number(doc.amount) : "",
          description: doc.merchant || doc.description || doc.title.replace(/\.[^/.]+$/, ""),
          category: doc.category && CATEGORIES.includes(doc.category) ? doc.category : "Food",
          transactionDate: doc.date || new Date().toISOString().slice(0, 10),
        },
      ]);
    }
  }

  // Open inspection modal for any document
  async function handleOpenDoc(doc: DocumentItem) {
    try {
      const full = await getDocumentStatus(token, doc.id);
      setupReviewSection(full);
    } catch {
      setupReviewSection(doc);
    }
  }

  // Polling logic for uploaded document
  function startPolling(id: string) {
    stopPolling();
    const pollStart = Date.now();
    pollIntervalRef.current = setInterval(async () => {
      try {
        // Guard against infinite polling (>30s)
        if (Date.now() - pollStart > 30000) {
          stopPolling();
          setUploadError("Document processing is taking longer than expected. FinSage is working on it in the background — feel free to refresh shortly.");
          loadDocuments();
          return;
        }

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

  // Handle Drag & Drop
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(true);
  }
  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setUploadError(null);
      setUploadMessage(null);
    }
  }

  // Handle upload
  async function handleUpload() {
    if (!file) {
      setUploadError("Please select or drop a file first");
      return;
    }

    setUploadError(null);
    setUploadMessage(null);
    setUploading(true);

    try {
      const res = await uploadDocument(token, file, docType);
      setUploadMessage("Deposited to Vault. OCR analysis active.");

      const initialDoc: DocumentItem = {
        id: res.documentId,
        title: file.name,
        docType: docType,
        status: res.status || "QUEUED",
        confidence: null,
        uploadedAt: new Date().toISOString(),
      };
      setCurrentDoc(initialDoc);

      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      startPolling(res.documentId);
      loadDocuments();
    } catch (e: any) {
      setUploadError(e.message || "Failed to deposit document into vault");
    } finally {
      setUploading(false);
    }
  }

  // Row changes inside review modal
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

  // Confirm extracted rows
  async function handleConfirmAll() {
    if (!inspectDoc) return;

    const invalid = reviewRows.some(
      (r) => !r.description?.trim() || isNaN(parseFloat(String(r.amount))) || parseFloat(String(r.amount)) <= 0
    );

    if (invalid) {
      setReviewError("Each item must have a valid positive amount and description.");
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

      await confirmDocument(token, inspectDoc.id, formatted);
      setReviewSuccess("Transactions reconciled & recorded in ledger.");

      await loadDocuments();

      if (currentDoc && currentDoc.id === inspectDoc.id) {
        setCurrentDoc({ ...currentDoc, status: "COMPLETED" });
      }

      setTimeout(() => {
        setInspectDoc(null);
        setReviewSuccess(null);
      }, 1400);
    } catch (e: any) {
      setReviewError(e.message || "Failed to confirm document");
    } finally {
      setConfirming(false);
    }
  }

  // Vault Summary Stats
  const vaultStats = useMemo(() => {
    const total = documents.length;
    const completed = documents.filter((d) => d.status === "COMPLETED").length;
    const needsReview = documents.filter((d) => d.status === "NEEDS_REVIEW").length;
    const processing = documents.filter((d) => d.status === "QUEUED" || d.status === "PROCESSING").length;

    const confList = documents
      .map((d) => d.confidence)
      .filter((c): c is number => typeof c === "number" && !isNaN(c));
    const avgConfidence =
      confList.length > 0 ? Math.round((confList.reduce((a, b) => a + b, 0) / confList.length) * 100) : 95;

    return { total, completed, needsReview, processing, avgConfidence };
  }, [documents]);

  // Icon & styling helper based on document
  function getDocIcon(docType: string, title: string) {
    const lower = (docType + " " + title).toLowerCase();
    if (lower.includes("statement") || lower.includes("bank") || lower.includes("salary") || lower.includes("hdfc")) {
      return { icon: "🏦", badge: "BANK STATEMENT", color: "text-indigo-600 bg-indigo-50" };
    }
    if (lower.includes("receipt") || lower.includes("coffee") || lower.includes("starbucks") || lower.includes("pharmacy")) {
      return { icon: "🧾", badge: "RECEIPT", color: "text-lime-700 bg-lime-50" };
    }
    return { icon: "📄", badge: "INVOICE / DOC", color: "text-amber-700 bg-amber-50" };
  }

  // Render Status Pill
  function renderStatusPill(status: string) {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-300/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
            ✓ RECONCILED
          </span>
        );
      case "NEEDS_REVIEW":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-300/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
            ⚠ NEEDS REVIEW
          </span>
        );
      case "QUEUED":
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 border border-purple-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-800">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-600 animate-ping" />
            ◌ PROCESSING
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-800">
            ✕ FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 border border-stone-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stone-600">
            ✦ {status}
          </span>
        );
    }
  }

  // Render OCR Confidence Visual Indicator
  function renderConfidenceMeter(conf: number | null, status?: string) {
    if (status === "FAILED") {
      return (
        <div className="flex items-center gap-2">
          <div className="w-14 h-1.5 rounded-full bg-rose-100 overflow-hidden">
            <div className="h-full rounded-full bg-rose-500 w-0" />
          </div>
          <span className="text-[10px] font-bold text-rose-800 uppercase tracking-tight">
            0% EXTRACTION FAILED
          </span>
        </div>
      );
    }
    if (conf == null) {
      return <span className="text-[10px] font-semibold text-stone-400 italic">CALCULATING…</span>;
    }
    const pct = Math.round(conf * 100);
    const isHigh = pct >= 80;
    return (
      <div className="flex items-center gap-2">
        <div className="w-14 h-1.5 rounded-full bg-stone-100 overflow-hidden">
          <div
            className={`h-full rounded-full ${isHigh ? "bg-lime-500" : "bg-amber-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={`text-[10px] font-bold ${isHigh ? "text-stone-700" : "text-amber-800"}`}>
          {pct}% {isHigh ? "CONFIDENT" : "NEEDS A LOOK 👀"}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. VAULT HERO HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-200/80 pb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-lime-400/25 border border-lime-500/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#18122B]">
              ● VAULT SECURE
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-indigo-700">
              ✦ OCR READY
            </span>
            {uploadMessage && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 animate-in fade-in">
                ✓ {uploadMessage}
              </span>
            )}
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#18122B]">
            THE FINSAGE VAULT.
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 font-medium">
            Drop the paperwork. Let FinSage make sense of it. Receipts, statements, and financial vouchers parsed with AI.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#18122B] px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-stone-800 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
          >
            <span>✦</span>
            <span>+ Upload Document</span>
            <span className="text-lime-400 font-bold">→</span>
          </button>
        </div>
      </div>

      {/* 2. VAULT SNAPSHOT CARD */}
      <div className="rounded-[22px] border border-stone-200/90 bg-[#FFFDF8] p-4 sm:p-5 shadow-sm transition">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
          <div>
            <p className="text-[10px] font-bold tracking-wider uppercase text-stone-400">
              VAULT DOCUMENTS
            </p>
            <p className="font-serif text-2xl sm:text-3xl font-bold text-[#18122B] mt-0.5">
              {vaultStats.total}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold tracking-wider uppercase text-stone-400">
              RECONCILED
            </p>
            <p className="font-serif text-2xl sm:text-3xl font-bold text-emerald-700 mt-0.5">
              {vaultStats.completed}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold tracking-wider uppercase text-stone-400">
              NEEDS REVIEW
            </p>
            <p className="font-serif text-2xl sm:text-3xl font-bold text-amber-700 mt-0.5">
              {vaultStats.needsReview}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold tracking-wider uppercase text-stone-400">
              AVG OCR CONFIDENCE
            </p>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="font-serif text-2xl sm:text-3xl font-bold text-[#18122B]">
                {vaultStats.avgConfidence}%
              </span>
              <span className="text-[10px] font-bold text-lime-700 uppercase tracking-wide">
                HIGH
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. COMPACT UPLOAD DROP ZONE */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-[22px] border-2 border-dashed p-4 sm:p-5 transition duration-200 text-center ${
          isDragOver
            ? "border-lime-500 bg-lime-50/50 scale-[1.01]"
            : "border-stone-300/80 bg-[#FFFDF8] hover:border-stone-400"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-left">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-lime-400/25 border border-lime-500/30 flex items-center justify-center text-xl shrink-0">
              ✦
            </div>
            <div>
              <p className="font-serif text-base sm:text-lg font-bold text-[#18122B] tracking-tight">
                {file ? file.name : "DROP IT HERE, OR CHOOSE A FILE."}
              </p>
              <p className="text-xs text-stone-500 font-medium">
                {file
                  ? `${(file.size / 1024).toFixed(1)} KB · Ready to deposit`
                  : "Upload receipts, invoices, or bank statements — JPG, PNG, PDF, CSV"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {/* DocType Segmented Pill */}
            <div className="inline-flex rounded-full bg-stone-100 p-0.5 border border-stone-200 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setDocType("receipt")}
                className={`rounded-full px-3 py-1 transition cursor-pointer ${
                  docType === "receipt" ? "bg-[#18122B] text-white shadow-xs" : "text-stone-600 hover:text-[#18122B]"
                }`}
              >
                Receipt
              </button>
              <button
                type="button"
                onClick={() => setDocType("bank_statement")}
                className={`rounded-full px-3 py-1 transition cursor-pointer ${
                  docType === "bank_statement"
                    ? "bg-[#18122B] text-white shadow-xs"
                    : "text-stone-600 hover:text-[#18122B]"
                }`}
              >
                Bank Statement
              </button>
            </div>

            {/* Choose file CTA */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full border border-stone-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition cursor-pointer"
            >
              Choose file
            </button>

            {/* Upload Button */}
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || uploading}
              className="rounded-full bg-[#18122B] px-4 py-1.5 text-xs font-semibold text-white shadow-md hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1.5"
            >
              {uploading ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                  <span>Scanning…</span>
                </>
              ) : (
                <>
                  <span>Deposit →</span>
                </>
              )}
            </button>
          </div>
        </div>

        {uploadError && (
          <p className="mt-2 text-left text-xs font-semibold text-rose-700">
            ⚠ {uploadError}
          </p>
        )}

        {/* Live Processing Banner if a document was just uploaded */}
        {currentDoc && (currentDoc.status === "QUEUED" || currentDoc.status === "PROCESSING") && (
          <div className="mt-3 flex items-center justify-between rounded-xl bg-purple-50 border border-purple-200/80 p-2.5 text-left animate-pulse">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-purple-600 animate-ping" />
              <p className="text-xs font-semibold text-purple-900">
                OCR Scanner analyzing <span className="font-mono">{currentDoc.title}</span>…
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
              IN FLIGHT
            </span>
          </div>
        )}
      </div>

      {/* 4. COLLECTIBLE DOCUMENT CARDS GRID */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
            VAULT RECORDS ({documents.length})
          </p>
          <button
            onClick={loadDocuments}
            className="rounded-full border border-stone-200 bg-[#FFFDF8] px-3 py-1 text-xs font-semibold text-stone-600 hover:text-[#18122B] transition cursor-pointer"
          >
            ↻ Refresh Vault
          </button>
        </div>

        {loadingDocs ? (
          <div className="py-16 text-center">
            <div className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-[#18122B] border-t-transparent mb-3" />
            <p className="font-serif text-sm italic text-stone-500">
              Unlocking Vault records…
            </p>
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-stone-300 bg-[#FFFDF8] p-8 sm:p-12 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-lime-400/30 flex items-center justify-center text-2xl mb-4 shadow-sm">
              📁
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#18122B] tracking-tight">
              YOUR VAULT IS READY FOR PAPERWORK.
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-stone-500 max-w-md mx-auto font-medium">
              Drop payment receipts, invoices, or statements above. FinSage OCR will scan, categorize, and extract items directly into your money trail.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#18122B] px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-stone-800 transition cursor-pointer"
            >
              <span>+ Deposit your first document</span>
              <span className="text-lime-400 font-bold">✨</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((d) => {
              const info = getDocIcon(d.docType, d.title);
              const formattedDate = new Date(d.uploadedAt)
                .toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                .toUpperCase();
              const dError = getDocumentError(d);
              const isLongError = Boolean(dError && dError.length > 90);
              const isExpandedError = Boolean(expandedErrors[d.id]);

              return (
                <div
                  key={d.id}
                  onClick={() => handleOpenDoc(d)}
                  className="group relative flex flex-col justify-between rounded-[22px] border border-stone-200/80 bg-[#FFFDF8] p-4 sm:p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:border-stone-300 cursor-pointer overflow-hidden"
                >
                  {/* Card Top: Icon, DocType Badge, Upload Date */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl p-1.5 rounded-xl bg-stone-100 shadow-2xs">
                          {info.icon}
                        </span>
                        <span className="text-[10px] font-bold tracking-wider uppercase text-stone-400">
                          {info.badge}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-stone-400 uppercase">
                        {formattedDate}
                      </span>
                    </div>

                    {/* Document Title */}
                    <h3 className="font-mono text-xs sm:text-sm font-semibold text-[#18122B] truncate tracking-tight">
                      {d.title}
                    </h3>

                    {/* OCR Confidence */}
                    <div className="mt-3.5 pt-3 border-t border-stone-100 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                        OCR SCORE
                      </span>
                      {renderConfidenceMeter(d.confidence, d.status)}
                    </div>
                  </div>

                  {/* Card Bottom: Status Pill + Action + Error Surfacing */}
                  <div className="mt-4 pt-3 border-t border-stone-100 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      {renderStatusPill(d.status)}

                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-semibold text-stone-500 group-hover:text-[#18122B] transition">
                          {d.status === "NEEDS_REVIEW" || d.status === "FAILED" || dError ? "Review" : "Details"}
                        </span>
                        <span className="h-6 w-6 rounded-full bg-stone-100 flex items-center justify-center text-xs text-stone-600 group-hover:bg-[#18122B] group-hover:text-white transition">
                          →
                        </span>
                      </div>
                    </div>

                    {/* Surfaced Error Message */}
                    {(d.status === "FAILED" || dError) && (
                      <div className="rounded-xl border border-rose-200/90 bg-rose-50/80 p-2.5 text-left transition space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-800">
                            <span>⚠</span>
                            <span>NEEDS ATTENTION</span>
                          </div>
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm bg-rose-100/90 text-rose-800 border border-rose-200/80 tracking-wider">
                            {d.status === "FAILED" ? "FAILED" : "ATTENTION"}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-rose-900/90 leading-relaxed break-words">
                          {isLongError && !isExpandedError ? `${dError!.slice(0, 90)}…` : dError}
                        </p>
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-rose-200/50">
                          {isLongError ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedErrors((prev) => ({ ...prev, [d.id]: !prev[d.id] }));
                              }}
                              className="text-[10px] font-semibold text-rose-700 underline underline-offset-2 hover:text-rose-900 cursor-pointer"
                            >
                              {isExpandedError ? "Show less" : "Show details"}
                            </button>
                          ) : (
                            <span className="text-[10px] text-rose-600/75 font-medium">Click to review</span>
                          )}
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100/90 hover:bg-rose-200 px-2.5 py-0.5 text-[10px] font-bold text-rose-800 border border-rose-300/80 shadow-2xs transition cursor-pointer">
                            <span>Review</span>
                            <span>→</span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. DOCUMENT PREVIEW / REVIEW MODAL */}
      {inspectDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[26px] border border-stone-200/80 bg-[#FAF7F2] p-5 sm:p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl p-2 rounded-2xl bg-white shadow-xs">
                  {getDocIcon(inspectDoc.docType, inspectDoc.title).icon}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-stone-400">
                      VAULT RECORD
                    </span>
                    {renderStatusPill(inspectDoc.status)}
                  </div>
                  <h3 className="font-mono text-sm sm:text-base font-bold text-[#18122B] truncate max-w-md">
                    {inspectDoc.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setInspectDoc(null)}
                className="rounded-full p-1.5 text-stone-400 hover:bg-stone-200/60 hover:text-[#18122B] transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Metadata Snapshot */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-2xl bg-white p-3.5 border border-stone-200/70">
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase">TYPE</span>
                <p className="text-xs font-semibold text-[#18122B] uppercase mt-0.5">
                  {inspectDoc.docType.replace("_", " ")}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase">DEPOSITED</span>
                <p className="text-xs font-semibold text-[#18122B] mt-0.5">
                  {new Date(inspectDoc.uploadedAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase">OCR CONFIDENCE</span>
                <div className="mt-0.5">
                  {renderConfidenceMeter(inspectDoc.confidence, inspectDoc.status)}
                </div>
              </div>
            </div>

            {/* Extracted Transactions Editor / Auditor */}
            <div className="mt-4">
              {/* Surfaced Error Alert if Failed or Error present */}
              {(inspectDoc.status === "FAILED" || getDocumentError(inspectDoc)) && (
                <div className="mb-3 rounded-xl bg-rose-50 border border-rose-200 p-3 flex items-start gap-2.5 text-left">
                  <span className="text-base leading-none text-rose-600 shrink-0">⚠</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-rose-900">
                      {inspectDoc.status === "FAILED" ? "OCR Extraction Incomplete" : "Processing Attention Required"}
                    </p>
                    <p className="text-[11px] font-medium text-rose-800/90 mt-0.5 leading-relaxed">
                      {getDocumentError(inspectDoc) || "Document processing failed. Please try again."}
                    </p>
                  </div>
                </div>
              )}

              {inspectDoc.status === "NEEDS_REVIEW" && !getDocumentError(inspectDoc) && (
                <div className="mb-3 rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2.5 text-left">
                  <span className="text-base leading-none shrink-0">👀</span>
                  <div>
                    <p className="text-xs font-bold text-amber-900">
                      Review Required Before Recording
                    </p>
                    <p className="text-[11px] text-amber-800/90 mt-0.5">
                      FinSage couldn’t confidently read all receipt figures. Review and correct the highlighted fields below before committing to your ledger.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-serif text-sm font-bold text-[#18122B]">
                    {inspectDoc.status === "NEEDS_REVIEW" || inspectDoc.status === "FAILED"
                      ? "Verify Extracted Transactions"
                      : "Extracted Financial Items"}
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    {inspectDoc.status === "NEEDS_REVIEW" || inspectDoc.status === "FAILED"
                      ? "Review and correct amounts before committing to your ledger."
                      : "Transactions successfully verified and registered into your financial trail."}
                  </p>
                </div>
                {(inspectDoc.status === "NEEDS_REVIEW" || inspectDoc.status === "FAILED") && (
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="rounded-full border border-stone-200 bg-white px-3 py-1 text-[11px] font-semibold text-[#18122B] hover:bg-stone-50 transition cursor-pointer"
                  >
                    + Add Row
                  </button>
                )}
              </div>

              {/* Editable Table */}
              {(() => {
                const isReviewable = inspectDoc.status === "NEEDS_REVIEW" || inspectDoc.status === "FAILED";
                return (
                  <div className="rounded-2xl border border-stone-200/80 bg-white overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-stone-100 bg-[#FAF7F2] text-[10px] font-bold uppercase tracking-wider text-stone-400">
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Description</th>
                            <th className="py-2.5 px-3">Category</th>
                            <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                            {isReviewable && <th className="py-2.5 px-2 w-8"></th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {reviewRows.map((row, idx) => {
                            const isUnreadable = row.amount === "" || isNaN(Number(row.amount)) || Number(row.amount) <= 0;
                            return (
                              <tr key={idx} className="hover:bg-stone-50/50 transition">
                                <td className="py-2 px-3">
                                  {isReviewable ? (
                                    <input
                                      type="date"
                                      className="w-full rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs text-[#18122B] focus:border-[#18122B] focus:outline-none"
                                      value={row.transactionDate}
                                      onChange={(e) => handleRowChange(idx, "transactionDate", e.target.value)}
                                    />
                                  ) : (
                                    <span className="font-mono text-stone-600">{row.transactionDate}</span>
                                  )}
                                </td>
                                <td className="py-2 px-3">
                                  {isReviewable ? (
                                    <input
                                      type="text"
                                      placeholder="Description"
                                      className="w-full rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs text-[#18122B] focus:border-[#18122B] focus:outline-none"
                                      value={row.description}
                                      onChange={(e) => handleRowChange(idx, "description", e.target.value)}
                                    />
                                  ) : (
                                    <span className="font-medium text-[#18122B]">{row.description}</span>
                                  )}
                                </td>
                                <td className="py-2 px-3">
                                  {isReviewable ? (
                                    <select
                                      className="w-full rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs font-medium text-[#18122B] focus:border-[#18122B] focus:outline-none"
                                      value={row.category}
                                      onChange={(e) => handleRowChange(idx, "category", e.target.value)}
                                    >
                                      {CATEGORIES.map((c) => (
                                        <option key={c} value={c}>
                                          {c}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <span className="inline-block rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600 uppercase">
                                      {row.category}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-right">
                                  {isReviewable ? (
                                    <div className="flex flex-col items-end">
                                      <div className="relative inline-block w-28">
                                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 font-serif text-xs font-bold text-stone-400">
                                          ₹
                                        </span>
                                        <input
                                          type="number"
                                          step="0.01"
                                          placeholder="0.00"
                                          className={`w-full rounded-lg border bg-white py-1 pl-5 pr-2 text-right font-serif text-xs font-bold tabular-nums text-[#18122B] focus:border-[#18122B] focus:outline-none ${
                                            isUnreadable ? "border-amber-300 ring-1 ring-amber-200" : "border-stone-200"
                                          }`}
                                          value={row.amount}
                                          onChange={(e) => handleRowChange(idx, "amount", e.target.value)}
                                        />
                                      </div>
                                      {isUnreadable && (
                                        <span className="text-[9px] font-bold text-amber-700 uppercase tracking-tight mt-0.5">
                                          Unreadable in scan
                                        </span>
                                      )}
                                    </div>
                                  ) : isUnreadable ? (
                                    <span className="text-[11px] font-semibold text-amber-700 italic">
                                      Amount unreadable — review required
                                    </span>
                                  ) : (
                                    <span className="font-serif font-bold text-[#18122B] tabular-nums">
                                      {formatINR(Number(row.amount))}
                                    </span>
                                  )}
                                </td>
                                {isReviewable && (
                                  <td className="py-2 px-2 text-center">
                                    {reviewRows.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveRow(idx)}
                                        className="rounded p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                      >
                                        ✕
                                      </button>
                                    )}
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {reviewError && (
                <p className="mt-2 text-xs font-semibold text-rose-700">
                  ⚠ {reviewError}
                </p>
              )}
              {reviewSuccess && (
                <p className="mt-2 text-xs font-semibold text-emerald-700">
                  ✓ {reviewSuccess}
                </p>
              )}
            </div>

            {/* Modal Actions */}
            <div className="mt-5 flex items-center justify-between pt-3 border-t border-stone-200/80">
              <button
                type="button"
                onClick={() => setInspectDoc(null)}
                className="rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition cursor-pointer"
              >
                Close
              </button>

              {(inspectDoc.status === "NEEDS_REVIEW" || inspectDoc.status === "FAILED") && (
                <button
                  type="button"
                  onClick={handleConfirmAll}
                  disabled={confirming}
                  className="rounded-full bg-[#18122B] px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-stone-800 disabled:opacity-40 transition cursor-pointer flex items-center gap-1.5"
                >
                  {confirming ? "Reconciling…" : "Confirm all to Ledger →"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
