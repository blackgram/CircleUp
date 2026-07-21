import { IRoomStorage } from "./IRoomStorage";
import { MemoryStorage } from "./MemoryStorage";

export { IRoomStorage } from "./IRoomStorage";
export { MemoryStorage } from "./MemoryStorage";

// TODO: add RedisStorage when Redis is available
export const roomStorage: IRoomStorage = new MemoryStorage();
