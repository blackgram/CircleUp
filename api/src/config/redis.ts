import Redis from "ioredis";
import { env } from "./env";
import { logger } from "../utils/logger";

let redis: Redis | null = null;

if (env.REDIS_URL) {
  redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 5) {
        logger.warn("Redis retry limit reached, giving up");
        return null;
      }
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });

  redis.connect().then(() => {
    logger.info("Connected to Redis");
  }).catch((err) => {
    logger.warn(err, "Redis unavailable, falling back to in-memory");
    redis = null;
  });

  redis.on("error", (err) => {
    logger.error(err, "Redis connection error");
  });
} else {
  logger.info("No REDIS_URL configured, using in-memory fallback");
}

export { redis };
