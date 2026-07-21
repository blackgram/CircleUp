import http from "http";
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
  server.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });
});

export { server, io };
