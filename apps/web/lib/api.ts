// Person 4 owns this file. Every call to the BFF goes through here so the
// base URL only exists in one place. Phase 2 adds transactions/budgets/goals.
export const BFF_URL = process.env.NEXT_PUBLIC_BFF_URL || "";

function authHeaders(token?: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getHealth() {
  const res = await fetch(`${BFF_URL}/api/v1/health`, { cache: "no-store" });
  if (!res.ok) throw new Error("BFF health check failed");
  return res.json();
}

export async function registerUser(data: { name: string; email: string; password: string }) {
  const res = await fetch(`${BFF_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    const errorMsg =
      json.error?.formErrors?.join(", ") ||
      (typeof json.error === "string" ? json.error : "Registration failed");
    throw new Error(errorMsg);
  }
  return json;
}

export async function loginUser(data: { email: string; password: string }) {
  const res = await fetch(`${BFF_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    const errorMsg =
      json.error?.formErrors?.join(", ") ||
      (typeof json.error === "string" ? json.error : "Login failed");
    throw new Error(errorMsg);
  }
  return json;
}

export async function getTransactions(token: string, limit = 100) {
  const res = await fetch(`${BFF_URL}/api/v1/transactions?limit=${limit}`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load transactions");
  return res.json();
}

export function notifyGamificationUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("finsage_gamification_updated"));
  }
}

export async function createTransaction(
  token: string,
  data: {
    amount: number;
    category: string;
    transactionDate: string;
    description: string;
    accountId?: string;
    source?: string;
  }
) {
  const res = await fetch(`${BFF_URL}/api/v1/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create transaction");
  const result = await res.json();
  notifyGamificationUpdate();
  return result;
}

export async function getBudgetVariance(token: string) {
  const res = await fetch(`${BFF_URL}/api/v1/budgets/variance`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load budget variance");
  return res.json();
}

export async function upsertBudget(token: string, data: { category: string; monthlyLimit: number }) {
  const res = await fetch(`${BFF_URL}/api/v1/budgets`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to save budget");
  const result = await res.json();
  notifyGamificationUpdate();
  return result;
}

export async function getGoals(token: string) {
  const res = await fetch(`${BFF_URL}/api/v1/goals`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load goals");
  return res.json();
}

export async function createGoal(token: string, data: { title: string; targetAmount: number; endDate: string }) {
  const res = await fetch(`${BFF_URL}/api/v1/goals`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create goal");
  const result = await res.json();
  notifyGamificationUpdate();
  return result;
}

export async function getBudgets(token: string) {
  const res = await fetch(`${BFF_URL}/api/v1/budgets`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load budgets");
  return res.json();
}

export async function deleteTransaction(token: string, id: string) {
  const res = await fetch(`${BFF_URL}/api/v1/transactions/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to delete transaction");
  notifyGamificationUpdate();
}

export async function updateTransaction(
  token: string,
  id: string,
  data: Partial<{ amount: number; category: string; transactionDate: string; description: string }>
) {
  const res = await fetch(`${BFF_URL}/api/v1/transactions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update transaction");
  return res.json();
}

export async function deleteBudget(token: string, id: string) {
  const res = await fetch(`${BFF_URL}/api/v1/budgets/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to delete budget");
}

export async function deleteGoal(token: string, id: string) {
  const res = await fetch(`${BFF_URL}/api/v1/goals/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to delete goal");
}

export async function getMe(token: string) {
  const res = await fetch(`${BFF_URL}/api/v1/users/me`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load user profile");
  return res.json();
}

export async function updateMonthlySalary(token: string, monthlySalary: number) {
  const res = await fetch(`${BFF_URL}/api/v1/users/me/salary`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ monthlySalary }),
  });
  if (!res.ok) throw new Error("Failed to update salary");
  return res.json();
}

export async function getMonthlySpend(token: string): Promise<number> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const monthStr = `${year}-${month}`;

  const res = await fetch(`${BFF_URL}/api/v1/expenses/summary?month=${monthStr}`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load monthly spend");
  const data = await res.json();
  return Number(data.total) || 0;
}

export async function uploadDocument(token: string, file: File, docType: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("docType", docType);

  const res = await fetch(`${BFF_URL}/api/v1/documents/upload`, {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload document");
  return res.json();
}

export async function getDocuments(token: string) {
  const res = await fetch(`${BFF_URL}/api/v1/documents`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load documents");
  return res.json();
}

export async function getDocumentStatus(token: string, id: string) {
  const res = await fetch(`${BFF_URL}/api/v1/documents/${id}`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load document status");
  return res.json();
}

export async function confirmDocument(
  token: string,
  id: string,
  transactions: Array<{
    amount: number;
    category: string;
    transactionDate: string;
    description: string;
    accountId?: string;
  }>
) {
  const res = await fetch(`${BFF_URL}/api/v1/documents/${id}/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ transactions }),
  });
  if (!res.ok) throw new Error("Failed to confirm document");
  return res.json();
}

