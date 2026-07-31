import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "../utils/logger";

export async function connectDatabase(): Promise<void> {
  if (env.LAN_MODE) {
    logger.info("LAN mode enabled — skipping MongoDB connection");
    return;
  }

  try {
    await mongoose.connect(env.DATABASE_URL);
    logger.info("Connected to MongoDB");
  } catch (err) {
    logger.fatal(err, "MongoDB connection error");
    process.exit(1);
  }
}
