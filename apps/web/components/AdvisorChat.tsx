"use client";

import { useEffect, useRef, useState } from "react";
import { streamAdvisorChat, exportFinancialReport } from "@/lib/api";
import { formatINR } from "@/lib/formatCurrency";
import { AdvisorResponseView, StructuredGuruPerspective } from "./AdvisorResponseView";
import { CitationSourceControl } from "./CitationSourceControl";

export interface MatchingTransaction {
  id?: string;
  date?: string;
  transactionDate?: string;
  description?: string;
  merchant?: string;
  category?: string;
  amount?: number | string;
  [key: string]: any;
}

export interface ReasoningTrace {
  evidence?: string[] | string;
  calculation?: string;
  confidence?: "high" | "medium" | "low" | string;
  summary?: string;
  [key: string]: any;
}

interface Message {
  id: string;
  role: "user" | "advisor";
  content: string;
  timestamp: string;
  mode?: "advisor" | "compare";
  citations?: any[];
  guru_perspectives?: StructuredGuruPerspective[];
  matching_transactions?: MatchingTransaction[];
  reasoning_trace?: ReasoningTrace;
}

const ADVISOR_PROMPTS = [
  "How much did I spend on Food this month?",
  "Am I within my monthly budget allocations?",
  "Summarize my recent transactions and highlight any spending anomalies.",
  "Where are my top financial leaks?",
];

const GURU_PROMPTS = [
  "Compare Conservative vs Growth perspectives on my spending pace",
  "What would Buffett vs Bogle advise on my monthly savings rate?",
  "Compare Safe Play vs Balanced Take for my emergency fund",
  "Contrast value investing vs index strategies for my surplus cash",
];

const SUGGESTED_QUESTION_CHIPS = [
  "How much did I spend on food this month?",
  "Should I pay off debt or invest?",
  "Where did most of my money go this month?",
  "Am I overspending anywhere?",
];

// Helper to format confidence pill colors: high (teal), medium (gold/amber), low (muted grey)
function getConfidenceBadge(confidence?: string) {
  const conf = (confidence || "medium").toLowerCase();
  if (conf === "high") {
    return {
      label: "HIGH",
      bg: "bg-teal-50 border-teal-200 text-teal-800",
      dot: "bg-teal-600",
    };
  }
  if (conf === "medium") {
    return {
      label: "MEDIUM",
      bg: "bg-amber-50 border-amber-200 text-amber-800",
      dot: "bg-amber-500",
    };
  }
  return {
    label: "LOW",
    bg: "bg-stone-100 border-stone-200 text-stone-600",
    dot: "bg-stone-400",
  };
}

