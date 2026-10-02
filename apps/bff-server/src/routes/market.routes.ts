// Phase 6: Market-data routes — all authenticated.
// Exposes 4 external financial API adapters + a health endpoint.
import { Router } from "express";
import {
  getMfNav,
  getForexRates,
  getEconomicIndicators,
  getCommodityPrices,
  getMarketHealth,
} from "../controllers/market.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);

/**
 * GET /api/v1/market/nav?schemeCode=119598
 * Returns normalized mutual-fund NAV data from mfapi.in.
 */
router.get("/nav", getMfNav);

/**
 * GET /api/v1/market/forex?base=INR
 * Returns normalized forex exchange rates from exchangerate-api.com.
 */
router.get("/forex", getForexRates);

/**
 * GET /api/v1/market/economic-indicators?country=IN
 * Returns inflation, GDP growth, and real interest rate from World Bank API.
 */
router.get("/economic-indicators", getEconomicIndicators);

/**
 * GET /api/v1/market/commodities
 * Returns gold, silver, and crude oil prices in INR from commodities-api.com.
 */
router.get("/commodities", getCommodityPrices);

/**
 * GET /api/v1/market/health
 * Liveness probe for all 4 external providers.
 * Returns HTTP 200 (all ok) or 207 (degraded — partial providers up).
 */
router.get("/health", getMarketHealth);

export default router;
