import { Server, Socket } from "socket.io";
import { socketAuthMiddleware } from "./socketAuth";
import { RoomGateway } from "./RoomGateway";
import { GameGateway } from "./GameGateway";
import { SocketManager } from "./SocketManager";
import { logger } from "../utils/logger";
import { ClientToServerEvents, ServerToClientEvents, SocketData } from "./events";

let socketManagerInstance: SocketManager | null = null;

export function getSocketManager(): SocketManager {
  if (!socketManagerInstance) throw new Error("SocketManager not initialized");
  return socketManagerInstance;
}

export function registerSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>
): void {
  // Auth middleware
  io.use(socketAuthMiddleware as any);

  const socketManager = new SocketManager(io as any);
  socketManagerInstance = socketManager;
  const roomGateway = new RoomGateway(io as any, socketManager);
  const gameGateway = new GameGateway(io as any, socketManager);

  io.on("connection", (socket: Socket) => {
    const { userId } = socket.data as SocketData;
    logger.info({ userId, socketId: socket.id }, "Socket connected");

    // ── Room Events ──

    socket.on("room:join", async (payload, ack) => {
      const result = await roomGateway.handleJoin(socket, payload);
      ack(result);
    });

    socket.on("room:leave", async (ack) => {
      const result = await roomGateway.handleLeave(socket);
      ack(result);
    });

    socket.on("player:ready", async (ack) => {
      const result = await roomGateway.handleReady(socket);
      ack(result);
    });

    // ── Game Events ──

    socket.on("game:start", async (ack) => {
      const result = await gameGateway.handleStart(socket);
      ack(result);
    });

    socket.on("game:action", async (payload, ack) => {
      const result = await gameGateway.handleAction(socket, payload);
      ack(result);
    });

    // ── Disconnect ──

    socket.on("disconnect", async () => {
      await roomGateway.handleDisconnect(socket);
      logger.info({ userId, socketId: socket.id }, "Socket disconnected");
    });
  });
}

export { SocketManager } from "./SocketManager";
