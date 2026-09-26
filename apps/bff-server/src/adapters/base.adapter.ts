/**
 * Base adapter interface for all external financial-API integrations.
 * Mirrors the pattern of apps/ai-engine/app/adapters/base_adapter.py
 * (read-only inspiration — nothing is imported from there).
 *
 * Every concrete adapter must implement:
 *   fetchData    — performs the real HTTP call with timeout + retry + circuit-breaker
 *   normalizeData — maps provider-specific shapes → FinSage canonical schema
 *   healthCheck  — lightweight liveness probe (used by GET /api/v1/market/health)
 *
 * Shared utilities (withRetry, withCircuitBreaker, redisCache) live here so
 * all adapters get identical resilience behaviour without code duplication.
 */

import { redis } from "../lib/redis";
import { logger } from "../lib/logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Every adapter must conform to this interface. */
export interface FinancialAdapter<TRaw, TNormalized> {
  readonly providerName: string;
  fetchData(params?: Record<string, string>): Promise<TRaw>;
  normalizeData(raw: TRaw): TNormalized;
  healthCheck(): Promise<boolean>;
}

/** Structured error returned from adapter failures. */
export interface AdapterError {
  error: string;
  provider: string;
  detail: string;
  cached?: boolean;
}

// ---------------------------------------------------------------------------
// Retry with exponential back-off
// ---------------------------------------------------------------------------

export interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  timeoutMs: number;
}

const DEFAULT_RETRY: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 500,
  timeoutMs: 8000,
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Wraps an async function with:
 *  - a hard AbortController timeout per attempt
 *  - exponential backoff between retries
 *  - 429 / Retry-After honour
 *
 * @throws the last error after all attempts are exhausted
 */
export async function withRetry<T>(
  provider: string,
  endpoint: string,
  fn: (signal: AbortSignal) => Promise<T>,
  opts: RetryOptions = DEFAULT_RETRY
): Promise<T> {
  let lastErr: unknown;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs);
    const start = Date.now();

    try {
      const result = await fn(controller.signal);
      clearTimeout(timer);
      logger.info("adapter.fetch.ok", {
        provider,
        endpoint,
        status: "ok",
        latencyMs: Date.now() - start,
        attempt,
      });
      return result;
    } catch (err: any) {
      clearTimeout(timer);
      lastErr = err;

      const latencyMs = Date.now() - start;
      const isAbort = err.name === "AbortError";
      const is429 = (err as any).__status === 429;
      const retryAfterMs = is429 ? ((err as any).__retryAfterMs ?? opts.baseDelayMs) : 0;

      logger.warn("adapter.fetch.attempt_failed", {
        provider,
        endpoint,
        status: isAbort ? "timeout" : (err as any).__status ?? "unknown",
        latencyMs,
        attempt,
        detail: err.message,
      });

      if (attempt < opts.maxAttempts) {
        const delay = is429
          ? retryAfterMs
          : Math.min(opts.baseDelayMs * Math.pow(2, attempt - 1), 16000);
        await sleep(delay);
      }
    }
  }

  logger.error("adapter.fetch.exhausted", {
    provider,
    endpoint,
    status: "exhausted",
    detail: String(lastErr),
  });
  throw lastErr;
}

// ---------------------------------------------------------------------------
// Circuit Breaker (simple in-process, half-open strategy)
// ---------------------------------------------------------------------------

interface CircuitState {
  failures: number;
  openUntil: number; // epoch ms
  halfOpen: boolean;
}

const CIRCUIT_THRESHOLD = 5;      // failures before opening
const CIRCUIT_OPEN_MS   = 30_000; // stay open for 30 s

const circuits = new Map<string, CircuitState>();

function getCircuit(key: string): CircuitState {
  if (!circuits.has(key)) {
    circuits.set(key, { failures: 0, openUntil: 0, halfOpen: false });
  }
  return circuits.get(key)!;
}

/**
 * Wraps a call with circuit-breaker logic.
 * On success → resets failure count.
 * On failure → increments counter; opens circuit after threshold.
 * When open  → immediately throws AdapterError without calling fn.
 */
export async function withCircuitBreaker<T>(
  provider: string,
  fn: () => Promise<T>
): Promise<T> {
  const state = getCircuit(provider);
  const now = Date.now();

  if (state.openUntil > now) {
    // Circuit is open — short-circuit
    throw makeAdapterError(provider, "Circuit breaker open — provider temporarily unavailable", "circuit_open");
  }

  if (state.openUntil > 0 && state.openUntil <= now) {
    // Transition to half-open: allow one probe
    state.halfOpen = true;
    state.openUntil = 0;
  }

  try {
    const result = await fn();
    // Success → reset circuit
    state.failures = 0;
    state.halfOpen = false;
    return result;
  } catch (err) {
    state.failures += 1;
    if (state.failures >= CIRCUIT_THRESHOLD) {
      state.openUntil = Date.now() + CIRCUIT_OPEN_MS;
      state.halfOpen = false;
      logger.error("adapter.circuit.opened", {
        provider,
        endpoint: "circuit",
        status: "open",
        detail: `${state.failures} consecutive failures — circuit opened for ${CIRCUIT_OPEN_MS / 1000}s`,
      });
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Redis cache helpers
// ---------------------------------------------------------------------------

/**
 * Try to return a cached value from Redis.
 * On miss or Redis unavailability → returns null (caller must fetch fresh).
 */
export async function getCache<T>(cacheKey: string): Promise<T | null> {
  try {
    const raw = await redis.get(cacheKey);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Store a value in Redis with a TTL.
 * Silently swallows errors so a Redis outage never breaks the API path.
 */
export async function setCache(cacheKey: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    await redis.set(cacheKey, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // Non-fatal — cache write failure does not block the response
  }
}

// ---------------------------------------------------------------------------
// Shared helper: fetchWithStatus
// Wraps the native fetch so HTTP ≥ 400 surfaces as a typed error
// ---------------------------------------------------------------------------

interface StatusError extends Error {
  __status: number;
  __retryAfterMs?: number;
}

export async function fetchWithStatus(
  url: string,
  init: RequestInit & { signal?: AbortSignal }
): Promise<Response> {
  const res = await fetch(url, init);

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const err = new Error(`HTTP ${res.status}: ${body}`) as StatusError;
    err.__status = res.status;

    if (res.status === 429) {
      const retryAfter = res.headers.get("Retry-After");
      err.__retryAfterMs = retryAfter ? Number(retryAfter) * 1000 : 5000;
    }
    throw err;
  }

  return res;
}

// ---------------------------------------------------------------------------
// Convenience: build a structured AdapterError object
// ---------------------------------------------------------------------------

export function makeAdapterError(provider: string, message: string, detail: unknown): AdapterError {
  return {
    error: message,
    provider,
    detail: String(detail),
  };
}
