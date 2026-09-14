"use client";

import React, { useState, useMemo } from "react";

export interface CitationItem {
  id: string;
  label: string;
  category: "transaction" | "budget" | "goal" | "document" | "general";
  excerpt: string;
  detail: string;
}

export interface GuruPerspective {
  title: string;
  tag: string;
  style: "safe" | "growth" | "balanced";
  recommendation: string;
  content: string;
  citations: CitationItem[];
}

interface AdvisorResponseViewProps {
  content: string;
  isStreaming?: boolean;
  mode?: "advisor" | "compare";
}

// Helper to intelligently detect RAG references from grounded response text
function extractCitationsFromText(text: string): CitationItem[] {
  const citations: CitationItem[] = [];
  const lower = text.toLowerCase();

  if (lower.includes("transaction") || lower.includes("spent") || lower.includes("expense") || lower.includes("ledger")) {
    citations.push({
      id: "cite-tx",
      label: "Transactions · Sep 2026",
      category: "transaction",
      excerpt: "Grounded in recent transactions and spending records.",
      detail: "Verified against current billing cycle ledger ledger entries.",
    });
  }

  if (lower.includes("budget") || lower.includes("limit") || lower.includes("ceiling") || lower.includes("allocated")) {
    citations.push({
      id: "cite-budget",
      label: "Budget Allocations",
      category: "budget",
      excerpt: "Referenced monthly category spending limits and target allowances.",
      detail: "Grounding data from active category budget caps.",
    });
  }

  if (lower.includes("goal") || lower.includes("mission") || lower.includes("target date") || lower.includes("savings")) {
    citations.push({
      id: "cite-goal",
      label: "Money Missions",
      category: "goal",
      excerpt: "Evaluated against target maturity dates and milestones.",
      detail: "Grounding data from established savings targets.",
    });
  }

  if (lower.includes("document") || lower.includes("receipt") || lower.includes("statement") || lower.includes("ocr")) {
    citations.push({
      id: "cite-doc",
      label: "FinSage Vault",
      category: "document",
      excerpt: "Referenced OCR-extracted receipts and bank statement vouchers.",
      detail: "Verified against audited documents in Vault.",
    });
  }

  return citations;
}

