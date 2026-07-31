import http from "http";
import os from "os";
import app from "./app";
import { env } from "./config/env";
import { connectDatabase } from "./config/database";
import { createSocketServer } from "./config/socket";
import { registerSocketHandlers } from "./socket";
import { logger } from "./utils/logger";

const server = http.createServer(app);
const io = createSocketServer(server);

// Register socket event handlers
registerSocketHandlers(io as any);

connectDatabase().then(() => {
  server.listen(env.PORT, "0.0.0.0", () => {
    logger.info(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
    if (env.LAN_MODE) {
      const lanIp = Object.values(os.networkInterfaces())
        .flat()
        .find((i) => i && i.family === "IPv4" && !i.internal)?.address;
      if (lanIp) {
        logger.info(`LAN play available at: http://${lanIp}:${env.PORT}`);
      }
    }
  });
});

export { server, io };
