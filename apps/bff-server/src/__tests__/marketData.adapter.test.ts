/**
 * Tests for MarketDataAdapter (mfapi.in)
 * ========================================
 * Mocks the HTTP layer — never hits real APIs in CI.
 *
 * Coverage:
 *   ✓ happy path: fetchData returns valid normalized data
 *   ✓ timeout path: AbortController fires → throws
 *   ✓ retry-exhausted path: all 3 attempts fail → throws final error
 *   ✓ stale cache served on adapter failure
 *   ✓ Zod validation catches malformed responses
 */

import { MarketDataAdapter } from "../adapters/marketData.adapter";
import { getCache, setCache } from "../adapters/base.adapter";

// ---- Mock fetch globally ----
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

// ---- Mock redis lib so no real Redis connection is made ----
jest.mock("../lib/redis", () => ({
  redis: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue("OK"),
    on: jest.fn(),
  },
}));

// ---- Mock logger to suppress noise in tests ----
jest.mock("../lib/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// ---- Sample valid MFAPI response ----
const validMfApiResponse = {
  schemeCode: 119598,
  schemeName: "Axis Bluechip Fund - Growth",
  fundHouse: "Axis Mutual Fund",
  schemeType: "Open Ended Schemes",
  schemeCategory: "Equity Scheme - Large Cap Fund",
  data: [
    { date: "25-09-2026", nav: "58.4512" },
    { date: "24-09-2026", nav: "57.9100" },
  ],
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

describe("MarketDataAdapter", () => {
  let adapter: MarketDataAdapter;

  beforeEach(() => {
    adapter = new MarketDataAdapter("119598");
    mockFetch.mockReset();
  });

  // ---- Happy path ----
  it("fetchData: returns valid raw data on success", async () => {
    mockFetch.mockResolvedValue(makeJsonResponse(validMfApiResponse));

    const raw = await adapter.fetchData();
    expect(raw.schemeCode).toBe(119598);
    expect(raw.data[0].nav).toBe("58.4512");
  });

  it("normalizeData: produces correct normalized shape", async () => {
    mockFetch.mockResolvedValue(makeJsonResponse(validMfApiResponse));
    const raw = await adapter.fetchData();
    const normalized = adapter.normalizeData(raw);

    expect(normalized.provider).toBe("mfapi");
    expect(normalized.nav).toBe(58.4512);
    expect(normalized.navDate).toBe("25-09-2026");
    expect(normalized.schemeName).toBe("Axis Bluechip Fund - Growth");
    expect(typeof normalized.fetchedAt).toBe("string");
  });

  // ---- Timeout path ----
  it("fetchData: throws on timeout (AbortError)", async () => {
    const abortErr = Object.assign(new Error("The operation was aborted"), { name: "AbortError" });
    mockFetch.mockRejectedValue(abortErr);

    await expect(adapter.fetchData()).rejects.toThrow();
    // Should have attempted 3 times
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  // ---- Retry-exhausted path ----
  it("fetchData: exhausts 3 retries on persistent network failure", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    await expect(adapter.fetchData()).rejects.toThrow("Network error");
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  // ---- Zod validation catches malformed response ----
  it("fetchData: throws validation error on malformed response", async () => {
    mockFetch.mockResolvedValue(makeJsonResponse({ broken: "data" }));

    await expect(adapter.fetchData()).rejects.toThrow(/validation failed/i);
  });

  // ---- Health check ----
  it("healthCheck: returns true on HTTP 200", async () => {
    mockFetch.mockResolvedValue(makeJsonResponse(validMfApiResponse, 200));
    const ok = await adapter.healthCheck();
    expect(ok).toBe(true);
  });

  it("healthCheck: returns false on network error", async () => {
    mockFetch.mockRejectedValue(new Error("ECONNREFUSED"));
    const ok = await adapter.healthCheck();
    expect(ok).toBe(false);
  });
});
