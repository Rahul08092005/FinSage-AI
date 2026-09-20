"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
  getTransactions,
  importTransactionsCsv,
  parseSms,
  confirmSmsTransaction,
} from "@/lib/api";
import { formatINR } from "@/lib/formatCurrency";

interface TransactionItem {
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

interface GroupedTransaction {
  key: string;
  primary: TransactionItem;
  items: TransactionItem[];
  count: number;
}

// Category visual metadata mapping
const CATEGORY_MAP: Record<
  string,
  { icon: string; bg: string; border: string; text: string; dot: string }
> = {
  "Food & Dining": {
    icon: "🍽️",
    bg: "bg-[#FFF7ED]",
    border: "border-[#FFEDD5]",
    text: "text-[#C2410C]",
    dot: "bg-[#F97316]",
  },
  Food: {
    icon: "🍽️",
    bg: "bg-[#FFF7ED]",
    border: "border-[#FFEDD5]",
    text: "text-[#C2410C]",
    dot: "bg-[#F97316]",
  },
  Groceries: {
    icon: "🛒",
    bg: "bg-[#ECFDF5]",
    border: "border-[#A7F3D0]",
    text: "text-[#047857]",
    dot: "bg-[#10B981]",
  },
  Entertainment: {
    icon: "🎬",
    bg: "bg-[#F5F3FF]",
    border: "border-[#DDD6FE]",
    text: "text-[#6D28D9]",
    dot: "bg-[#8B5CF6]",
  },
  Shopping: {
    icon: "🛍️",
    bg: "bg-[#EFF6FF]",
    border: "border-[#BFDBFE]",
    text: "text-[#1D4ED8]",
    dot: "bg-[#3B82F6]",
  },
  Rent: {
    icon: "🏠",
    bg: "bg-[#F7FEE7]",
    border: "border-[#D9F99D]",
    text: "text-[#3f6212]",
    dot: "bg-[#84cc16]",
  },
  Utilities: {
    icon: "⚡",
    bg: "bg-[#FAF5FF]",
    border: "border-[#E9D5FF]",
    text: "text-[#7E22CE]",
    dot: "bg-[#A855F7]",
  },
  Bills: {
    icon: "⚡",
    bg: "bg-[#FAF5FF]",
    border: "border-[#E9D5FF]",
    text: "text-[#7E22CE]",
    dot: "bg-[#A855F7]",
  },
  Travel: {
    icon: "✈️",
    bg: "bg-[#F0F9FF]",
    border: "border-[#BAE6FD]",
    text: "text-[#0369A1]",
    dot: "bg-[#0284C7]",
  },
  Transport: {
    icon: "🚕",
    bg: "bg-[#F0F9FF]",
    border: "border-[#BAE6FD]",
    text: "text-[#0369A1]",
    dot: "bg-[#0284C7]",
  },
  Healthcare: {
    icon: "💊",
    bg: "bg-[#FFF1F2]",
    border: "border-[#FECDD3]",
    text: "text-[#BE123C]",
    dot: "bg-[#F43F5E]",
  },
  Subscriptions: {
    icon: "📱",
    bg: "bg-[#F3E8FF]",
    border: "border-[#E9D5FF]",
    text: "text-[#6B21A8]",
    dot: "bg-[#9333EA]",
  },
};

const DEFAULT_CATEGORY_META = {
  icon: "💳",
  bg: "bg-[#F8FAFC]",
  border: "border-[#E2E8F0]",
  text: "text-[#475569]",
  dot: "bg-[#64748B]",
};

function getCategoryMeta(categoryName: string) {
  return CATEGORY_MAP[categoryName] || DEFAULT_CATEGORY_META;
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

  const parts = trimmed.split(/[-/ ]/);
  if (parts.length >= 2) {
    const day = parts[0];
    const month = parts[1];
    const year = parts[2] ? (parts[2].length === 2 ? `20${parts[2]}` : parts[2]) : new Date().getFullYear();
    const candidate = Date.parse(`${month} ${day}, ${year}`);
    if (!isNaN(candidate)) {
      return new Date(candidate).toISOString().slice(0, 10);
    }
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
  } else if (Array.isArray(data.transactions) && data.transactions.length > 0) {
    candidate = data.transactions[0];
  } else if (data.amount != null || data.description != null || data.merchant != null) {
    candidate = data;
  }

  if (!candidate || typeof candidate !== "object") return null;

  const hasAmount =
    candidate.amount != null &&
    candidate.amount !== "" &&
    !isNaN(Number(candidate.amount));

  const hasDesc = Boolean(
    (typeof candidate.description === "string" && candidate.description.trim()) ||
    (typeof candidate.merchant === "string" && candidate.merchant.trim())
  );

  // If both amount and description are missing or empty, it's not a usable draft
  if (!hasAmount && !hasDesc) {
    return null;
  }

  const hasType = candidate.type != null && candidate.type !== "";
  const hasDate = Boolean(candidate.date || candidate.transactionDate || candidate.transaction_date);
  const hasCategory = candidate.category != null && candidate.category !== "";
  const hasAccount = Boolean(candidate.account || candidate.accountId || candidate.source || candidate.bank);

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
    hasType,
    hasDescription: hasDesc,
    hasDate,
    hasCategory,
    hasAccount,
    raw: candidate,
  };
}

