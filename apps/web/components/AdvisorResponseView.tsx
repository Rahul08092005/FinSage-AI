"use client";

import React, { useMemo } from "react";
import { FormattedMessage } from "./FormattedMessage";

export interface StructuredGuruPerspective {
  label: string;
  summary: string;
  reasoning: string;
  title?: string;
  recommendation?: string;
  content?: string;
}

export interface GuruPerspectiveViewModel {
  title: string;
  tag: string;
  style: "safe" | "growth" | "balanced";
  summary?: string;
  reasoning?: string;
  recommendation?: string;
  content?: string;
}

// Backward-compatible alias
export type GuruPerspective = GuruPerspectiveViewModel;

interface AdvisorResponseViewProps {
  content: string;
  isStreaming?: boolean;
  mode?: "advisor" | "compare";
  guru_perspectives?: StructuredGuruPerspective[] | null;
  guruPerspectives?: StructuredGuruPerspective[] | null;
}

// ---------------------------------------------------------------------------
// 1. STRUCTURED GURU NORMALIZER (Preferred Phase 6 Contract)
// ---------------------------------------------------------------------------
function normalizeStructuredPerspectives(
  data: unknown
): GuruPerspectiveViewModel[] | null {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  const valid: GuruPerspectiveViewModel[] = [];

  for (const item of data) {
    if (!item || typeof item !== "object") continue;
    const p = item as Partial<StructuredGuruPerspective>;

    const title = String(p.label || p.title || "").trim();
    const summary = String(p.summary || p.recommendation || "").trim();
    const reasoning = String(p.reasoning || p.content || "").trim();

    // Must have at least a non-empty title/label and summary or reasoning to be usable
    if (!title || (!summary && !reasoning)) continue;

    // Determine visual accent style & badge based on persona characteristics
    const lower = `${title} ${summary} ${reasoning}`.toLowerCase();
    let style: "safe" | "growth" | "balanced" = "balanced";
    let tag = "BALANCED PHILOSOPHY";

    if (
      lower.includes("buffett") ||
      lower.includes("bogle") ||
      lower.includes("graham") ||
      lower.includes("safe") ||
      lower.includes("conservative") ||
      lower.includes("margin of safety") ||
      lower.includes("defense") ||
      lower.includes("indexing")
    ) {
      style = "safe";
      tag = "VALUE & SAFETY";
    } else if (
      lower.includes("lynch") ||
      lower.includes("growth") ||
      lower.includes("aggressive") ||
      lower.includes("compounding") ||
      lower.includes("equity") ||
      lower.includes("opportunity")
    ) {
      style = "growth";
      tag = "GROWTH & COMPOUNDING";
    } else if (
      lower.includes("dalio") ||
      lower.includes("munger") ||
      lower.includes("balanced") ||
      lower.includes("all-weather") ||
      lower.includes("macro")
    ) {
      style = "balanced";
      tag = "BALANCED & DIVERSIFIED";
    }

    valid.push({
      title,
      tag,
      style,
      summary: summary || undefined,
      reasoning: reasoning && reasoning !== summary ? reasoning : undefined,
      recommendation: p.recommendation && p.recommendation !== summary ? p.recommendation : undefined,
      content: p.content && p.content !== reasoning && p.content !== summary ? p.content : undefined,
    });
  }

  return valid.length >= 2 ? valid : null;
}

// Helper to extract structured perspectives if content itself is JSON
function tryExtractStructuredFromJson(raw: string): StructuredGuruPerspective[] | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.guru_perspectives)) {
      return parsed.guru_perspectives;
    }
  } catch {
    return null;
  }
  return null;
}

