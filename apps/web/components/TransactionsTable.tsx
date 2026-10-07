"use client";

import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
  getTransactions,
  importTransactionsCsv,
  parseSms,
  confirmSmsTransaction,
  getDocuments,
  getDocumentStatus,
  uploadDocument,
  deleteDocument,
  getInsights,
  generateInsights,
  type InsightItem,
} from "@/lib/api";
import { formatINR } from "@/lib/formatCurrency";
import { DocumentReviewModal, type ReviewDocument } from "@/components/DocumentReviewModal";

export interface TransactionItem {
  id: string;
  userId: string;
  amount: number;
  category: string;
  description: string;
  transactionDate: string;
  source?: string;
  accountId?: string;
  createdAt?: string;
  updatedAt?: string;
  documentId?: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  docType: string;
  status: "QUEUED" | "PROCESSING" | "NEEDS_REVIEW" | "COMPLETED" | "FAILED" | string;
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

// Category visual metadata mapping
const CATEGORY_MAP: Record<
  string,
  { icon: string; bg: string; border: string; text: string; dot: string; color: string }
> = {
  "Food & Dining": {
    icon: "🍽️",
    bg: "bg-[#FFF7ED]",
    border: "border-[#FFEDD5]",
    text: "text-[#C2410C]",
    dot: "bg-[#F97316]",
    color: "#F97316",
  },
  Food: {
    icon: "🍽️",
    bg: "bg-[#FFF7ED]",
    border: "border-[#FFEDD5]",
    text: "text-[#C2410C]",
    dot: "bg-[#F97316]",
    color: "#F97316",
  },
  Groceries: {
    icon: "🛒",
    bg: "bg-[#ECFDF5]",
    border: "border-[#A7F3D0]",
    text: "text-[#047857]",
    dot: "bg-[#10B981]",
    color: "#10B981",
  },
  Entertainment: {
    icon: "🎬",
    bg: "bg-[#F5F3FF]",
    border: "border-[#DDD6FE]",
    text: "text-[#6D28D9]",
    dot: "bg-[#8B5CF6]",
    color: "#8B5CF6",
  },
  Shopping: {
    icon: "🛍️",
    bg: "bg-[#EFF6FF]",
    border: "border-[#BFDBFE]",
    text: "text-[#1D4ED8]",
    dot: "bg-[#3B82F6]",
    color: "#3B82F6",
  },
  Rent: {
    icon: "🏠",
    bg: "bg-[#F7FEE7]",
    border: "border-[#D9F99D]",
    text: "text-[#3f6212]",
    dot: "bg-[#84cc16]",
    color: "#84cc16",
  },
  Utilities: {
    icon: "⚡",
    bg: "bg-[#FAF5FF]",
    border: "border-[#E9D5FF]",
    text: "text-[#7E22CE]",
    dot: "bg-[#A855F7]",
    color: "#A855F7",
  },
  Bills: {
    icon: "⚡",
    bg: "bg-[#FAF5FF]",
    border: "border-[#E9D5FF]",
    text: "text-[#7E22CE]",
    dot: "bg-[#A855F7]",
    color: "#A855F7",
  },
  Travel: {
    icon: "✈️",
    bg: "bg-[#F0F9FF]",
    border: "border-[#BAE6FD]",
    text: "text-[#0369A1]",
    dot: "bg-[#0284C7]",
    color: "#0284C7",
  },
  Transport: {
    icon: "🚕",
    bg: "bg-[#F0F9FF]",
    border: "border-[#BAE6FD]",
    text: "text-[#0369A1]",
    dot: "bg-[#0284C7]",
    color: "#0284C7",
  },
  Healthcare: {
    icon: "💊",
    bg: "bg-[#FFF1F2]",
    border: "border-[#FECDD3]",
    text: "text-[#BE123C]",
    dot: "bg-[#F43F5E]",
    color: "#F43F5E",
  },
  Subscriptions: {
    icon: "📱",
    bg: "bg-[#F3E8FF]",
    border: "border-[#E9D5FF]",
    text: "text-[#6B21A8]",
    dot: "bg-[#9333EA]",
    color: "#9333EA",
  },
  General: {
    icon: "💳",
    bg: "bg-[#F8FAFC]",
    border: "border-[#E2E8F0]",
    text: "text-[#475569]",
    dot: "bg-[#64748B]",
    color: "#64748B",
  },
};

const DEFAULT_CATEGORY_META = {
  icon: "💳",
  bg: "bg-[#F8FAFC]",
  border: "border-[#E2E8F0]",
  text: "text-[#475569]",
  dot: "bg-[#64748B]",
  color: "#64748B",
};

function getCategoryMeta(categoryName: string) {
  return CATEGORY_MAP[categoryName] || DEFAULT_CATEGORY_META;
}

// Tailored merchant logo and icon resolution
function getMerchantMeta(name: string, category: string) {
  const lower = (name || "").toLowerCase();
  if (lower.includes("netflix")) {
    return { icon: "N", bg: "bg-black text-red-600 font-bold", isLogo: true };
  }
  if (lower.includes("spotify")) {
    return { icon: "🎧", bg: "bg-[#121212] text-[#1DB954] font-bold", isLogo: true };
  }
  if (lower.includes("zomato")) {
    return { icon: "Z", bg: "bg-[#E23744] text-white font-black", isLogo: true };
  }
  if (lower.includes("swiggy")) {
    return { icon: "S", bg: "bg-[#FC8019] text-white font-black", isLogo: true };
  }
  if (lower.includes("amazon")) {
    return { icon: "a", bg: "bg-[#232F3E] text-[#FF9900] font-black", isLogo: true };
  }
  if (lower.includes("flipkart")) {
    return { icon: "🛍️", bg: "bg-[#2874F0]/15 text-[#2874F0] font-bold", isLogo: true };
  }
  if (lower.includes("ola") || lower.includes("uber")) {
    return { icon: "🚗", bg: "bg-sky-100 text-sky-700", isLogo: true };
  }
  if (lower.includes("burger") || lower.includes("mcdonald") || lower.includes("kfc")) {
    return { icon: "🍔", bg: "bg-amber-100 text-amber-800", isLogo: true };
  }
  if (lower.includes("rent") || lower.includes("maintenance")) {
    return { icon: "🏠", bg: "bg-lime-100 text-lime-800", isLogo: true };
  }
  if (
    lower.includes("grocery") ||
    lower.includes("mart") ||
    lower.includes("market") ||
    lower.includes("fresh") ||
    lower.includes("blinkit") ||
    lower.includes("zepto")
  ) {
    return { icon: "🛒", bg: "bg-emerald-100 text-emerald-800", isLogo: true };
  }
  const cat = getCategoryMeta(category);
  return { icon: cat.icon, bg: `${cat.bg} ${cat.text}`, isLogo: false };
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function normalizeDateForInput(rawDate?: any): string {
  if (!rawDate) return new Date().toISOString().slice(0, 10);
  const trimmed = String(rawDate).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const parsed = Date.parse(trimmed);
  if (!isNaN(parsed)) {
    return new Date(parsed).toISOString().slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
}

interface EditableSmsDraft {
  amount: string;
  type: string;
  description: string;
  date: string;
  category: string;
  account: string;
  hasAmount: boolean;
  hasType: boolean;
  hasDescription: boolean;
  hasDate: boolean;
  hasCategory: boolean;
  hasAccount: boolean;
  raw: Record<string, any>;
}

function extractDraft(data: any): EditableSmsDraft | null {
  if (!data || typeof data !== "object") return null;

  let candidate: any = null;
  if (data.transaction && typeof data.transaction === "object") {
    candidate = data.transaction;
  } else if (data.draft && typeof data.draft === "object") {
    candidate = data.draft;
  } else if (data.data && typeof data.data === "object") {
    candidate = Array.isArray(data.data) ? data.data[0] : data.data;
  } else if (Array.isArray(data) && data.length > 0) {
    candidate = data[0];
  } else if (data.amount != null || data.description != null || data.merchant != null) {
    candidate = data;
  }

  if (!candidate || typeof candidate !== "object") return null;

  const hasAmount = candidate.amount != null && candidate.amount !== "" && !isNaN(Number(candidate.amount));
  const hasDesc = Boolean(
    (typeof candidate.description === "string" && candidate.description.trim()) ||
    (typeof candidate.merchant === "string" && candidate.merchant.trim())
  );

  if (!hasAmount && !hasDesc) return null;

  return {
    amount: candidate.amount != null ? String(candidate.amount) : "",
    type: candidate.type
      ? String(candidate.type).toLowerCase() === "credit"
        ? "credit"
        : "debit"
      : "debit",
    description: (candidate.description || candidate.merchant || "").trim(),
    date: normalizeDateForInput(candidate.date || candidate.transactionDate || candidate.transaction_date),
    category: candidate.category || "Food & Dining",
    account: candidate.account || candidate.accountId || candidate.source || candidate.bank || "",
    hasAmount,
    hasType: candidate.type != null && candidate.type !== "",
    hasDescription: hasDesc,
    hasDate: Boolean(candidate.date || candidate.transactionDate),
    hasCategory: candidate.category != null && candidate.category !== "",
    hasAccount: Boolean(candidate.account || candidate.accountId || candidate.source),
    raw: candidate,
  };
}

function parseSmsClientFallback(text: string): EditableSmsDraft | null {
  const amtMatch = text.match(/(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (!amtMatch) return null;
  const amount = amtMatch[1].replace(/,/g, "");

  const isCredit = /\b(?:credited|received|deposit)\b/i.test(text);
  const type: "debit" | "credit" = isCredit ? "credit" : "debit";

  let dateStr = "";
  const dateMatch =
    text.match(/(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i) ||
    text.match(/(\d{1,2}[-/]\w{3}[-/]?\d{0,4})/i);
  if (dateMatch) dateStr = dateMatch[1];

  let desc = "";
  const forMatch = text.match(
    /(?:for|to|at|towards)\s+([A-Za-z0-9 &.'_-]{2,40}?)(?:\.\s*Ref|\s+Ref|\s+on\s+\d|\s+Txn|\s+Avail|\s*[.\-]|$)/i
  );
  if (forMatch) desc = forMatch[1].trim();
  if (!desc) desc = "Bank transaction";

  const accMatch = text.match(/(?:A\/?c|account|card)\s*[\w*X-]+/i);
  const account = accMatch ? accMatch[0].trim() : "";

  let category = "General";
  const d = desc.toLowerCase();
  if (["mart", "grocery", "groceries", "supermarket", "fresh", "blinkit", "zepto"].some((k) => d.includes(k))) {
    category = "Groceries";
  } else if (["zomato", "swiggy", "cafe", "restaurant", "dining", "food", "coffee"].some((k) => d.includes(k))) {
    category = "Food & Dining";
  } else if (["uber", "ola", "metro", "petrol", "fuel", "travel"].some((k) => d.includes(k))) {
    category = "Travel";
  } else if (["amazon", "flipkart", "myntra", "shopping", "zara"].some((k) => d.includes(k))) {
    category = "Shopping";
  } else if (["apollo", "pharmacy", "health", "hospital"].some((k) => d.includes(k))) {
    category = "Healthcare";
  } else if (["netflix", "hotstar", "spotify", "cinema"].some((k) => d.includes(k))) {
    category = "Entertainment";
  } else if (["electricity", "bescom", "water", "wifi", "bill"].some((k) => d.includes(k))) {
    category = "Utilities";
  }

  return {
    amount,
    type,
    description: desc,
    date: normalizeDateForInput(dateStr),
    category,
    account,
    hasAmount: true,
    hasType: true,
    hasDescription: Boolean(desc),
    hasDate: Boolean(dateStr),
    hasCategory: true,
    hasAccount: Boolean(account),
    raw: { amount, description: desc, category, type },
  };
}

// Compact SVG Donut Chart Component
function DonutChart({
  categories,
  total,
}: {
  categories: Array<{ name: string; total: number; pct: number; color: string }>;
  total: number;
}) {
  const size = 100;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedOffset = 0;

  return (
    <div className="relative flex items-center justify-center w-24 h-24 shrink-0">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5DAC4"
          strokeWidth={strokeWidth}
          opacity={0.3}
        />
        {total > 0 &&
          categories.map((cat, i) => {
            const segmentLen = (cat.pct / 100) * circumference;
            const strokeDasharray = `${segmentLen} ${circumference}`;
            const strokeDashoffset = -accumulatedOffset;
            accumulatedOffset += segmentLen;

            return (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={cat.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500"
              />
            );
          })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-1">
        <span className="font-mono text-[11px] font-bold text-[#18122B] leading-tight">
          {formatINR(total)}
        </span>
        <span className="text-[8px] text-[#18122B]/60 font-medium">Spent</span>
      </div>
    </div>
  );
}

export function TransactionsTable({
  token,
  initialView = "transactions",
}: {
  token: string;
  initialView?: "transactions" | "documents" | "all";
}) {
  const searchParams = useSearchParams();
  const queryView = searchParams?.get("view");

  // Top Segmented View: transactions | documents | all
  const [viewMode, setViewMode] = useState<"transactions" | "documents" | "all">(
    queryView === "documents"
      ? "documents"
      : queryView === "all"
      ? "all"
      : initialView
  );

  useEffect(() => {
    if (queryView === "documents" || queryView === "all" || queryView === "transactions") {
      setViewMode(queryView as any);
    }
  }, [queryView]);

  // 1. Transactions State
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [importingCsv, setImportingCsv] = useState(false);

  // Form Mode & Inputs
  const [activeTab, setActiveTab] = useState<"quickAdd" | "pasteSms" | "uploadDoc">("quickAdd");
  const [form, setForm] = useState({
    amount: "",
    category: "Food & Dining",
    description: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDateFilter, setSelectedDateFilter] = useState("All");
  const [selectedAmountRange, setSelectedAmountRange] = useState("All");
  const [sortBy, setSortBy] = useState<"latest" | "oldest" | "highest" | "lowest">("latest");

  // Action Menu Dropdown active ID
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Edit Modal State
  const [editItem, setEditItem] = useState<TransactionItem | null>(null);
  const [editForm, setEditForm] = useState({
    description: "",
    amount: "",
    category: "",
    transactionDate: "",
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete Confirmation State
  const [deleteCandidate, setDeleteCandidate] = useState<TransactionItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 2. Documents State
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>("receipt");
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadDocError, setUploadDocError] = useState<string | null>(null);
  const [currentProcessingDoc, setCurrentProcessingDoc] = useState<DocumentItem | null>(null);
  const [vaultFilter, setVaultFilter] = useState<"all" | "receipt" | "bank_statement" | "other">("all");
  const [reviewDoc, setReviewDoc] = useState<ReviewDocument | null>(null);
  const [isLoadingReview, setIsLoadingReview] = useState(false);
  const [confirmDeleteDocId, setConfirmDeleteDocId] = useState<string | null>(null);
  const [isDeletingDoc, setIsDeletingDoc] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // 3. AI Insights State
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [refreshingInsights, setRefreshingInsights] = useState(false);

  // DOM Refs
  const csvInputRef = useRef<HTMLInputElement | null>(null);
  const docFileInputRef = useRef<HTMLInputElement | null>(null);
  const amountInputRef = useRef<HTMLInputElement | null>(null);
  const composerRef = useRef<HTMLDivElement | null>(null);
  const smsTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const docPollRef = useRef<NodeJS.Timeout | null>(null);

  // SMS Quick-Add State
  const [smsText, setSmsText] = useState("");
  const [isParsingSms, setIsParsingSms] = useState(false);
  const [smsDraft, setSmsDraft] = useState<EditableSmsDraft | null>(null);
  const [smsError, setSmsError] = useState<string | null>(null);
  const [isConfirmingSms, setIsConfirmingSms] = useState(false);

  function showToast(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3500);
  }

  // Load transactions
  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTransactions(token, 100);
      const raw = data.items || [];
      const normalized = raw.map((i: any) => ({
        ...i,
        amount: Number(i.amount || 0),
      }));
      setItems(normalized);
    } catch (e) {
      console.error("Failed to load transactions:", e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load documents
  const loadDocumentsList = useCallback(async (quiet = false) => {
    if (!quiet) setLoadingDocs(true);
    try {
      const docs = await getDocuments(token);
      if (Array.isArray(docs)) {
        setDocuments(docs);
      }
    } catch (e: any) {
      console.error("Failed to load documents:", e.message);
    } finally {
      if (!quiet) setLoadingDocs(false);
    }
  }, [token]);

  // Load Insights
  const loadInsights = useCallback(async () => {
    setLoadingInsights(true);
    try {
      const data = await getInsights(token);
      if (Array.isArray(data)) {
        setInsights(data);
      }
    } catch (e) {
      console.warn("Failed to load insights:", e);
    } finally {
      setLoadingInsights(false);
    }
  }, [token]);

  useEffect(() => {
    loadTransactions();
    loadDocumentsList();
    loadInsights();
  }, [loadTransactions, loadDocumentsList, loadInsights]);

  // Polling for processing documents
  const hasPendingDocs = documents.some(
    (d) => d.status === "QUEUED" || d.status === "PROCESSING"
  );

  useEffect(() => {
    if (!hasPendingDocs && !currentProcessingDoc) return;

    docPollRef.current = setInterval(async () => {
      try {
        await loadDocumentsList(true);
        if (currentProcessingDoc) {
          const updated = await getDocumentStatus(token, currentProcessingDoc.id);
          if (updated && (updated.status === "COMPLETED" || updated.status === "NEEDS_REVIEW" || updated.status === "FAILED")) {
            setCurrentProcessingDoc(null);
            if (updated.status === "NEEDS_REVIEW") {
              setReviewDoc(updated);
            }
          }
        }
      } catch (err) {
        console.warn("Polling status error:", err);
      }
    }, 2500);

    return () => {
      if (docPollRef.current) clearInterval(docPollRef.current);
    };
  }, [hasPendingDocs, currentProcessingDoc, token, loadDocumentsList]);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-action-menu]")) {
        setActiveMenuId(null);
      }
    }
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  // Handle Add Transaction
  async function handleAdd(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!form.amount || !form.description.trim()) return;

    setIsSubmitting(true);
    try {
      await createTransaction(token, {
        amount: Number(form.amount),
        category: form.category,
        description: form.description.trim(),
        transactionDate: form.date ? new Date(form.date).toISOString() : new Date().toISOString(),
      });
      setForm({
        amount: "",
        category: "Food & Dining",
        description: "",
        date: new Date().toISOString().slice(0, 10),
      });
      showToast("Transaction recorded successfully! ✦");
      loadTransactions();
    } catch (err: any) {
      console.error(err);
      showToast("Error recording transaction");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle CSV Upload
  async function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingCsv(true);
    try {
      const res = await importTransactionsCsv(token, file);
      showToast(`Imported ${res.count || "several"} transactions!`);
      loadTransactions();
    } catch (err: any) {
      console.error("CSV import error:", err);
      showToast(`Import failed: ${err.message || "Invalid file"}`);
    } finally {
      setImportingCsv(false);
      if (csvInputRef.current) csvInputRef.current.value = "";
    }
  }

  // Export CSV
  function handleExportCsv() {
    if (filteredItems.length === 0) {
      showToast("No transactions to export");
      return;
    }
    const headers = ["Date", "Description", "Category", "Amount", "Source"];
    const rows = filteredItems.map((i) => [
      i.transactionDate.slice(0, 10),
      `"${(i.description || "").replace(/"/g, '""')}"`,
      `"${(i.category || "").replace(/"/g, '""')}"`,
      i.amount,
      i.source || "MANUAL",
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `finsage_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Transactions exported to CSV!");
  }

  // Handle Bank SMS Parse
  async function handleParseSms() {
    const trimmed = smsText.trim();
    if (!trimmed) {
      setSmsError("Please paste an SMS text to parse");
      return;
    }

    setSmsError(null);
    setIsParsingSms(true);
    try {
      let draft: EditableSmsDraft | null = null;
      try {
        const res = await parseSms(token, trimmed);
        draft = extractDraft(res);
      } catch (srvErr) {
        console.warn("Server SMS parse endpoint warning, trying fallback:", srvErr);
      }

      if (!draft) draft = parseSmsClientFallback(trimmed);

      if (!draft) {
        setSmsError("Couldn't recognize this message format");
        setSmsDraft(null);
        return;
      }
      setSmsDraft(draft);
    } catch (err: any) {
      console.error("SMS parse error:", err);
      const fallbackDraft = parseSmsClientFallback(trimmed);
      if (fallbackDraft) {
        setSmsDraft(fallbackDraft);
        setSmsError(null);
      } else {
        setSmsError("Couldn't recognize this message format");
        setSmsDraft(null);
      }
    } finally {
      setIsParsingSms(false);
    }
  }

  // Handle Confirm SMS
  async function handleConfirmSms() {
    if (!smsDraft) return;

    const amt = parseFloat(smsDraft.amount);
    if (smsDraft.hasAmount && (isNaN(amt) || amt <= 0)) {
      setSmsError("Please enter a valid positive amount.");
      return;
    }
    if (smsDraft.hasDescription && !smsDraft.description.trim()) {
      setSmsError("Description cannot be empty.");
      return;
    }

    setSmsError(null);
    setIsConfirmingSms(true);

    try {
      const payload: Record<string, any> = {
        ...smsDraft.raw,
      };
      if (smsDraft.hasAmount) payload.amount = amt;
      if (smsDraft.hasDescription) {
        payload.description = smsDraft.description.trim();
        if (smsDraft.raw.merchant) payload.merchant = smsDraft.description.trim();
      }
      if (smsDraft.hasType) payload.type = smsDraft.type;
      if (smsDraft.hasDate) {
        payload.date = smsDraft.date;
        payload.transactionDate = new Date(smsDraft.date).toISOString();
      } else {
        payload.transactionDate = new Date().toISOString();
      }
      if (smsDraft.hasCategory) payload.category = smsDraft.category;
      if (smsDraft.hasAccount) {
        payload.account = smsDraft.account;
        if (smsDraft.raw.accountId) payload.accountId = smsDraft.account;
        if (smsDraft.raw.source) payload.source = smsDraft.account;
      }

      await confirmSmsTransaction(token, payload);
      await loadTransactions();
      setSmsText("");
      setSmsDraft(null);
      setSmsError(null);
      showToast("SMS transaction confirmed and recorded! ✦");
    } catch (err: any) {
      console.error("Failed to confirm SMS transaction:", err);
      const msg = err?.message && !err.message.includes("[object")
        ? err.message
        : "Failed to confirm transaction. Please try again.";
      setSmsError(msg);
    } finally {
      setIsConfirmingSms(false);
    }
  }

  // Handle Document Upload
  async function handleDocUpload() {
    if (!docFile) {
      setUploadDocError("Please select or drop a document file first.");
      return;
    }

    setUploadDocError(null);
    setUploadingDoc(true);

    try {
      const res = await uploadDocument(token, docFile, docType);
      showToast(`Document "${docFile.name}" deposited to vault.`);

      const newDoc: DocumentItem = {
        id: res.documentId || res.id,
        title: docFile.name,
        docType: docType,
        status: res.status || "QUEUED",
        confidence: null,
        uploadedAt: new Date().toISOString(),
      };
      setCurrentProcessingDoc(newDoc);
      setDocFile(null);
      if (docFileInputRef.current) docFileInputRef.current.value = "";

      await loadDocumentsList(true);
    } catch (e: any) {
      setUploadDocError(e.message || "Failed to upload document");
    } finally {
      setUploadingDoc(false);
    }
  }

  // Open Document Review Modal
  async function handleOpenDocReview(doc: DocumentItem) {
    setIsLoadingReview(true);
    try {
      const fullDoc = await getDocumentStatus(token, doc.id);
      setReviewDoc(fullDoc || doc);
    } catch {
      setReviewDoc(doc);
    } finally {
      setIsLoadingReview(false);
    }
  }

  // Delete Document
  async function handleDeleteDoc(id: string, e?: React.MouseEvent) {
    if (e) e.stopPropagation();

    if (confirmDeleteDocId !== id) {
      setConfirmDeleteDocId(id);
      return;
    }

    setIsDeletingDoc(true);
    try {
      await deleteDocument(token, id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      if (reviewDoc && reviewDoc.id === id) setReviewDoc(null);
      if (currentProcessingDoc && currentProcessingDoc.id === id) setCurrentProcessingDoc(null);
      setConfirmDeleteDocId(null);
      showToast("Document deleted from vault.");
    } catch (err: any) {
      alert(err.message || "Failed to delete document");
    } finally {
      setIsDeletingDoc(false);
    }
  }

  // Refresh AI Insights
  async function handleRefreshInsights() {
    setRefreshingInsights(true);
    try {
      const res = await generateInsights(token);
      if (res && res.insights && Array.isArray(res.insights)) {
        setInsights(res.insights);
        showToast("Fresh AI insights generated!");
      } else {
        const fresh = await getInsights(token);
        if (Array.isArray(fresh)) setInsights(fresh);
        showToast("Insights updated!");
      }
    } catch (e) {
      console.warn("Failed to generate fresh insights:", e);
      try {
        const fresh = await getInsights(token);
        if (Array.isArray(fresh)) setInsights(fresh);
      } catch {}
    } finally {
      setRefreshingInsights(false);
    }
  }

  // Handle Edit Trigger
  function handleOpenEdit(item: TransactionItem) {
    setActiveMenuId(null);
    setEditItem(item);
    setEditForm({
      description: item.description,
      amount: String(item.amount),
      category: item.category,
      transactionDate: item.transactionDate.slice(0, 10),
    });
  }

  // Save Edit
  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editItem) return;

    setIsSavingEdit(true);
    try {
      await updateTransaction(token, editItem.id, {
        description: editForm.description.trim(),
        amount: Number(editForm.amount),
        category: editForm.category,
        transactionDate: new Date(editForm.transactionDate).toISOString(),
      });
      showToast("Transaction updated!");
      setEditItem(null);
      loadTransactions();
    } catch (err: any) {
      console.error(err);
      showToast("Failed to update transaction");
    } finally {
      setIsSavingEdit(false);
    }
  }

  // Delete Trigger
  function handleOpenDelete(item: TransactionItem) {
    setActiveMenuId(null);
    setDeleteCandidate(item);
  }

  // Confirm Delete
  async function handleConfirmDelete() {
    if (!deleteCandidate) return;
    setIsDeleting(true);
    try {
      await deleteTransaction(token, deleteCandidate.id);
      showToast("Transaction deleted");
      setDeleteCandidate(null);
      loadTransactions();
    } catch (err: any) {
      console.error(err);
      showToast("Failed to delete transaction");
    } finally {
      setIsDeleting(false);
    }
  }

  // Financial Metrics for the 4 Summary Cards
  const summaryMetrics = useMemo(() => {
    const now = new Date();
    const currYear = now.getFullYear();
    const currMonth = now.getMonth();

    const prevMonthDate = new Date(currYear, currMonth - 1, 1);
    const prevYear = prevMonthDate.getFullYear();
    const prevMonth = prevMonthDate.getMonth();

    const currentMonthItems = items.filter((i) => {
      const d = new Date(i.transactionDate);
      return d.getFullYear() === currYear && d.getMonth() === currMonth;
    });

    const prevMonthItems = items.filter((i) => {
      const d = new Date(i.transactionDate);
      return d.getFullYear() === prevYear && d.getMonth() === prevMonth;
    });

    const thisMonthSpent = currentMonthItems.reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
    const prevMonthSpent = prevMonthItems.reduce((acc, cur) => acc + Number(cur.amount || 0), 0);

    const isSpendDown = thisMonthSpent <= prevMonthSpent;
    const spendDiff = Math.abs(thisMonthSpent - prevMonthSpent);
    const momSpendDiff =
      prevMonthSpent > 0
        ? `${isSpendDown ? "↓" : "↑"} ${Math.round((spendDiff / prevMonthSpent) * 100)}% vs last mo`
        : "Current period";

    // Top Category
    const catMap: Record<string, number> = {};
    for (const item of currentMonthItems) {
      catMap[item.category] = (catMap[item.category] || 0) + Number(item.amount || 0);
    }
    let topCat = "General";
    let topCatAmt = 0;
    for (const [cat, amt] of Object.entries(catMap)) {
      if (amt > topCatAmt) {
        topCat = cat;
        topCatAmt = amt;
      }
    }

    const dayOfMonth = Math.max(1, now.getDate());
    const avgDailySpend = Math.round(thisMonthSpent / dayOfMonth);

    const transactionCount = currentMonthItems.length;
    const prevTransactionCount = prevMonthItems.length;
    const txDiff = transactionCount - prevTransactionCount;
    const momTxDiff =
      prevTransactionCount > 0
        ? `${txDiff >= 0 ? "+" : ""}${txDiff} vs last mo`
        : `${transactionCount} recorded`;

    // Vault Stats
    const totalDocs = documents.length;
    const reconciledDocs = documents.filter((d) => d.status === "COMPLETED").length;
    const needsReviewDocs = documents.filter((d) => d.status === "NEEDS_REVIEW").length;

    return {
      thisMonthSpent,
      prevMonthSpent,
      isSpendDown,
      momSpendDiff,
      transactionCount,
      momTxDiff,
      topCategoryName: topCat,
      topCategoryAmount: topCatAmt,
      topCategoryMeta: getCategoryMeta(topCat),
      avgDailySpend,
      totalDocs,
      reconciledDocs,
      needsReviewDocs,
    };
  }, [items, documents]);

  // Filtered transactions list
  const filteredItems = useMemo(() => {
    let result = [...items];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (i) =>
          (i.description && i.description.toLowerCase().includes(q)) ||
          (i.category && i.category.toLowerCase().includes(q)) ||
          (i.source && i.source.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== "All") {
      result = result.filter((i) => i.category === selectedCategory);
    }

    if (selectedDateFilter !== "All") {
      const now = new Date();
      const currYear = now.getFullYear();
      const currMonth = now.getMonth();

      if (selectedDateFilter === "thisMonth") {
        result = result.filter((i) => {
          const d = new Date(i.transactionDate);
          return d.getFullYear() === currYear && d.getMonth() === currMonth;
        });
      } else if (selectedDateFilter === "lastMonth") {
        const prevMonthDate = new Date(currYear, currMonth - 1, 1);
        const pYear = prevMonthDate.getFullYear();
        const pMonth = prevMonthDate.getMonth();
        result = result.filter((i) => {
          const d = new Date(i.transactionDate);
          return d.getFullYear() === pYear && d.getMonth() === pMonth;
        });
      } else if (selectedDateFilter === "last30Days") {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);
        result = result.filter((i) => new Date(i.transactionDate) >= cutoff);
      } else if (selectedDateFilter === "thisYear") {
        result = result.filter((i) => new Date(i.transactionDate).getFullYear() === currYear);
      }
    }

    if (selectedAmountRange !== "All") {
      if (selectedAmountRange === "under500") {
        result = result.filter((i) => Number(i.amount) < 500);
      } else if (selectedAmountRange === "500to2000") {
        result = result.filter((i) => Number(i.amount) >= 500 && Number(i.amount) <= 2000);
      } else if (selectedAmountRange === "2000to10000") {
        result = result.filter((i) => Number(i.amount) > 2000 && Number(i.amount) <= 10000);
      } else if (selectedAmountRange === "above10000") {
        result = result.filter((i) => Number(i.amount) > 10000);
      }
    }

    result.sort((a, b) => {
      if (sortBy === "latest") {
        return new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime();
      }
      if (sortBy === "highest") {
        return Number(b.amount) - Number(a.amount);
      }
      if (sortBy === "lowest") {
        return Number(a.amount) - Number(b.amount);
      }
      return 0;
    });

    return result;
  }, [items, searchQuery, selectedCategory, selectedDateFilter, selectedAmountRange, sortBy]);

  // Filtered documents list
  const filteredDocuments = useMemo(() => {
    let list = [...documents];
    if (vaultFilter !== "all") {
      list = list.filter((d) => {
        const lower = (d.docType || "").toLowerCase();
        if (vaultFilter === "receipt") return lower.includes("receipt");
        if (vaultFilter === "bank_statement") return lower.includes("statement") || lower.includes("bank");
        return !lower.includes("receipt") && !lower.includes("statement");
      });
    }
    return list;
  }, [documents, vaultFilter]);

  // Combined Activity feed for "All Activity" view
  const combinedActivity = useMemo(() => {
    const txEvents = items.map((tx) => ({
      type: "transaction" as const,
      id: tx.id,
      date: tx.transactionDate,
      title: tx.description,
      subtitle: `${tx.category} • ${tx.source || "MANUAL"}`,
      amount: tx.amount,
      isDebit: true,
      raw: tx,
    }));

    const docEvents = documents.map((doc) => ({
      type: "document" as const,
      id: doc.id,
      date: doc.uploadedAt,
      title: doc.title,
      subtitle: `VAULT: ${doc.docType.replace("_", " ").toUpperCase()} • ${doc.status}`,
      amount: null,
      isDebit: false,
      raw: doc,
    }));

    const combined = [...txEvents, ...docEvents];
    combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return combined;
  }, [items, documents]);

  // Spending Breakdown data
  const spendingBreakdown = useMemo(() => {
    const now = new Date();
    const currYear = now.getFullYear();
    const currMonth = now.getMonth();

    const currentMonthItems = items.filter((i) => {
      const d = new Date(i.transactionDate);
      return d.getFullYear() === currYear && d.getMonth() === currMonth;
    });

    const totals: Record<string, number> = {};
    for (const item of currentMonthItems) {
      const cat = item.category || "General";
      totals[cat] = (totals[cat] || 0) + Number(item.amount || 0);
    }

    const totalAll = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
    const sorted = Object.entries(totals)
      .map(([name, total]) => ({
        name,
        total,
        pct: Math.round((total / totalAll) * 100),
        color: getCategoryMeta(name).color,
      }))
      .sort((a, b) => b.total - a.total);

    return {
      total: totalAll === 1 && Object.keys(totals).length === 0 ? 0 : totalAll,
      categories: sorted.length > 0 ? sorted.slice(0, 4) : [
        { name: "No Data", total: 0, pct: 100, color: "#E5DAC4" },
      ],
    };
  }, [items]);

  // Helper for document icon
  function getDocIcon(type: string, title: string) {
    const lower = (type + " " + title).toLowerCase();
    if (lower.includes("statement") || lower.includes("bank") || lower.includes("salary")) {
      return { icon: "🏦", badge: "STATEMENT", color: "text-indigo-600 bg-indigo-50" };
    }
    if (lower.includes("receipt") || lower.includes("coffee") || lower.includes("mart")) {
      return { icon: "🧾", badge: "RECEIPT", color: "text-lime-700 bg-lime-50" };
    }
    return { icon: "📄", badge: "DOCUMENT", color: "text-amber-700 bg-amber-50" };
  }

  // Render Document Status Pill
  function renderDocStatus(status: string) {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-300 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-800">
            ✓ RECONCILED
          </span>
        );
      case "NEEDS_REVIEW":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-300 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-800 animate-pulse">
            ⚠ REVIEW
          </span>
        );
      case "QUEUED":
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-purple-800">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-600 animate-ping" />
            PARSING…
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-rose-800">
            ✕ FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 border border-stone-200 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-stone-600">
            ✦ {status}
          </span>
        );
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF6ED] text-[#18122B] pb-16 pt-2 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {message && (
        <div className="fixed top-4 right-4 z-50 rounded-xl border border-[#DDD9CF] bg-[#18122B] text-white px-4 py-2.5 text-xs font-bold shadow-xl animate-fade-in flex items-center gap-2">
          <span>✦</span>
          <span>{message}</span>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          1. COMPACT TRANSACTIONS + VAULT HERO
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="relative pt-2 sm:pt-3 pb-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-100/70 px-2.5 py-0.5 text-[10px] font-bold text-emerald-900 mb-1">
              <span>🏷️</span>
              <span className="tracking-wide uppercase">FINANCIAL LEDGER & VAULT</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#18122B]">
              Your money, all in one place. <span className="text-amber-500">✦</span>
            </h1>
            <p className="text-xs text-[#18122B]/60 font-medium mt-0.5">
              Live double-entry transactions and intelligent document vault unified in a single workspace.
            </p>
          </div>

          {/* Hero Right: Integrated FinSage Owl Mascot */}
          <div className="flex items-center gap-3 self-start md:self-center">
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="font-serif text-xs font-bold italic text-[#18122B]/75">
                small spends, big picture
              </span>
              <span className="font-serif text-[11px] text-[#18122B]/55 italic">
                receipts + ledger synced 💖
              </span>
            </div>

            <div className="relative w-28 sm:w-36 h-20 sm:h-24 shrink-0 flex items-center justify-center">
              <Image
                src="/owl-transactions-hero.png"
                alt="FinSage Owl Mascot"
                width={160}
                height={120}
                priority
                className="w-auto h-full object-contain pointer-events-none drop-shadow-sm select-none"
              />
            </div>
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            SEGMENTED VIEW NAVIGATION TABS (Compact)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="mt-3 flex items-center gap-1.5 border-b border-[#E5DAC4] pb-2.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setViewMode("transactions")}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer shrink-0 ${
              viewMode === "transactions"
                ? "bg-[#18122B] text-white shadow-xs"
                : "bg-white border border-[#DDD9CF] text-[#18122B]/70 hover:text-[#18122B]"
            }`}
          >
            <span>🏷️</span>
            <span>Transactions</span>
            <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] font-mono">
              {items.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("documents")}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer shrink-0 ${
              viewMode === "documents"
                ? "bg-[#18122B] text-white shadow-xs"
                : "bg-white border border-[#DDD9CF] text-[#18122B]/70 hover:text-[#18122B]"
            }`}
          >
            <span>📁</span>
            <span>Document Vault</span>
            <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] font-mono">
              {documents.length}
            </span>
            {summaryMetrics.needsReviewDocs > 0 && (
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setViewMode("all")}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer shrink-0 ${
              viewMode === "all"
                ? "bg-[#18122B] text-white shadow-xs"
                : "bg-white border border-[#DDD9CF] text-[#18122B]/70 hover:text-[#18122B]"
            }`}
          >
            <span>⚡</span>
            <span>All Activity</span>
          </button>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          2. FOUR SUMMARY CARDS
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
        {/* Card 1: THIS MONTH */}
        <div className="rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-3 sm:p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-rose-700 text-[10px]">
                ↓
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#18122B]/60">
                THIS MONTH
              </span>
            </div>
            <div className="flex items-end gap-0.5 h-3">
              <div className="w-1 bg-rose-300 h-1.5 rounded-t-xs" />
              <div className="w-1 bg-rose-400 h-2.5 rounded-t-xs" />
              <div className="w-1 bg-rose-500 h-full rounded-t-xs" />
            </div>
          </div>
          <div className="mt-1.5">
            <p className="font-mono text-lg sm:text-xl font-black text-[#18122B]">
              {formatINR(summaryMetrics.thisMonthSpent)}
            </p>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[10px] font-medium text-[#18122B]/50">Total Outflow</span>
              <span
                className={`text-[9px] font-bold ${
                  summaryMetrics.isSpendDown ? "text-rose-600" : "text-emerald-700"
                }`}
              >
                {summaryMetrics.momSpendDiff}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: TRANSACTIONS RECORDED */}
        <div className="rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-3 sm:p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[10px]">
                ↑
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#18122B]/60">
                TRANSACTIONS
              </span>
            </div>
            <span className="text-emerald-600 text-xs font-mono">📈</span>
          </div>
          <div className="mt-1.5">
            <p className="font-mono text-lg sm:text-xl font-black text-[#18122B]">
              {summaryMetrics.transactionCount}
            </p>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[10px] font-medium text-[#18122B]/50">Recorded</span>
              <span className="text-[9px] font-bold text-emerald-700 font-mono">
                {summaryMetrics.momTxDiff}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: TOP CATEGORY */}
        <div className="rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-3 sm:p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-[10px]">
                🛍️
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#18122B]/60">
                TOP CATEGORY
              </span>
            </div>
            <span className="text-xs">{summaryMetrics.topCategoryMeta.icon}</span>
          </div>
          <div className="mt-1.5">
            <div className="flex items-center justify-between">
              <p className="font-serif text-sm font-bold text-[#18122B] truncate">
                {summaryMetrics.topCategoryName}
              </p>
              <span className="font-mono text-xs font-bold text-[#18122B]/80">
                {formatINR(summaryMetrics.topCategoryAmount)}
              </span>
            </div>
            <p className="text-[10px] font-medium text-[#18122B]/50 mt-0.5 truncate">
              Highest spending bucket
            </p>
          </div>
        </div>

        {/* Card 4: VAULT DOCUMENTS */}
        <div className="rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-3 sm:p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-800 text-[10px]">
                📁
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#18122B]/60">
                VAULT DOCUMENTS
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700">
              {summaryMetrics.reconciledDocs} reconciled
            </span>
          </div>
          <div className="mt-1.5">
            <p className="font-mono text-lg sm:text-xl font-black text-[#18122B]">
              {summaryMetrics.totalDocs}
            </p>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[10px] font-medium text-[#18122B]/50">OCR Ingested</span>
              {summaryMetrics.needsReviewDocs > 0 ? (
                <span className="text-[9px] font-bold text-amber-800">
                  {summaryMetrics.needsReviewDocs} need review
                </span>
              ) : (
                <span className="text-[9px] font-bold text-emerald-700">All synced ✓</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          3. ADD TRANSACTION / UPLOAD DOCUMENT WORKSPACE
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div
        ref={composerRef}
        className="rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-3 sm:p-3.5 shadow-2xs mb-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-xs sm:text-sm font-bold tracking-tight uppercase text-[#18122B]">
              RECORD ACTIVITY
            </h2>
          </div>

          {/* Mode Toggles */}
          <div className="flex items-center gap-1 bg-[#FAF6ED] p-0.5 rounded-xl border border-[#E5DAC4]">
            <button
              type="button"
              onClick={() => setActiveTab("quickAdd")}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                activeTab === "quickAdd"
                  ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                  : "text-[#18122B]/60 hover:text-[#18122B]"
              }`}
            >
              <span>🌱</span>
              <span>Quick Add</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("pasteSms")}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                activeTab === "pasteSms"
                  ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                  : "text-[#18122B]/60 hover:text-[#18122B]"
              }`}
            >
              <span>📋</span>
              <span>Paste Bank SMS</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("uploadDoc")}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                activeTab === "uploadDoc"
                  ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                  : "text-[#18122B]/60 hover:text-[#18122B]"
              }`}
            >
              <span>✦</span>
              <span>Upload Document</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Quick Add Form */}
        {activeTab === "quickAdd" && (
          <form
            onSubmit={handleAdd}
            className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
          >
            {/* Amount */}
            <div className="sm:col-span-2 relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#18122B]/50 font-mono">
                ₹
              </span>
              <input
                ref={amountInputRef}
                type="number"
                placeholder="Amount"
                step="any"
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full rounded-xl border border-[#DDD9CF] bg-white pl-6 pr-2 py-1.5 text-xs font-mono font-bold text-[#18122B] placeholder:text-[#18122B]/40 focus:border-[#18122B] focus:outline-none"
              />
            </div>

            {/* Description / Merchant */}
            <div className="sm:col-span-4">
              <input
                type="text"
                placeholder="What did you spend on? (e.g. Dinner, Fuel, Rent)"
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-xl border border-[#DDD9CF] bg-white px-3 py-1.5 text-xs font-medium text-[#18122B] placeholder:text-[#18122B]/40 focus:border-[#18122B] focus:outline-none"
              />
            </div>

            {/* Category Dropdown */}
            <div className="sm:col-span-3">
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-xl border border-[#DDD9CF] bg-white px-2.5 py-1.5 text-xs font-medium text-[#18122B] focus:border-[#18122B] focus:outline-none cursor-pointer"
              >
                <option value="Food & Dining">🍽️ Food & Dining</option>
                <option value="Groceries">🛒 Groceries</option>
                <option value="Entertainment">🎬 Entertainment</option>
                <option value="Shopping">🛍️ Shopping</option>
                <option value="Rent">🏠 Rent</option>
                <option value="Utilities">⚡ Utilities</option>
                <option value="Travel">✈️ Travel</option>
                <option value="Healthcare">💊 Healthcare</option>
                <option value="Subscriptions">📱 Subscriptions</option>
                <option value="General">💳 General</option>
              </select>
            </div>

            {/* Date Picker */}
            <div className="sm:col-span-2">
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full rounded-xl border border-[#DDD9CF] bg-white px-2 py-1.5 text-xs font-medium text-[#18122B] focus:border-[#18122B] focus:outline-none"
              />
            </div>

            {/* Record Button */}
            <div className="sm:col-span-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-[#2d5016] hover:bg-[#234011] text-white py-1.5 px-2 text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? "..." : <span>Record →</span>}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Bank SMS Quick Add */}
        {activeTab === "pasteSms" && (
          <div className="space-y-2">
            {!smsDraft ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <textarea
                  ref={smsTextareaRef}
                  value={smsText}
                  onChange={(e) => {
                    setSmsText(e.target.value);
                    setSmsError(null);
                  }}
                  rows={2}
                  placeholder="Paste bank/UPI debit alert SMS (e.g., 'Rs 450 debited at Zomato on 03-Oct-26...')"
                  className="flex-1 rounded-xl border border-[#DDD9CF] bg-white p-2 text-xs font-mono text-[#18122B] placeholder:text-[#18122B]/40 focus:border-[#18122B] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleParseSms}
                  disabled={isParsingSms || !smsText.trim()}
                  className="sm:w-32 rounded-xl bg-[#2d5016] hover:bg-[#234011] text-white py-1.5 px-3 text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isParsingSms ? "Parsing..." : "Parse SMS →"}
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                    <span>✓</span> Review Parsed SMS Transaction
                  </span>
                  <button
                    type="button"
                    onClick={() => setSmsDraft(null)}
                    className="text-[11px] font-bold text-[#18122B]/60 hover:text-[#18122B]"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-[#18122B]/60">Amount (₹)</label>
                    <input
                      type="number"
                      value={smsDraft.amount}
                      onChange={(e) => setSmsDraft({ ...smsDraft, amount: e.target.value })}
                      className="w-full rounded-lg border border-[#DDD9CF] bg-white px-2 py-1 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#18122B]/60">Merchant / Description</label>
                    <input
                      type="text"
                      value={smsDraft.description}
                      onChange={(e) => setSmsDraft({ ...smsDraft, description: e.target.value })}
                      className="w-full rounded-lg border border-[#DDD9CF] bg-white px-2 py-1 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#18122B]/60">Category</label>
                    <select
                      value={smsDraft.category}
                      onChange={(e) => setSmsDraft({ ...smsDraft, category: e.target.value })}
                      className="w-full rounded-lg border border-[#DDD9CF] bg-white px-2 py-1 font-medium"
                    >
                      <option value="Food & Dining">Food & Dining</option>
                      <option value="Groceries">Groceries</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Shopping">Shopping</option>
                      <option value="Rent">Rent</option>
                      <option value="Utilities">Utilities</option>
                      <option value="Travel">Travel</option>
                      <option value="General">General</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#18122B]/60">Date</label>
                    <input
                      type="date"
                      value={smsDraft.date}
                      onChange={(e) => setSmsDraft({ ...smsDraft, date: e.target.value })}
                      className="w-full rounded-lg border border-[#DDD9CF] bg-white px-2 py-1 font-medium"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSmsDraft(null)}
                    className="rounded-lg border border-[#DDD9CF] bg-white px-3 py-1 text-xs font-bold text-[#18122B]/70 hover:bg-[#FAF6ED]"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSms}
                    disabled={isConfirmingSms}
                    className="rounded-lg bg-[#2d5016] hover:bg-[#234011] text-white px-3 py-1 text-xs font-bold transition flex items-center gap-1 shadow-xs disabled:opacity-50"
                  >
                    {isConfirmingSms ? "Saving..." : "Confirm & Save →"}
                  </button>
                </div>
              </div>
            )}

            {smsError && (
              <p className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-1.5">
                ⚠️ {smsError}
              </p>
            )}
          </div>
        )}

        {/* Tab 3: Quick Document Upload Dropzone */}
        {activeTab === "uploadDoc" && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragOver(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                setDocFile(e.dataTransfer.files[0]);
                setUploadDocError(null);
              }
            }}
            className={`rounded-xl border-2 border-dashed p-3 transition flex flex-col sm:flex-row items-center justify-between gap-3 ${
              isDragOver
                ? "border-lime-500 bg-lime-50/50"
                : "border-stone-300/80 bg-white"
            }`}
          >
            <input
              ref={docFileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.csv"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setDocFile(e.target.files[0]);
                  setUploadDocError(null);
                }
              }}
              className="hidden"
            />

            <div className="flex items-center gap-2.5">
              <span className="text-xl p-1.5 rounded-lg bg-lime-100 text-lime-800">
                ✦
              </span>
              <div>
                <p className="font-serif text-xs sm:text-sm font-bold text-[#18122B]">
                  {docFile ? docFile.name : "DROP FINANCIAL DOCUMENT OR CHOOSE FILE"}
                </p>
                <p className="text-[10px] text-stone-500">
                  {docFile
                    ? `${(docFile.size / 1024).toFixed(1)} KB · Ready to deposit`
                    : "Receipts, statements, invoices (PDF, JPG, PNG, CSV)"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="rounded-lg border border-[#DDD9CF] bg-white px-2 py-1 text-xs font-semibold text-[#18122B]"
              >
                <option value="receipt">Receipt</option>
                <option value="bank_statement">Bank Statement</option>
                <option value="other">Other Document</option>
              </select>

              <button
                type="button"
                onClick={() => docFileInputRef.current?.click()}
                className="rounded-lg border border-[#DDD9CF] bg-white px-3 py-1 text-xs font-bold text-stone-700 hover:bg-stone-50 transition"
              >
                Choose file
              </button>

              <button
                type="button"
                onClick={handleDocUpload}
                disabled={!docFile || uploadingDoc}
                className="rounded-lg bg-[#18122B] px-3.5 py-1 text-xs font-bold text-white shadow-xs hover:bg-stone-800 disabled:opacity-40 transition"
              >
                {uploadingDoc ? "Scanning…" : "Deposit to Vault →"}
              </button>
            </div>

            {uploadDocError && (
              <p className="w-full text-xs font-semibold text-rose-700">
                ⚠ {uploadDocError}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          4. MAIN TWO-COLUMN WORKSPACE
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            LEFT / PRIMARY COLUMN (Col-7 or Col-8 on desktop)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="lg:col-span-7 space-y-4">
          {/* SEARCH & FILTERS TOOLBAR */}
          <div className="rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-2">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px]">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#18122B]/40">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search transactions, receipts, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[#DDD9CF] bg-white pl-7 pr-2 py-1.5 text-xs text-[#18122B] placeholder:text-[#18122B]/40 focus:border-[#18122B] focus:outline-none"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-1.5">
              {viewMode === "transactions" && (
                <>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="rounded-xl border border-[#DDD9CF] bg-white px-2 py-1.5 text-xs font-bold text-[#18122B]/80 focus:border-[#18122B] focus:outline-none cursor-pointer"
                  >
                    <option value="All">All Categories ▾</option>
                    <option value="Food & Dining">Food & Dining</option>
                    <option value="Groceries">Groceries</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Rent">Rent</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Travel">Travel</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="General">General</option>
                  </select>

                  <select
                    value={selectedDateFilter}
                    onChange={(e) => setSelectedDateFilter(e.target.value)}
                    className="rounded-xl border border-[#DDD9CF] bg-white px-2 py-1.5 text-xs font-bold text-[#18122B]/80 focus:border-[#18122B] focus:outline-none cursor-pointer"
                  >
                    <option value="All">All Dates ▾</option>
                    <option value="thisMonth">This Month</option>
                    <option value="lastMonth">Last Month</option>
                    <option value="last30Days">Last 30 Days</option>
                    <option value="thisYear">This Year</option>
                  </select>

                  <select
                    value={selectedAmountRange}
                    onChange={(e) => setSelectedAmountRange(e.target.value)}
                    className="rounded-xl border border-[#DDD9CF] bg-white px-2 py-1.5 text-xs font-bold text-[#18122B]/80 focus:border-[#18122B] focus:outline-none cursor-pointer"
                  >
                    <option value="All">All Amounts ▾</option>
                    <option value="under500">Under ₹500</option>
                    <option value="500to2000">₹500 – ₹2,000</option>
                    <option value="2000to10000">₹2,000 – ₹10,000</option>
                    <option value="above10000">Above ₹10,000</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="rounded-xl border border-[#DDD9CF] bg-white px-2 py-1.5 text-xs font-bold text-[#18122B]/80 focus:border-[#18122B] focus:outline-none cursor-pointer"
                  >
                    <option value="latest">Latest First ▾</option>
                    <option value="oldest">Oldest First</option>
                    <option value="highest">Highest Amount</option>
                    <option value="lowest">Lowest Amount</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="flex items-center gap-1 rounded-xl border border-[#DDD9CF] bg-white px-2.5 py-1.5 text-xs font-bold text-[#18122B] hover:bg-[#FAF6ED] transition cursor-pointer"
                  >
                    <span>📥</span>
                    <span>Export</span>
                  </button>
                </>
              )}

              {viewMode === "documents" && (
                <div className="flex items-center gap-1">
                  {(["all", "receipt", "bank_statement", "other"] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setVaultFilter(cat)}
                      className={`rounded-xl px-2.5 py-1 text-xs font-bold capitalize transition ${
                        vaultFilter === cat
                          ? "bg-[#18122B] text-white"
                          : "border border-[#DDD9CF] bg-white text-[#18122B]/70 hover:text-[#18122B]"
                      }`}
                    >
                      {cat.replace("_", " ")}
                    </button>
                  ))}
                </div>
              )}

              {/* Hidden CSV file upload */}
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* VIEW: TRANSACTIONS LIST */}
          {viewMode === "transactions" && (
            <div className="rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-3.5 sm:p-4 shadow-2xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#E5DAC4]/60 mb-2">
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-xs sm:text-sm font-bold uppercase tracking-tight text-[#18122B]">
                    RECENT TRANSACTIONS
                  </h2>
                  <span className="rounded-full bg-[#18122B]/10 px-2 py-0.5 text-[10px] font-bold text-[#18122B]">
                    {filteredItems.length} records
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => csvInputRef.current?.click()}
                    disabled={importingCsv}
                    className="text-[11px] font-bold text-[#18122B]/70 hover:text-[#18122B] transition"
                  >
                    {importingCsv ? "Importing..." : "+ Import CSV"}
                  </button>
                </div>
              </div>

              {/* Transaction Row List */}
              {loading ? (
                <div className="py-12 text-center text-xs font-bold text-[#18122B]/50 animate-pulse">
                  Loading transactions...
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="py-12 text-center text-xs font-medium text-[#18122B]/50">
                  No transactions match the selected filters.
                </div>
              ) : (
                <div className="divide-y divide-[#E5DAC4]/40">
                  {filteredItems.map((item) => {
                    const meta = getCategoryMeta(item.category);
                    const merchantMeta = getMerchantMeta(item.description, item.category);
                    const isDocAttached = Boolean(
                      item.documentId ||
                      item.source === "ocr" ||
                      item.source === "document" ||
                      item.source === "bank_statement"
                    );

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between py-2 px-1 hover:bg-[#FAF6ED]/60 rounded-xl transition group relative"
                      >
                        {/* Left: Icon + Title + Metadata */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#DDD9CF]/60 text-xs shadow-2xs ${merchantMeta.bg}`}
                          >
                            {merchantMeta.icon}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-bold text-xs sm:text-sm text-[#18122B] truncate capitalize">
                                {item.description}
                              </p>
                              {isDocAttached && (
                                <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                  🧾 Receipt
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-[#18122B]/50 font-medium">
                              {formatDate(item.transactionDate)} •{" "}
                              <span className="uppercase text-[9px] font-bold tracking-wider">
                                {item.source || "MANUAL"}
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Middle: Category Pill */}
                        <div className="hidden sm:flex items-center shrink-0 pr-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold border ${meta.bg} ${meta.border} ${meta.text}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                            <span>{item.category}</span>
                          </span>
                        </div>

                        {/* Right: Amount & Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono text-xs sm:text-sm font-black text-[#18122B] whitespace-nowrap">
                            - {formatINR(item.amount)}
                          </span>

                          {/* Action Menu */}
                          <div className="relative" data-action-menu>
                            <button
                              type="button"
                              onClick={() =>
                                setActiveMenuId(activeMenuId === item.id ? null : item.id)
                              }
                              className="flex h-6 w-6 items-center justify-center rounded-lg text-[#18122B]/40 hover:text-[#18122B] hover:bg-[#FAF6ED] transition"
                            >
                              •••
                            </button>

                            {activeMenuId === item.id && (
                              <div className="absolute right-0 mt-1 w-28 rounded-xl border border-[#E5DAC4] bg-[#FFFDF8] p-1 shadow-lg z-30 animate-fade-in">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(item)}
                                  className="w-full text-left px-2 py-1 text-[11px] font-bold text-[#18122B]/80 hover:bg-[#FAF6ED] rounded-lg transition"
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenDelete(item)}
                                  className="w-full text-left px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-50 rounded-lg transition"
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* VIEW: DOCUMENTS GRID */}
          {viewMode === "documents" && (
            <div className="rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-3.5 sm:p-4 shadow-2xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#E5DAC4]/60 mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-xs sm:text-sm font-bold uppercase tracking-tight text-[#18122B]">
                    VAULT DOCUMENTS ({filteredDocuments.length})
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => loadDocumentsList()}
                  className="text-[11px] font-bold text-[#18122B]/70 hover:text-[#18122B]"
                >
                  ↻ Refresh Vault
                </button>
              </div>

              {loadingDocs ? (
                <div className="py-12 text-center text-xs font-bold text-[#18122B]/50 animate-pulse">
                  Retrieving vault records…
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="font-serif text-base font-bold text-[#18122B]">
                    No documents found in this category.
                  </p>
                  <p className="text-xs text-[#18122B]/50 mt-1">
                    Upload a receipt or statement to auto-extract expenses into your ledger.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredDocuments.map((d) => {
                    const iconInfo = getDocIcon(d.docType, d.title);
                    const formattedDate = formatDate(d.uploadedAt);
                    const confPct = d.confidence != null ? Math.round(d.confidence * 100) : null;

                    return (
                      <div
                        key={d.id}
                        onClick={() => handleOpenDocReview(d)}
                        className="flex flex-col justify-between rounded-xl border border-[#E5DAC4]/80 bg-white p-3.5 shadow-2xs hover:shadow-md hover:border-[#18122B]/30 transition cursor-pointer"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1.5 mb-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-base p-1 rounded-md bg-stone-100">
                                {iconInfo.icon}
                              </span>
                              <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400">
                                {iconInfo.badge}
                              </span>
                            </div>
                            <span className="text-[9px] font-semibold text-stone-400">
                              {formattedDate}
                            </span>
                          </div>

                          <p className="font-bold text-xs text-[#18122B] truncate font-mono">
                            {d.title}
                          </p>

                          <div className="mt-2 flex items-center justify-between">
                            {renderDocStatus(d.status)}
                            {confPct !== null && (
                              <span className="text-[10px] font-bold text-stone-600 font-mono">
                                {confPct}% Conf.
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-[#E5DAC4]/40 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDocReview(d);
                            }}
                            className="text-[11px] font-bold text-[#18122B] hover:text-[#2d5016]"
                          >
                            {d.status === "NEEDS_REVIEW" ? "Review Extractions →" : "View Entries →"}
                          </button>

                          {confirmDeleteDocId === d.id ? (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteDoc(d.id, e)}
                              disabled={isDeletingDoc}
                              className="rounded bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5"
                            >
                              Confirm Delete
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteDoc(d.id, e)}
                              className="text-stone-400 hover:text-rose-600 text-xs"
                              title="Delete document"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* VIEW: ALL COMBINED ACTIVITY */}
          {viewMode === "all" && (
            <div className="rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-3.5 sm:p-4 shadow-2xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#E5DAC4]/60 mb-2">
                <h2 className="font-serif text-xs sm:text-sm font-bold uppercase tracking-tight text-[#18122B]">
                  ALL FINANCIAL & VAULT ACTIVITY ({combinedActivity.length})
                </h2>
              </div>

              {combinedActivity.length === 0 ? (
                <div className="py-12 text-center text-xs font-medium text-[#18122B]/50">
                  No activity recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-[#E5DAC4]/40">
                  {combinedActivity.map((evt) => (
                    <div
                      key={evt.id}
                      className="flex items-center justify-between py-2 px-1 hover:bg-[#FAF6ED]/60 rounded-xl transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                        <span className="text-lg">
                          {evt.type === "transaction" ? "💳" : "📁"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs sm:text-sm text-[#18122B] truncate capitalize">
                            {evt.title}
                          </p>
                          <p className="text-[10px] text-[#18122B]/50 font-medium">
                            {formatDate(evt.date)} • {evt.subtitle}
                          </p>
                        </div>
                      </div>

                      {evt.amount !== null && (
                        <span className="font-mono text-xs sm:text-sm font-black text-[#18122B]">
                          - {formatINR(evt.amount)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            RIGHT / CONTEXTUAL SIDEBAR (Col-5 or Col-4 on desktop)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="lg:col-span-5 space-y-4">
          {/* 1. DOCUMENT VAULT CONTEXTUAL PANEL */}
          <div className="rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-3.5 sm:p-4 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5DAC4]/60 mb-2.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">📁</span>
                <h3 className="font-serif text-xs sm:text-sm font-bold uppercase tracking-tight text-[#18122B]">
                  DOCUMENT VAULT
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewMode("documents")}
                className="text-[11px] font-bold text-[#18122B]/70 hover:text-[#18122B]"
              >
                Expand Vault →
              </button>
            </div>

            {/* Compact Vault Document List */}
            {loadingDocs ? (
              <div className="py-4 text-center text-xs font-medium text-[#18122B]/50 animate-pulse">
                Checking vault files...
              </div>
            ) : documents.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-xs font-medium text-[#18122B]/60">
                  No documents in vault yet.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("uploadDoc")}
                  className="mt-2 text-[11px] font-bold text-[#2d5016] underline"
                >
                  + Upload first receipt
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.slice(0, 4).map((d) => {
                  const info = getDocIcon(d.docType, d.title);
                  return (
                    <div
                      key={d.id}
                      onClick={() => handleOpenDocReview(d)}
                      className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#FAF6ED]/70 border border-[#E5DAC4]/60 hover:bg-[#FAF6ED] transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-base">{info.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold text-[#18122B] truncate font-mono">
                            {d.title}
                          </p>
                          <p className="text-[9px] text-stone-500">
                            {formatDate(d.uploadedAt)} • {info.badge}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {renderDocStatus(d.status)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. AI DOCUMENT INSIGHTS (With subtle Owl Mascot anchor) */}
          <div className="relative rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-3.5 sm:p-4 shadow-2xs overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5DAC4]/60 mb-2.5">
              <div className="flex items-center gap-1.5">
                <span className="text-amber-500 text-xs">💡</span>
                <h3 className="font-serif text-xs sm:text-sm font-bold uppercase tracking-tight text-[#18122B]">
                  AI SPENDING & VAULT INSIGHTS
                </h3>
              </div>
              <button
                type="button"
                onClick={handleRefreshInsights}
                disabled={refreshingInsights}
                className="text-[10px] font-bold text-[#18122B]/70 hover:text-[#18122B] disabled:opacity-50 flex items-center gap-1"
              >
                <span>{refreshingInsights ? "Refreshing..." : "↻ Refresh"}</span>
              </button>
            </div>

            {/* Real AI Insights List */}
            {loadingInsights ? (
              <div className="py-5 text-center text-xs font-medium text-[#18122B]/50 animate-pulse">
                Analyzing spending patterns & receipts...
              </div>
            ) : insights.length === 0 ? (
              <div className="py-3 text-left">
                <p className="text-xs font-medium text-[#18122B]/60">
                  No spending anomalies detected. All ledger records & receipts look balanced!
                </p>
              </div>
            ) : (
              <div className="space-y-2 pr-10 sm:pr-14 relative z-10">
                {insights.slice(0, 2).map((ins, idx) => (
                  <div
                    key={ins.id || idx}
                    className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#FAF6ED]/70 border border-[#E5DAC4]/60 hover:bg-[#FAF6ED] transition"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-[10px]">
                        🧠
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-[#18122B] truncate">
                          {ins.title}
                        </p>
                        {ins.description && (
                          <p className="text-[10px] text-[#18122B]/60 truncate font-medium">
                            {ins.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Owl Mascot #2 Bubble */}
            <div className="absolute -bottom-1 -right-1 w-24 sm:w-28 h-16 sm:h-20 pointer-events-none select-none z-0">
              <Image
                src="/owl-insights-bubble.png"
                alt="FinSage Owl Guard Mascot"
                width={120}
                height={80}
                className="w-auto h-full object-contain drop-shadow-sm ml-auto opacity-90"
              />
            </div>
          </div>

          {/* 3. SPENDING BREAKDOWN & TOP MERCHANTS */}
          <div className="rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-3.5 sm:p-4 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5DAC4]/60 mb-2.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">📊</span>
                <h3 className="font-serif text-xs sm:text-sm font-bold uppercase tracking-tight text-[#18122B]">
                  MONTHLY BREAKDOWN
                </h3>
              </div>
              <span className="text-[10px] font-bold text-[#18122B]/60">This month</span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <DonutChart
                categories={spendingBreakdown.categories}
                total={spendingBreakdown.total}
              />

              <div className="flex-1 space-y-1 text-xs">
                {spendingBreakdown.categories.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0 pr-2">
                      <span
                        className="h-1.5 w-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-medium text-[#18122B]/80 truncate text-[10px]">
                        {cat.name}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] font-bold text-[#18122B] shrink-0">
                      {cat.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          MODALS: EDIT, DELETE, & DOCUMENT REVIEW
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#DDD9CF] bg-[#FFFDF8] p-5 shadow-xl animate-fade-in">
            <h3 className="font-serif text-base font-bold text-[#18122B] mb-3">
              Edit Transaction
            </h3>
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#18122B]/60">Description</label>
                <input
                  type="text"
                  required
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full rounded-xl border border-[#DDD9CF] bg-white px-3 py-2 text-xs font-medium text-[#18122B] mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#18122B]/60">Amount (₹)</label>
                <input
                  type="number"
                  required
                  step="any"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  className="w-full rounded-xl border border-[#DDD9CF] bg-white px-3 py-2 text-xs font-mono font-bold text-[#18122B] mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#18122B]/60">Category</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full rounded-xl border border-[#DDD9CF] bg-white px-3 py-2 text-xs font-medium text-[#18122B] mt-1 cursor-pointer"
                >
                  <option value="Food & Dining">🍽️ Food & Dining</option>
                  <option value="Groceries">🛒 Groceries</option>
                  <option value="Entertainment">🎬 Entertainment</option>
                  <option value="Shopping">🛍️ Shopping</option>
                  <option value="Rent">🏠 Rent</option>
                  <option value="Utilities">⚡ Utilities</option>
                  <option value="Travel">✈️ Travel</option>
                  <option value="Healthcare">💊 Healthcare</option>
                  <option value="Subscriptions">📱 Subscriptions</option>
                  <option value="General">💳 General</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#18122B]/60">Date</label>
                <input
                  type="date"
                  required
                  value={editForm.transactionDate}
                  onChange={(e) => setEditForm({ ...editForm, transactionDate: e.target.value })}
                  className="w-full rounded-xl border border-[#DDD9CF] bg-white px-3 py-2 text-xs font-medium text-[#18122B] mt-1"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  className="rounded-xl border border-[#DDD9CF] bg-white px-4 py-2 text-xs font-bold text-[#18122B]/70 hover:bg-[#FAF6ED]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="rounded-xl bg-[#18122B] hover:bg-[#18122B]/90 text-white px-4 py-2 text-xs font-bold transition disabled:opacity-50"
                >
                  {isSavingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[#DDD9CF] bg-[#FFFDF8] p-5 shadow-xl animate-fade-in text-center">
            <span className="text-2xl mb-2 block">🗑️</span>
            <h3 className="font-serif text-base font-bold text-[#18122B]">
              Delete Transaction?
            </h3>
            <p className="text-xs text-[#18122B]/60 font-medium mt-1 mb-4">
              Are you sure you want to delete &ldquo;{deleteCandidate.description}&rdquo; ({formatINR(deleteCandidate.amount)})?
            </p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="rounded-xl border border-[#DDD9CF] bg-white px-4 py-2 text-xs font-bold text-[#18122B]/70 hover:bg-[#FAF6ED]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-xs font-bold transition disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Review Modal */}
      {reviewDoc && (
        <DocumentReviewModal
          token={token}
          document={reviewDoc}
          onClose={() => setReviewDoc(null)}
          onConfirmed={() => {
            loadDocumentsList(true);
            loadTransactions();
            showToast("Document entries recorded into ledger! ✦");
          }}
        />
      )}
    </div>
  );
}
