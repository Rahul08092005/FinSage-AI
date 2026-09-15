"use client";

import { useEffect, useRef, useState } from "react";
import { streamAdvisorChat, exportFinancialReport } from "@/lib/api";
import { AdvisorResponseView } from "./AdvisorResponseView";
import { CitationSourceControl } from "./CitationSourceControl";

interface Message {
  id: string;
  role: "user" | "advisor";
  content: string;
  timestamp: string;
  mode?: "advisor" | "compare";
  citations?: any[];
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

    const currentTimestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

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
    if (mode === "compare" && !textToSend.toLowerCase().includes("compare") && !textToSend.toLowerCase().includes("guru")) {
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
        setError(err.message || "Failed to reach AI Advisor. Please verify the AI service is running.");
        setIsStreaming(false);
      },
      (citations) => {
        if (Array.isArray(citations) && citations.length > 0) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === advisorMsgId ? { ...msg, citations } : msg
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
        console.warn("[ExportReport] Backend report endpoint unavailable, compiling frontend analysis session:", err);
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
            sessionContent += `### Advisor Memorandum (${m.timestamp}) [Mode: ${m.mode ?? "advisor"}]:\n${m.content}\n\n`;
            if (m.citations && m.citations.length > 0) {
              sessionContent += `**Grounded Sources (${m.citations.length}):**\n`;
              m.citations.forEach((c: any, cIdx: number) => {
                const text = typeof c === "string" ? c : (c.title ? `${c.title}: ${c.content || c.snippet || ""}` : (c.content || c.snippet || JSON.stringify(c)));
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

      const finalMarkdown = baseReport ? `${baseReport}\n${sessionContent}` : `# FinSage AI Financial Advisory Report\n${sessionContent}`;

      // Trigger client-side file download
      const blob = new Blob([finalMarkdown], { type: "text/markdown;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `FinSage-Financial-Advisory-Report-${new Date().toISOString().slice(0, 10)}.md`);
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
              <span className={`h-1.5 w-1.5 rounded-full ${isStreaming ? "bg-amber-500 animate-ping" : "bg-emerald-500"}`} />
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

      {/* 2. CONTEXTUAL PROMPT SUGGESTIONS */}
      <div className="border-b border-stone-200/70 bg-[#FFFDF8] px-5 py-2">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-0.5">
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-stone-400 mr-1">
            {mode === "compare" ? "✦ Guru Inquiries:" : "✦ Suggested Inquiries:"}
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
                    />

                    {/* Grounded Evidence / Citation Source Control */}
                    <CitationSourceControl citations={msg.citations} />
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

      {/* 4. COMPOSER INPUT BAR */}
      <div className="border-t border-stone-200/80 bg-[#FAF7F2] p-3 sm:p-4">
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
