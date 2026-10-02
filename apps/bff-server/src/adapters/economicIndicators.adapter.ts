/**
 * Economic Indicators Adapter — World Bank Open Data API
 * =======================================================
 * Provider : api.worldbank.org  (free, no API key required)
 * Endpoint : GET https://api.worldbank.org/v2/country/IN/indicator/{indicator}?format=json&mrv=1
 *
 * Selected indicators used by FinSage:
 *   FP.CPI.TOTL.ZG  — Inflation, consumer prices (annual %)
 *   NY.GDP.MKTP.KD.ZG — GDP growth (annual %)
 *   FR.INR.RINR      — Real interest rate (%)
 *
 * Normalized output schema:
 * {
 *   provider:    "worldbank",
 *   country:     string,           // e.g. "India"
 *   countryCode: string,           // "IN"
 *   indicators: [
 *     {
 *       id:          string,       // indicator code
 *       name:        string,       // human-readable name
 *       value:       number | null,
 *       year:        number,
 *       unit:        string        // e.g. "% per annum"
 *     }
 *   ],
 *   fetchedAt:   string            // ISO-8601 timestamp
 * }
 *
 * Redis cache TTL: 86400 s (24 hours) — World Bank data updates annually.
 *
 * Env vars required: none (public API — no key needed).
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

const PROVIDER = "worldbank";
const BASE_URL = "https://api.worldbank.org/v2";
const CACHE_TTL_S = 86400; // 24 hours
const RETRY_OPTS: RetryOptions = { maxAttempts: 3, baseDelayMs: 800, timeoutMs: 10000 };

// Indicators we care about for Indian users
export const INDICATORS = {
  INFLATION: "FP.CPI.TOTL.ZG",
  GDP_GROWTH: "NY.GDP.MKTP.KD.ZG",
  INTEREST_RATE: "FR.INR.RINR",
} as const;

// ---------------------------------------------------------------------------
// Zod validation schema for raw World Bank indicator response
// ---------------------------------------------------------------------------
// World Bank returns an array of 2 items: [metadata, data[]]

const wbIndicatorEntrySchema = z.object({
  indicator: z.object({ id: z.string(), value: z.string() }),
  country: z.object({ id: z.string(), value: z.string() }),
  date: z.string(),
  value: z.number().nullable(),
});

const wbResponseSchema = z.tuple([
  z.object({ page: z.number() }), // metadata
  z.array(wbIndicatorEntrySchema).min(1),
]);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WbIndicatorEntry = z.infer<typeof wbIndicatorEntrySchema>;

export interface BankStatementRaw {
  indicatorId: string;
  entries: WbIndicatorEntry[];
}

export interface EconomicIndicatorItem {
  id: string;
  name: string;
  value: number | null;
  year: number;
  unit: string;
}

export interface EconomicIndicatorsNormalized {
  provider: string;
  country: string;
  countryCode: string;
  indicators: EconomicIndicatorItem[];
  fetchedAt: string;
}

// Unit labels per indicator
const UNITS: Record<string, string> = {
  [INDICATORS.INFLATION]: "% per annum",
  [INDICATORS.GDP_GROWTH]: "% per annum",
  [INDICATORS.INTEREST_RATE]: "% per annum",
};

// ---------------------------------------------------------------------------
// Adapter implementation
// ---------------------------------------------------------------------------

export class EconomicIndicatorsAdapter
  implements FinancialAdapter<BankStatementRaw[], EconomicIndicatorsNormalized>
{
  readonly providerName = PROVIDER;

  private country: string;
  private indicatorIds: string[];

  constructor(country: string = "IN", indicatorIds: string[] = Object.values(INDICATORS)) {
    this.country = country;
    this.indicatorIds = indicatorIds;
  }

  // ---- fetchData -----------------------------------------------------------

  async fetchData(_params?: Record<string, string>): Promise<BankStatementRaw[]> {
    const country = _params?.country ?? this.country;
    const cacheKey = `worldbank:indicators:${country}`;

    // 1. Try cache
    const cached = await getCache<BankStatementRaw[]>(cacheKey);
    if (cached) {
      logger.debug("adapter.cache.hit", {
        provider: PROVIDER,
        endpoint: `${BASE_URL}/country/${country}/indicator/*`,
        status: "hit",
      });
      return cached;
    }

    // 2. Fetch each indicator in parallel (3 lightweight calls)
    const results: BankStatementRaw[] = await Promise.all(
      this.indicatorIds.map((id) => this._fetchOneIndicator(country, id))
    );

    // 3. Cache the combined result
    await setCache(cacheKey, results, CACHE_TTL_S);
    return results;
  }

  private async _fetchOneIndicator(country: string, indicatorId: string): Promise<BankStatementRaw> {
    const endpoint = `${BASE_URL}/country/${country}/indicator/${indicatorId}?format=json&mrv=1`;

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

    const parsed = wbResponseSchema.safeParse(raw);
    if (!parsed.success) {
      logger.error("adapter.validation.failed", {
        provider: PROVIDER,
        endpoint,
        status: "validation_error",
        detail: JSON.stringify(parsed.error.flatten()),
      });
      throw new Error(`World Bank response validation failed for ${indicatorId}`);
    }

    return { indicatorId, entries: parsed.data[1] };
  }

  // ---- normalizeData -------------------------------------------------------

  normalizeData(raw: BankStatementRaw[]): EconomicIndicatorsNormalized {
    const firstEntry = raw[0]?.entries[0];
    const country = firstEntry?.country.value ?? "India";
    const countryCode = firstEntry?.country.id ?? "IN";

    const indicators: EconomicIndicatorItem[] = raw
      .filter((r) => r.entries.length > 0)
      .map((r) => {
        const entry = r.entries[0];
        return {
          id: entry.indicator.id,
          name: entry.indicator.value,
          value: entry.value,
          year: parseInt(entry.date, 10),
          unit: UNITS[r.indicatorId] ?? "%",
        };
      });

    return {
      provider: PROVIDER,
      country,
      countryCode,
      indicators,
      fetchedAt: new Date().toISOString(),
    };
  }

  // ---- healthCheck ---------------------------------------------------------

  async healthCheck(): Promise<boolean> {
    try {
      const endpoint = `${BASE_URL}/country/IN/indicator/${INDICATORS.INFLATION}?format=json&mrv=1`;
      const res = await fetchWithStatus(endpoint, {});
      return res.status === 200;
    } catch {
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton export + convenience fetch-and-normalize with stale-cache fallback
// ---------------------------------------------------------------------------

export const economicAdapter = new EconomicIndicatorsAdapter();

/**
 * Fetches and normalizes economic indicator data.
 * On adapter failure → serves the last cached value (stale) if available.
 */
export async function fetchEconomicIndicators(
  country: string = "IN"
): Promise<{ data: EconomicIndicatorsNormalized; stale: boolean } | { error: AdapterError }> {
  const adapter = new EconomicIndicatorsAdapter(country);
  const cacheKey = `worldbank:indicators:${country}`;

  try {
    const raw = await adapter.fetchData({ country });
    return { data: adapter.normalizeData(raw), stale: false };
  } catch (err: any) {
    // Try stale cache
    const staleRaw = await getCache<BankStatementRaw[]>(cacheKey);
    if (staleRaw) {
      logger.warn("adapter.stale_cache.served", {
        provider: PROVIDER,
        endpoint: `${BASE_URL}/country/${country}/indicator/*`,
        status: "stale",
        detail: err.message,
      });
      return { data: adapter.normalizeData(staleRaw), stale: true };
    }

    logger.error("adapter.fetch.failed", {
      provider: PROVIDER,
      endpoint: `${BASE_URL}/country/${country}/indicator/*`,
      status: "error",
      detail: err.message,
    });
    return {
      error: makeAdapterError(PROVIDER, "Failed to fetch economic indicators", err.message),
    };
  }
}