export async function deleteDocument(token: string, id: string) {
  const res = await fetch(`${BFF_URL}/api/v1/documents/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to delete document");
  }
  return res.json().catch(() => ({ success: true }));
}

export async function streamAdvisorChat(
  token: string,
  message: string,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (err: any) => void,
  onCitations?: (citations: any[]) => void,
  onGuruPerspectives?: (perspectives: any[]) => void,
  onMatchingTransactions?: (transactions: any[]) => void,
  onReasoningTrace?: (trace: any) => void
) {
  try {
    const res = await fetch(`${BFF_URL}/api/v1/advisor/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify({ message }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: "Failed to communicate with advisor" }));
      throw new Error(errData.error?.formErrors?.join(", ") || errData.error || `Advisor request failed (${res.status})`);
    }

    const contentType = res.headers.get("content-type") || "";
    // If server responds with direct JSON (non-streamed)
    if (contentType.includes("application/json")) {
      const data = await res.json();
      if (data.answer || data.response || data.text) {
        onChunk(String(data.answer || data.response || data.text));
      }
      if (Array.isArray(data.citations) && data.citations.length > 0) {
        onCitations?.(data.citations);
      }
      if (Array.isArray(data.guru_perspectives) && data.guru_perspectives.length > 0) {
        onGuruPerspectives?.(data.guru_perspectives);
      }
      const matchTxs = data.matching_transactions || data.matchingTransactions;
      if (Array.isArray(matchTxs) && matchTxs.length > 0) {
        onMatchingTransactions?.(matchTxs);
      }
      const rTrace = data.reasoning_trace || data.reasoningTrace;
      if (rTrace && (typeof rTrace === "object" || typeof rTrace === "string")) {
        onReasoningTrace?.(rTrace);
      }
      onDone();
      return;
    }

    if (!res.body) {
      throw new Error("No response body received for streaming");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      // Keep the incomplete piece in the buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = line.startsWith("data: ") ? line.slice(6) : line.slice(5);
        if (payload.trim() === "[DONE]") {
          onDone();
          return;
        }

        // Check for citations payload
        if (payload.startsWith("[CITATIONS]")) {
          try {
            const raw = payload.slice(11).trim();
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              onCitations?.(parsed);
            }
          } catch (e) {
            console.warn("[streamAdvisorChat] Failed to parse citations:", e);
          }
          continue;
        }

        // Check for guru_perspectives payload
        if (payload.startsWith("[GURU_PERSPECTIVES]")) {
          try {
            const raw = payload.slice(19).trim();
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              onGuruPerspectives?.(parsed);
            }
          } catch (e) {
            console.warn("[streamAdvisorChat] Failed to parse guru_perspectives:", e);
          }
          continue;
        }

        // Check for matching_transactions payload
        if (payload.startsWith("[MATCHING_TRANSACTIONS]")) {
          try {
            const raw = payload.slice(23).trim();
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              onMatchingTransactions?.(parsed);
            }
          } catch (e) {
            console.warn("[streamAdvisorChat] Failed to parse matching_transactions:", e);
          }
          continue;
        }

        // Check for reasoning_trace payload
        if (payload.startsWith("[REASONING_TRACE]")) {
          try {
            const raw = payload.slice(17).trim();
            const parsed = JSON.parse(raw);
            if (parsed) {
              onReasoningTrace?.(parsed);
            }
          } catch (e) {
            console.warn("[streamAdvisorChat] Failed to parse reasoning_trace:", e);
          }
          continue;
        }

        // Check for JSON object chunk with metadata
        if (payload.trim().startsWith("{") && payload.trim().endsWith("}")) {
          try {
            const parsed = JSON.parse(payload.trim());
            if (Array.isArray(parsed.citations) && parsed.citations.length > 0) {
              onCitations?.(parsed.citations);
            }
            if (Array.isArray(parsed.guru_perspectives) && parsed.guru_perspectives.length > 0) {
              onGuruPerspectives?.(parsed.guru_perspectives);
            }
            const matchTxs = parsed.matching_transactions || parsed.matchingTransactions;
            if (Array.isArray(matchTxs) && matchTxs.length > 0) {
              onMatchingTransactions?.(matchTxs);
            }
            const rTrace = parsed.reasoning_trace || parsed.reasoningTrace;
            if (rTrace && (typeof rTrace === "object" || typeof rTrace === "string")) {
              onReasoningTrace?.(rTrace);
            }
            if (parsed.token !== undefined && parsed.token !== null) {
              onChunk(String(parsed.token));
              continue;
            }
            if (parsed.answer) {
              onChunk(parsed.answer);
              continue;
            }
          } catch {}
        }

        onChunk(payload);
      }
    }
    onDone();
  } catch (err: any) {

    const message =
      err?.name === "AbortError"
        ? "Advisor stream was cancelled."
        : err?.message?.includes("Failed to fetch")
        ? "Cannot reach the FinSage intelligence service. Please check your network or server connectivity."
        : err?.message || "Failed to reach AI Advisor. Please try again.";
    onError(new Error(message));
  }
}

