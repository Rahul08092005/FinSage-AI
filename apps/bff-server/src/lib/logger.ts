/**
 * Centralized structured logger for FinSage BFF.
 * All adapter failures, external-API calls, and infrastructure events are
 * routed through here so every log line has a consistent shape that can be
 * ingested by any log aggregator (Datadog, CloudWatch, etc.).
 *
 * Shape emitted for adapter events:
 *   { level, timestamp, provider, endpoint, status, latencyMs, message, detail? }
 */

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface AdapterLogContext {
  provider: string;
  endpoint: string;
  status?: number | string;
  latencyMs?: number;
  detail?: unknown;
}

function format(level: LogLevel, message: string, ctx?: AdapterLogContext | Record<string, unknown>): string {
  return JSON.stringify({
    level,
    timestamp: new Date().toISOString(),
    message,
    ...(ctx ?? {}),
  });
}

export const logger = {
  info(message: string, ctx?: AdapterLogContext | Record<string, unknown>): void {
    console.log(format("info", message, ctx));
  },
  warn(message: string, ctx?: AdapterLogContext | Record<string, unknown>): void {
    console.warn(format("warn", message, ctx));
  },
  error(message: string, ctx?: AdapterLogContext | Record<string, unknown>): void {
    console.error(format("error", message, ctx));
  },
  debug(message: string, ctx?: AdapterLogContext | Record<string, unknown>): void {
    if (process.env.LOG_LEVEL === "debug") {
      console.debug(format("debug", message, ctx));
    }
  },
};
