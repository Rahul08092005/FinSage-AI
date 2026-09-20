"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { streamAdvisorChat } from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ContextConfig {
  greeting: string;
  sub: string;
  suggestions: string[];
}

const ROUTE_CONTEXTS: Record<string, ContextConfig> = {
  dashboard: {
    greeting: "Quick money check?",
    sub: "Ask me anything about your current balances and spending pace.",
    suggestions: [
      "What's my biggest spend?",
      "How am I doing this month?",
      "Where can I save?",
    ],
  },
  transactions: {
    greeting: "Let's clean up your money trail.",
    sub: "Spot duplicates, categorize expenses, or audit recent purchases.",
    suggestions: [
      "Show my biggest transactions",
      "Find unusual spending",
      "Where did I spend the most?",
    ],
  },
  budgets: {
    greeting: "Budget looking a little sus?",
    sub: "Keep an eye on category caps and spending limits before they breach.",
    suggestions: [
      "Which budget is closest to the limit?",
      "Where am I overspending?",
      "Can I afford another ₹2,000?",
    ],
  },
  goals: {
    greeting: "Your money has missions.",
    sub: "Track your milestones, target deadlines, and stash progress.",
    suggestions: [
      "Am I on track?",
      "Which goal needs attention?",
      "How much is left to save?",
    ],
  },
  documents: {
    greeting: "Paperwork detected. Want me to make sense of it?",
    sub: "Parse receipts, audit OCR confidence, and verify extracted transactions.",
    suggestions: [
      "Summarize this document",
      "Find important amounts",
      "Which documents need review?",
    ],
  },
};

const DEFAULT_CONTEXT: ContextConfig = {
  greeting: "Hey! What's on your mind?",
  sub: "Your FinSage money copilot is ready to analyze your finances.",
  suggestions: [
    "How am I doing this month?",
    "What's my biggest expense?",
    "Where can I save more?",
  ],
};

