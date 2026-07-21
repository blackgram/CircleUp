import { redis } from "../../config/redis";
import { env } from "../../config/env";

const TOKEN_BLACKLIST_PREFIX = "bl:";

// In-memory fallback when Redis is unavailable
const memoryBlacklist = new Map<string, number>();

function cleanupMemory() {
  const now = Date.now();
  for (const [key, expiresAt] of memoryBlacklist) {
    if (expiresAt <= now) {
      memoryBlacklist.delete(key);
    }
  }
}

// Cleanup every 5 minutes
setInterval(cleanupMemory, 5 * 60 * 1000);

export class TokenBlacklistService {
  async blacklist(token: string): Promise<void> {
    const ttl = env.JWT_ACCESS_EXPIRY;

    if (redis) {
      try {
        await redis.setex(TOKEN_BLACKLIST_PREFIX + token, ttl, "1");
        return;
      } catch {
        // Fall through to memory
      }
    }

    memoryBlacklist.set(token, Date.now() + ttl * 1000);
  }

  async isBlacklisted(token: string): Promise<boolean> {
    if (redis) {
      try {
        const result = await redis.get(TOKEN_BLACKLIST_PREFIX + token);
        return result !== null;
      } catch {
        // Fall through to memory
      }
    }

    const expiresAt = memoryBlacklist.get(token);
    if (!expiresAt) return false;
    if (expiresAt <= Date.now()) {
      memoryBlacklist.delete(token);
      return false;
    }
    return true;
  }
}

export const tokenBlacklistService = new TokenBlacklistService();
