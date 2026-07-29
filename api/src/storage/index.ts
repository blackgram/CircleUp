import { redis } from "../config/redis";
import { logger } from "../utils/logger";
import { IRoomStorage } from "./IRoomStorage";
import { MemoryStorage } from "./MemoryStorage";
import { RedisStorage } from "./RedisStorage";

export { IRoomStorage } from "./IRoomStorage";
export { MemoryStorage } from "./MemoryStorage";
export { RedisStorage } from "./RedisStorage";

function createStorage(): IRoomStorage {
  if (redis) {
    logger.info("Using Redis for room/session storage");
    return new RedisStorage(redis);
  }
  logger.info("Using in-memory room/session storage (no Redis)");
  return new MemoryStorage();
}

export const roomStorage: IRoomStorage = createStorage();