export function GlobalFloatingAssistant({ token }: { token: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasUnreadInsight, setHasUnreadInsight] = useState(true);

  const panelRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Determine active context based on current route
  const currentContext = useMemo(() => {
    if (!pathname) return DEFAULT_CONTEXT;
    if (pathname.startsWith("/dashboard")) return ROUTE_CONTEXTS.dashboard;
    if (pathname.startsWith("/transactions")) return ROUTE_CONTEXTS.transactions;
    if (pathname.startsWith("/budgets")) return ROUTE_CONTEXTS.budgets;
    if (pathname.startsWith("/goals")) return ROUTE_CONTEXTS.goals;
    if (pathname.startsWith("/documents")) return ROUTE_CONTEXTS.documents;
    return DEFAULT_CONTEXT;
  }, [pathname]);

  // If user is on the dedicated AI Advisor page, hide the floating assistant
  const isAdvisorPage = pathname?.startsWith("/advisor");

  // Scroll messages to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isStreaming, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setHasUnreadInsight(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (
        isOpen &&
        panelRef.current &&
        !panelRef.current.contains(target) &&
        !target.closest("[data-floating-robot-btn]")
      ) {
        setIsOpen(false);
      }
    }
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Send message
  async function handleSend(customText?: string) {
    const textToSend = (customText ?? input).trim();
    if (!textToSend || isStreaming) return;

    setInput("");

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const assistantMsgId = `assistant-${Date.now()}`;
    const initialAssistantMsg: Message = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage, initialAssistantMsg]);
    setIsStreaming(true);

    try {
      await streamAdvisorChat(
        token,
        textToSend,
        (chunk) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId ? { ...msg, content: msg.content + chunk } : msg
            )
          );
        },
        () => {
          setIsStreaming(false);
          setTimeout(() => inputRef.current?.focus(), 100);
        },
        (err) => {
          console.error("Floating assistant error:", err);
          const errorMsg =
            err?.message && !err.message.includes("[object")
              ? err.message
              : "Unable to connect to FinSage AI Advisor. Please ensure the AI engine service is running.";
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    content: msg.content || errorMsg,
                  }
                : msg
            )
          );
          setIsStreaming(false);
        }
      );
    } catch {
      setIsStreaming(false);
    }
  }

  // Navigate to full AI Advisor
  function handleOpenFullAdvisor() {
    setIsOpen(false);
    router.push("/advisor");
  }

  // Do not show on the full dedicated AI Advisor page
  if (isAdvisorPage) {
    return null;
  }

  return (
    <>
      {/* 1. FLOATING QUICK AI PANEL */}
      {isOpen && (
        <div
          ref={panelRef}
          className="fixed z-50 flex flex-col overflow-hidden rounded-[26px] border border-[#E5DAC4] bg-[#FFFDF8] shadow-2xl transition-all duration-200 animate-in fade-in zoom-in-95 slide-in-from-bottom-3 inset-x-3 bottom-20 h-[480px] max-h-[80vh] sm:inset-x-auto sm:left-auto sm:right-6 sm:bottom-24 sm:w-[380px] sm:h-[500px]"
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between border-b border-[#E5DAC4]/60 bg-[#FBF7EE]/90 px-4 py-3 backdrop-blur-xs">
            <div className="flex items-center gap-2.5">
              {/* Mini robot avatar */}
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#18122B] shadow-inner">
                <span className="absolute -top-1 h-1 w-0.5 rounded-full bg-[#84cc16]" />
                <div className="flex items-center gap-1">
                  <span className="h-1 w-1 rounded-full bg-[#84cc16] shadow-[0_0_4px_#84cc16]" />
                  <span className="h-1 w-1 rounded-full bg-[#84cc16] shadow-[0_0_4px_#84cc16]" />
                </div>
                <span className="absolute bottom-1.5 h-0.5 w-2 rounded-full bg-[#84cc16]/80" />
              </div>

              <div>
                <h3 className="font-serif text-sm font-black text-[#18122B] leading-none">
                  FinSage AI
                </h3>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-[#18122B]/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#84cc16] animate-pulse" />
                  <span>Online · Your money copilot</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#18122B]/50 transition-colors hover:bg-[#18122B]/10 hover:text-[#18122B]"
              title="Close panel (Esc)"
            >
              ✕
            </button>
          </div>

          {/* Panel Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-xs">
            {/* Contextual Greeting Card */}
            <div className="rounded-2xl border border-[#E5DAC4]/60 bg-white p-3 shadow-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">✨</span>
                <span className="font-serif text-xs font-black text-[#18122B]">
                  {currentContext.greeting}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-[#18122B]/65 font-medium leading-relaxed">
                {currentContext.sub}
              </p>

              {/* Suggested quick actions */}
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {currentContext.suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(s)}
                    className="rounded-full border border-[#DDD9CF] bg-[#FAF6EC] px-2.5 py-1 text-[11px] font-semibold text-[#18122B] transition-all hover:border-[#84cc16] hover:bg-[#84cc16]/15 hover:text-[#3f6212] active:scale-95 text-left"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation Messages */}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                    m.role === "user"
                      ? "bg-[#18122B] text-white rounded-br-xs shadow-xs font-medium"
                      : "bg-white border border-[#E5DAC4] text-[#18122B] rounded-bl-xs shadow-xs font-medium"
                  }`}
                >
                  {m.content ? (
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  ) : (
                    <div className="flex items-center gap-1 py-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#84cc16] animate-bounce" />
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-[#84cc16] animate-bounce"
                        style={{ animationDelay: "0.15s" }}
                      />
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-[#84cc16] animate-bounce"
                        style={{ animationDelay: "0.3s" }}
                      />
                    </div>
                  )}
                </div>
                <span className="mt-0.5 px-1 font-mono text-[9px] text-[#18122B]/40">
                  {m.timestamp}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Panel Input Composer & Full Advisor Action */}
          <div className="border-t border-[#E5DAC4]/60 bg-[#FBF7EE] p-3 space-y-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-1.5"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask something about your money..."
                disabled={isStreaming}
                className="flex-1 rounded-xl border border-[#DDD9CF] bg-white px-3 py-2 text-xs font-medium text-[#18122B] placeholder:text-[#18122B]/40 transition-all focus:border-[#84cc16] focus:outline-none focus:ring-2 focus:ring-[#84cc16]/30 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isStreaming}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#18122B] text-[#84cc16] shadow-sm transition-all hover:bg-[#2e234c] hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                title="Send question"
              >
                <span className="font-bold text-sm">&rarr;</span>
              </button>
            </form>

            {/* Link to Full AI Advisor */}
            <div className="flex items-center justify-between pt-1 text-[11px] text-[#18122B]/60">
              <span className="font-mono text-[10px] uppercase text-[#18122B]/40">
                Quick Assistant
              </span>
              <button
                onClick={handleOpenFullAdvisor}
                className="group flex items-center gap-1 font-bold text-[#18122B] hover:text-[#4d7c0f] transition-colors"
              >
                <span>Open full AI Advisor</span>
                <span className="text-[#84cc16] transition-transform group-hover:translate-x-0.5">
                  &rarr;
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. FLOATING CIRCULAR ROBOT BUTTON (Anchored bottom-right) */}
      <button
        data-floating-robot-btn
        onClick={() => setIsOpen(!isOpen)}
        aria-label="FinSage AI quick assistant"
        title={isOpen ? "Close FinSage AI" : "Open FinSage AI quick assistant"}
        className={`fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full bg-[#18122B] text-white shadow-[0_4px_24px_rgba(24,18,43,0.25)] transition-all duration-200 
          /* Desktop & Mobile Dimensions */
          h-14 w-14 sm:h-16 sm:w-16 
          /* Hover effects */
          hover:scale-105 hover:shadow-[0_6px_30px_rgba(132,204,22,0.35)] active:scale-95 
          /* Subtle breathing border */
          border-2 ${isOpen ? "border-[#84cc16] ring-4 ring-[#84cc16]/20" : "border-[#84cc16]/70"}`}
      >
        {/* Antenna */}
        <span className="absolute -top-1.5 h-2 w-0.5 rounded-full bg-[#84cc16] shadow-[0_0_4px_#84cc16]" />

        {/* Robot Face */}
        <div className="flex flex-col items-center justify-center gap-1">
          {/* Eyes */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span
              className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-[#84cc16] shadow-[0_0_6px_#84cc16] transition-all ${
                isOpen ? "scale-110" : "animate-pulse"
              }`}
            />
            <span
              className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-[#84cc16] shadow-[0_0_6px_#84cc16] transition-all ${
                isOpen ? "scale-110" : "animate-pulse"
              }`}
            />
          </div>
          {/* Smile / status line */}
          <span
            className={`h-0.5 rounded-full bg-white/70 transition-all ${
              isOpen ? "w-3 bg-[#84cc16]" : "w-2.5"
            }`}
          />
        </div>

        {/* Insight badge notification dot */}
        {hasUnreadInsight && !isOpen && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#84cc16] opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full border-2 border-[#18122B] bg-[#84cc16]" />
          </span>
        )}
      </button>
    </>
  );
}