function MatchingTransactionsControl({
  transactions,
  messageId,
}: {
  transactions?: MatchingTransaction[];
  messageId: string;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
    return null;
  }

  const count = transactions.length;

  return (
    <div className="mt-3 pt-2.5 border-t border-stone-200/70">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls={`matching-txs-${messageId}`}
        className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white hover:bg-stone-50 px-3 py-1 text-xs font-semibold text-stone-700 transition cursor-pointer shadow-2xs"
      >
        <span>🧾</span>
        <span>
          {expanded ? "Hide" : "View"} {count} matching transaction{count === 1 ? "" : "s"}
        </span>
        <span className="text-stone-400 text-[10px]">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div
          id={`matching-txs-${messageId}`}
          className="mt-2.5 rounded-xl border border-stone-200/80 bg-white p-3 shadow-2xs max-h-60 overflow-y-auto"
        >
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-stone-200/60 text-[9px] font-bold uppercase tracking-wider text-stone-400">
            <span>Date & Description</span>
            <span>Category / Amount</span>
          </div>

          <div className="divide-y divide-stone-100 space-y-1">
            {transactions.map((tx, idx) => {
              const dateStr = tx.date || tx.transactionDate;
              const formattedDate = dateStr
                ? new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                : "—";
              const desc = tx.description || tx.merchant || "Transaction";
              const cat = tx.category || "General";
              const amt =
                tx.amount !== undefined && tx.amount !== null ? formatINR(tx.amount) : "—";

              return (
                <div
                  key={tx.id || idx}
                  className="pt-1.5 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0 flex items-center gap-2">
                    <span className="text-[10px] font-mono text-stone-400 shrink-0">
                      {formattedDate}
                    </span>
                    <span className="font-medium text-[#18122B] truncate">{desc}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded font-medium">
                      {cat}
                    </span>
                    <span className="font-serif font-bold text-[#18122B]">{amt}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ReasoningTraceControl({
  trace,
  messageId,
}: {
  trace?: ReasoningTrace;
  messageId: string;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!trace || typeof trace !== "object") {
    return null;
  }

  // Verify at least one usable property exists
  const hasEvidence = Array.isArray(trace.evidence)
    ? trace.evidence.length > 0
    : !!trace.evidence;
  const hasCalc = !!trace.calculation;
  const hasConf = !!trace.confidence;
  const hasSummary = !!trace.summary;

  if (!hasEvidence && !hasCalc && !hasConf && !hasSummary) {
    return null;
  }

  const confBadge = getConfidenceBadge(trace.confidence);
  const evidenceList = Array.isArray(trace.evidence)
    ? trace.evidence
    : typeof trace.evidence === "string"
    ? [trace.evidence]
    : [];

  return (
    <div className="mt-3 pt-2.5 border-t border-stone-200/70">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls={`reasoning-trace-${messageId}`}
        className="inline-flex items-center gap-1.5 rounded-full border border-[#E5DAC4] bg-[#FFFDF8] hover:bg-stone-50 px-3 py-1 text-xs font-semibold text-[#18122B] transition cursor-pointer shadow-2xs"
      >
        <span className="text-[#84cc16] font-bold">✦</span>
        <span>Why?</span>
        <span className="text-stone-400 text-[10px]">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div
          id={`reasoning-trace-${messageId}`}
          className="mt-2.5 rounded-xl border border-[#E5DAC4] bg-white p-3.5 shadow-2xs space-y-3"
        >
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#18122B]/70">
              ✦ SHOW YOUR WORK
            </span>
            {hasConf && (
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase ${confBadge.bg}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${confBadge.dot}`} />
                <span>CONFIDENCE: {confBadge.label}</span>
              </span>
            )}
          </div>

          {/* Evidence section */}
          {evidenceList.length > 0 && (
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                EVIDENCE
              </span>
              <ul className="space-y-1 text-xs text-stone-700">
                {evidenceList.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-[#3f6212] font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Calculation section */}
          {hasCalc && (
            <div className="pt-2 border-t border-stone-100">
              <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                CALCULATION
              </span>
              <p className="font-mono text-xs text-[#18122B] bg-[#FAF8F5] p-2 rounded-lg border border-[#E5DAC4]/60">
                {trace.calculation}
              </p>
            </div>
          )}

          {/* Summary section if provided and distinct */}
          {hasSummary && !hasCalc && (
            <div className="pt-2 border-t border-stone-100">
              <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                REASONING SUMMARY
              </span>
              <p className="text-xs text-stone-700 font-medium leading-relaxed">
                {trace.summary}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AdvisorChat({ token }: { token: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"advisor" | "compare">("advisor");
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  async function handleSend(promptText?: string) {
    const textToSend = (promptText ?? input).trim();
    if (!textToSend || isStreaming) return;

    setError(null);
    setInput("");

    const currentTimestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: currentTimestamp,
      mode,
    };

    const advisorMsgId = `advisor-${Date.now()}`;
    const initialAdvisorMessage: Message = {
      id: advisorMsgId,
      role: "advisor",
      content: "",
      timestamp: currentTimestamp,
      mode,
    };

    setMessages((prev) => [...prev, userMessage, initialAdvisorMessage]);
    setIsStreaming(true);

    // If in Guru Compare mode and query isn't already explicit, guide context
    let queryToSend = textToSend;
    if (
      mode === "compare" &&
      !textToSend.toLowerCase().includes("compare") &&
      !textToSend.toLowerCase().includes("guru")
    ) {
      queryToSend = `Please compare different financial guru perspectives (e.g. Conservative vs Growth vs Balanced): ${textToSend}`;
    }

    await streamAdvisorChat(
      token,
      queryToSend,
      (chunk) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === advisorMsgId ? { ...msg, content: msg.content + chunk } : msg
          )
        );
      },
      () => {
        setIsStreaming(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      },
      (err) => {
        console.error("[streamAdvisorChat] Error:", err);
        setError(
          err.message || "Failed to reach AI Advisor. Please verify the AI service is running."
        );
        setIsStreaming(false);
      },
      (citations) => {
        if (Array.isArray(citations) && citations.length > 0) {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === advisorMsgId ? { ...msg, citations } : msg))
          );
        }
      },
      (guru_perspectives) => {
        if (Array.isArray(guru_perspectives) && guru_perspectives.length > 0) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === advisorMsgId ? { ...msg, guru_perspectives } : msg
            )
          );
        }
      },
      (matching_transactions) => {
        if (Array.isArray(matching_transactions) && matching_transactions.length > 0) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === advisorMsgId ? { ...msg, matching_transactions } : msg
            )
          );
        }
      },
      (reasoning_trace) => {
        if (reasoning_trace) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === advisorMsgId ? { ...msg, reasoning_trace } : msg
            )
          );
        }
      }
    );
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Handle Export Report
  async function handleExportReport() {
    setIsExporting(true);
    setExportMessage(null);
    try {
      let baseReport = "";
      try {
        baseReport = await exportFinancialReport(token);
      } catch (err) {
        console.warn(
          "[ExportReport] Backend report endpoint unavailable, compiling frontend analysis session:",
          err
        );
      }

      // Build conversation memorandum
      const dateStr = new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      let sessionContent = `\n\n## FinSage AI Advisory Session Memorandum\n*Generated on ${dateStr} at ${timeStr}*\n\n`;

      if (messages.length > 0) {
        messages.forEach((m) => {
          if (m.role === "user") {
            sessionContent += `### Inquirer Query (${m.timestamp}):\n> ${m.content}\n\n`;
          } else {
            sessionContent += `### Advisor Memorandum (${m.timestamp}) [Mode: ${
              m.mode ?? "advisor"
            }]:\n${m.content}\n\n`;
            if (m.citations && m.citations.length > 0) {
              sessionContent += `**Grounded Sources (${m.citations.length}):**\n`;
              m.citations.forEach((c: any, cIdx: number) => {
                const text =
                  typeof c === "string"
                    ? c
                    : c.title
                    ? `${c.title}: ${c.content || c.snippet || ""}`
                    : c.content || c.snippet || JSON.stringify(c);
                sessionContent += `- [Source ${cIdx + 1}] ${text.slice(0, 160)}...\n`;
              });
              sessionContent += `\n`;
            }
            sessionContent += `---\n\n`;
          }
        });
      } else {
        sessionContent += `*No active conversation queries recorded in this session.*\n\n`;
      }

      const finalMarkdown = baseReport
        ? `${baseReport}\n${sessionContent}`
        : `# FinSage AI Financial Advisory Report\n${sessionContent}`;

      // Trigger client-side file download
      const blob = new Blob([finalMarkdown], { type: "text/markdown;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `FinSage-Financial-Advisory-Report-${new Date().toISOString().slice(0, 10)}.md`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportMessage("Report downloaded successfully ✨");
      setTimeout(() => setExportMessage(null), 3000);
    } catch (e: any) {
      console.error("[handleExportReport] failed:", e);
      setError("Failed to generate report export.");
    } finally {
      setIsExporting(false);
    }
  }

  const activePresets = mode === "compare" ? GURU_PROMPTS : ADVISOR_PROMPTS;

  return (
    <div className="flex h-[calc(100vh-6.5rem)] min-h-[580px] flex-col rounded-[22px] border border-stone-200/90 bg-[#FFFDF8] shadow-sm overflow-hidden">
      {/* 1. EDITORIAL ADVISOR HEADER WITH MODE SWITCHER & EXPORT */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-200/80 bg-[#FAF7F2] px-5 py-3.5">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-lime-400/25 border border-lime-500/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#18122B]">
              ✦ RAG GROUNDED
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-stone-400 uppercase">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isStreaming ? "bg-amber-500 animate-ping" : "bg-emerald-500"
                }`}
              />
              {isStreaming ? "Formulating response…" : "Engine Ready"}
            </span>
            {exportMessage && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800 animate-in fade-in">
                ✓ {exportMessage}
              </span>
            )}
          </div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#18122B]">
            AI ADVISOR.
          </h1>
          <p className="text-xs text-stone-500 font-medium">
            Your personal money copilot. Deep ledger analysis, guru perspectives, and RAG grounding.
          </p>
        </div>

        {/* Right Controls: Mode Switcher + Export Report */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Segmented Mode Switcher */}
          <div className="inline-flex rounded-full bg-stone-200/70 p-0.5 border border-stone-300/80 text-[11px] font-semibold shadow-2xs">
            <button
              type="button"
              onClick={() => setMode("advisor")}
              className={`rounded-full px-3 py-1 transition cursor-pointer ${
                mode === "advisor"
                  ? "bg-[#18122B] text-white shadow-xs"
                  : "text-stone-600 hover:text-[#18122B]"
              }`}
            >
              Advisor
            </button>
            <button
              type="button"
              onClick={() => setMode("compare")}
              className={`rounded-full px-3 py-1 transition cursor-pointer flex items-center gap-1 ${
                mode === "compare"
                  ? "bg-[#18122B] text-white shadow-xs"
                  : "text-stone-600 hover:text-[#18122B]"
              }`}
            >
              <span>Guru Compare</span>
              <span className="text-lime-400 text-[10px]">✦</span>
            </button>
          </div>

          {/* Export Report Pill Action */}
          <button
            type="button"
            onClick={handleExportReport}
            disabled={isExporting}
            className="inline-flex items-center gap-1 rounded-full border border-stone-300 bg-white hover:bg-stone-50 px-3 py-1 text-xs font-semibold text-stone-700 transition cursor-pointer shadow-2xs active:scale-[0.98] disabled:opacity-50"
            title="Download complete advisory analysis as markdown report"
          >
            {isExporting ? (
              <>
                <span className="h-2.5 w-2.5 rounded-full border border-stone-600 border-t-transparent animate-spin" />
                <span>Exporting…</span>
              </>
            ) : (
              <>
                <span>Export Report</span>
                <span className="text-[#18122B] font-bold">→</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. CONTEXTUAL PROMPT SUGGESTIONS (TOP) */}
      <div className="border-b border-stone-200/70 bg-[#FFFDF8] px-5 py-2">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-0.5">
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-stone-400 mr-1">
            {mode === "compare" ? "✦ Guru Inquiries:" : "✦ Contextual Inquiries:"}
          </span>
          {activePresets.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isStreaming}
              onClick={() => handleSend(prompt)}
              className="shrink-0 rounded-full border border-stone-200 bg-stone-50/80 px-2.5 py-1 text-[11px] font-medium text-stone-600 transition hover:border-[#18122B] hover:bg-lime-50/40 hover:text-[#18122B] disabled:opacity-40 cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* 3. MESSAGE FEED */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {/* Welcome Empty State */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center max-w-lg mx-auto">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-400/25 border border-lime-500/30 text-2xl mb-3 shadow-xs">
              {mode === "compare" ? "⚖️" : "✦"}
            </div>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-[#18122B] tracking-tight">
              {mode === "compare"
                ? "GURU PHILOSOPHY SYNTHESIS"
                : "WELCOME TO THE FINSAGE ADVISORY DESK"}
            </h3>
            <p className="mt-1 text-xs text-stone-500 font-medium leading-relaxed">
              {mode === "compare"
                ? "Synthesize your capital decisions across classic value investing, low-cost index philosophy, and modern compounding rules."
                : "I have direct access to your current month's ledger records, spending categories, budget caps, and savings goals."}
            </p>

            <div className="mt-5 rounded-2xl border border-stone-200/80 bg-[#FAF7F2] p-3.5 text-xs text-stone-600 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                TRY ASKING:
              </span>
              <button
                type="button"
                onClick={() =>
                  handleSend(
                    mode === "compare"
                      ? "Compare Conservative vs Growth perspectives on my spending pace"
                      : "How much did I spend on Food this month?"
                  )
                }
                className="font-serif font-bold text-[#18122B] underline decoration-lime-500 hover:text-stone-800 transition cursor-pointer"
              >
                &ldquo;
                {mode === "compare"
                  ? "Compare Conservative vs Growth perspectives on my spending pace"
                  : "How much did I spend on Food this month?"}
                &rdquo; →
              </button>
            </div>
          </div>
        )}

        {/* Messages List */}
        {messages.map((msg) => {
          const isUser = msg.role === "user";

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-[10px] font-bold tracking-wider text-stone-400 uppercase">
                  {isUser ? "You" : "Advisor Memorandum"}
                </span>
                <span className="text-[10px] text-stone-400">{msg.timestamp}</span>
              </div>

              <div
                className={`max-w-[92%] sm:max-w-[85%] rounded-[20px] text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? "bg-[#18122B] text-white px-4 py-2.5 shadow-xs font-sans"
                    : "border border-stone-200/90 bg-[#FAF7F2] p-4 text-[#18122B] shadow-xs"
                }`}
              >
                {!isUser ? (
                  <div>
                    <div className="mb-2 border-b border-stone-200/70 pb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-lime-500" />
                        <span className="font-serif text-xs font-bold text-[#18122B]">
                          FinSage Intelligence
                        </span>
                      </div>
                      <span className="text-[9px] font-mono uppercase tracking-wider text-stone-400">
                        RAG Grounded
                      </span>
                    </div>

                    <AdvisorResponseView
                      content={msg.content}
                      isStreaming={isStreaming && msg.id === messages[messages.length - 1]?.id}
                      mode={msg.mode || mode}
                      guru_perspectives={msg.guru_perspectives}
                    />

                    {/* Grounded Evidence / Citation Source Control */}
                    <CitationSourceControl citations={msg.citations} />

                    {/* Step 1: Matching Transactions Expandable Toggle */}
                    <MatchingTransactionsControl
                      transactions={msg.matching_transactions}
                      messageId={msg.id}
                    />

                    {/* Step 2: "Why?" Reasoning Expandable Toggle */}
                    <ReasoningTraceControl
                      trace={msg.reasoning_trace}
                      messageId={msg.id}
                    />
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          );
        })}

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 flex items-center gap-2">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. SUGGESTED QUESTION CHIPS ABOVE CHAT INPUT */}
      <div className="border-t border-stone-200/80 bg-[#FAF7F2] px-4 pt-2.5 pb-1">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-0.5">
          <span className="shrink-0 text-[10px] font-black uppercase tracking-wider text-[#18122B]/70 mr-1">
            TRY ASKING ✦
          </span>
          {SUGGESTED_QUESTION_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isStreaming}
              onClick={() => {
                setInput(chip);
                inputRef.current?.focus();
              }}
              className="shrink-0 rounded-full border border-stone-300 bg-white hover:bg-stone-50 px-2.5 py-1 text-[11px] font-medium text-stone-700 transition hover:border-[#18122B] hover:text-[#18122B] disabled:opacity-40 cursor-pointer shadow-2xs active:scale-95"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* 5. COMPOSER INPUT BAR */}
      <div className="bg-[#FAF7F2] px-3 pb-3 sm:px-4 sm:pb-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2.5"
        >
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
              placeholder={
                isStreaming
                  ? "Advisor is streaming response…"
                  : mode === "compare"
                  ? "Ask for a guru comparison or contrasting investment approaches… (Press Enter to transmit)"
                  : "Inquire about ledger balances, category trends, or savings strategy… (Press Enter to transmit)"
              }
              className="w-full resize-none rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs text-[#18122B] placeholder:text-stone-400 transition focus:border-[#18122B] focus:outline-none focus:ring-1 focus:ring-[#18122B]/20 disabled:opacity-60"
            />
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="rounded-xl bg-[#18122B] px-4 sm:px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            {isStreaming ? (
              <>
                <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span className="hidden sm:inline">Streaming…</span>
              </>
            ) : (
              <>
                <span>Transmit Query</span>
                <span className="text-lime-400 font-bold">→</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
