// Single shared Redis client. Used later for session caching + job queues
// (OCR, embeddings, CSV imports — Phase 3+).
import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(REDIS_URL);

redis.on("error", (err) => {
  console.error("[redis] connection error:", err.message);
});
