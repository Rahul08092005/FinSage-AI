"use client";

import React, { useState, useMemo } from "react";

export interface CitationRaw {
  title?: string;
  source?: string;
  document?: string;
  name?: string;
  sourceTitle?: string;
  domain?: string;
  content?: string;
  text?: string;
  chunk?: string;
  snippet?: string;
  body?: string;
  excerpt?: string;
  date?: string;
  category?: string;
  page?: string | number;
  metadata?: {
    date?: string;
    category?: string;
    page?: string | number;
    source?: string;
    title?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface NormalizedCitation {
  id: string;
  sourceType: string;
  title: string;
  snippet: string;
  fullText: string;
  date?: string;
  category?: string;
  page?: string | number;
  icon: string;
  hasMore: boolean;
}

// Intelligent normalizer that handles both raw string chunks and structured chunk objects
export function normalizeCitation(raw: any, index: number): NormalizedCitation | null {
  if (!raw) return null;

  let fullText = "";
  let explicitTitle = "";
  let explicitSourceType = "";
  let date: string | undefined = undefined;
  let category: string | undefined = undefined;
  let page: string | number | undefined = undefined;

  if (typeof raw === "string") {
    fullText = raw.trim();
  } else if (typeof raw === "object") {
    fullText = String(raw.content || raw.text || raw.chunk || raw.snippet || raw.body || raw.excerpt || "").trim();
    explicitTitle = String(raw.title || raw.document || raw.name || raw.sourceTitle || raw.heading || raw.metadata?.title || "").trim();
    explicitSourceType = String(raw.sourceType || raw.source || raw.domain || raw.type || raw.metadata?.source || "").trim();

    if (raw.date || raw.metadata?.date || raw.uploadedAt || raw.timestamp) {
      date = String(raw.date || raw.metadata?.date || raw.uploadedAt || raw.timestamp).trim();
    }
    if (raw.category || raw.metadata?.category) {
      category = String(raw.category || raw.metadata?.category).trim();
    }
    if (raw.page != null || raw.metadata?.page != null || raw.pageNumber != null) {
      page = raw.page ?? raw.metadata?.page ?? raw.pageNumber;
    }
  }

  // Filter out completely empty chunks
  if (!fullText && !explicitTitle) {
    return null;
  }

  // Determine source type and icon from text semantics or explicit metadata
  const lower = (explicitSourceType + " " + explicitTitle + " " + fullText).toLowerCase();

  let icon = "✦";
  let sourceType = "KNOWLEDGE";

  if (lower.includes("receipt") || lower.includes("bistro") || lower.includes("cafe") || lower.includes("restaurant") || lower.includes("starbucks") || lower.includes("invoice") || lower.includes("bill")) {
    icon = "🧾";
    sourceType = "RECEIPT";
  } else if (lower.includes("statement") || lower.includes("salary") || lower.includes("hdfc") || lower.includes("icici") || lower.includes("bank") || lower.includes("account")) {
    icon = "🏦";
    sourceType = "BANK STATEMENT";
  } else if (lower.includes("50/30/20") || lower.includes("budget") || lower.includes("allowance") || lower.includes("spending limit")) {
    icon = "📊";
    sourceType = "BUDGET RULE";
  } else if (lower.includes("ppf") || lower.includes("elss") || lower.includes("80c") || lower.includes("tax") || lower.includes("itr") || lower.includes("deduction")) {
    icon = "📑";
    sourceType = "TAX & REGULATION";
  } else if (lower.includes("buffett") || lower.includes("munger") || lower.includes("bogle") || lower.includes("graham") || lower.includes("guru") || lower.includes("value investing")) {
    icon = "💡";
    sourceType = "GURU PHILOSOPHY";
  } else if (lower.includes("emergency fund") || lower.includes("runway") || lower.includes("liquid fund")) {
    icon = "🛡️";
    sourceType = "SAFETY RUNWAY";
  } else if (lower.includes("transaction") || lower.includes("ledger") || lower.includes("spend")) {
    icon = "💳";
    sourceType = "LEDGER RECORD";
  }

  // Determine Title: prioritize explicit title, then first clean sentence/clause
  let title = explicitTitle;
  if (!title) {
    const firstSentence = fullText.split(/[.?!]\s+/)[0] || "";
    if (firstSentence.length > 0 && firstSentence.length <= 50) {
      title = firstSentence.replace(/^["'#\s]+|["'\s]+$/g, "");
    } else if (firstSentence.length > 50) {
      const words = firstSentence.split(" ").slice(0, 6).join(" ");
      title = words.replace(/^["'#\s]+|["'\s]+$/g, "");
    } else {
      title = `${sourceType} Chunk #${index + 1}`;
    }
  }

  // Derive date if not present and matches common date patterns
  if (!date) {
    const dateMatch = fullText.match(/\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\b/i)
      || fullText.match(/\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})\b/i)
      || fullText.match(/\b(\d{4}-\d{2}-\d{2})\b/);
    if (dateMatch) {
      date = dateMatch[0];
    }
  }

  // Derive category if not present
  if (!category) {
    if (lower.includes("food") || lower.includes("dining") || lower.includes("grocery")) category = "Food & Dining";
    else if (lower.includes("utilities") || lower.includes("rent") || lower.includes("electricity")) category = "Bills & Utilities";
    else if (lower.includes("shopping")) category = "Shopping";
    else if (lower.includes("tax")) category = "Tax Strategy";
    else if (lower.includes("investment") || lower.includes("equity")) category = "Investments";
  }

  // Snippet truncation
  const MAX_SNIPPET_LEN = 175;
  const hasMore = fullText.length > MAX_SNIPPET_LEN;
  const snippet = hasMore ? fullText.slice(0, MAX_SNIPPET_LEN).trim() + "…" : fullText;

  return {
    id: `cite-${index}-${title.slice(0, 15).replace(/\s+/g, "_")}`,
    sourceType,
    title,
    snippet,
    fullText,
    date,
    category,
    page,
    icon,
    hasMore,
  };
}

interface CitationSourceControlProps {
  citations?: any[];
}

export function CitationSourceControl({ citations }: CitationSourceControlProps) {
  const [expanded, setExpanded] = useState(false);
  const [showAllSources, setShowAllSources] = useState(false);
  const [expandedSnippets, setExpandedSnippets] = useState<Record<number, boolean>>({});

  const normalizedList = useMemo(() => {
    if (!Array.isArray(citations) || citations.length === 0) return [];
    return citations
      .map((c, idx) => normalizeCitation(c, idx))
      .filter((c): c is NormalizedCitation => c !== null);
  }, [citations]);

  // Acceptance Criteria: 0 citations -> do NOT render a Sources section
  if (normalizedList.length === 0) {
    return null;
  }

  const count = normalizedList.length;
  const hasMany = count > 3;
  const visibleCitations = hasMany && !showAllSources ? normalizedList.slice(0, 3) : normalizedList;

  function toggleSnippet(idx: number) {
    setExpandedSnippets((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  }

  return (
    <div className="mt-2.5 text-left">
      {/* 1. COMPACT COLLAPSED SOURCE CONTROL BUTTON */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-label={`${expanded ? "Collapse" : "Expand"} ${count} sources`}
        className="inline-flex items-center gap-1.5 rounded-full border border-stone-200/90 bg-[#FFFDF8] hover:bg-stone-100 hover:border-stone-300 px-3 py-1 text-[11px] font-semibold text-[#18122B] shadow-2xs transition-all duration-150 cursor-pointer focus:outline-none focus:ring-1 focus:ring-lime-500/50"
      >
        <span className="text-lime-600 font-bold text-xs">✦</span>
        <span>Sources ({count})</span>
        <span className="font-mono text-stone-400 font-bold text-xs ml-0.5">
          {expanded ? "−" : "+"}
        </span>
      </button>

      {/* 2. EXPANDED CITATIONS PANEL */}
      {expanded && (
        <div className="mt-2 space-y-2 rounded-2xl border border-stone-200/80 bg-[#FFFDF8] p-3 shadow-xs animate-in fade-in zoom-in-98 duration-150">
          {/* Micro-label Header */}
          <div className="flex items-center justify-between border-b border-stone-100 pb-1.5 mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-500" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">
                ✦ GROUNDED IN YOUR DATA
              </span>
            </div>
            <span className="text-[10px] font-semibold text-stone-400">
              {count} {count === 1 ? "source" : "sources"}
            </span>
          </div>

          {/* Citation Cards List */}
          <div className="space-y-2">
            {visibleCitations.map((c, idx) => {
              const isExpandedText = expandedSnippets[idx];
              return (
                <div
                  key={c.id}
                  className="rounded-xl border border-stone-200/70 bg-[#FAF7F2] p-2.5 transition duration-150 hover:border-stone-300 hover:shadow-2xs text-left"
                >
                  {/* Top: Source Type & Title */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-xs shrink-0">{c.icon}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 truncate">
                        {c.sourceType} · {c.title}
                      </span>
                    </div>
                  </div>

                  {/* Body: Retrieved chunk text */}
                  <p className="font-sans text-[11px] leading-relaxed text-[#18122B] italic">
                    "{isExpandedText ? c.fullText : c.snippet}"
                  </p>

                  {/* Show more / Show less progressive disclosure */}
                  {c.hasMore && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSnippet(idx);
                      }}
                      className="text-[10px] font-semibold text-lime-700 hover:text-lime-800 underline underline-offset-2 mt-1 cursor-pointer inline-block"
                    >
                      {isExpandedText ? "Show less" : "Show more"}
                    </button>
                  )}

                  {/* Bottom: Date / Category / Page Metadata when actually available */}
                  {(c.date || c.category || c.page != null) && (
                    <div className="mt-2 pt-1.5 border-t border-stone-200/60 flex items-center justify-between text-[10px] font-medium text-stone-400">
                      <div className="flex items-center gap-2 flex-wrap">
                        {c.date && <span>{c.date}</span>}
                        {c.category && (
                          <>
                            <span>·</span>
                            <span className="uppercase text-stone-500 font-semibold">{c.category}</span>
                          </>
                        )}
                        {c.page != null && (
                          <>
                            <span>·</span>
                            <span>Page {c.page}</span>
                          </>
                        )}
                      </div>
                      <span className="text-stone-400 font-mono text-[11px]">↗</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Show all N sources toggle if many sources */}
          {hasMany && (
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAllSources(!showAllSources);
                }}
                className="text-[11px] font-semibold text-stone-600 hover:text-[#18122B] transition cursor-pointer"
              >
                {showAllSources ? "Show fewer sources" : `Show all ${count} sources`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
