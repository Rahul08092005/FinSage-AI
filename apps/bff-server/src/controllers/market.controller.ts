// Phase 6: Market-data controller — exposes normalized data from the 4 external
// financial API adapters (MF NAV, Forex, Economic Indicators, Commodities).
// Error handling mirrors analytics.controller.ts (502/503 pattern).
// All routes are authenticated via requireAuth middleware in market.routes.ts.
import { Response } from "express";
import { AuthedRequest } from "../middleware/auth.middleware";
import { fetchMarketData, MarketDataAdapter } from "../adapters/marketData.adapter";
import { fetchForexRates, ForexAdapter } from "../adapters/forex.adapter";
import { fetchEconomicIndicators, EconomicIndicatorsAdapter } from "../adapters/economicIndicators.adapter";
import { fetchCommodityPrices, CommodityAdapter } from "../adapters/commodity.adapter";
import { logger } from "../lib/logger";

// ---------------------------------------------------------------------------
// GET /api/v1/market/nav
// Query params: schemeCode (optional, defaults to Axis Bluechip Fund 119598)
// ---------------------------------------------------------------------------
export async function getMfNav(req: AuthedRequest, res: Response) {
  const { schemeCode } = req.query as Record<string, string | undefined>;
  const result = await fetchMarketData(schemeCode);

  if ("error" in result) {
    return res.status(502).json(result);
  }

  return res.json({
    ...result.data,
    ...(result.stale ? { _stale: true, _staleWarning: "Serving cached data — provider unavailable" } : {}),
  });
}

// ---------------------------------------------------------------------------
// GET /api/v1/market/forex
// Query params: base (optional, defaults to "INR")
// ---------------------------------------------------------------------------
export async function getForexRates(req: AuthedRequest, res: Response) {
  const { base } = req.query as Record<string, string | undefined>;
  const result = await fetchForexRates(base ?? "INR");

  if ("error" in result) {
    return res.status(502).json(result);
  }

  return res.json({
    ...result.data,
    ...(result.stale ? { _stale: true, _staleWarning: "Serving cached data — provider unavailable" } : {}),
  });
}

// ---------------------------------------------------------------------------
// GET /api/v1/market/economic-indicators
// Query params: country (optional, defaults to "IN" = India)
// ---------------------------------------------------------------------------
export async function getEconomicIndicators(req: AuthedRequest, res: Response) {
  const { country } = req.query as Record<string, string | undefined>;
  const result = await fetchEconomicIndicators(country ?? "IN");

  if ("error" in result) {
    return res.status(502).json(result);
  }

  return res.json({
    ...result.data,
    ...(result.stale ? { _stale: true, _staleWarning: "Serving cached data — provider unavailable" } : {}),
  });
}

// ---------------------------------------------------------------------------
// GET /api/v1/market/commodities
// No query params — returns Gold, Silver, Crude Oil prices in INR
// ---------------------------------------------------------------------------
export async function getCommodityPrices(req: AuthedRequest, res: Response) {
  const result = await fetchCommodityPrices();

  if ("error" in result) {
    return res.status(502).json(result);
  }

  return res.json({
    ...result.data,
    ...(result.stale ? { _stale: true, _staleWarning: "Serving cached data — provider unavailable" } : {}),
  });
}

// ---------------------------------------------------------------------------
// GET /api/v1/market/health
// Lightweight liveness check for all 4 providers (no cache bypass — just pings)
// ---------------------------------------------------------------------------
export async function getMarketHealth(req: AuthedRequest, res: Response) {
  const [mfOk, forexOk, ecoOk, commodOk] = await Promise.allSettled([
    new MarketDataAdapter().healthCheck(),
    new ForexAdapter().healthCheck(),
    new EconomicIndicatorsAdapter().healthCheck(),
    new CommodityAdapter().healthCheck(),
  ]);

  const health = {
    mfapi: mfOk.status === "fulfilled" ? mfOk.value : false,
    forex: forexOk.status === "fulfilled" ? forexOk.value : false,
    worldbank: ecoOk.status === "fulfilled" ? ecoOk.value : false,
    commodities: commodOk.status === "fulfilled" ? commodOk.value : false,
  };

  const allHealthy = Object.values(health).every(Boolean);
  logger.info("adapter.health_check", {
    provider: "all",
    endpoint: "/api/v1/market/health",
    status: allHealthy ? "ok" : "degraded",
  });

  return res.status(allHealthy ? 200 : 207).json({
    status: allHealthy ? "ok" : "degraded",
    providers: health,
    checkedAt: new Date().toISOString(),
  });
}
