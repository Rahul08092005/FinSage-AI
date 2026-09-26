/**
 * Forex Rate Adapter — Open Exchange Rates / ExchangeRate-API
 * ============================================================
 * Provider : exchangerate-api.com  (free tier — 1500 req/month, no CC required)
 * Endpoint : GET https://v6.exchangerate-api.com/v6/{API_KEY}/latest/{base}
 *
 * Normalized output schema:
 * {
 *   provider:    "exchangerate-api",
 *   base:        string,           // e.g. "INR"
 *   rates:       Record<string, number>,  // e.g. { USD: 0.012, EUR: 0.011, GBP: 0.0095, ... }
 *   lastUpdated: string,           // ISO-8601 timestamp from provider
 *   fetchedAt:   string            // ISO-8601 timestamp
 * }
 *
 * Redis cache TTL: 1800 s (30 min) — rates refresh every few hours on free tier.
 *
 * Env vars required:
 *   EXCHANGERATE_API_KEY   (required — from exchangerate-api.com free signup)
 *
 * Fail-fast: if EXCHANGERATE_API_KEY is missing at startup, the module logs a clear
 * error and all calls return an AdapterError without making any HTTP request.
 */

import { z } from "zod";
import {
  FinancialAdapter,
  withRetry,
  withCircuitBreaker,
  getCache,
  setCache,
  fetchWithStatus,
  makeAdapterError,
  AdapterError,
  RetryOptions,
} from "./base.adapter";
import { logger } from "../lib/logger";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROVIDER = "exchangerate-api";
const BASE_URL = "https://v6.exchangerate-api.com/v6";
const CACHE_TTL_S = 1800; // 30 minutes
const RETRY_OPTS: RetryOptions = { maxAttempts: 3, baseDelayMs: 600, timeoutMs: 8000 };
const DEFAULT_BASE = "INR";

// Key presence check — fail fast with a clear message
function getApiKey(): string | null {
  const key = process.env.EXCHANGERATE_API_KEY;
  if (!key) {
    logger.error("adapter.config.missing_key", {
      provider: PROVIDER,
      endpoint: BASE_URL,
      status: "misconfigured",
      detail: "EXCHANGERATE_API_KEY is not set. Forex adapter is disabled.",
    });
    return null;
  }
  return key;
}

// ---------------------------------------------------------------------------
// Zod validation schema for raw provider response
// ---------------------------------------------------------------------------

const forexRawSchema = z.object({
  result: z.literal("success"),
  base_code: z.string(),
  time_last_update_utc: z.string(),
  conversion_rates: z.record(z.string(), z.number()),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ForexRaw = z.infer<typeof forexRawSchema>;

export interface ForexNormalized {
  provider: string;
  base: string;
  rates: Record<string, number>;
  lastUpdated: string;
  fetchedAt: string;
}

// ---------------------------------------------------------------------------
// Adapter implementation
// ---------------------------------------------------------------------------

export class ForexAdapter implements FinancialAdapter<ForexRaw, ForexNormalized> {
  readonly providerName = PROVIDER;

  private base: string;

  constructor(base: string = DEFAULT_BASE) {
    this.base = base;
  }

  // ---- fetchData -----------------------------------------------------------

  async fetchData(_params?: Record<string, string>): Promise<ForexRaw> {
    const base = _params?.base ?? this.base;
    const cacheKey = `forex:rates:${base}`;

    // 1. Try cache first
    const cached = await getCache<ForexRaw>(cacheKey);
    if (cached) {
      logger.debug("adapter.cache.hit", { provider: PROVIDER, endpoint: `${BASE_URL}/latest/${base}`, status: "hit" });
      return cached;
    }

    // 2. Key must be present before making any request
    const apiKey = getApiKey();
    if (!apiKey) {
      throw Object.assign(
        new Error("EXCHANGERATE_API_KEY is not configured"),
        { __status: 503 }
      );
    }

    const endpoint = `${BASE_URL}/${apiKey}/latest/${base}`;

    // 3. Fetch with retry + circuit-breaker
    const raw = await withCircuitBreaker(PROVIDER, () =>
      withRetry(
        PROVIDER,
        endpoint,
        async (signal) => {
          const res = await fetchWithStatus(endpoint, { signal });
          return res.json() as Promise<unknown>;
        },
        RETRY_OPTS
      )
    );

    // 4. Validate schema
    const parsed = forexRawSchema.safeParse(raw);
    if (!parsed.success) {
      logger.error("adapter.validation.failed", {
        provider: PROVIDER,
        endpoint,
        status: "validation_error",
        detail: JSON.stringify(parsed.error.flatten()),
      });
      throw new Error(`Forex response validation failed: ${JSON.stringify(parsed.error.flatten())}`);
    }

    // 5. Cache valid response
    await setCache(cacheKey, parsed.data, CACHE_TTL_S);
    return parsed.data;
  }

  // ---- normalizeData -------------------------------------------------------

  normalizeData(raw: ForexRaw): ForexNormalized {
    return {
      provider: PROVIDER,
      base: raw.base_code,
      rates: raw.conversion_rates,
      lastUpdated: raw.time_last_update_utc,
      fetchedAt: new Date().toISOString(),
    };
  }

  // ---- healthCheck ---------------------------------------------------------

  async healthCheck(): Promise<boolean> {
    const apiKey = getApiKey();
    if (!apiKey) return false;

    try {
      const res = await fetchWithStatus(`${BASE_URL}/${apiKey}/latest/INR`, {});
      return res.status === 200;
    } catch {
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton export + convenience fetch-and-normalize with stale-cache fallback
// ---------------------------------------------------------------------------

export const forexAdapter = new ForexAdapter();

/**
 * Fetches and normalizes forex rates for the given base currency.
 * On adapter failure → serves the last cached value (stale) if available.
 * Returns { data, stale: true } when serving a cached fallback.
 */
export async function fetchForexRates(
  base: string = DEFAULT_BASE
): Promise<{ data: ForexNormalized; stale: boolean } | { error: AdapterError }> {
  const adapter = new ForexAdapter(base);
  const cacheKey = `forex:rates:${base}`;

  try {
    const raw = await adapter.fetchData({ base });
    return { data: adapter.normalizeData(raw), stale: false };
  } catch (err: any) {
    // Try stale cache
    const staleRaw = await getCache<ForexRaw>(cacheKey);
    if (staleRaw) {
      logger.warn("adapter.stale_cache.served", {
        provider: PROVIDER,
        endpoint: `${BASE_URL}/latest/${base}`,
        status: "stale",
        detail: err.message,
      });
      return { data: adapter.normalizeData(staleRaw), stale: true };
    }

    logger.error("adapter.fetch.failed", {
      provider: PROVIDER,
      endpoint: `${BASE_URL}/latest/${base}`,
      status: "error",
      detail: err.message,
    });
    return { error: makeAdapterError(PROVIDER, "Failed to fetch forex rates", err.message) };
  }
}
