// Person 4 owns this file. Every call to the BFF goes through here so the
// base URL only exists in one place. Phase 2 adds transactions/budgets/goals.
const BFF_URL = process.env.NEXT_PUBLIC_BFF_URL || "http://localhost:4000";

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
  return res.json();
}

export async function getTransactions(token: string) {
  const res = await fetch(`${BFF_URL}/api/v1/transactions`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load transactions");
  return res.json();
}

export async function createTransaction(
  token: string,
  data: { amount: number; category: string; transactionDate: string; description: string }
) {
  const res = await fetch(`${BFF_URL}/api/v1/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create transaction");
  return res.json();
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
  return res.json();
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
  return res.json();
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

export async function streamAdvisorChat(
  token: string,
  message: string,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (err: any) => void
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
        onChunk(payload);
      }
    }
    onDone();
  } catch (err) {
    onError(err);
  }
}


