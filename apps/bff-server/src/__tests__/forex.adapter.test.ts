/**
 * Tests for ForexAdapter (exchangerate-api.com)
 * ===============================================
 * Mocks the HTTP layer — never hits real APIs in CI.
 *
 * Coverage:
 *   ✓ happy path: returns normalized forex rates
 *   ✓ timeout path: throws on AbortError
 *   ✓ retry-exhausted path: all 3 attempts fail
 *   ✓ missing API key: fails fast with clear error
 *   ✓ Zod validation catches malformed responses
 *   ✓ healthCheck: true on 200, false on error
 */

import { ForexAdapter } from "../adapters/forex.adapter";

const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

jest.mock("../lib/redis", () => ({
  redis: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue("OK"),
    on: jest.fn(),
  },
}));

jest.mock("../lib/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const validForexResponse = {
  result: "success",
  base_code: "INR",
  time_last_update_utc: "Fri, 26 Sep 2026 00:00:01 +0000",
  conversion_rates: {
    USD: 0.012,
    EUR: 0.011,
    GBP: 0.0095,
    JPY: 1.79,
  },
};

function makeJsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
    headers: { get: jest.fn().mockReturnValue(null) },
  };
}

describe("ForexAdapter", () => {
  let adapter: ForexAdapter;
  const originalEnv = process.env;

  beforeEach(() => {
    adapter = new ForexAdapter("INR");
    mockFetch.mockReset();
    // Set a fake key so we can test happy paths
    process.env = { ...originalEnv, EXCHANGERATE_API_KEY: "test_key_123" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // ---- Happy path ----
  it("fetchData: returns normalized forex data on success", async () => {
    mockFetch.mockResolvedValue(makeJsonResponse(validForexResponse));

    const raw = await adapter.fetchData({ base: "INR" });
    const normalized = adapter.normalizeData(raw);

    expect(normalized.provider).toBe("exchangerate-api");
    expect(normalized.base).toBe("INR");
    expect(normalized.rates.USD).toBe(0.012);
    expect(typeof normalized.fetchedAt).toBe("string");
  });

  // ---- Missing API key ----
  it("fetchData: fails fast when EXCHANGERATE_API_KEY is missing", async () => {
    delete process.env.EXCHANGERATE_API_KEY;

    await expect(adapter.fetchData()).rejects.toThrow(/EXCHANGERATE_API_KEY is not configured/i);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  // ---- Timeout path ----
  it("fetchData: throws on timeout (AbortError)", async () => {
    const abortErr = Object.assign(new Error("aborted"), { name: "AbortError" });
    mockFetch.mockRejectedValue(abortErr);

    await expect(adapter.fetchData()).rejects.toThrow();
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  // ---- Retry-exhausted path ----
  it("fetchData: exhausts 3 retries on persistent failure", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    await expect(adapter.fetchData()).rejects.toThrow("Network error");
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  // ---- Zod validation ----
  it("fetchData: throws validation error on malformed response", async () => {
    mockFetch.mockResolvedValue(makeJsonResponse({ result: "error", error: "invalid_key" }));

    await expect(adapter.fetchData()).rejects.toThrow(/validation failed/i);
  });

  // ---- Health check ----
  it("healthCheck: returns false when API key is missing", async () => {
    delete process.env.EXCHANGERATE_API_KEY;
    const ok = await adapter.healthCheck();
    expect(ok).toBe(false);
  });

  it("healthCheck: returns true on HTTP 200", async () => {
    mockFetch.mockResolvedValue(makeJsonResponse(validForexResponse, 200));
    const ok = await adapter.healthCheck();
    expect(ok).toBe(true);
  });
});