// ---------------------------------------------------------------------------
// 2. LEGACY REGEX PARSER (Backward Compatibility Fallback)
// ---------------------------------------------------------------------------
function parsePerspectives(text: string): GuruPerspectiveViewModel[] | null {
  // Normalize header delimiters so even if newlines were compressed or streamed, they split cleanly
  let normalized = text
    .replace(/([^\n])\s*(#{2,3}\s+|\*\*(?:Perspective|Guru|The (?:Safe|Growth|Balanced)))/gi, "$1\n\n$2")
    .replace(/(#{2,3}\s*[A-Z\s]{3,30}?)([A-Z][a-z])/g, "$1\n$2");

  const lines = normalized.split("\n");
  const headers = lines.filter(
    (l) =>
      l.trim().startsWith("### ") ||
      l.trim().startsWith("## ") ||
      l.trim().match(/^\*\*(Perspective|Guru|Approach|The (Safe|Growth|Balanced))/i)
  );

  if (headers.length < 2) {
    return null;
  }

  // Parse structured sections
  const perspectives: GuruPerspectiveViewModel[] = [];
  let currentTitle = "";
  let currentBuffer: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const isHeader =
      trimmed.startsWith("### ") ||
      trimmed.startsWith("## ") ||
      trimmed.match(/^\*\*(Perspective|Guru|Approach|The (Safe|Growth|Balanced))/i);

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

function buildPerspective(rawTitle: string, rawContent: string): GuruPerspectiveViewModel {
  const lower = (rawTitle + " " + rawContent).toLowerCase();
  let style: "safe" | "growth" | "balanced" = "balanced";
  let tag = "THE BALANCED TAKE";

  if (
    lower.includes("safe") ||
    lower.includes("conservative") ||
    lower.includes("buffett") ||
    lower.includes("bogle") ||
    lower.includes("index") ||
    lower.includes("defense")
  ) {
    style = "safe";
    tag = "THE SAFE PLAY";
  } else if (
    lower.includes("growth") ||
    lower.includes("aggressive") ||
    lower.includes("compounding") ||
    lower.includes("equity") ||
    lower.includes("opportunity")
  ) {
    style = "growth";
    tag = "THE GROWTH PLAY";
  }

  // Keep raw markdown content intact for FormattedMessage to render lists, tables and bolding
  const trimmed = rawContent.trim();

  return {
    title: rawTitle,
    tag,
    style,
    content: trimmed,
  };
}

export function AdvisorResponseView({
  content,
  isStreaming = false,
  mode = "advisor",
  guru_perspectives,
  guruPerspectives,
}: AdvisorResponseViewProps) {
  // 1. Check structured data first (priority 1)
  const structuredData = useMemo(() => {
    if (isStreaming) return null;

    // Check props first
    const fromProps = guru_perspectives || guruPerspectives;
    if (fromProps) {
      const normalized = normalizeStructuredPerspectives(fromProps);
      if (normalized) return normalized;
    }

    // Check if content itself is JSON with guru_perspectives
    const fromJson = tryExtractStructuredFromJson(content);
    if (fromJson) {
      const normalized = normalizeStructuredPerspectives(fromJson);
      if (normalized) return normalized;
    }

    return null;
  }, [guru_perspectives, guruPerspectives, content, isStreaming]);

  // 2. Fall back to legacy regex parser ONLY when structured data is absent (do not double-parse)
  const legacyPerspectives = useMemo(() => {
    if (isStreaming || !content || structuredData) return null;
    return parsePerspectives(content);
  }, [content, isStreaming, structuredData]);

  const activePerspectives = structuredData || legacyPerspectives;

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
      {/* 1. RENDER MULTIPLE GURU PERSPECTIVES (STRUCTURED PREFERRED, REGEX FALLBACK) */}
      {activePerspectives && activePerspectives.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-widest uppercase text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                ✦ GURU COMPARISON SYNTHESIS
              </span>
              <span className="text-xs text-stone-400">
                {activePerspectives.length} Distinct Perspectives
              </span>
            </div>
            {structuredData && (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Structured Philosophy
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {activePerspectives.map((p, idx) => {
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

                    {/* Summary / Recommendation */}
                    {p.summary ? (
                      <div className="mt-2 rounded-xl bg-white/80 border border-stone-200/60 p-2.5">
                        <p className="text-xs font-semibold text-[#18122B] leading-snug">
                          {p.summary}
                        </p>
                      </div>
                    ) : p.recommendation ? (
                      <div className="mt-2 rounded-xl bg-white/80 border border-stone-200/60 p-2.5">
                        <p className="text-xs font-semibold text-[#18122B] leading-snug">
                          {p.recommendation}
                        </p>
                      </div>
                    ) : null}

                    {/* Reasoning or Structured Content */}
                    {p.reasoning && (
                      <div className="mt-2.5 text-xs text-stone-700 leading-relaxed">
                        <p className="font-medium">{p.reasoning}</p>
                      </div>
                    )}

                    {p.content && !p.reasoning && (
                      <div className="mt-2.5 text-xs text-stone-700 leading-relaxed">
                        <FormattedMessage content={p.content} />
                      </div>
                    )}
                  </div>
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

          <div className="text-xs sm:text-sm text-[#18122B] leading-relaxed font-sans">
            <FormattedMessage content={content} />
            {isStreaming && (
              <span className="ml-1 inline-block h-3.5 w-1 animate-pulse bg-lime-500 align-middle rounded-xs" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