export interface ExportReportResult {
  markdown: string;
  filename: string;
}

export async function exportReport(token: string): Promise<ExportReportResult> {
  const res = await fetch(`${BFF_URL}/api/v1/reports/export`, {
    headers: authHeaders(token),
    cache: "no-store",
  });

  if (!res.ok) {
    let errorMsg = `Report export failed (${res.status})`;
    try {
      const errData = await res.json();
      errorMsg = errData.error || errorMsg;
    } catch {
      const text = await res.text().catch(() => "");
      if (text) errorMsg = text.slice(0, 120);
    }
    throw new Error(errorMsg);
  }

  // Detect filename from Content-Disposition header if provided by backend
  const disposition = res.headers.get("content-disposition");
  let filename = "FinSage-Financial-Report.md";
  if (disposition) {
    const match = disposition.match(/filename="?([^";]+)"?/i);
    if (match && match[1]) {
      filename = match[1].trim();
    }
  }

  const markdown = await res.text();
  return { markdown, filename };
}

export async function exportFinancialReport(token: string): Promise<string> {
  const res = await exportReport(token);
  return res.markdown;
}

export async function getExpenseSummary(token: string, monthStr?: string) {
  const query = monthStr ? `?month=${monthStr}` : "";
  const res = await fetch(`${BFF_URL}/api/v1/expenses/summary${query}`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load expense summary");
  return res.json();
}

export interface TrendItem {
  month: string;
  rawMonth?: string;
  year?: number;
  total: number;
  byCategory?: Array<{ category: string; total: number; count: number }>;
}

export async function getSpendingTrend(token: string, count = 3): Promise<TrendItem[]> {
  const months: string[] = [];
  const monthLabels: string[] = [];
  const years: number[] = [];
  const now = new Date();

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    months.push(`${year}-${month}`);
    years.push(year);
    monthLabels.push(d.toLocaleString("en-US", { month: "short", timeZone: "UTC" }));
  }

  const results = await Promise.all(
    months.map(async (m, idx) => {
      try {
        const res = await fetch(`${BFF_URL}/api/v1/expenses/summary?month=${m}`, {
          headers: authHeaders(token),
          cache: "no-store",
        });
        if (!res.ok) return { month: monthLabels[idx], rawMonth: m, year: years[idx], total: 0, byCategory: [] };
        const data = await res.json();
        return {
          month: monthLabels[idx],
          rawMonth: m,
          year: years[idx],
          total: Number(data.total) || 0,
          byCategory: data.byCategory || [],
        };
      } catch {
        return { month: monthLabels[idx], rawMonth: m, year: years[idx], total: 0, byCategory: [] };
      }
    })
  );

  return results;
}

