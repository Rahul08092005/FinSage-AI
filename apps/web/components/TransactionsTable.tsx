"use client";

import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
  getTransactions,
  importTransactionsCsv,
  parseSms,
  confirmSmsTransaction,
  getInsights,
  generateInsights,
  type InsightItem,
} from "@/lib/api";
import { formatINR } from "@/lib/formatCurrency";

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
  const size = 110;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedOffset = 0;

  return (
    <div className="relative flex items-center justify-center w-28 h-28 shrink-0">
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
        <span className="font-mono text-xs font-bold text-[#18122B] leading-tight">
          {formatINR(total)}
        </span>
        <span className="text-[9px] text-[#18122B]/60 font-medium">Total Spent</span>
      </div>
    </div>
  );
}

export function TransactionsTable({ token }: { token: string }) {
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [importingCsv, setImportingCsv] = useState(false);

  // Form Mode & Inputs
  const [activeTab, setActiveTab] = useState<"quickAdd" | "pasteSms">("quickAdd");
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

  // Timeframe selectors for right cards
  const [breakdownTimeframe, setBreakdownTimeframe] = useState<"thisMonth" | "all">("thisMonth");
  const [merchantsTimeframe, setMerchantsTimeframe] = useState<"thisMonth" | "all">("thisMonth");

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

  // AI Insights State
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [refreshingInsights, setRefreshingInsights] = useState(false);

  // DOM Refs
  const csvInputRef = useRef<HTMLInputElement | null>(null);
  const amountInputRef = useRef<HTMLInputElement | null>(null);
  const composerRef = useRef<HTMLDivElement | null>(null);
  const smsTextareaRef = useRef<HTMLTextAreaElement | null>(null);

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
  const load = useCallback(async () => {
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
    load();
    loadInsights();
  }, [load, loadInsights]);

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

  // Focus composer when clicking "+ Add Transaction" in header
  function handleFocusComposer() {
    composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => {
      amountInputRef.current?.focus();
    }, 200);
  }

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
      load();
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
      load();
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
      await load();
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
      load();
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
      load();
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

    const lastMonthItems = items.filter((i) => {
      const d = new Date(i.transactionDate);
      return d.getFullYear() === prevYear && d.getMonth() === prevMonth;
    });

    // If current month has items, use them; otherwise fallback to all items for top category
    const activeSet = currentMonthItems.length > 0 ? currentMonthItems : items;

    // 1. This Month Spend
    const thisMonthSpent = currentMonthItems.reduce((acc, i) => acc + Number(i.amount || 0), 0);
    const lastMonthSpent = lastMonthItems.reduce((acc, i) => acc + Number(i.amount || 0), 0);

    let momSpendDiff = "-100%";
    let isSpendDown = true;
    if (lastMonthSpent > 0) {
      const diff = Math.round(((thisMonthSpent - lastMonthSpent) / lastMonthSpent) * 100);
      momSpendDiff = `${diff >= 0 ? "+" : ""}${diff}% vs last month`;
      isSpendDown = diff <= 0;
    } else if (thisMonthSpent > 0) {
      momSpendDiff = "Active month";
      isSpendDown = false;
    }

    // 2. Transaction Count
    const transactionCount = items.length;
    const thisMonthTxCount = currentMonthItems.length;
    const lastMonthTxCount = lastMonthItems.length;

    let momTxDiff = "+0%";
    if (lastMonthTxCount > 0) {
      const diff = Math.round(((thisMonthTxCount - lastMonthTxCount) / lastMonthTxCount) * 100);
      momTxDiff = `${diff >= 0 ? "+" : ""}${diff}% vs last month`;
    } else if (thisMonthTxCount > 0) {
      momTxDiff = `+${thisMonthTxCount} this month`;
    }

    // 3. Top Category
    const categoryTotals: Record<string, number> = {};
    for (const item of activeSet) {
      const cat = item.category || "General";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(item.amount || 0);
    }

    let topCategoryName = "General";
    let topCategoryAmount = 0;
    let maxSpend = -1;

    for (const [cat, amt] of Object.entries(categoryTotals)) {
      if (amt > maxSpend) {
        maxSpend = amt;
        topCategoryName = cat;
        topCategoryAmount = amt;
      }
    }

    // 4. Avg Daily Spend (Current Month)
    const currentDay = Math.max(1, now.getDate());
    const avgDailySpend = thisMonthSpent > 0 ? Math.round(thisMonthSpent / currentDay) : 0;

    return {
      thisMonthSpent,
      momSpendDiff,
      isSpendDown,
      transactionCount,
      momTxDiff,
      topCategoryName,
      topCategoryAmount,
      topCategoryMeta: getCategoryMeta(topCategoryName),
      avgDailySpend,
    };
  }, [items]);

  // Filter & Sort Items
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.description.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query) ||
          String(t.amount).includes(query) ||
          (t.source && t.source.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategory !== "All") {
      result = result.filter(
        (t) => t.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Date Filter
    if (selectedDateFilter !== "All") {
      const now = new Date();
      const currYear = now.getFullYear();
      const currMonth = now.getMonth();

      if (selectedDateFilter === "thisMonth") {
        result = result.filter((t) => {
          const d = new Date(t.transactionDate);
          return d.getFullYear() === currYear && d.getMonth() === currMonth;
        });
      } else if (selectedDateFilter === "lastMonth") {
        const prev = new Date(currYear, currMonth - 1, 1);
        result = result.filter((t) => {
          const d = new Date(t.transactionDate);
          return d.getFullYear() === prev.getFullYear() && d.getMonth() === prev.getMonth();
        });
      } else if (selectedDateFilter === "last30Days") {
        const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        result = result.filter((t) => new Date(t.transactionDate) >= cutoff);
      } else if (selectedDateFilter === "thisYear") {
        result = result.filter((t) => new Date(t.transactionDate).getFullYear() === currYear);
      }
    }

    // Amount range filter
    if (selectedAmountRange === "under500") {
      result = result.filter((t) => Number(t.amount) < 500);
    } else if (selectedAmountRange === "500to2000") {
      result = result.filter((t) => Number(t.amount) >= 500 && Number(t.amount) <= 2000);
    } else if (selectedAmountRange === "2000to10000") {
      result = result.filter((t) => Number(t.amount) > 2000 && Number(t.amount) <= 10000);
    } else if (selectedAmountRange === "above10000") {
      result = result.filter((t) => Number(t.amount) > 10000);
    }

    // Sorting
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

  // Spending Breakdown data (Right Column - Card 1)
  const spendingBreakdown = useMemo(() => {
    const now = new Date();
    const currYear = now.getFullYear();
    const currMonth = now.getMonth();

    const activeSet =
      breakdownTimeframe === "thisMonth"
        ? items.filter((i) => {
            const d = new Date(i.transactionDate);
            return d.getFullYear() === currYear && d.getMonth() === currMonth;
          })
        : items;

    const totals: Record<string, number> = {};
    for (const item of activeSet) {
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
      categories: sorted.length > 0 ? sorted.slice(0, 5) : [
        { name: "No Data", total: 0, pct: 100, color: "#E5DAC4" },
      ],
    };
  }, [items, breakdownTimeframe]);

  // Top Merchants data (Right Column - Card 2)
  const topMerchants = useMemo(() => {
    const now = new Date();
    const currYear = now.getFullYear();
    const currMonth = now.getMonth();

    const activeSet =
      merchantsTimeframe === "thisMonth"
        ? items.filter((i) => {
            const d = new Date(i.transactionDate);
            return d.getFullYear() === currYear && d.getMonth() === currMonth;
          })
        : items;

    const totals: Record<string, number> = {};
    for (const item of activeSet) {
      const raw = (item.description || "Unknown").trim();
      const name = raw.charAt(0).toUpperCase() + raw.slice(1);
      totals[name] = (totals[name] || 0) + Number(item.amount || 0);
    }

    const totalAll = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
    const sorted = Object.entries(totals)
      .map(([name, total]) => ({
        name,
        total,
        pct: Math.round((total / totalAll) * 100),
        meta: getMerchantMeta(name, "General"),
      }))
      .sort((a, b) => b.total - a.total);

    return sorted.slice(0, 5);
  }, [items, merchantsTimeframe]);

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
          1. COMPACT TRANSACTIONS HERO
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="relative pt-3 sm:pt-4 pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-100/70 px-2.5 py-0.5 text-[11px] font-bold text-emerald-900 mb-1.5">
              <span>🏷️</span>
              <span className="tracking-wide uppercase">TRANSACTIONS</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#18122B]">
              Your money, logged. <span className="text-amber-500">✦</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#18122B]/60 font-medium mt-0.5">
              Every payment, organized and accounted for.
            </p>
          </div>

          {/* Hero Right: Owl Mascot #1 + Add Button + Doodles */}
          <div className="flex items-center gap-3 sm:gap-6 self-start md:self-center">
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="font-serif text-[11px] font-bold italic text-[#18122B]/70">
                small spends, big picture
              </span>
              <span className="font-serif text-[10px] text-[#18122B]/50 italic">
                same you, better money 💖
              </span>
            </div>

            {/* Owl Mascot #1 (Writing in ledger) */}
            <div className="relative w-24 sm:w-32 h-20 sm:h-24 shrink-0 flex items-center justify-center">
              <Image
                src="/owl-transactions-hero.png"
                alt="FinSage Owl Ledger Mascot"
                width={140}
                height={120}
                priority
                className="w-auto h-full object-contain pointer-events-none drop-shadow-sm select-none"
              />
            </div>

            <button
              type="button"
              onClick={handleFocusComposer}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#18122B] px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#18122B]/90 transition cursor-pointer"
            >
              <span>+ Add Transaction</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          2. FOUR SUMMARY CARDS
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-2 mb-4">
        {/* Card 1: THIS MONTH */}
        <div className="rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-rose-700 text-[10px]">
                ↓
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#18122B]/60">
                THIS MONTH
              </span>
            </div>
            {/* Sparkline icon visual */}
            <div className="flex items-end gap-0.5 h-3.5">
              <div className="w-1 bg-rose-300 h-2 rounded-t-xs" />
              <div className="w-1 bg-rose-400 h-3 rounded-t-xs" />
              <div className="w-1 bg-rose-500 h-full rounded-t-xs" />
            </div>
          </div>
          <div className="mt-2">
            <p className="font-mono text-lg sm:text-2xl font-black text-[#18122B]">
              {formatINR(summaryMetrics.thisMonthSpent)}
            </p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[11px] font-medium text-[#18122B]/50">Spent</span>
              <span
                className={`text-[10px] font-bold ${
                  summaryMetrics.isSpendDown ? "text-rose-600" : "text-emerald-700"
                }`}
              >
                {summaryMetrics.momSpendDiff}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: TRANSACTIONS */}
        <div className="rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[10px]">
                ↑
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#18122B]/60">
                TRANSACTIONS
              </span>
            </div>
            {/* Line wave visual */}
            <span className="text-emerald-600 text-xs font-bold font-mono">📈</span>
          </div>
          <div className="mt-2">
            <p className="font-mono text-lg sm:text-2xl font-black text-[#18122B]">
              {summaryMetrics.transactionCount}
            </p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[11px] font-medium text-[#18122B]/50">Recorded</span>
              <span className="text-[10px] font-bold text-emerald-700 font-mono">
                {summaryMetrics.momTxDiff}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: TOP CATEGORY */}
        <div className="rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-[10px]">
                🛍️
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#18122B]/60">
                TOP CATEGORY
              </span>
            </div>
            <span className="text-xs">{summaryMetrics.topCategoryMeta.icon}</span>
          </div>
          <div className="mt-2">
            <div className="flex items-center justify-between">
              <p className="font-serif text-sm sm:text-base font-bold text-[#18122B] truncate">
                {summaryMetrics.topCategoryName}
              </p>
              <span className="font-mono text-xs sm:text-sm font-bold text-[#18122B]/80">
                {formatINR(summaryMetrics.topCategoryAmount)}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-medium text-[#18122B]/50 mt-1 truncate">
              Highest spending bucket
            </p>
          </div>
        </div>

        {/* Card 4: AVG. DAILY SPEND */}
        <div className="rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-800 text-[10px]">
                📅
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#18122B]/60">
                AVG. DAILY SPEND
              </span>
            </div>
            <div className="flex items-end gap-0.5 h-3.5">
              <div className="w-1 bg-amber-300 h-2 rounded-t-xs" />
              <div className="w-1 bg-amber-400 h-3 rounded-t-xs" />
              <div className="w-1 bg-amber-500 h-full rounded-t-xs" />
            </div>
          </div>
          <div className="mt-2">
            <p className="font-mono text-lg sm:text-2xl font-black text-[#18122B]">
              {formatINR(summaryMetrics.avgDailySpend)}
            </p>
            <p className="text-[10px] sm:text-[11px] font-medium text-[#18122B]/50 mt-1">
              This month
            </p>
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          3. ADD A TRANSACTION SECTION
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div
        ref={composerRef}
        className="rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-3.5 sm:p-4 shadow-2xs mb-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-xs sm:text-sm font-bold tracking-tight uppercase text-[#18122B]">
              ADD A TRANSACTION
            </h2>
          </div>

          {/* Mode Toggles */}
          <div className="flex items-center gap-1.5 bg-[#FAF6ED] p-1 rounded-xl border border-[#E5DAC4]">
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
          </div>
        </div>

        {/* Tab 1: Quick Add Row */}
        {activeTab === "quickAdd" && (
          <form
            onSubmit={handleAdd}
            className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
          >
            {/* Amount */}
            <div className="sm:col-span-2 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#18122B]/50 font-mono">
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
                className="w-full rounded-xl border border-[#DDD9CF] bg-white pl-7 pr-3 py-2 text-xs font-mono font-bold text-[#18122B] placeholder:text-[#18122B]/40 focus:border-[#18122B] focus:outline-none"
              />
            </div>

            {/* Description / Merchant */}
            <div className="sm:col-span-4">
              <input
                type="text"
                placeholder="What did you spend on? (e.g. Dinner, Rent, Fuel)"
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-xl border border-[#DDD9CF] bg-white px-3 py-2 text-xs font-medium text-[#18122B] placeholder:text-[#18122B]/40 focus:border-[#18122B] focus:outline-none"
              />
            </div>

            {/* Category Dropdown */}
            <div className="sm:col-span-3">
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-xl border border-[#DDD9CF] bg-white px-3 py-2 text-xs font-medium text-[#18122B] focus:border-[#18122B] focus:outline-none cursor-pointer"
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
                className="w-full rounded-xl border border-[#DDD9CF] bg-white px-3 py-2 text-xs font-medium text-[#18122B] focus:border-[#18122B] focus:outline-none"
              />
            </div>

            {/* Record Button */}
            <div className="sm:col-span-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-[#2d5016] hover:bg-[#234011] text-white py-2 px-3 text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? "..." : <span>Record →</span>}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Bank SMS Quick Add */}
        {activeTab === "pasteSms" && (
          <div className="space-y-3">
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
                  className="flex-1 rounded-xl border border-[#DDD9CF] bg-white p-2.5 text-xs font-mono text-[#18122B] placeholder:text-[#18122B]/40 focus:border-[#18122B] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleParseSms}
                  disabled={isParsingSms || !smsText.trim()}
                  className="sm:w-36 rounded-xl bg-[#2d5016] hover:bg-[#234011] text-white py-2 px-3 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isParsingSms ? "Parsing..." : "Parse SMS →"}
                </button>
              </div>
            ) : (
              /* Review Draft Before Commit */
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 space-y-2">
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
                    className="rounded-lg bg-[#2d5016] hover:bg-[#234011] text-white px-4 py-1 text-xs font-bold transition flex items-center gap-1 shadow-sm disabled:opacity-50"
                  >
                    {isConfirmingSms ? "Saving..." : "Confirm & Save Transaction →"}
                  </button>
                </div>
              </div>
            )}

            {smsError && (
              <p className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2">
                ⚠️ {smsError}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          4. SEARCH + FILTER TOOLBAR
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-2.5 sm:p-3 shadow-2xs mb-4 flex flex-wrap items-center justify-between gap-2">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#18122B]/40">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search transactions, merchant, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[#DDD9CF] bg-white pl-8 pr-3 py-1.5 text-xs text-[#18122B] placeholder:text-[#18122B]/40 focus:border-[#18122B] focus:outline-none"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-[#DDD9CF] bg-white px-2.5 py-1.5 text-xs font-bold text-[#18122B]/80 focus:border-[#18122B] focus:outline-none cursor-pointer"
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

          {/* Date Filter */}
          <select
            value={selectedDateFilter}
            onChange={(e) => setSelectedDateFilter(e.target.value)}
            className="rounded-xl border border-[#DDD9CF] bg-white px-2.5 py-1.5 text-xs font-bold text-[#18122B]/80 focus:border-[#18122B] focus:outline-none cursor-pointer"
          >
            <option value="All">All Dates ▾</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="last30Days">Last 30 Days</option>
            <option value="thisYear">This Year</option>
          </select>

          {/* Amount Filter */}
          <select
            value={selectedAmountRange}
            onChange={(e) => setSelectedAmountRange(e.target.value)}
            className="rounded-xl border border-[#DDD9CF] bg-white px-2.5 py-1.5 text-xs font-bold text-[#18122B]/80 focus:border-[#18122B] focus:outline-none cursor-pointer"
          >
            <option value="All">All Amounts ▾</option>
            <option value="under500">Under ₹500</option>
            <option value="500to2000">₹500 – ₹2,000</option>
            <option value="2000to10000">₹2,000 – ₹10,000</option>
            <option value="above10000">Above ₹10,000</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-xl border border-[#DDD9CF] bg-white px-2.5 py-1.5 text-xs font-bold text-[#18122B]/80 focus:border-[#18122B] focus:outline-none cursor-pointer"
          >
            <option value="latest">Latest First ▾</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Amount</option>
            <option value="lowest">Lowest Amount</option>
          </select>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 rounded-xl border border-[#DDD9CF] bg-white px-3 py-1.5 text-xs font-bold text-[#18122B] hover:bg-[#FAF6ED] transition cursor-pointer"
          >
            <span>📥</span>
            <span>Export CSV</span>
          </button>

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

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          5. TWO-COLUMN MAIN CONTENT AREA
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT COLUMN: RECENT TRANSACTIONS (Approx 62% width -> 7.5/12 or 7/12 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5DAC4]/60 mb-2">
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-sm sm:text-base font-bold uppercase tracking-tight text-[#18122B]">
                RECENT TRANSACTIONS
              </h2>
              <span className="rounded-full bg-[#18122B]/10 px-2 py-0.5 text-[10px] font-bold text-[#18122B]">
                {filteredItems.length} transactions
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#18122B]/70">
                View all →
              </span>
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

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2.5 px-1 hover:bg-[#FAF6ED]/60 rounded-xl transition group relative"
                  >
                    {/* Left: Icon + Title + Metadata */}
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#DDD9CF]/60 text-xs shadow-2xs ${merchantMeta.bg}`}
                      >
                        {merchantMeta.icon}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs sm:text-sm text-[#18122B] truncate capitalize">
                          {item.description}
                        </p>
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
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${meta.bg} ${meta.border} ${meta.text}`}
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
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#18122B]/40 hover:text-[#18122B] hover:bg-[#FAF6ED] transition"
                        >
                          •••
                        </button>

                        {activeMenuId === item.id && (
                          <div className="absolute right-0 mt-1 w-32 rounded-xl border border-[#E5DAC4] bg-[#FFFDF8] p-1 shadow-lg z-30 animate-fade-in">
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

        {/* RIGHT COLUMN: 3 ANALYTICAL CARDS (Approx 38% width -> 5/12 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* 1. SPENDING BREAKDOWN */}
          <div className="rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-3.5 sm:p-4 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5DAC4]/60 mb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-amber-600 text-xs">💡</span>
                <h3 className="font-serif text-xs sm:text-sm font-bold uppercase tracking-tight text-[#18122B]">
                  SPENDING BREAKDOWN
                </h3>
              </div>
              <select
                value={breakdownTimeframe}
                onChange={(e) => setBreakdownTimeframe(e.target.value as any)}
                className="rounded-lg border border-[#DDD9CF] bg-white px-2 py-0.5 text-[10px] font-bold text-[#18122B]/80 focus:outline-none cursor-pointer"
              >
                <option value="thisMonth">This month ▾</option>
                <option value="all">All time ▾</option>
              </select>
            </div>

            <div className="flex items-center justify-between gap-4">
              {/* SVG Ring Donut */}
              <DonutChart
                categories={spendingBreakdown.categories}
                total={spendingBreakdown.total}
              />

              {/* Dynamic Category Legend */}
              <div className="flex-1 space-y-1.5 text-xs">
                {spendingBreakdown.categories.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0 pr-2">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-medium text-[#18122B]/80 truncate text-[11px]">
                        {cat.name}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-[#18122B] shrink-0">
                      {cat.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 2. TOP MERCHANTS */}
          <div className="rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-3.5 sm:p-4 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5DAC4]/60 mb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">🥷</span>
                <h3 className="font-serif text-xs sm:text-sm font-bold uppercase tracking-tight text-[#18122B]">
                  TOP MERCHANTS
                </h3>
              </div>
              <select
                value={merchantsTimeframe}
                onChange={(e) => setMerchantsTimeframe(e.target.value as any)}
                className="rounded-lg border border-[#DDD9CF] bg-white px-2 py-0.5 text-[10px] font-bold text-[#18122B]/80 focus:outline-none cursor-pointer"
              >
                <option value="thisMonth">This month ▾</option>
                <option value="all">All time ▾</option>
              </select>
            </div>

            {topMerchants.length === 0 ? (
              <p className="text-xs text-[#18122B]/50 font-medium py-3 text-center">
                No merchant spending recorded yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {topMerchants.map((m, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-[#DDD9CF]/60 text-[10px] ${m.meta.bg}`}
                        >
                          {m.meta.icon}
                        </div>
                        <span className="font-bold text-[#18122B] text-xs truncate">
                          {m.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="font-bold text-[#18122B]">{formatINR(m.total)}</span>
                        <span className="text-[#18122B]/50 text-[10px] w-6 text-right">
                          {m.pct}%
                        </span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-1.5 w-full rounded-full bg-[#E5DAC4]/40 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#8b5cf6] transition-all duration-300"
                        style={{ width: `${Math.max(4, m.pct)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. SPENDING INSIGHTS (With Owl Mascot #2) */}
          <div className="relative rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-3.5 sm:p-4 shadow-2xs overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5DAC4]/60 mb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-amber-500 text-xs">💡</span>
                <h3 className="font-serif text-xs sm:text-sm font-bold uppercase tracking-tight text-[#18122B]">
                  SPENDING INSIGHTS
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
              <div className="py-6 text-center text-xs font-medium text-[#18122B]/50 animate-pulse">
                Analyzing spending patterns...
              </div>
            ) : insights.length === 0 ? (
              <div className="py-4 text-left">
                <p className="text-xs font-medium text-[#18122B]/60">
                  No spending anomalies detected. All accounts looking healthy!
                </p>
              </div>
            ) : (
              <div className="space-y-2 pr-12 sm:pr-16 relative z-10">
                {insights.slice(0, 2).map((ins, idx) => (
                  <div
                    key={ins.id || idx}
                    className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#FAF6ED]/70 border border-[#E5DAC4]/60 hover:bg-[#FAF6ED] transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xs">
                        🎮
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
                    <span className="text-xs text-[#18122B]/40 shrink-0">›</span>
                  </div>
                ))}
              </div>
            )}

            {/* Owl Mascot #2 (Speech bubble: "keeping your money in check!") */}
            <div className="absolute -bottom-1 -right-1 w-28 sm:w-36 h-20 sm:h-24 pointer-events-none select-none z-0">
              <Image
                src="/owl-insights-bubble.png"
                alt="FinSage Owl Guard Mascot"
                width={140}
                height={100}
                className="w-auto h-full object-contain drop-shadow-sm ml-auto"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          MODALS: EDIT & DELETE
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
    </div>
  );
}
