"use client";

import React, { useMemo } from "react";

interface FormattedMessageProps {
  content: string;
  className?: string;
}

/**
 * Parses inline formatting like **bold**, *italic*, and `code`
 */
function renderInline(text: string): React.ReactNode[] {
  // Regex splitting by bold (**...**), italic (*...*), or code (`...`)
  const parts = text.split(/(\*\*[^*]+?\*\*|\*[^*]+?\*|`[^`]+?`)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return (
        <strong key={index} className="font-bold text-[#18122B]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      return (
        <em key={index} className="italic text-[#18122B]/90">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code
          key={index}
          className="rounded border border-[#E5DAC4]/60 bg-[#FAF6EC] px-1 py-0.5 font-mono text-[11px] font-semibold text-[#18122B]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

/**
 * Checks if a line is a markdown table row (starts and ends with '|')
 */
function isTableRow(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith("|") && trimmed.endsWith("|") && trimmed.includes("|");
}

/**
 * Checks if a line is a markdown table separator (e.g. |---|---|)
 */
function isTableSeparator(line: string): boolean {
  const trimmed = line.trim();
  if (!isTableRow(trimmed)) return false;
  const inner = trimmed.slice(1, -1).replace(/[\s|:-]/g, "");
  return inner.length === 0;
}

/**
 * Splits a table row into cell strings
 */
function parseRowCells(row: string): string[] {
  const trimmed = row.trim();
  const inner = trimmed.startsWith("|") && trimmed.endsWith("|") ? trimmed.slice(1, -1) : trimmed;
  return inner.split("|").map((cell) => cell.trim());
}

export function FormattedMessage({ content, className = "" }: FormattedMessageProps) {
  const blocks = useMemo(() => {
    if (!content) return [];

    // Pre-normalize text to break run-on numbered items and sub-bullets onto fresh lines
    const normalized = content
      .replace(/([.!?])\s+(\d+\.\s+)/g, (m, p1, p2) => p1 + "\n\n" + p2)
      .replace(/([.!?])\s+-\s+/g, (m, p1) => p1 + "\n- ");

    const lines = normalized.split("\n");
    const parsedBlocks: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // 1. Skip completely empty lines
      if (!trimmed) {
        i++;
        continue;
      }

      // 2. Table Block Detection
      if (isTableRow(trimmed) && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
        const headerRow = parseRowCells(trimmed);
        i += 2; // skip header and separator
        const bodyRows: string[][] = [];

        while (i < lines.length && isTableRow(lines[i])) {
          if (!isTableSeparator(lines[i])) {
            bodyRows.push(parseRowCells(lines[i]));
          }
          i++;
        }

        parsedBlocks.push(
          <div
            key={`table-${i}`}
            className="my-2.5 overflow-hidden rounded-xl border border-[#E5DAC4] bg-white shadow-xs"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E5DAC4] bg-[#FAF6EC]/90 text-[11px] font-bold uppercase tracking-wider text-[#18122B]">
                    {headerRow.map((h, colIdx) => (
                      <th
                        key={colIdx}
                        className={`px-3 py-2 font-black ${
                          colIdx === headerRow.length - 1 ? "text-right" : "text-left"
                        }`}
                      >
                        {renderInline(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5DAC4]/40">
                  {bodyRows.map((row, rowIdx) => {
                    const isTotalRow = row.some((c) =>
                      c.toLowerCase().includes("total")
                    );

                    return (
                      <tr
                        key={rowIdx}
                        className={`transition-colors ${
                          isTotalRow
                            ? "bg-[#FAF6EC]/60 font-bold"
                            : rowIdx % 2 === 0
                            ? "bg-white hover:bg-[#FAF6EC]/30"
                            : "bg-[#FFFDF8] hover:bg-[#FAF6EC]/30"
                        }`}
                      >
                        {row.map((cell, cellIdx) => (
                          <td
                            key={cellIdx}
                            className={`px-3 py-1.5 text-xs text-[#18122B] tabular-nums ${
                              cellIdx === row.length - 1 ? "text-right" : "text-left"
                            }`}
                          >
                            {renderInline(cell)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
        continue;
      }

      // 3. Headings
      if (trimmed.startsWith("### ")) {
        parsedBlocks.push(
          <h4
            key={`h3-${i}`}
            className="mt-3 mb-1 font-serif text-sm font-black text-[#18122B] tracking-tight"
          >
            {renderInline(trimmed.slice(4))}
          </h4>
        );
        i++;
        continue;
      }
      if (trimmed.startsWith("## ")) {
        parsedBlocks.push(
          <h3
            key={`h2-${i}`}
            className="mt-3.5 mb-1.5 font-serif text-base font-black text-[#18122B] tracking-tight"
          >
            {renderInline(trimmed.slice(3))}
          </h3>
        );
        i++;
        continue;
      }
      if (trimmed.startsWith("# ")) {
        parsedBlocks.push(
          <h2
            key={`h1-${i}`}
            className="mt-4 mb-2 font-serif text-lg font-black text-[#18122B] tracking-tight"
          >
            {renderInline(trimmed.slice(2))}
          </h2>
        );
        i++;
        continue;
      }

      // 4. Bullet list items
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const listItems: string[] = [];
        while (
          i < lines.length &&
          (lines[i].trim().startsWith("- ") || lines[i].trim().startsWith("* "))
        ) {
          listItems.push(lines[i].trim().slice(2));
          i++;
        }

        parsedBlocks.push(
          <ul key={`ul-${i}`} className="my-1.5 space-y-1 pl-1 text-xs">
            {listItems.map((item, itemIdx) => (
              <li key={itemIdx} className="flex items-start gap-1.5">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#84cc16]" />
                <span className="text-[#18122B]/90 leading-relaxed">
                  {renderInline(item)}
                </span>
              </li>
            ))}
          </ul>
        );
        continue;
      }

      // 5. Numbered list items
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (numMatch) {
        const listItems: { num: string; text: string }[] = [];
        while (i < lines.length) {
          const match = lines[i].trim().match(/^(\d+)\.\s+(.*)$/);
          if (!match) break;
          listItems.push({ num: match[1], text: match[2] });
          i++;
        }

        parsedBlocks.push(
          <ol key={`ol-${i}`} className="my-1.5 space-y-1 pl-1 text-xs">
            {listItems.map((item, itemIdx) => (
              <li key={itemIdx} className="flex items-start gap-1.5">
                <span className="shrink-0 font-mono text-[10px] font-black text-[#84cc16]">
                  {item.num}.
                </span>
                <span className="text-[#18122B]/90 leading-relaxed">
                  {renderInline(item.text)}
                </span>
              </li>
            ))}
          </ol>
        );
        continue;
      }

      // 6. Regular paragraph
      parsedBlocks.push(
        <p key={`p-${i}`} className="my-1 text-xs text-[#18122B] leading-relaxed">
          {renderInline(trimmed)}
        </p>
      );
      i++;
    }

    return parsedBlocks;
  }, [content]);

  return <div className={`space-y-1 ${className}`}>{blocks}</div>;
}
