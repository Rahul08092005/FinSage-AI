// Single shared Redis client. Used later for session caching + job queues
// (OCR, embeddings, CSV imports — Phase 3+).
import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  retryStrategy(times) {
    if (times > 3) return null; // stop reconnecting if Redis is offline
    return Math.min(times * 1000, 3000);
  },
});

let loggedRedisError = false;
redis.on("error", (err) => {
  if (!loggedRedisError) {
    console.error("[redis] connection error (Redis may be offline):", err.message);
    loggedRedisError = true;
  }
});