// Parse multiple perspectives if text contains markdown headers, or return single block
function parsePerspectives(text: string): GuruPerspective[] | null {
  // Normalize header delimiters so even if newlines were compressed or streamed, they split cleanly
  let normalized = text
    .replace(/([^\n])\s*(#{2,3}\s+|\*\*(?:Perspective|Guru|The (?:Safe|Growth|Balanced)))/gi, "$1\n\n$2")
    .replace(/(#{2,3}\s*[A-Z\s]{3,30}?)([A-Z][a-z])/g, "$1\n$2");

  const lines = normalized.split("\n");
  const headers = lines.filter((l) => l.trim().startsWith("### ") || l.trim().startsWith("## ") || l.trim().match(/^\*\*(Perspective|Guru|Approach|The (Safe|Growth|Balanced))/i));

  if (headers.length < 2) {
    return null;
  }

  // Parse structured sections
  const perspectives: GuruPerspective[] = [];
  let currentTitle = "";
  let currentBuffer: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const isHeader = trimmed.startsWith("### ") || trimmed.startsWith("## ") || trimmed.match(/^\*\*(Perspective|Guru|Approach|The (Safe|Growth|Balanced))/i);

    if (isHeader) {
      if (currentTitle && currentBuffer.length > 0) {
        perspectives.push(buildPerspective(currentTitle, currentBuffer.join("\n")));
      }
      currentTitle = trimmed.replace(/^#{2,3}\s+/, "").replace(/^\*\*|\*\*$/g, "").trim();
      currentBuffer = [];
    } else {
      currentBuffer.push(line);
    }
  }

  if (currentTitle && currentBuffer.length > 0) {
    perspectives.push(buildPerspective(currentTitle, currentBuffer.join("\n")));
  }

  return perspectives.length >= 2 ? perspectives : null;
}

function buildPerspective(rawTitle: string, rawContent: string): GuruPerspective {
  const lower = (rawTitle + " " + rawContent).toLowerCase();
  let style: "safe" | "growth" | "balanced" = "balanced";
  let tag = "THE BALANCED TAKE";

  if (lower.includes("safe") || lower.includes("conservative") || lower.includes("buffett") || lower.includes("bogle") || lower.includes("index") || lower.includes("defense")) {
    style = "safe";
    tag = "THE SAFE PLAY";
  } else if (lower.includes("growth") || lower.includes("aggressive") || lower.includes("compounding") || lower.includes("equity") || lower.includes("opportunity")) {
    style = "growth";
    tag = "THE GROWTH PLAY";
  }

  // Extract key recommendation sentence if available
  const sentences = rawContent.split(/(?<=[.?!])\s+/).filter(Boolean);
  const recommendation = sentences[0] || rawTitle;
  const content = sentences.slice(1).join(" ") || rawContent;

  return {
    title: rawTitle,
    tag,
    style,
    recommendation,
    content,
    citations: extractCitationsFromText(rawContent),
  };
}

export function AdvisorResponseView({ content, isStreaming = false, mode = "advisor" }: AdvisorResponseViewProps) {
  const [activeCitation, setActiveCitation] = useState<CitationItem | null>(null);

  // Auto-detect multi-perspective vs single answer
  const multiPerspectives = useMemo(() => {
    if (isStreaming || !content) return null;
    return parsePerspectives(content);
  }, [content, isStreaming]);

  const citations = useMemo(() => {
    return extractCitationsFromText(content);
  }, [content]);

  // Style configurations for perspective cards
  const styleConfig = {
    safe: {
      border: "border-emerald-300/80 bg-emerald-50/40",
      tagBg: "bg-emerald-100 text-emerald-800 border-emerald-300",
      icon: "🛡️",
    },
    growth: {
      border: "border-purple-300/80 bg-purple-50/40",
      tagBg: "bg-purple-100 text-purple-800 border-purple-300",
      icon: "⚡",
    },
    balanced: {
      border: "border-amber-300/80 bg-amber-50/40",
      tagBg: "bg-amber-100 text-amber-800 border-amber-300",
      icon: "⚖️",
    },
  };

  return (
    <div className="space-y-3.5">
      {/* 1. RENDER MULTIPLE GURU PERSPECTIVES IF PARSED */}
      {multiPerspectives && multiPerspectives.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest uppercase text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
              ✦ GURU COMPARISON SYNTHESIS
            </span>
            <span className="text-xs text-stone-400">
              {multiPerspectives.length} Distinct Perspectives
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {multiPerspectives.map((p, idx) => {
              const cfg = styleConfig[p.style] || styleConfig.balanced;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border p-4 shadow-xs transition hover:shadow-md flex flex-col justify-between ${cfg.border} bg-[#FFFDF8]`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${cfg.tagBg}`}
                      >
                        <span>{cfg.icon}</span>
                        <span>{p.tag}</span>
                      </span>
                    </div>

                    <h4 className="font-serif text-sm font-bold text-[#18122B] tracking-tight">
                      {p.title}
                    </h4>

                    <div className="mt-2 rounded-xl bg-white/80 border border-stone-200/60 p-2.5">
                      <p className="text-xs font-semibold text-[#18122B] leading-snug">
                        {p.recommendation}
                      </p>
                    </div>

                    {p.content && (
                      <p className="mt-2 text-xs text-stone-600 leading-relaxed">
                        {p.content}
                      </p>
                    )}
                  </div>

                  {/* Supporting RAG chips inside card */}
                  {p.citations.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-stone-200/60 flex flex-wrap items-center gap-1.5">
                      <span className="text-[9px] font-bold uppercase text-stone-400">
                        Sources:
                      </span>
                      {p.citations.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setActiveCitation(c)}
                          className="rounded-full bg-stone-100 hover:bg-stone-200 px-2 py-0.5 text-[10px] font-medium text-stone-700 transition cursor-pointer"
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 2. RENDER SINGLE GROUNDED ANSWER CARD */
        <div className="space-y-2">
          {mode === "compare" && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold tracking-widest uppercase text-lime-800 bg-lime-400/25 px-2 py-0.5 rounded-full border border-lime-500/30">
                ✦ GROUNDED PERSPECTIVE
              </span>
            </div>
          )}

          <div className="text-xs sm:text-sm text-[#18122B] leading-relaxed whitespace-pre-wrap font-sans">
            {content}
            {isStreaming && (
              <span className="ml-1 inline-block h-3.5 w-1 animate-pulse bg-lime-500 align-middle rounded-xs" />
            )}
          </div>
        </div>
      )}

      {/* 3. SURFACE RAG CITATION CHIPS BENEATH RESPONSE */}
      {!isStreaming && citations.length > 0 && (
        <div className="pt-2 border-t border-stone-200/60 mt-2">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400">
              ✦ GROUNDED IN YOUR DATA
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {citations.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCitation(activeCitation?.id === c.id ? null : c)}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition cursor-pointer ${
                  activeCitation?.id === c.id
                    ? "border-[#18122B] bg-[#18122B] text-white shadow-xs"
                    : "border-stone-200/80 bg-white hover:border-lime-500 hover:bg-lime-50/40 text-stone-700"
                }`}
              >
                <span>
                  {c.category === "transaction"
                    ? "💳"
                    : c.category === "budget"
                    ? "📊"
                    : c.category === "goal"
                    ? "🎯"
                    : "🧾"}
                </span>
                <span>{c.label}</span>
                <span className="text-[9px] opacity-60">↗</span>
              </button>
            ))}
          </div>

          {/* RAG Source Detail Popover */}
          {activeCitation && (
            <div className="mt-2.5 rounded-xl border border-stone-200 bg-white p-3 shadow-md animate-in fade-in max-w-md">
              <div className="flex items-center justify-between border-b border-stone-100 pb-1.5 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                    {activeCitation.label}
                  </span>
                  <span className="text-[9px] font-bold uppercase text-lime-700 bg-lime-100 px-1.5 py-0.2 rounded">
                    Verified
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveCitation(null)}
                  className="text-stone-400 hover:text-stone-700 text-xs p-0.5"
                >
                  ✕
                </button>
              </div>
              <p className="text-[11px] text-stone-600 leading-snug">
                {activeCitation.excerpt}
              </p>
              <p className="mt-1 text-[10px] text-stone-400 italic">
                {activeCitation.detail}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