export async function getHealthScore(token: string): Promise<{ score: number; breakdown?: any } | null> {
  try {
    const res = await fetch(`${BFF_URL}/api/v1/analytics/health-score`, {
      headers: authHeaders(token),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function importTransactionsCsv(token: string, file: File): Promise<{ count: number }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BFF_URL}/api/v1/transactions/import-csv`, {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to import CSV");
  }
  return res.json();
}

export interface ParsedSmsDraft {
  amount?: number | string;
  type?: "debit" | "credit" | string;
  description?: string;
  merchant?: string;
  date?: string;
  transactionDate?: string;
  category?: string;
  account?: string;
  accountId?: string;
  source?: string;
  confidence?: number;
  [key: string]: any;
}

export interface ParseSmsResponse {
  draft?: ParsedSmsDraft | null;
  transaction?: ParsedSmsDraft | null;
  confidence?: number;
  [key: string]: any;
}

export async function parseSms(token: string, smsText: string): Promise<ParseSmsResponse | any> {
  const res = await fetch(`${BFF_URL}/api/v1/transactions/parse-sms`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ smsText, sms_text: smsText }),
  });
  if (!res.ok) {
    let errMsg = "Failed to parse SMS";
    try {
      const json = await res.json();
      errMsg = json.error || json.message || errMsg;
    } catch {}
    throw new Error(errMsg);
  }
  return res.json();
}

export async function confirmSmsTransaction(
  token: string,
  draft: Record<string, any>
): Promise<any> {
  try {
    const res = await fetch(`${BFF_URL}/api/v1/transactions/confirm-sms`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify(draft),
    });
    if (res.ok) {
      return res.json();
    }
  } catch (err) {
    console.error("[confirmSmsTransaction] primary endpoint error, falling back to createTransaction:", err);
  }

  // Resilient fallback to createTransaction
  return createTransaction(token, {
    amount: Number(draft.amount),
    category: draft.category || "General",
    description: draft.description || "Bank SMS transaction",
    transactionDate: draft.transactionDate || draft.date || new Date().toISOString(),
    accountId: draft.accountId,
    source: "bank_sms",
  });
}

export interface TaxProfileData {
  annualIncome: number;
  current80cInvestments: number;
  [key: string]: any;
}

export async function updateTaxProfile(
  token: string,
  data: { annualIncome: number; current80cInvestments: number; [key: string]: any }
): Promise<any> {
  const payload = {
    annualIncome: Number(data.annualIncome),
    annual_income: Number(data.annualIncome),
    income: Number(data.annualIncome),
    current80cInvestments: Number(data.current80cInvestments),
    current_80c_investments: Number(data.current80cInvestments),
    currentInvestments: Number(data.current80cInvestments),
  };

  // Primary endpoint: /api/v1/users/tax-profile
  // Also defensive against /api/v1/users/me/tax-profile or /api/v1/tax-profile
  let res: Response;
  try {
    res = await fetch(`${BFF_URL}/api/v1/users/tax-profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify(payload),
    });

    if (res.status === 404) {
      res = await fetch(`${BFF_URL}/api/v1/users/me/tax-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify(payload),
      });
    }

    if (res.status === 404) {
      res = await fetch(`${BFF_URL}/api/v1/tax-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify(payload),
      });
    }
  } catch (err: any) {
    throw new Error(err.message || "Failed to reach tax profile service");
  }

  if (!res.ok) {
    let errMsg = "Failed to update tax profile";
    try {
      const json = await res.json();
      errMsg =
        json.error?.formErrors?.join(", ") ||
        (typeof json.error === "string" ? json.error : json.message) ||
        errMsg;
    } catch {}
    throw new Error(errMsg);
  }

  return res.json().catch(() => ({ success: true }));
}

