import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { env } from "./env";

export function createSocketServer(httpServer: HttpServer): Server {
  const origins = env.CORS_ORIGIN.includes(",")
    ? env.CORS_ORIGIN.split(",").map((o) => o.trim())
    : env.CORS_ORIGIN;

  const io = new Server(httpServer, {
    cors: {
      origin: origins,
      methods: ["GET", "POST"],
    },
  });

  return io;
}
