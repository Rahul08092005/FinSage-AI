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