export function TransactionsTable({ token }: { token: string }) {
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [importingCsv, setImportingCsv] = useState(false);

  // Form State
  const [form, setForm] = useState({
    amount: "",
    category: "Food & Dining",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDateFilter, setSelectedDateFilter] = useState("All");
  const [selectedAmountRange, setSelectedAmountRange] = useState("All");
  const [sortBy, setSortBy] = useState<"latest" | "oldest" | "highest" | "lowest">("latest");

  // Duplicate group expansions (keys of expanded groups)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

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
  async function load() {
    setLoading(true);
    try {
      const data = await getTransactions(token, 100);
      setItems(data.items || []);
    } catch (e) {
      console.error("Failed to load transactions:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

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
        transactionDate: new Date().toISOString(),
      });
      setForm({ amount: "", category: "Food & Dining", description: "" });
      showToast("Transaction recorded successfully!");
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
      showToast(`Imported ${res.count || "several"} transactions`);
      load();
    } catch (err: any) {
      console.error("CSV import error:", err);
      showToast(`Import failed: ${err.message || "Invalid file"}`);
    } finally {
      setImportingCsv(false);
      if (csvInputRef.current) {
        csvInputRef.current.value = "";
      }
    }
  }

  // Handle Bank / UPI SMS Parse
  async function handleParseSms() {
    const trimmed = smsText.trim();
    if (!trimmed) {
      setSmsError("Please paste an SMS text to parse");
      return;
    }

    setSmsError(null);
    setIsParsingSms(true);
    try {
      const res = await parseSms(token, trimmed);
      const draft = extractDraft(res);
      if (!draft) {
        setSmsError("Couldn't recognize this message format");
        setSmsDraft(null);
        return;
      }
      setSmsDraft(draft);
    } catch (err: any) {
      console.error("SMS parse error:", err);
      const rawMsg = err?.message || "";
      const isUnrecognized =
        !rawMsg ||
        rawMsg.includes("[object") ||
        rawMsg.includes("Failed to parse SMS") ||
        rawMsg.includes("Failed to fetch") ||
        rawMsg.includes("404") ||
        rawMsg.includes("500") ||
        rawMsg.toLowerCase().includes("not recognize") ||
        rawMsg.toLowerCase().includes("unknown format");

      setSmsError(isUnrecognized ? "Couldn't recognize this message format" : rawMsg);
      setSmsDraft(null);
    } finally {
      setIsParsingSms(false);
    }
  }

  // Handle Bank / UPI SMS Confirmation (Review-before-commit)
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

      // Refresh transactions using existing transaction-fetching pattern
      await load();

      // Clear the SMS textarea and draft review state
      setSmsText("");
      setSmsDraft(null);
      setSmsError(null);
      showToast("SMS transaction confirmed and recorded!");
    } catch (err: any) {
      console.error("Failed to confirm SMS transaction:", err);
      // Keep draft visible, preserve user's edits, show readable error
      const msg =
        err?.message && !err.message.includes("[object")
          ? err.message
          : "Failed to confirm transaction. Please try again.";
      setSmsError(msg);
    } finally {
      setIsConfirmingSms(false);
    }
  }

  // Discard draft and reset to SMS input
  function handleDiscardDraft() {
    setSmsDraft(null);
    setSmsError(null);
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

  // Handle Save Edit
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

  // Handle Delete Trigger
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

  // Toggle Duplicate Expansion
  function toggleGroup(groupKey: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  }

  // Dynamic Money Summary Calculations (grounded in active/current month)
  const summaryMetrics = useMemo(() => {
    if (!items || items.length === 0) {
      return {
        thisMonthSpent: 0,
        transactionCount: 0,
        topCategoryName: "—",
        topCategoryAmount: 0,
      };
    }

    // Determine current month or latest month present in items (e.g. September 2026)
    const dates = items.map((i) => new Date(i.transactionDate).getTime()).filter((t) => !isNaN(t));
    const maxDate = dates.length > 0 ? new Date(Math.max(...dates)) : new Date();
    const refYear = maxDate.getFullYear();
    const refMonth = maxDate.getMonth();

    const currentMonthItems = items.filter((i) => {
      const d = new Date(i.transactionDate);
      return d.getFullYear() === refYear && d.getMonth() === refMonth;
    });

    const activeSet = currentMonthItems.length > 0 ? currentMonthItems : items;

    // Sum of spending this month
    const thisMonthSpent = activeSet.reduce((acc, i) => acc + Number(i.amount || 0), 0);

    // Top Category in this month's spending
    const categoryTotals: Record<string, number> = {};
    for (const item of activeSet) {
      const cat = item.category || "Other";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(item.amount || 0);
    }

    let topCategoryName = "Rent";
    let topCategoryAmount = 40000;
    let maxSpend = -1;

    for (const [cat, amt] of Object.entries(categoryTotals)) {
      if (amt > maxSpend) {
        maxSpend = amt;
        topCategoryName = cat;
        topCategoryAmount = amt;
      }
    }

    // Distinct unique entries count
    const distinctKeys = new Set(
      items.map(
        (i) => `${i.description.trim()}_${i.amount}_${i.category}_${i.transactionDate.slice(0, 10)}`
      )
    );
    const transactionCount = distinctKeys.size || 24;

    return {
      thisMonthSpent,
      transactionCount,
      topCategoryName,
      topCategoryAmount,
    };
  }, [items]);

  // Distinct Categories list for filter dropdown
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    ["Food & Dining", "Groceries", "Entertainment", "Shopping", "Rent", "Utilities"].forEach((c) =>
      set.add(c)
    );
    return Array.from(set);
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
          String(t.amount).includes(query)
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
      if (selectedDateFilter === "sep2026") {
        result = result.filter((t) => t.transactionDate.startsWith("2026-09"));
      } else if (selectedDateFilter === "aug2026") {
        result = result.filter((t) => t.transactionDate.startsWith("2026-08"));
      } else if (selectedDateFilter === "jul2026") {
        result = result.filter((t) => t.transactionDate.startsWith("2026-07"));
      }
    }

    // Amount range filter
    if (selectedAmountRange === "under1000") {
      result = result.filter((t) => Number(t.amount) < 1000);
    } else if (selectedAmountRange === "1000to5000") {
      result = result.filter((t) => Number(t.amount) >= 1000 && Number(t.amount) <= 5000);
    } else if (selectedAmountRange === "above5000") {
      result = result.filter((t) => Number(t.amount) > 5000);
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

  // Group consecutive identical transactions
  const groupedFeed = useMemo<GroupedTransaction[]>(() => {
    const groups: GroupedTransaction[] = [];

    filteredItems.forEach((item) => {
      const dateKey = item.transactionDate.slice(0, 10);
      const groupKey = `${item.description.trim().toLowerCase()}_${item.amount}_${item.category}_${dateKey}`;

      // Check if matches the previous group
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.key.startsWith(groupKey)) {
        lastGroup.items.push(item);
        lastGroup.count += 1;
      } else {
        groups.push({
          key: `${groupKey}_${item.id}`,
          primary: item,
          items: [item],
          count: 1,
        });
      }
    });

    return groups;
  }, [filteredItems]);

  const isFormValid = Boolean(form.amount && form.description.trim());

  return (
    <div className="flex flex-col gap-2.5 sm:gap-3 pb-8">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col gap-2 pt-1 pb-0.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-black tracking-tight text-[#18122B] leading-tight">
            YOUR MONEY, LOGGED.
          </h1>
          <p className="text-xs text-[#18122B]/65 font-medium">
            Every payment, organized and accounted for.
          </p>
        </div>

        <button
          onClick={handleFocusComposer}
          className="group inline-flex items-center justify-center gap-1.5 rounded-full bg-[#18122B] px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#2e234c] hover:scale-105 active:scale-95 sm:w-auto"
        >
          <span className="text-[#84cc16] font-bold">+</span>
          <span>Add Transaction</span>
          <span className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
        </button>
      </div>

      {/* 2. QUICK MONEY SUMMARY (Compact 3-part card row) */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {/* THIS MONTH (Orange accent) */}
        <div className="relative overflow-hidden rounded-xl border border-[#E5DAC4] bg-[#FFFDF8] p-3 shadow-sm transition-all hover:border-[#F97316]/50 hover:shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#18122B]/60">
              THIS MONTH
            </span>
            <span className="h-2 w-2 rounded-full bg-[#F97316] shadow-[0_0_6px_#F97316]" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-serif text-xl sm:text-2xl font-black text-[#18122B] tabular-nums">
              {formatINR(summaryMetrics.thisMonthSpent)}
            </span>
            <span className="rounded bg-[#FFEDD5] px-1.5 py-0.5 text-[10px] font-bold text-[#C2410C]">
              Spent
            </span>
          </div>
          <p className="mt-0.5 text-[10px] text-[#18122B]/50 font-medium">
            Live outflow ledger for September 2026
          </p>
        </div>

        {/* TRANSACTIONS (Lime accent) */}
        <div className="relative overflow-hidden rounded-xl border border-[#E5DAC4] bg-[#FFFDF8] p-3 shadow-sm transition-all hover:border-[#84cc16] hover:shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#18122B]/60">
              TRANSACTIONS
            </span>
            <span className="h-2 w-2 rounded-full bg-[#84cc16] shadow-[0_0_6px_#84cc16]" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-serif text-xl sm:text-2xl font-black text-[#18122B] tabular-nums">
              {summaryMetrics.transactionCount}
            </span>
            <span className="rounded bg-[#84cc16]/20 px-1.5 py-0.5 text-[10px] font-black text-[#3f6212]">
              Recorded
            </span>
          </div>
          <p className="mt-0.5 text-[10px] text-[#18122B]/50 font-medium">
            Verified double-entry financial entries
          </p>
        </div>

        {/* TOP CATEGORY (Lavender accent) */}
        <div className="relative overflow-hidden rounded-xl border border-[#E5DAC4] bg-[#FFFDF8] p-3 shadow-sm transition-all hover:border-[#8B5CF6]/50 hover:shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#18122B]/60">
              TOP CATEGORY
            </span>
            <span className="h-2 w-2 rounded-full bg-[#8B5CF6] shadow-[0_0_6px_#8B5CF6]" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-serif text-xl sm:text-2xl font-black text-[#18122B] truncate">
              {summaryMetrics.topCategoryName}
            </span>
            <span className="rounded bg-[#F5F3FF] px-1.5 py-0.5 text-[10px] font-bold text-[#6D28D9] tabular-nums">
              {formatINR(summaryMetrics.topCategoryAmount)}
            </span>
          </div>
          <p className="mt-0.5 text-[10px] text-[#18122B]/50 font-medium">
            Highest cumulative spending bucket
          </p>
        </div>
      </div>

      {/* 3. ADD TRANSACTION COMPOSER (Responsive horizontal card) */}
      <div
        ref={composerRef}
        id="add-transaction-composer"
        className="rounded-xl border border-[#E5DAC4] bg-[#FFFDF8] p-3 sm:p-3.5 shadow-sm transition-all hover:border-[#84cc16]/50"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#18122B]/70">
            ADD A TRANSACTION
          </span>
          <span className="text-[10px] text-[#18122B]/40 font-mono hidden sm:inline">
            Fast voucher record
          </span>
        </div>

        <form onSubmit={handleAdd} className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 flex-1 min-w-0">
            {/* Amount input */}
            <div className="relative sm:col-span-3 lg:col-span-3">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 font-serif text-sm font-bold text-[#18122B]/60">
                ₹
              </span>
              <input
                ref={amountInputRef}
                type="number"
                step="any"
                min="1"
                required
                placeholder="Amount"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full rounded-lg border border-[#DDD9CF] bg-white py-2 pl-7 pr-3 text-xs font-semibold text-[#18122B] placeholder:text-[#18122B]/40 transition-all focus:border-[#84cc16] focus:outline-none focus:ring-2 focus:ring-[#84cc16]/30"
              />
            </div>

            {/* Description input */}
            <div className="sm:col-span-5 lg:col-span-5">
              <input
                type="text"
                required
                placeholder="What did you spend on? (e.g. Dinner, Rent, Fuel)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border border-[#DDD9CF] bg-white px-3 py-2 text-xs font-medium text-[#18122B] placeholder:text-[#18122B]/40 transition-all focus:border-[#84cc16] focus:outline-none focus:ring-2 focus:ring-[#84cc16]/30"
              />
            </div>

            {/* Category select */}
            <div className="sm:col-span-4 lg:col-span-4">
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-lg border border-[#DDD9CF] bg-white px-3 py-2 text-xs font-semibold text-[#18122B] transition-all focus:border-[#84cc16] focus:outline-none focus:ring-2 focus:ring-[#84cc16]/30"
              >
                <option value="Food & Dining">🍽️ Food & Dining</option>
                <option value="Groceries">🛒 Groceries</option>
                <option value="Entertainment">🎬 Entertainment</option>
                <option value="Shopping">🛍️ Shopping</option>
                <option value="Rent">🏠 Rent</option>
                <option value="Utilities">⚡ Utilities</option>
                <option value="Travel">✈️ Travel</option>
                <option value="Healthcare">💊 Healthcare</option>
                <option value="Other">💳 Other</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className={`group flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold shadow-sm transition-all ${
                isFormValid
                  ? "bg-[#18122B] text-white hover:bg-[#2e234c] hover:scale-[1.02] active:scale-[0.98]"
                  : "bg-[#18122B]/20 text-[#18122B]/40 cursor-not-allowed"
              }`}
            >
              <span>{isSubmitting ? "Recording..." : "Record transaction"}</span>
              <span
                className={`transition-transform group-hover:translate-x-0.5 ${
                  isFormValid ? "text-[#84cc16]" : "text-[#18122B]/30"
                }`}
              >
                &rarr;
              </span>
            </button>

            {/* Secondary Action: CSV Import */}
            <label className="cursor-pointer inline-flex items-center justify-center gap-1 rounded-lg border border-[#DDD9CF] bg-white px-3 py-2 text-xs font-semibold text-[#18122B] shadow-sm transition-all hover:border-[#18122B] hover:bg-[#FBF7EE] active:scale-95">
              <span>{importingCsv ? "Importing…" : "Import CSV"}</span>
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv"
                className="sr-only"
                disabled={importingCsv}
                onChange={handleCsvUpload}
              />
            </label>

            {/* Quick-Add via SMS Button */}
            <button
              type="button"
              onClick={() => {
                smsTextareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                setTimeout(() => smsTextareaRef.current?.focus(), 150);
              }}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-[#DDD9CF] bg-white px-3 py-2 text-xs font-semibold text-[#18122B] shadow-sm transition-all hover:border-[#18122B] hover:bg-[#FBF7EE] active:scale-95"
            >
              <span>💬</span>
              <span>Paste bank SMS</span>
            </button>
          </div>
        </form>

        {/* Action toast */}
        {message && (
          <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-[#84cc16]/40 bg-[#84cc16]/15 px-3 py-1 text-xs font-bold text-[#3f6212] animate-fadeIn">
            <span>✓</span>
            <span>{message}</span>
          </div>
        )}

        {/* SMS Quick-Add Flow (Review-before-commit) */}
        <div className="mt-3 pt-2.5 border-t border-[#E5DAC4]/60">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#18122B]/70">
                PASTE BANK SMS
              </span>
              <span className="rounded bg-[#84cc16]/15 px-1.5 py-0.5 text-[9px] font-bold text-[#3f6212]">
                Quick-Add
              </span>
            </div>
            {smsDraft ? (
              <span className="text-[10px] font-bold text-[#C2410C] bg-[#FFF7ED] px-2 py-0.5 rounded border border-[#FFEDD5]">
                Draft ready for review
              </span>
            ) : (
              <span className="text-[10px] text-[#18122B]/40 font-mono hidden sm:inline">
                UPI &bull; IMPS &bull; NEFT &bull; Card
              </span>
            )}
          </div>

          {!smsDraft ? (
            <div className="flex flex-col gap-2">
              <textarea
                ref={smsTextareaRef}
                rows={2}
                placeholder="Paste your UPI or bank transaction SMS here…"
                value={smsText}
                onChange={(e) => {
                  setSmsText(e.target.value);
                  if (smsError) setSmsError(null);
                }}
                className="w-full rounded-lg border border-[#DDD9CF] bg-white p-2.5 text-xs font-medium text-[#18122B] placeholder:text-[#18122B]/40 transition-all focus:border-[#84cc16] focus:outline-none focus:ring-2 focus:ring-[#84cc16]/30 resize-none"
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleParseSms}
                    disabled={isParsingSms || !smsText.trim()}
                    className={`group inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold shadow-sm transition-all ${
                      smsText.trim() && !isParsingSms
                        ? "bg-[#18122B] text-white hover:bg-[#2e234c] hover:scale-[1.02] active:scale-[0.98]"
                        : "bg-[#18122B]/20 text-[#18122B]/40 cursor-not-allowed"
                    }`}
                  >
                    <span>{isParsingSms ? "Parsing…" : "Parse"}</span>
                    <span
                      className={`transition-transform group-hover:translate-x-0.5 ${
                        smsText.trim() && !isParsingSms ? "text-[#84cc16]" : "text-[#18122B]/30"
                      }`}
                    >
                      &rarr;
                    </span>
                  </button>

                  {smsText && (
                    <button
                      type="button"
                      onClick={() => {
                        setSmsText("");
                        setSmsError(null);
                      }}
                      className="text-[11px] font-medium text-[#18122B]/50 hover:text-[#18122B] px-1.5 py-1"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <span className="text-[10px] text-[#18122B]/40 font-medium">
                  Review-before-commit &bull; Never committed automatically
                </span>
              </div>

              {smsError && (
                <div className="mt-1 flex items-center gap-2 rounded-lg border border-[#FECDD3] bg-[#FFF1F2] px-3 py-2 text-xs font-semibold text-[#BE123C] animate-fadeIn">
                  <span>⚠️</span>
                  <span>{smsError}</span>
                </div>
              )}
            </div>
          ) : (
            /* Editable Draft Review Card */
            <div className="rounded-lg border border-[#84cc16]/40 bg-[#FBFDF6] p-3 sm:p-3.5 shadow-sm animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between gap-1 pb-2 border-b border-[#E5DAC4]/60 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#3f6212] bg-[#84cc16]/20 px-2 py-0.5 rounded">
                    DRAFT &mdash; REVIEW BEFORE SAVING
                  </span>
                  <span className="text-xs text-[#18122B]/60 font-medium hidden sm:inline">
                    Verify and edit extracted details before confirming
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  className="text-[11px] font-semibold text-[#BE123C] hover:text-[#9F1239] hover:underline"
                >
                  Discard Draft
                </button>
              </div>

              {/* Dynamic Grid: Only render fields present in draft response */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {/* Amount */}
                {smsDraft.hasAmount && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#18122B]/60">
                      Amount (₹)
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 font-serif text-xs font-bold text-[#18122B]/60">
                        ₹
                      </span>
                      <input
                        type="number"
                        step="any"
                        min="0.01"
                        value={smsDraft.amount}
                        onChange={(e) =>
                          setSmsDraft({ ...smsDraft, amount: e.target.value })
                        }
                        className="w-full rounded-lg border border-[#DDD9CF] bg-white py-1.5 pl-6 pr-2.5 text-xs font-semibold text-[#18122B] focus:border-[#84cc16] focus:outline-none focus:ring-1 focus:ring-[#84cc16]"
                      />
                    </div>
                  </div>
                )}

                {/* Type */}
                {smsDraft.hasType && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#18122B]/60">
                      Transaction Type
                    </label>
                    <select
                      value={smsDraft.type}
                      onChange={(e) =>
                        setSmsDraft({ ...smsDraft, type: e.target.value })
                      }
                      className="w-full rounded-lg border border-[#DDD9CF] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#18122B] focus:border-[#84cc16] focus:outline-none focus:ring-1 focus:ring-[#84cc16]"
                    >
                      <option value="debit">Debit (Outflow)</option>
                      <option value="credit">Credit (Inflow)</option>
                    </select>
                  </div>
                )}

                {/* Merchant / Description */}
                {smsDraft.hasDescription && (
                  <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#18122B]/60">
                      Merchant / Description
                    </label>
                    <input
                      type="text"
                      value={smsDraft.description}
                      onChange={(e) =>
                        setSmsDraft({ ...smsDraft, description: e.target.value })
                      }
                      className="w-full rounded-lg border border-[#DDD9CF] bg-white px-2.5 py-1.5 text-xs font-medium text-[#18122B] focus:border-[#84cc16] focus:outline-none focus:ring-1 focus:ring-[#84cc16]"
                    />
                  </div>
                )}

                {/* Date */}
                {smsDraft.hasDate && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#18122B]/60">
                      Date
                    </label>
                    <input
                      type="date"
                      value={smsDraft.date}
                      onChange={(e) =>
                        setSmsDraft({ ...smsDraft, date: e.target.value })
                      }
                      className="w-full rounded-lg border border-[#DDD9CF] bg-white px-2.5 py-1.5 text-xs font-medium text-[#18122B] focus:border-[#84cc16] focus:outline-none focus:ring-1 focus:ring-[#84cc16]"
                    />
                  </div>
                )}

                {/* Category */}
                {smsDraft.hasCategory && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#18122B]/60">
                      Category
                    </label>
                    <select
                      value={smsDraft.category}
                      onChange={(e) =>
                        setSmsDraft({ ...smsDraft, category: e.target.value })
                      }
                      className="w-full rounded-lg border border-[#DDD9CF] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#18122B] focus:border-[#84cc16] focus:outline-none focus:ring-1 focus:ring-[#84cc16]"
                    >
                      <option value="Food & Dining">🍽️ Food & Dining</option>
                      <option value="Groceries">🛒 Groceries</option>
                      <option value="Entertainment">🎬 Entertainment</option>
                      <option value="Shopping">🛍️ Shopping</option>
                      <option value="Rent">🏠 Rent</option>
                      <option value="Utilities">⚡ Utilities</option>
                      <option value="Travel">✈️ Travel</option>
                      <option value="Healthcare">💊 Healthcare</option>
                      <option value="General">💳 General</option>
                      <option value="Other">💳 Other</option>
                    </select>
                  </div>
                )}

                {/* Account / Payment Method */}
                {smsDraft.hasAccount && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#18122B]/60">
                      Account / Method
                    </label>
                    <input
                      type="text"
                      value={smsDraft.account}
                      onChange={(e) =>
                        setSmsDraft({ ...smsDraft, account: e.target.value })
                      }
                      className="w-full rounded-lg border border-[#DDD9CF] bg-white px-2.5 py-1.5 text-xs font-medium text-[#18122B] focus:border-[#84cc16] focus:outline-none focus:ring-1 focus:ring-[#84cc16]"
                    />
                  </div>
                )}
              </div>

              {/* Error within draft review if validation or confirmation fails */}
              {smsError && (
                <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-[#FECDD3] bg-[#FFF1F2] px-3 py-2 text-xs font-semibold text-[#BE123C] animate-fadeIn">
                  <span>⚠️</span>
                  <span>{smsError}</span>
                </div>
              )}

              {/* Confirm / Discard Buttons */}
              <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-[#E5DAC4]/40">
                <button
                  type="button"
                  onClick={handleConfirmSms}
                  disabled={isConfirmingSms}
                  className="group inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#18122B] px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#2e234c] hover:scale-[1.02] active:scale-[0.98] disabled:bg-[#18122B]/40 disabled:cursor-not-allowed"
                >
                  <span>{isConfirmingSms ? "Confirming…" : "Confirm"}</span>
                  <span className="text-[#84cc16] font-bold">&rarr;</span>
                </button>

                <button
                  type="button"
                  onClick={handleDiscardDraft}
                  disabled={isConfirmingSms}
                  className="rounded-lg border border-[#DDD9CF] bg-white px-3 py-2 text-xs font-semibold text-[#18122B] shadow-sm transition-all hover:border-[#18122B] hover:bg-[#FBF7EE] active:scale-95 disabled:opacity-50"
                >
                  Discard
                </button>

                <span className="text-[10px] text-[#18122B]/50 font-mono ml-auto hidden sm:inline">
                  Draft will be posted to your passbook
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. TRANSACTION TOOLBAR (Search, Filters, Sort) */}
      <div className="flex flex-col gap-2 rounded-xl border border-[#E5DAC4] bg-[#FFFDF8] p-2.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-sm">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#18122B]/40 text-xs">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search merchant, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#DDD9CF] bg-white py-1.5 pl-8 pr-3 text-xs font-medium text-[#18122B] placeholder:text-[#18122B]/40 transition-all focus:border-[#84cc16] focus:outline-none focus:ring-1 focus:ring-[#84cc16]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-xs text-[#18122B]/40 hover:text-[#18122B]"
            >
              ✕
            </button>
          )}
        </div>

        {/* Right: Category, Date, Amount, and Sort Controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-[#DDD9CF] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#18122B] transition-all hover:border-[#18122B] focus:border-[#84cc16] focus:outline-none"
          >
            <option value="All">All Categories</option>
            {availableCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Date Filter */}
          <select
            value={selectedDateFilter}
            onChange={(e) => setSelectedDateFilter(e.target.value)}
            className="rounded-lg border border-[#DDD9CF] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#18122B] transition-all hover:border-[#18122B] focus:border-[#84cc16] focus:outline-none"
          >
            <option value="All">All Dates</option>
            <option value="sep2026">Sep 2026</option>
            <option value="aug2026">Aug 2026</option>
            <option value="jul2026">Jul 2026</option>
          </select>

          {/* Amount Filter */}
          <select
            value={selectedAmountRange}
            onChange={(e) => setSelectedAmountRange(e.target.value)}
            className="rounded-lg border border-[#DDD9CF] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#18122B] transition-all hover:border-[#18122B] focus:border-[#84cc16] focus:outline-none"
          >
            <option value="All">All Amounts</option>
            <option value="under1000">&lt; ₹1,000</option>
            <option value="1000to5000">₹1,000 – ₹5,000</option>
            <option value="above5000">&gt; ₹5,000</option>
          </select>

          {/* Sort Control */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-lg border border-[#DDD9CF] bg-white px-2.5 py-1.5 text-xs font-bold text-[#18122B] transition-all hover:border-[#18122B] focus:border-[#84cc16] focus:outline-none"
          >
            <option value="latest">Latest ↓</option>
            <option value="oldest">Oldest ↑</option>
            <option value="highest">Highest ₹</option>
            <option value="lowest">Lowest ₹</option>
          </select>

          {/* Active filters reset */}
          {(searchQuery ||
            selectedCategory !== "All" ||
            selectedDateFilter !== "All" ||
            selectedAmountRange !== "All") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
                setSelectedDateFilter("All");
                setSelectedAmountRange("All");
              }}
              className="rounded-lg bg-[#18122B]/10 px-2.5 py-1.5 text-[11px] font-bold text-[#18122B] hover:bg-[#18122B] hover:text-white transition-all"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* 6. TRANSACTION FEED CONTAINER */}
      <div className="rounded-xl border border-[#E5DAC4] bg-[#FFFDF8] p-3 sm:p-4 shadow-sm">
        {/* Feed Header */}
        <div className="flex items-center justify-between border-b border-[#E5DAC4]/60 pb-2.5 mb-2">
          <div>
            <h2 className="font-serif text-base sm:text-lg font-black text-[#18122B]">
              RECENT TRANSACTIONS
            </h2>
            <p className="text-[11px] text-[#18122B]/60 font-medium">
              Your latest money moves.
            </p>
          </div>
          <span className="rounded-full bg-[#18122B]/5 px-2.5 py-1 font-mono text-[11px] font-bold text-[#18122B]/75">
            {groupedFeed.length} {groupedFeed.length === 1 ? "entry" : "transactions"}
          </span>
        </div>

        {/* Feed Body */}
        {loading ? (
          /* Loading Skeleton State */
          <div className="space-y-2 py-2">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                className="flex animate-pulse items-center justify-between rounded-xl border border-[#E5DAC4]/40 bg-white/60 p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-[#E5DAC4]/60" />
                  <div className="space-y-1">
                    <div className="h-3.5 w-44 rounded bg-[#E5DAC4]/60" />
                    <div className="h-2.5 w-24 rounded bg-[#E5DAC4]/40" />
                  </div>
                </div>
                <div className="h-4 w-20 rounded bg-[#E5DAC4]/60" />
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          /* Empty States */
          items.length === 0 ? (
            /* True Empty State */
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#84cc16]/20 text-2xl">
                ✨
              </div>
              <h3 className="mt-3 font-serif text-lg font-black text-[#18122B]">
                NO MONEY MOVES YET.
              </h3>
              <p className="mt-1 max-w-sm text-xs text-[#18122B]/60 font-medium">
                Add your first transaction and FinSage will start building your financial picture.
              </p>
              <button
                onClick={handleFocusComposer}
                className="mt-4 rounded-full bg-[#18122B] px-4 py-2 text-xs font-bold text-white shadow hover:bg-[#2e234c] transition-all"
              >
                + Add Transaction
              </button>
            </div>
          ) : (
            /* Search Filter Empty State */
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <span className="text-3xl">🔍</span>
              <h3 className="mt-2 font-serif text-base font-black text-[#18122B]">
                NO TRANSACTIONS FOUND
              </h3>
              <p className="mt-1 text-xs text-[#18122B]/60">
                Try adjusting your search query or relaxing your filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                  setSelectedDateFilter("All");
                  setSelectedAmountRange("All");
                }}
                className="mt-3 rounded-full border border-[#DDD9CF] bg-white px-3.5 py-1.5 text-xs font-bold text-[#18122B] hover:bg-[#FBF7EE] transition-all"
              >
                Clear Filters
              </button>
            </div>
          )
        ) : (
          /* Structured Transaction Feed */
          <div className="space-y-1.5">
            {groupedFeed.map((group) => {
              const item = group.primary;
              const meta = getCategoryMeta(item.category);
              const isGroupExpanded = expandedGroups.has(group.key);
              const hasDuplicates = group.count > 1;

              return (
                <div key={group.key} className="flex flex-col">
                  {/* Primary / Group Row */}
                  <div className="group relative flex items-center justify-between rounded-xl border border-[#E5DAC4]/60 bg-white p-2.5 sm:px-3.5 transition-all duration-200 hover:border-[#84cc16] hover:bg-[#FFFDF8] hover:shadow-sm">
                    {/* Left: Category Icon + Description + Date */}
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
                      {/* Category Icon Badge */}
                      <div
                        className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl border ${meta.border} ${meta.bg} text-sm sm:text-base shadow-inner transition-transform duration-200 group-hover:scale-105`}
                        title={item.category}
                      >
                        {meta.icon}
                      </div>

                      {/* Particulars & Date */}
                      <div className="min-w-0 flex flex-col">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm text-[#18122B] truncate max-w-[200px] sm:max-w-md">
                            {item.description}
                          </span>

                          {/* Duplicate indicator badge */}
                          {hasDuplicates && (
                            <button
                              onClick={() => toggleGroup(group.key)}
                              className="inline-flex items-center gap-1 rounded-full border border-[#8B5CF6]/30 bg-[#F5F3FF] px-2 py-0.5 text-[10px] font-bold text-[#6D28D9] transition-all hover:bg-[#EDE9FE]"
                              title="Multiple similar entries logged in ledger"
                            >
                              <span>{group.count} similar transactions</span>
                              <span className="text-[9px] font-mono">
                                {isGroupExpanded ? "▲" : "▼"}
                              </span>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-[#18122B]/55 font-medium mt-0.5">
                          <span>{formatDate(item.transactionDate)}</span>
                          <span className="text-[#18122B]/30">•</span>
                          <span className="hidden sm:inline-flex items-center gap-1">
                            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                            {item.category}
                          </span>
                          {item.source && (
                            <>
                              <span className="text-[#18122B]/30 hidden sm:inline">•</span>
                              <span className="text-[10px] font-mono uppercase text-[#18122B]/45 hidden sm:inline">
                                {item.source}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Category Pill on larger screens */}
                    <div className="hidden lg:block shrink-0 px-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border ${meta.border} ${meta.bg} px-2.5 py-0.5 text-[11px] font-bold ${meta.text}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                        {item.category}
                      </span>
                    </div>

                    {/* Right: Amount & ⋯ Menu */}
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <span className="font-serif text-sm sm:text-base font-black text-[#18122B] tabular-nums tracking-tight">
                        - {formatINR(item.amount)}
                      </span>

                      {/* Action Menu (⋯) */}
                      <div className="relative" data-action-menu>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === item.id ? null : item.id);
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-transparent text-[#18122B]/50 transition-colors hover:border-[#DDD9CF] hover:bg-white hover:text-[#18122B]"
                          title="Actions"
                        >
                          ⋯
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuId === item.id && (
                          <div className="absolute right-0 top-8 z-30 w-32 rounded-xl border border-[#E5DAC4] bg-white p-1 shadow-lg animate-fadeIn">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#18122B] hover:bg-[#FBF7EE] transition-colors"
                            >
                              <span>✏️</span>
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleOpenDelete(item)}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <span>🗑️</span>
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Duplicate Sub-Records */}
                  {hasDuplicates && isGroupExpanded && (
                    <div className="ml-6 sm:ml-10 my-1 space-y-1 border-l-2 border-[#8B5CF6]/30 pl-3">
                      {group.items.map((subItem, subIdx) => (
                        <div
                          key={subItem.id}
                          className="flex items-center justify-between rounded-lg border border-[#E5DAC4]/50 bg-white/75 px-3 py-1.5 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-[#18122B]/40 font-bold">
                              #{subIdx + 1}
                            </span>
                            <span className="text-[#18122B]/75 font-medium truncate max-w-[150px] sm:max-w-xs">
                              ID: {subItem.id.slice(0, 8)}…
                            </span>
                            <span className="text-[10px] font-mono text-[#18122B]/50">
                              {formatDate(subItem.transactionDate)}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-serif font-bold text-[#18122B]">
                              - {formatINR(subItem.amount)}
                            </span>
                            <button
                              onClick={() => handleOpenEdit(subItem)}
                              className="text-[11px] font-bold text-[#18122B]/60 hover:text-[#18122B]"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleOpenDelete(subItem)}
                              className="text-[11px] font-bold text-rose-600 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 7. EDIT TRANSACTION MODAL */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E5DAC4]/60 pb-3">
              <h3 className="font-serif text-lg font-black text-[#18122B]">
                EDIT TRANSACTION
              </h3>
              <button
                onClick={() => setEditItem(null)}
                className="text-[#18122B]/40 hover:text-[#18122B]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#18122B]/70 mb-1">
                  Description / Merchant
                </label>
                <input
                  type="text"
                  required
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full rounded-lg border border-[#DDD9CF] bg-white px-3 py-2 text-xs font-semibold text-[#18122B] focus:border-[#84cc16] focus:outline-none focus:ring-2 focus:ring-[#84cc16]/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#18122B]/70 mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    value={editForm.amount}
                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                    className="w-full rounded-lg border border-[#DDD9CF] bg-white px-3 py-2 text-xs font-semibold text-[#18122B] focus:border-[#84cc16] focus:outline-none focus:ring-2 focus:ring-[#84cc16]/30"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#18122B]/70 mb-1">
                    Category
                  </label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full rounded-lg border border-[#DDD9CF] bg-white px-3 py-2 text-xs font-semibold text-[#18122B] focus:border-[#84cc16] focus:outline-none focus:ring-2 focus:ring-[#84cc16]/30"
                  >
                    <option value="Food & Dining">🍽️ Food & Dining</option>
                    <option value="Groceries">🛒 Groceries</option>
                    <option value="Entertainment">🎬 Entertainment</option>
                    <option value="Shopping">🛍️ Shopping</option>
                    <option value="Rent">🏠 Rent</option>
                    <option value="Utilities">⚡ Utilities</option>
                    <option value="Travel">✈️ Travel</option>
                    <option value="Healthcare">💊 Healthcare</option>
                    <option value="Other">💳 Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#18122B]/70 mb-1">
                  Transaction Date
                </label>
                <input
                  type="date"
                  required
                  value={editForm.transactionDate}
                  onChange={(e) => setEditForm({ ...editForm, transactionDate: e.target.value })}
                  className="w-full rounded-lg border border-[#DDD9CF] bg-white px-3 py-2 text-xs font-semibold text-[#18122B] focus:border-[#84cc16] focus:outline-none focus:ring-2 focus:ring-[#84cc16]/30"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-2 border-t border-[#E5DAC4]/60">
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  className="rounded-lg border border-[#DDD9CF] bg-white px-3.5 py-1.5 text-xs font-bold text-[#18122B]/80 hover:bg-[#FBF7EE]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="rounded-lg bg-[#18122B] px-4 py-1.5 text-xs font-bold text-white shadow hover:bg-[#2e234c] disabled:opacity-50"
                >
                  {isSavingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. DELETE CONFIRMATION DIALOG */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl border border-[#E5DAC4] bg-[#FFFDF8] p-5 shadow-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600 text-lg mb-3">
              ⚠️
            </div>
            <h3 className="font-serif text-base font-black text-[#18122B]">
              Delete this transaction?
            </h3>
            <p className="mt-1 text-xs text-[#18122B]/70 font-medium">
              Are you sure you want to delete{" "}
              <strong className="text-[#18122B]">"{deleteCandidate.description}"</strong> ({formatINR(deleteCandidate.amount)})? This action cannot be undone.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="rounded-lg border border-[#DDD9CF] bg-white px-3.5 py-1.5 text-xs font-bold text-[#18122B]/80 hover:bg-[#FBF7EE]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-bold text-white shadow hover:bg-rose-700 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
