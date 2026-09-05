"use client";
import { useEffect, useRef, useState } from "react";
import { streamAdvisorChat } from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "advisor";
  content: string;
  timestamp: string;
}

const PRESET_PROMPTS = [
  "How much did I spend on Food this month?",
  "Am I within my monthly budget allocations?",
  "How can I optimize my spending to reach my savings goals faster?",
  "Summarize my recent transactions and highlight any spending anomalies.",
];

export function AdvisorChat({ token }: { token: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const advisorMsgId = `advisor-${Date.now()}`;
    const initialAdvisorMessage: Message = {
      id: advisorMsgId,
      role: "advisor",
      content: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage, initialAdvisorMessage]);
    setIsStreaming(true);

    await streamAdvisorChat(
      token,
      textToSend,
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
        setError(err.message || "Failed to reach AI Advisor. Please verify the AI engine is running.");
        setIsStreaming(false);
      }
    );
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col rounded-lg border border-line bg-paper-sheet shadow-subtle">
      {/* Advisor Header */}
      <div className="flex items-center justify-between border-b border-line px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-teal/40 bg-teal-tint">
            <span className="font-serif text-sm font-bold text-teal">FS</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-base font-semibold text-ink">
                FinSage Advisory Desk
              </h2>
              <span className="rounded border border-teal/30 bg-teal-tint px-2 py-0.5 text-[9px] font-semibold text-teal uppercase tracking-wider">
                Live SSE Stream
              </span>
            </div>
            <p className="text-xs text-ink-muted">
              RAG-grounded financial intelligence powered by your ledger
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-2.5 py-1 text-[10px] font-semibold text-ink-muted">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isStreaming ? "animate-pulse bg-gold" : "bg-teal"
              }`}
            />
            {isStreaming ? "Advisor formulating…" : "Ready"}
          </span>
        </div>
      </div>

      {/* Preset Prompt Suggestions */}
      <div className="border-b border-line/60 bg-paper/30 px-6 py-2.5">
        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">
            Suggested Inquiries:
          </span>
          {PRESET_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isStreaming}
              onClick={() => handleSend(prompt)}
              className="shrink-0 rounded-md border border-line bg-paper-sheet px-2.5 py-1 text-[11px] font-medium text-ink-muted transition-colors hover:border-teal/40 hover:bg-teal-tint/30 hover:text-teal disabled:cursor-not-allowed disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Empty State Suggestion */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-teal/40 bg-teal-tint shadow-subtle">
              <span className="font-serif text-lg font-bold text-teal">FS</span>
            </div>
            <h3 className="mt-4 font-serif text-lg font-semibold text-ink">
              Welcome to the FinSage Advisory Desk
            </h3>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-ink-muted">
              I have direct access to your current month&apos;s ledger records, spending categories, and savings targets.
            </p>
            <div className="mt-6 rounded-md border border-line bg-paper/60 p-4 shadow-subtle">
              <p className="text-xs text-ink-muted">
                Try asking:{" "}
                <button
                  type="button"
                  onClick={() => handleSend("How much did I spend on Food this month?")}
                  className="font-serif font-semibold text-teal underline decoration-teal/40 transition hover:text-teal-dark"
                >
                  &ldquo;How much did I spend on Food this month?&rdquo;
                </button>
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === "user";

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-[10px] font-bold tracking-wider text-ink-subtle uppercase">
                  {isUser ? "You" : "Advisor Memorandum"}
                </span>
                <span className="text-[10px] text-ink-subtle">{msg.timestamp}</span>
              </div>

              <div
                className={`max-w-[85%] rounded-lg border text-sm leading-relaxed ${
                  isUser
                    ? "border-ink-light bg-ink px-4 py-2.5 text-paper-sheet shadow-subtle"
                    : "border-line bg-paper-sheet p-4 text-ink shadow-subtle"
                }`}
              >
                {!isUser && (
                  <div className="mb-2 border-b border-line/60 pb-1.5 flex items-center justify-between">
                    <span className="font-serif text-xs italic font-semibold text-teal">
                      FinSage Advisory Protocol
                    </span>
                    <span className="text-[9px] font-mono uppercase tracking-widest text-ink-subtle">
                      Authenticated Analysis
                    </span>
                  </div>
                )}

                <div className="whitespace-pre-wrap font-sans">
                  {msg.content}
                  {isStreaming && msg.id === messages[messages.length - 1]?.id && (
                    <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-teal align-middle" />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {error && (
          <div className="rounded-md border border-rose/30 bg-rose-tint p-3 text-xs font-medium text-rose">
            ⚠ {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="border-t border-line bg-paper/30 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-3"
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
                  : "Inquire about ledger balances, category trends, or savings strategy… (Press Enter to send)"
              }
              className="w-full resize-none rounded-md border border-line bg-paper px-3.5 py-2.5 text-xs text-ink placeholder:text-ink-subtle transition focus:border-teal focus:bg-paper-sheet focus:outline-none focus:ring-1 focus:ring-teal/30 disabled:opacity-60"
            />
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="rounded-md bg-teal px-5 py-2.5 text-xs font-medium text-paper-sheet shadow-subtle transition-all hover:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal shrink-0"
          >
            {isStreaming ? "Streaming…" : "Transmit Query"}
          </button>
        </form>
      </div>
    </div>
  );
}
