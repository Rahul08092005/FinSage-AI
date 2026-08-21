// Simple health checks the frontend + AI engine can ping to prove
// the BFF, Postgres, and Redis are all wired up correctly (for the demo video).
import { Router } from "express";
import { prisma } from "../lib/prisma";
import { redis } from "../lib/redis";

const router = Router();

router.get("/", async (_req, res) => {
  let dbStatus = "down";
  let redisStatus = "down";

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "up";
  } catch {
    dbStatus = "down";
  }

  try {
    const pong = await redis.ping();
    redisStatus = pong === "PONG" ? "up" : "down";
  } catch {
    redisStatus = "down";
  }

  res.json({
    service: "finsage-bff-server",
    status: "ok",
    database: dbStatus,
    redis: redisStatus,
    timestamp: new Date().toISOString(),
  });
});

export default router;
