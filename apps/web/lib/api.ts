// Person 4 owns this file. Every call to the BFF goes through here so the
// base URL only exists in one place. Phase 2 adds transactions/budgets/goals.
const BFF_URL = process.env.NEXT_PUBLIC_BFF_URL || "http://localhost:4000";

function authHeaders(token?: string) {
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