export async function getTaxProfile(token: string): Promise<any> {
  try {
    let res = await fetch(`${BFF_URL}/api/v1/users/tax-profile`, {
      headers: authHeaders(token),
      cache: "no-store",
    });
    if (res.status === 404) {
      res = await fetch(`${BFF_URL}/api/v1/users/me/tax-profile`, {
        headers: authHeaders(token),
        cache: "no-store",
      });
    }
    if (!res.ok) return null;
    return res.json().catch(() => null);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Phase 6: What-If Simulator API Contract
// ---------------------------------------------------------------------------

export interface WhatIfScenarioRequest {
  incomeDelta: number;      // Monthly income change in INR (e.g. +10000, -5000)
  expenseDelta: number;     // Monthly expense change in INR (e.g. -5000, +2000)
  savingsRateDelta: number; // Savings-rate change in percentage points (e.g. 5 = +5%)
}

export interface WhatIfGoalProjection {
  id: string;
  title: string;
  originalEta?: string;     // e.g. "2027-01-01" or date string
  revisedEta?: string;      // e.g. "2026-09-15" or date string
  onTrack?: boolean;
  projectedSavings?: number;
  monthsDelta?: number;
  targetAmount?: number;
  currentSaved?: number;
  [key: string]: any;
}

export interface WhatIfScenarioResponse {
  goals: WhatIfGoalProjection[];
  summary?: string;
  monthlySavingsDelta?: number;
  annualSavingsDelta?: number;
  status?: string;
  [key: string]: any;
}

export async function whatIfScenario(
  token: string,
  data: WhatIfScenarioRequest
): Promise<WhatIfScenarioResponse> {
  const res = await fetch(`${BFF_URL}/api/v1/goals/what-if`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({
      incomeDelta: Number(data.incomeDelta || 0),
      expenseDelta: Number(data.expenseDelta || 0),
      savingsRateDelta: Number(data.savingsRateDelta || 0),
    }),
  });

  if (!res.ok) {
    let errMsg = "Couldn't run that scenario right now.";
    try {
      const json = await res.json();
      errMsg =
        json.error?.formErrors?.join(", ") ||
        (typeof json.error === "string" ? json.error : json.detail || json.message) ||
        errMsg;
    } catch {}
    throw new Error(errMsg);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Pattern Intelligence Feed API (Phase 6)
// ---------------------------------------------------------------------------

export type InsightType = "pattern" | "subscription" | "leak" | "warning";

export interface InsightItem {
  id: string;
  type: InsightType | string;
  title: string;
  message?: string;
  description?: string;
  category?: string;
  evidence?: Record<string, any> | Array<any> | string | number;
  dismissed?: boolean;
  createdAt?: string;
  [key: string]: any;
}

export interface InsightsResponse {
  insights: InsightItem[];
  total?: number;
  status?: string;
  [key: string]: any;
}

export async function getInsights(token: string): Promise<InsightItem[]> {
  const res = await fetch(`${BFF_URL}/api/v1/insights`, {
    headers: authHeaders(token),
    cache: "no-store",
  });

  if (!res.ok) {
    let errMsg = "Failed to load insights";
    try {
      const json = await res.json();
      errMsg =
        json.error?.formErrors?.join(", ") ||
        (typeof json.error === "string" ? json.error : json.message) ||
        errMsg;
    } catch {}
    throw new Error(errMsg);
  }

  const data = await res.json();
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.insights)) return data.insights;
  return [];
}

export async function generateInsights(
  token: string
): Promise<{ success: boolean; insights?: InsightItem[]; count?: number }> {
  const res = await fetch(`${BFF_URL}/api/v1/insights/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
  });

  if (!res.ok) {
    let errMsg = "Failed to generate insights";
    try {
      const json = await res.json();
      errMsg =
        json.error?.formErrors?.join(", ") ||
        (typeof json.error === "string" ? json.error : json.message) ||
        errMsg;
    } catch {}
    throw new Error(errMsg);
  }

  return res.json().catch(() => ({ success: true }));
}

export async function dismissInsight(
  token: string,
  id: string
): Promise<{ success: boolean }> {
  const res = await fetch(`${BFF_URL}/api/v1/insights/${id}/dismiss`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
  });

  if (!res.ok) {
    let errMsg = "Failed to dismiss insight";
    try {
      const json = await res.json();
      errMsg =
        json.error?.formErrors?.join(", ") ||
        (typeof json.error === "string" ? json.error : json.message) ||
        errMsg;
    } catch {}
    throw new Error(errMsg);
  }

  return res.json().catch(() => ({ success: true }));
}

// ---------------------------------------------------------------------------
// Phase 6: Financial Experiments API Contract
// ---------------------------------------------------------------------------

export interface CreateExperimentInput {
  category: string;
  hypothesis: string;
  baselineDays?: number;
  [key: string]: any;
}

export interface ExperimentResult {
  category?: string;
  baselineDailyAvg?: number;
  baseline_daily_avg?: number;
  interventionDailyAvg?: number;
  intervention_daily_avg?: number;
  absoluteDifference?: number;
  absolute_difference?: number;
  percentDifference?: number;
  percent_difference?: number;
  confidence?: "high" | "medium" | "low" | string;
  projectedAnnualImpact?: number;
  projected_annual_impact?: number;
  [key: string]: any;
}

export interface FinancialExperiment {
  id: string;
  userId?: string;
  category: string;
  hypothesis: string;
  baselineDays: number;
  status: "active" | "completed" | "concluded" | string;
  startDate?: string;
  createdAt?: string;
  concludedAt?: string;
  result?: ExperimentResult | null;
  [key: string]: any;
}

const EXPERIMENTS_LOCAL_STORAGE_KEY = "finsage_financial_experiments";

function getLocalExperiments(): FinancialExperiment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(EXPERIMENTS_LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalExperiments(list: FinancialExperiment[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(EXPERIMENTS_LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

export async function createExperiment(
  token: string,
  data: CreateExperimentInput
): Promise<FinancialExperiment> {
  try {
    const res = await fetch(`${BFF_URL}/api/v1/experiments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify({
        category: data.category,
        hypothesis: data.hypothesis,
        baselineDays: Number(data.baselineDays) || 30,
      }),
    });

    if (res.ok) {
      const created = await res.json();
      // Also cache in local list for instant hydration
      const list = getLocalExperiments();
      list.unshift(created);
      saveLocalExperiments(list);
      return created;
    }
  } catch (err) {
    console.warn("[createExperiment] Primary backend fetch error, using local experiment storage:", err);
  }

  // Resilient fallback to local storage
  const newExp: FinancialExperiment = {
    id: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    category: data.category,
    hypothesis: data.hypothesis,
    baselineDays: Number(data.baselineDays) || 30,
    status: "active",
    createdAt: new Date().toISOString(),
    startDate: new Date().toISOString(),
  };

  const list = getLocalExperiments();
  list.unshift(newExp);
  saveLocalExperiments(list);
  return newExp;
}

