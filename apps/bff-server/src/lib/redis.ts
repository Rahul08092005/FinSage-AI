// Single shared Redis client. Used for session caching + job queues
// (OCR, embeddings, CSV imports — Phase 3+).
import Redis from "ioredis";

export function sanitizeRedisUrl(raw?: string): string {
  if (!raw) return "redis://127.0.0.1:6379";
  let url = raw.trim();

  // If user pasted CLI command or multiple URLs (e.g. "redis://redis-cli --tls -u redis://default:...")
  const matches = url.match(/(rediss?:\/\/[^\s"']+)/g);
  if (matches && matches.length > 0) {
    url = matches[matches.length - 1];
  }

  // Upstash cloud endpoints require TLS (rediss://)
  if (url.includes("upstash.io") && url.startsWith("redis://")) {
    url = url.replace(/^redis:\/\//, "rediss://");
  }

  try {
    new URL(url);
    return url;
  } catch {
    console.warn(`[redis] Warning: Invalid REDIS_URL provided ("${raw}"). Falling back to dummy redis connection.`);
    return "redis://127.0.0.1:6379";
  }
}

const REDIS_URL = sanitizeRedisUrl(process.env.REDIS_URL);

function createRedisClient(): Redis {
  try {
    return new Redis(REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 3) return null; // stop reconnecting if Redis is offline
        return Math.min(times * 1000, 3000);
      },
    });
  } catch (err: any) {
    console.error("[redis] Failed to initialize Redis client:", err.message);
    return new Redis("redis://127.0.0.1:6379", { lazyConnect: true });
  }
}

export const redis = createRedisClient();

let loggedRedisError = false;
redis.on("error", (err) => {
  if (!loggedRedisError) {
    console.error("[redis] connection error (Redis may be offline):", err.message);
    loggedRedisError = true;
  }
});
