"use client";
import { useState } from "react";
import { confirmDocument } from "@/lib/api";

export interface ExtractedRow {
  amount: number | string;
  category: string;
  transactionDate: string;
  description: string;
  accountId?: string;
}

export interface ReviewDocument {
  id: string;
  title: string;
  docType: string;
  status: string;
  confidence: number | null;
  extractedJson?: any;
}

interface DocumentReviewModalProps {
  token: string;
  document: ReviewDocument;
  onClose: () => void;
  onConfirmed: () => void;
}

const CATEGORIES = ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Other"];

export function DocumentReviewModal({
  token,
  document,
  onClose,
  onConfirmed,
}: DocumentReviewModalProps) {
  // Normalize extracted JSON rows
  const initialRows: ExtractedRow[] = (() => {
    let rows: any[] = [];
    if (Array.isArray(document.extractedJson)) {
      rows = document.extractedJson;
    } else if (document.extractedJson && Array.isArray(document.extractedJson.transactions)) {
      rows = document.extractedJson.transactions;
    }

    if (rows.length > 0) {
      return rows.map((r) => ({
        amount: r.amount ?? "",
        category: r.category && CATEGORIES.includes(r.category) ? r.category : "Food",
        transactionDate: r.transactionDate || r.transaction_date || r.date
          ? new Date(r.transactionDate || r.transaction_date || r.date).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        description: r.description ?? r.narration ?? r.vendor ?? r.title ?? "Extracted expense",
        accountId: r.accountId,
      }));
    }

    return [
      {
        amount: "",
        category: "Food",
        transactionDate: new Date().toISOString().slice(0, 10),
        description: document.title.replace(/\.[^/.]+$/, ""),
      },
    ];
  })();

  const [rows, setRows] = useState<ExtractedRow[]>(initialRows);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confidencePct = document.confidence != null ? Math.round(document.confidence * 100) : null;
  const isLowConfidence = confidencePct === null || confidencePct < 85;

  function handleRowChange(index: number, field: keyof ExtractedRow, value: string) {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function handleAddRow() {
    setRows((prev) => [
      ...prev,
      {
        amount: "",
        category: "Food",
        transactionDate: new Date().toISOString().slice(0, 10),
        description: "",
      },
    ]);
  }

  function handleRemoveRow(index: number) {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  const totalAmount = rows.reduce((sum, r) => {
    const val = parseFloat(String(r.amount));
    return isNaN(val) ? sum : sum + val;
  }, 0);

  const isFormValid = rows.every(
    (r) =>
      Boolean(r.description?.trim()) &&
      !isNaN(parseFloat(String(r.amount))) &&
      parseFloat(String(r.amount)) > 0
  );

  async function handleConfirm() {
    if (!isFormValid) {
      setError("Please ensure every row has a valid positive amount and description.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const formatted = rows.map((r) => ({
        amount: parseFloat(String(r.amount)),
        category: r.category || "Other",
        transactionDate: new Date(r.transactionDate || Date.now()).toISOString(),
        description: r.description.trim(),
        accountId: r.accountId,
      }));

      await confirmDocument(token, document.id, formatted);
      onConfirmed();
      onClose();
    } catch (e: any) {
      setError(e.message || "Failed to confirm document");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-lg border border-line bg-paper-sheet shadow-ledger">
        {/* Header */}
        <div className="border-b border-line px-6 py-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-widest text-ink-subtle uppercase">
              Extraction Review Voucher
            </span>
            <span
              className={`rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                isLowConfidence
                  ? "border-gold/40 bg-gold/15 text-gold-dark"
                  : "border-teal/30 bg-teal-tint text-teal"
              }`}
            >
              {confidencePct !== null ? `${confidencePct}% Confidence` : "Manual Review"}
            </span>
          </div>
          <h2 className="mt-1 font-serif text-xl font-semibold tracking-tight text-ink">
            Review Extracted Transactions
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            Document: <span className="font-mono text-ink">{document.title}</span> ({document.docType})
          </p>
        </div>

        {/* Confidence Notice */}
        <div className="border-b border-line px-6 py-3">
          {isLowConfidence ? (
            <div className="flex items-center gap-2 rounded-md border border-gold/40 bg-gold-tint p-3 text-xs text-gold-dark">
              <span className="text-base">⚠</span>
              <div>
                <p className="font-semibold">Low-Confidence Extraction Notice</p>
                <p className="text-[11px] text-ink-muted">
                  The AI parser flagged low confidence ({confidencePct !== null ? `${confidencePct}%` : "unrated"}).
                  Please verify amounts, particulars, and categories before recording into the official ledger.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-md border border-teal/30 bg-teal-tint p-3 text-xs text-teal">
              <span className="text-base">✓</span>
              <div>
                <p className="font-semibold">High-Confidence OCR Extraction ({confidencePct}%)</p>
                <p className="text-[11px] text-teal-dark">
                  Please review the entries below and confirm to record them into your ledger book.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Rows Table */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                  <th className="w-36 py-2 font-semibold">Date</th>
                  <th className="py-2 font-semibold">Particulars / Description</th>
                  <th className="w-36 py-2 font-semibold">Category</th>
                  <th className="w-32 py-2 pr-2 text-right font-semibold">Amount (₹)</th>
                  <th className="w-12 py-2 text-center font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {rows.map((row, idx) => (
                  <tr key={idx} className="transition-colors hover:bg-paper/30">
                    <td className="py-2.5 pr-2">
                      <input
                        type="date"
                        className="w-full rounded border border-line bg-paper px-2 py-1.5 text-xs text-ink transition focus:border-teal focus:bg-paper-sheet focus:outline-none focus:ring-1 focus:ring-teal/30"
                        value={row.transactionDate}
                        onChange={(e) => handleRowChange(idx, "transactionDate", e.target.value)}
                      />
                    </td>
                    <td className="py-2.5 pr-2">
                      <input
                        type="text"
                        placeholder="e.g. Cafe Coffee Day"
                        className="w-full rounded border border-line bg-paper px-2.5 py-1.5 text-xs text-ink placeholder:text-ink-subtle transition focus:border-teal focus:bg-paper-sheet focus:outline-none focus:ring-1 focus:ring-teal/30"
                        value={row.description}
                        onChange={(e) => handleRowChange(idx, "description", e.target.value)}
                      />
                    </td>
                    <td className="py-2.5 pr-2">
                      <select
                        className="w-full rounded border border-line bg-paper px-2 py-1.5 text-xs font-medium text-ink transition focus:border-teal focus:bg-paper-sheet focus:outline-none focus:ring-1 focus:ring-teal/30"
                        value={row.category}
                        onChange={(e) => handleRowChange(idx, "category", e.target.value)}
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2.5 pr-2">
                      <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 font-serif text-xs font-semibold text-ink-subtle">
                          ₹
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="w-full rounded border border-line bg-paper py-1.5 pl-5 pr-2 text-right font-serif text-xs font-semibold tabular-nums text-ink placeholder:text-ink-subtle transition focus:border-teal focus:bg-paper-sheet focus:outline-none focus:ring-1 focus:ring-teal/30"
                          value={row.amount}
                          onChange={(e) => handleRowChange(idx, "amount", e.target.value)}
                        />
                      </div>
                    </td>
                    <td className="py-2.5 text-center">
                      {rows.length > 1 && (
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

          <div className="mt-3 flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleAddRow}
              className="inline-flex items-center gap-1 rounded border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-paper-sheet hover:text-teal focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal"
            >
              + Add Transaction Line
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                Total Voucher Debit:
              </span>
              <span className="font-serif text-base font-semibold tabular-nums text-ink">
                ₹{" "}
                {totalAmount.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-md border border-rose/30 bg-rose-tint p-3 text-xs font-medium text-rose">
              ⚠ {error}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-line bg-paper/40 px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-md border border-line bg-paper px-4 py-2 text-xs font-medium text-ink transition-colors hover:bg-paper-sheet focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isFormValid || isSubmitting}
            className="rounded-md bg-teal px-5 py-2 text-xs font-medium text-paper-sheet shadow-subtle transition-all hover:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal"
          >
            {isSubmitting ? "Recording into Ledger…" : "Confirm & Record into Ledger"}
          </button>
        </div>
      </div>
    </div>
  );
}
