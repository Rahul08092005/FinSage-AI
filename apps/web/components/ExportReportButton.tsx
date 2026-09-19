"use client";

import { useState, useRef, useEffect } from "react";
import { exportReport } from "@/lib/api";
import { useToken } from "@/components/AuthGate";

interface ExportReportButtonProps {
  className?: string;
}

export function ExportReportButton({ className = "" }: ExportReportButtonProps) {
  const tokenFromHook = useToken();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  async function handleExport() {
    if (status === "loading") return;

    const token =
      tokenFromHook ||
      (typeof window !== "undefined" ? localStorage.getItem("finsage_token") : null);

    if (!token) {
      setErrorMessage("Please sign in to export your financial report.");
      setStatus("error");
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setStatus("idle");
        setErrorMessage(null);
      }, 4000);
      return;
    }

    setStatus("loading");
    setErrorMessage(null);

    try {
      // 1. Call exportReport(token)
      const { markdown, filename } = await exportReport(token);

      // 2. Create a browser Blob from the Markdown response
      const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8;" });

      // 3. Create temporary <a> element with object URL
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename || "FinSage-Financial-Report.md");
      document.body.appendChild(link);

      // 4. Trigger download
      link.click();

      // 5. Clean up temporary DOM element and revoke URL
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      // 6. Subtle success indication
      setStatus("success");
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setStatus("idle");
      }, 3500);
    } catch (err: any) {
      console.error("[ExportReport] Export failed:", err);
      setStatus("error");
      setErrorMessage("Couldn't export your report. Please try again in a moment.");
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setStatus("idle");
        setErrorMessage(null);
      }, 6000);
    }
  }

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={handleExport}
        disabled={status === "loading"}
        aria-label="Export Financial Report"
        className={`group inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-2xs transition-all duration-150 cursor-pointer select-none active:scale-95 disabled:cursor-not-allowed ${
          status === "loading"
            ? "border-lime-400/80 bg-lime-50/40 text-[#18122B] opacity-90"
            : status === "success"
            ? "border-lime-500 bg-lime-50 text-[#18122B]"
            : "border-[#E5DAC4] bg-[#FFFDF8] text-[#18122B] hover:border-[#18122B]/40 hover:bg-[#FAF7F2] hover:scale-102"
        }`}
      >
        {status === "loading" ? (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-lime-500 animate-pulse" />
            <span className="tracking-tight">Packaging your money story…</span>
          </>
        ) : status === "success" ? (
          <>
            <span className="text-lime-600 font-bold">✓</span>
            <span className="font-semibold text-[#18122B]">Report&apos;s ready</span>
          </>
        ) : (
          <>
            <span>Export Report</span>
            <span className="text-lime-600 font-bold transition-transform group-hover:translate-y-0.5">
              ↓
            </span>
          </>
        )}
      </button>

      {/* Compact FinSage Error Popover */}
      {status === "error" && errorMessage && (
        <div
          role="alert"
          className="absolute right-0 top-full mt-2 z-40 flex items-center gap-2 rounded-2xl border border-rose-200/90 bg-[#FFFDF8] px-3.5 py-2 text-xs text-[#18122B] shadow-md animate-in fade-in slide-in-from-top-1 duration-150 whitespace-nowrap"
        >
          <span className="text-rose-500 font-bold text-sm">⚠</span>
          <span className="font-medium text-stone-700 text-[11px]">{errorMessage}</span>
          <button
            type="button"
            onClick={handleExport}
            className="text-[11px] font-bold text-lime-700 underline underline-offset-2 hover:text-lime-800 ml-1 cursor-pointer"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={() => {
              setStatus("idle");
              setErrorMessage(null);
            }}
            aria-label="Dismiss error"
            className="text-stone-400 hover:text-stone-600 text-xs ml-1 cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