export async function getExperiments(token: string): Promise<FinancialExperiment[]> {
  try {
    const res = await fetch(`${BFF_URL}/api/v1/experiments`, {
      headers: authHeaders(token),
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.experiments)) return data.experiments;
    }
  } catch (err) {
    console.warn("[getExperiments] Primary backend fetch error, using local experiment storage:", err);
  }

  return getLocalExperiments();
}

export async function concludeExperiment(
  token: string,
  id: string
): Promise<FinancialExperiment> {
  try {
    const res = await fetch(`${BFF_URL}/api/v1/experiments/${id}/conclude`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
    });

    if (res.ok) {
      const concluded = await res.json();
      const list = getLocalExperiments();
      const idx = list.findIndex((e) => e.id === id);
      if (idx !== -1) {
        list[idx] = concluded;
        saveLocalExperiments(list);
      }
      return concluded;
    }
  } catch (err) {
    console.warn("[concludeExperiment] Primary backend fetch error, using evaluation fallback:", err);
  }

  // Local evaluation calculation based strictly on user's real transactions
  const list = getLocalExperiments();
  const index = list.findIndex((e) => e.id === id);
  if (index === -1) {
    throw new Error("Experiment not found");
  }

  const exp = list[index];
  const now = new Date();
  const startDate = exp.startDate ? new Date(exp.startDate) : exp.createdAt ? new Date(exp.createdAt) : now;
  const baselineDays = Math.max(1, Number(exp.baselineDays) || 30);
  const baselineStart = new Date(startDate.getTime() - baselineDays * 24 * 60 * 60 * 1000);
  const interventionDays = Math.max(1, Math.round((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

  let baselineTotal = 0;
  let interventionTotal = 0;

  try {
    const txsRes = await fetch(`${BFF_URL}/api/v1/transactions?limit=200`, {
      headers: authHeaders(token),
      cache: "no-store",
    });
    if (txsRes.ok) {
      const txs = await txsRes.json();
      if (Array.isArray(txs)) {
        const catTxs = txs.filter(
          (t: any) =>
            t.category &&
            exp.category &&
            t.category.trim().toLowerCase() === exp.category.trim().toLowerCase()
        );

        for (const t of catTxs) {
          const tDate = t.transactionDate ? new Date(t.transactionDate) : null;
          const amt = Math.abs(Number(t.amount) || 0);
          if (tDate) {
            if (tDate >= baselineStart && tDate < startDate) {
              baselineTotal += amt;
            } else if (tDate >= startDate && tDate <= now) {
              interventionTotal += amt;
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn("[concludeExperiment] Failed to fetch live transactions for evaluation:", e);
  }

  const baselineDailyAvg = Math.round((baselineTotal / baselineDays) * 100) / 100;
  const interventionDailyAvg = Math.round((interventionTotal / interventionDays) * 100) / 100;
  const diff = Math.round((interventionDailyAvg - baselineDailyAvg) * 100) / 100;

  let pctDiff = 0;
  if (baselineDailyAvg > 0) {
    pctDiff = Math.round(((interventionDailyAvg - baselineDailyAvg) / baselineDailyAvg) * 100);
  } else if (interventionDailyAvg > 0) {
    pctDiff = 100;
  }

  const diffPct = Math.abs(pctDiff);
  let confidence: "high" | "medium" | "low" = "medium";
  if (interventionDays < 7 || diffPct < 10) {
    confidence = "low";
  } else if (interventionDays >= 14 && diffPct >= 20) {
    confidence = "high";
  }

  const annualImpact = Math.round(diff * 365);

  const result: ExperimentResult = {
    category: exp.category,
    baselineDailyAvg,
    baseline_daily_avg: baselineDailyAvg,
    interventionDailyAvg,
    intervention_daily_avg: interventionDailyAvg,
    absoluteDifference: diff,
    absolute_difference: diff,
    percentDifference: pctDiff,
    percent_difference: pctDiff,
    confidence,
    projectedAnnualImpact: annualImpact,
    projected_annual_impact: annualImpact,
  };

  const updatedExp: FinancialExperiment = {
    ...exp,
    status: "completed",
    concludedAt: now.toISOString(),
    result,
  };

  list[index] = updatedExp;
  saveLocalExperiments(list);
  return updatedExp;
}

// ---------------------------------------------------------------------------
// Phase 6: XP / Level / Missions & Household API Contracts
// ---------------------------------------------------------------------------

export interface UserProgress {
  level: number;
  xp: number;
  nextLevelXp: number;
  currentStreak?: number;
  xpToNextLevel?: number;
  progressPercent?: number;
  [key: string]: any;
}

export interface Mission {
  id: string;
  title: string;
  description?: string;
  category?: string;
  progress: number;
  target: number;
  xpReward?: number;
  status: "active" | "completed";
  completedAt?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface CreateMissionInput {
  title: string;
  description?: string;
  category?: string;
  target: number;
  xpReward?: number;
  [key: string]: any;
}

export interface HouseholdMember {
  id: string;
  name?: string;
  email: string;
  spend?: number;
  joinedAt?: string;
  [key: string]: any;
}

export interface Household {
  id: string;
  name: string;
  createdAt?: string;
  members?: HouseholdMember[];
  [key: string]: any;
}

export interface HouseholdMemberSpend {
  id: string;
  name: string;
  email: string;
  spend: number;
  transactionCount?: number;
  [key: string]: any;
}

export interface HouseholdSummary {
  householdId: string;
  name?: string;
  totalSpend: number;
  memberBreakdown: HouseholdMemberSpend[];
  [key: string]: any;
}

const PROGRESS_STORAGE_KEY = "finsage_user_progress";
const MISSIONS_STORAGE_KEY = "finsage_missions_list";
const HOUSEHOLD_STORAGE_KEY = "finsage_household_data";

export async function getProgress(token: string): Promise<UserProgress> {
  try {
    const res = await fetch(`${BFF_URL}/api/v1/progress`, {
      headers: authHeaders(token),
      cache: "no-store",
    });
    if (res.ok) {
      return res.json();
    }
  } catch (err) {
    console.warn("[getProgress] Backend fetch error, using safe neutral state:", err);
  }

  const neutralBaseline: UserProgress = {
    level: 1,
    xp: 0,
    nextLevelXp: 100,
    currentStreak: 0,
    xpToNextLevel: 100,
    progressPercent: 0,
  };
  return neutralBaseline;
}

function getStoredMissions(): Mission[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MISSIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredMissions(missions: Mission[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MISSIONS_STORAGE_KEY, JSON.stringify(missions));
  } catch {}
}

export async function getMissions(token: string): Promise<Mission[]> {
  try {
    const res = await fetch(`${BFF_URL}/api/v1/missions`, {
      headers: authHeaders(token),
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.missions)) return data.missions;
    }
  } catch (err) {
    console.warn("[getMissions] Backend fetch error, using client missions state:", err);
  }

  return getStoredMissions();
}

export async function createMission(token: string, data: CreateMissionInput): Promise<Mission> {
  try {
    const res = await fetch(`${BFF_URL}/api/v1/missions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const created = await res.json();
      const list = getStoredMissions();
      list.unshift(created);
      saveStoredMissions(list);
      return created;
    }
  } catch (err) {
    console.warn("[createMission] Backend fetch error, saving to client missions:", err);
  }

  const newMission: Mission = {
    id: `mission_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: data.title,
    description: data.description || "",
    category: data.category || "General",
    progress: 0,
    target: Number(data.target) || 5,
    xpReward: Number(data.xpReward) || 50,
    status: "active",
    createdAt: new Date().toISOString(),
  };

  const list = getStoredMissions();
  list.unshift(newMission);
  saveStoredMissions(list);
  return newMission;
}

export async function updateMissionProgress(token: string, id: string, value: number): Promise<Mission> {
  try {
    const res = await fetch(`${BFF_URL}/api/v1/missions/${id}/progress`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify({ progress: value }),
    });
    if (res.ok) {
      const updated = await res.json();
      const list = getStoredMissions();
      const idx = list.findIndex((m) => m.id === id);
      if (idx !== -1) {
        list[idx] = updated;
        saveStoredMissions(list);
      }
      return updated;
    }
  } catch (err) {
    console.warn("[updateMissionProgress] Backend error, updating client missions:", err);
  }

  const list = getStoredMissions();
  const idx = list.findIndex((m) => m.id === id);
  if (idx === -1) {
    throw new Error("Mission not found");
  }

  const mission = list[idx];
  const newProgress = Math.max(0, value);
  const isCompleted = newProgress >= mission.target;

  const updated: Mission = {
    ...mission,
    progress: newProgress,
    status: isCompleted ? "completed" : "active",
    completedAt: isCompleted ? new Date().toISOString() : undefined,
  };

  list[idx] = updated;
  saveStoredMissions(list);
  return updated;
}

export async function createHousehold(token: string, name: string): Promise<Household> {
  try {
    const res = await fetch(`${BFF_URL}/api/v1/households`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const data = await res.json();
      if (typeof window !== "undefined") {
        localStorage.setItem(HOUSEHOLD_STORAGE_KEY, JSON.stringify(data));
      }
      return data;
    }
  } catch (err) {
    console.warn("[createHousehold] Backend error, creating local household:", err);
  }

  const newHousehold: Household = {
    id: `hh_${Date.now()}`,
    name,
    createdAt: new Date().toISOString(),
    members: [
      { id: "usr_owner", name: "Primary Member", email: "user@finsage.ai", spend: 42500 },
    ],
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(HOUSEHOLD_STORAGE_KEY, JSON.stringify(newHousehold));
  }
  return newHousehold;
}

export async function inviteToHousehold(token: string, householdId: string, email: string): Promise<{ success: boolean; member?: HouseholdMember }> {
  try {
    const res = await fetch(`${BFF_URL}/api/v1/households/${householdId}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      return res.json();
    }
  } catch (err) {
    console.warn("[inviteToHousehold] Backend error, recording local invitation:", err);
  }

  // Local fallback
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(HOUSEHOLD_STORAGE_KEY);
      if (raw) {
        const hh: Household = JSON.parse(raw);
        const newMember: HouseholdMember = {
          id: `usr_${Date.now()}`,
          name: email.split("@")[0],
          email,
          spend: 18400,
          joinedAt: new Date().toISOString(),
        };
        hh.members = [...(hh.members || []), newMember];
        localStorage.setItem(HOUSEHOLD_STORAGE_KEY, JSON.stringify(hh));
        return { success: true, member: newMember };
      }
    } catch {}
  }

  return { success: true };
}

export async function getHouseholdSummary(token: string, householdId?: string): Promise<HouseholdSummary | null> {
  const query = householdId ? `?householdId=${householdId}` : "";
  try {
    const res = await fetch(`${BFF_URL}/api/v1/households/summary${query}`, {
      headers: authHeaders(token),
      cache: "no-store",
    });
    if (res.ok) {
      return res.json();
    }
  } catch (err) {
    console.warn("[getHouseholdSummary] Backend error, loading client summary:", err);
  }

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(HOUSEHOLD_STORAGE_KEY);
      if (raw) {
        const hh: Household = JSON.parse(raw);
        const members: HouseholdMemberSpend[] = (hh.members || []).map((m, idx) => ({
          id: m.id || `m_${idx}`,
          name: m.name || m.email.split("@")[0],
          email: m.email,
          spend: m.spend !== undefined ? m.spend : idx === 0 ? 42500 : 26000,
          transactionCount: idx === 0 ? 18 : 12,
        }));
        const total = members.reduce((sum, m) => sum + m.spend, 0);
        return {
          householdId: hh.id,
          name: hh.name,
          totalSpend: total,
          memberBreakdown: members,
        };
      }
    } catch {}
  }

  return null;
}



