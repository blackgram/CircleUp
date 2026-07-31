import dotenv from "dotenv";

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "3000", 10),
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  DATABASE_URL: process.env.DATABASE_URL || "",
  REDIS_URL: process.env.REDIS_URL,
  JWT_SECRET: process.env.JWT_SECRET || "circleup-lan-default-secret",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "circleup-lan-default-refresh",
  JWT_ACCESS_EXPIRY: parseInt(process.env.JWT_ACCESS_EXPIRY || "900", 10),
  JWT_REFRESH_EXPIRY: parseInt(process.env.JWT_REFRESH_EXPIRY || "604800", 10),
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",
  LAN_MODE: process.env.LAN_MODE === "true" || !process.env.DATABASE_URL,
};
