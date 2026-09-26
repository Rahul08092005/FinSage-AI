/**
 * Commodity Prices Adapter — Commodities-API (commodities-api.com)
 * ================================================================
 * Provider : commodities-api.com  (free tier — 100 req/month, no CC required)
 * Endpoint : GET https://commodities-api.com/api/latest?access_key={KEY}&base=INR&symbols=XAU,XAG,CRUDE
 *
 * Selected commodities relevant to Indian wealth management:
 *   XAU  — Gold (per troy ounce, converted to per gram)
 *   XAG  — Silver (per troy ounce, converted to per gram)
 *   CRUDE — WTI Crude Oil (per barrel)
 *
 * Normalized output schema:
 * {
 *   provider:    "commodities-api",
 *   base:        "INR",
 *   commodities: [
 *     {
 *       symbol:     string,        // "XAU", "XAG", "CRUDE"
 *       name:       string,        // "Gold", "Silver", "Crude Oil"
 *       priceInr:   number,        // price in INR per gram (gold/silver) or per barrel (crude)
 *       unit:       string         // "per gram" | "per barrel"
 *     }
 *   ],
 *   timestamp:   number,           // Unix epoch from provider
 *   fetchedAt:   string            // ISO-8601 timestamp
 * }
 *
 * Redis cache TTL: 900 s (15 min) — commodity prices update frequently.
 *
 * Env vars required:
 *   COMMODITIES_API_KEY   (required — from commodities-api.com free signup)
 *
 * Fail-fast: if COMMODITIES_API_KEY is missing, all calls return an AdapterError.
 *
 * NOTE: free tier rate limit is 100 requests/month. The 15-min Redis cache
 *        keeps actual API calls well within this limit for a dev/demo deployment.
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

const PROVIDER = "commodities-api";
const BASE_URL = "https://commodities-api.com/api";
const CACHE_TTL_S = 900; // 15 minutes
const RETRY_OPTS: RetryOptions = { maxAttempts: 3, baseDelayMs: 700, timeoutMs: 9000 };

const TROY_OUNCE_TO_GRAM = 31.1035; // 1 troy oz = 31.1035 g

const COMMODITY_META: Record<string, { name: string; unit: string; divisor: number }> = {
  XAU: { name: "Gold", unit: "per gram", divisor: TROY_OUNCE_TO_GRAM },
  XAG: { name: "Silver", unit: "per gram", divisor: TROY_OUNCE_TO_GRAM },
  CRUDE: { name: "Crude Oil (WTI)", unit: "per barrel", divisor: 1 },
};

// Key presence check — fail fast with clear message
function getApiKey(): string | null {
  const key = process.env.COMMODITIES_API_KEY;
  if (!key) {
    logger.error("adapter.config.missing_key", {
      provider: PROVIDER,
      endpoint: BASE_URL,
      status: "misconfigured",
      detail: "COMMODITIES_API_KEY is not set. Commodities adapter is disabled.",
    });
    return null;
  }
  return key;
}

// ---------------------------------------------------------------------------
// Zod validation schema for raw provider response
// ---------------------------------------------------------------------------

const commodityRawSchema = z.object({
  data: z.object({
    success: z.boolean(),
    timestamp: z.number(),
    base: z.string(),
    rates: z.record(z.string(), z.number()),
  }),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CommodityRaw = z.infer<typeof commodityRawSchema>;

export interface CommodityItem {
  symbol: string;
  name: string;
  priceInr: number;
  unit: string;
}

export interface CommoditiesNormalized {
  provider: string;
  base: string;
  commodities: CommodityItem[];
  timestamp: number;
  fetchedAt: string;
}

// ---------------------------------------------------------------------------
// Adapter implementation
// ---------------------------------------------------------------------------

export class CommodityAdapter implements FinancialAdapter<CommodityRaw, CommoditiesNormalized> {
  readonly providerName = PROVIDER;

  // ---- fetchData -----------------------------------------------------------

  async fetchData(_params?: Record<string, string>): Promise<CommodityRaw> {
    const cacheKey = "commodities:latest:INR";

    // 1. Try cache first
    const cached = await getCache<CommodityRaw>(cacheKey);
    if (cached) {
      logger.debug("adapter.cache.hit", {
        provider: PROVIDER,
        endpoint: `${BASE_URL}/latest`,
        status: "hit",
      });
      return cached;
    }

    // 2. Key must be present before any HTTP call
    const apiKey = getApiKey();
    if (!apiKey) {
      throw Object.assign(
        new Error("COMMODITIES_API_KEY is not configured"),
        { __status: 503 }
      );
    }

    const symbols = Object.keys(COMMODITY_META).join(",");
    const endpoint = `${BASE_URL}/latest?access_key=${apiKey}&base=INR&symbols=${symbols}`;

    // 3. Fetch with retry + circuit-breaker
    const raw = await withCircuitBreaker(PROVIDER, () =>
      withRetry(
        PROVIDER,
        `${BASE_URL}/latest`,
        async (signal) => {
          const res = await fetchWithStatus(endpoint, { signal });
          return res.json() as Promise<unknown>;
        },
        RETRY_OPTS
      )
    );

    // 4. Validate schema
    const parsed = commodityRawSchema.safeParse(raw);
    if (!parsed.success) {
      logger.error("adapter.validation.failed", {
        provider: PROVIDER,
        endpoint: `${BASE_URL}/latest`,
        status: "validation_error",
        detail: JSON.stringify(parsed.error.flatten()),
      });
      throw new Error(`Commodities API response validation failed: ${JSON.stringify(parsed.error.flatten())}`);
    }

    // 5. Cache valid response
    await setCache(cacheKey, parsed.data, CACHE_TTL_S);
    return parsed.data;
  }

  // ---- normalizeData -------------------------------------------------------

  normalizeData(raw: CommodityRaw): CommoditiesNormalized {
    const { timestamp, base, rates } = raw.data;

    // rates are expressed as "units of commodity per 1 INR" from the API
    // We need "INR per unit of commodity", so: priceInr = 1 / rate (then per gram)
    const commodities: CommodityItem[] = Object.keys(COMMODITY_META)
      .filter((sym) => sym in rates && rates[sym] > 0)
      .map((sym) => {
        const meta = COMMODITY_META[sym];
        const ratePerInr = rates[sym]; // how many units of commodity per 1 INR
        const inrPerTroyOz = 1 / ratePerInr;
        const priceInr = inrPerTroyOz / meta.divisor;

        return {
          symbol: sym,
          name: meta.name,
          priceInr: Math.round(priceInr * 100) / 100,
          unit: meta.unit,
        };
      });

    return {
      provider: PROVIDER,
      base,
      commodities,
      timestamp,
      fetchedAt: new Date().toISOString(),
    };
  }

  // ---- healthCheck ---------------------------------------------------------

  async healthCheck(): Promise<boolean> {
    const apiKey = getApiKey();
    if (!apiKey) return false;

    try {
      const res = await fetchWithStatus(`${BASE_URL}/latest?access_key=${apiKey}&base=INR&symbols=XAU`, {});
      return res.status === 200;
    } catch {
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton export + convenience fetch-and-normalize with stale-cache fallback
// ---------------------------------------------------------------------------

export const commodityAdapter = new CommodityAdapter();

/**
 * Fetches and normalizes commodity price data.
 * On adapter failure → serves the last cached value (stale) if available.
 */
export async function fetchCommodityPrices(): Promise<
  { data: CommoditiesNormalized; stale: boolean } | { error: AdapterError }
> {
  const cacheKey = "commodities:latest:INR";

  try {
    const raw = await commodityAdapter.fetchData();
    return { data: commodityAdapter.normalizeData(raw), stale: false };
  } catch (err: any) {
    // Try stale cache
    const staleRaw = await getCache<CommodityRaw>(cacheKey);
    if (staleRaw) {
      logger.warn("adapter.stale_cache.served", {
        provider: PROVIDER,
        endpoint: `${BASE_URL}/latest`,
        status: "stale",
        detail: err.message,
      });
      return { data: commodityAdapter.normalizeData(staleRaw), stale: true };
    }

    logger.error("adapter.fetch.failed", {
      provider: PROVIDER,
      endpoint: `${BASE_URL}/latest`,
      status: "error",
      detail: err.message,
    });
    return { error: makeAdapterError(PROVIDER, "Failed to fetch commodity prices", err.message) };
  }
}
