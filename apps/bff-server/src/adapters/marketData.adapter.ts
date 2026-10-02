/**
 * Market Data Adapter — MFAPI (mfapi.in)
 * =========================================
 * Provider : mfapi.in  (free, no API key required)
 * Endpoint : GET https://api.mfapi.in/mf/{schemeCode}
 *
 * Normalized output schema:
 * {
 *   provider:    "mfapi",
 *   schemeCode:  number,
 *   schemeName:  string,
 *   nav:         number,          // latest Net Asset Value in INR
 *   navDate:     string,          // ISO date "YYYY-MM-DD"
 *   fundHouse:   string,
 *   schemeType:  string,          // e.g. "Open Ended Schemes"
 *   schemeCategory: string,       // e.g. "Growth"
 *   fetchedAt:   string           // ISO-8601 timestamp
 * }
 *
 * Redis cache TTL: 3600 s (1 hour) — NAVs update once per market day.
 *
 * Env vars required: none (public API — no key needed).
 *   MFAPI_SCHEME_CODE (optional, default: 119598 = Axis Bluechip Fund)
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

const PROVIDER = "mfapi";
const BASE_URL = "https://api.mfapi.in/mf";
const CACHE_TTL_S = 3600; // 1 hour
const DEFAULT_SCHEME = process.env.MFAPI_SCHEME_CODE ?? "119598";

const RETRY_OPTS: RetryOptions = { maxAttempts: 3, baseDelayMs: 500, timeoutMs: 8000 };

// ---------------------------------------------------------------------------
// Zod validation schema for raw MFAPI response
// ---------------------------------------------------------------------------

const mfDataSchema = z.object({
  schemeCode: z.number(),
  schemeName: z.string(),
  fundHouse: z.string(),
  schemeType: z.string(),
  schemeCategory: z.string(),
  data: z
    .array(
      z.object({
        date: z.string(),
        nav: z.string(),
      })
    )
    .min(1),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MfApiRaw = z.infer<typeof mfDataSchema>;

export interface MarketDataNormalized {
  provider: string;
  schemeCode: number;
  schemeName: string;
  nav: number;
  navDate: string;
  fundHouse: string;
  schemeType: string;
  schemeCategory: string;
  fetchedAt: string;
}

// ---------------------------------------------------------------------------
// Adapter implementation
// ---------------------------------------------------------------------------

export class MarketDataAdapter implements FinancialAdapter<MfApiRaw, MarketDataNormalized> {
  readonly providerName = PROVIDER;

  private schemeCode: string;

  constructor(schemeCode: string = DEFAULT_SCHEME) {
    this.schemeCode = schemeCode;
  }

  // ---- fetchData -----------------------------------------------------------

  async fetchData(_params?: Record<string, string>): Promise<MfApiRaw> {
    const schemeCode = _params?.schemeCode ?? this.schemeCode;
    const cacheKey = `mfapi:nav:${schemeCode}`;

    // 1. Try cache first
    const cached = await getCache<MfApiRaw>(cacheKey);
    if (cached) {
      logger.debug("adapter.cache.hit", { provider: PROVIDER, endpoint: `${BASE_URL}/${schemeCode}`, status: "hit" });
      return cached;
    }

    // 2. Fetch fresh data with retry + circuit-breaker
    const raw = await withCircuitBreaker(PROVIDER, () =>
      withRetry(
        PROVIDER,
        `${BASE_URL}/${schemeCode}`,
        async (signal) => {
          const res = await fetchWithStatus(`${BASE_URL}/${schemeCode}`, { signal });
          return res.json() as Promise<unknown>;
        },
        RETRY_OPTS
      )
    );

    // 3. Validate schema
    const parsed = mfDataSchema.safeParse(raw);
    if (!parsed.success) {
      logger.error("adapter.validation.failed", {
        provider: PROVIDER,
        endpoint: `${BASE_URL}/${schemeCode}`,
        status: "validation_error",
        detail: JSON.stringify(parsed.error.flatten()),
      });
      throw new Error(`MFAPI response validation failed: ${JSON.stringify(parsed.error.flatten())}`);
    }

    // 4. Cache valid response
    await setCache(cacheKey, parsed.data, CACHE_TTL_S);
    return parsed.data;
  }

  // ---- normalizeData -------------------------------------------------------

  normalizeData(raw: MfApiRaw): MarketDataNormalized {
    const latest = raw.data[0];
    return {
      provider: PROVIDER,
      schemeCode: raw.schemeCode,
      schemeName: raw.schemeName,
      nav: parseFloat(latest.nav),
      navDate: latest.date,
      fundHouse: raw.fundHouse,
      schemeType: raw.schemeType,
      schemeCategory: raw.schemeCategory,
      fetchedAt: new Date().toISOString(),
    };
  }

  // ---- healthCheck ---------------------------------------------------------

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetchWithStatus(`${BASE_URL}/${this.schemeCode}`, {});
      return res.status === 200;
    } catch {
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton export + convenience fetch-and-normalize with stale-cache fallback
// ---------------------------------------------------------------------------

export const marketDataAdapter = new MarketDataAdapter();

/**
 * Fetches and normalizes mutual-fund NAV data.
 * On adapter failure → serves the last cached value (stale) if available.
 * Returns { data, stale: true } when serving cached fallback.
 */
export async function fetchMarketData(
  schemeCode?: string
): Promise<{ data: MarketDataNormalized; stale: boolean } | { error: AdapterError }> {
  const adapter = schemeCode ? new MarketDataAdapter(schemeCode) : marketDataAdapter;
  const cacheKey = `mfapi:nav:${schemeCode ?? DEFAULT_SCHEME}`;

  try {
    const raw = await adapter.fetchData(schemeCode ? { schemeCode } : undefined);
    return { data: adapter.normalizeData(raw), stale: false };
  } catch (err: any) {
    // Try stale cache
    const staleRaw = await getCache<MfApiRaw>(cacheKey);
    if (staleRaw) {
      logger.warn("adapter.stale_cache.served", {
        provider: PROVIDER,
        endpoint: `${BASE_URL}/${schemeCode ?? DEFAULT_SCHEME}`,
        status: "stale",
        detail: err.message,
      });
      return { data: adapter.normalizeData(staleRaw), stale: true };
    }

    logger.error("adapter.fetch.failed", {
      provider: PROVIDER,
      endpoint: `${BASE_URL}/${schemeCode ?? DEFAULT_SCHEME}`,
      status: "error",
      detail: err.message,
    });
    return { error: makeAdapterError(PROVIDER, "Failed to fetch market data", err.message) };
  }
}
