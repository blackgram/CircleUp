import { Router } from "express";
import os from "os";
import { env } from "../config/env";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

healthRouter.get("/lan", (_req, res) => {
  const interfaces = Object.values(os.networkInterfaces()).flat();
  const lanIp = interfaces.find((i) => i && i.family === "IPv4" && !i.internal)?.address;

  res.json({
    success: true,
    data: {
      lanMode: env.LAN_MODE,
      ip: lanIp || null,
      port: env.PORT,
      url: lanIp ? `http://${lanIp}:${env.PORT}` : null,
    },
  });
});
