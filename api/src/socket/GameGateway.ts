import { Server, Socket } from "socket.io";
import { roomService } from "../services/RoomService";
import { gameSessionService } from "../services/GameSessionService";
import { roomStorage } from "../storage";
import { logger } from "../utils/logger";
import { SocketData, SocketResponse, GameActionPayload } from "./events";
import { SocketManager } from "./SocketManager";

export class GameGateway {
  constructor(private io: Server, private socketManager: SocketManager) {}

  async handleStart(socket: Socket): Promise<SocketResponse> {
    const { userId, roomCode } = socket.data as SocketData;

    if (!roomCode) {
      return { success: false, message: "Not in a room" };
    }

    try {
      const session = await roomService.startGame(userId, roomCode);

      // Broadcast both room state (status changed) and game state
      await this.socketManager.broadcastRoomState(roomCode);
      await this.socketManager.broadcastGameState(roomCode, session);

      logger.info({ userId, roomCode, sessionId: session.id }, "Game started");
      return { success: true, data: { sessionId: session.id } };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async handleAction(socket: Socket, payload: GameActionPayload): Promise<SocketResponse> {
    const { userId, roomCode } = socket.data as SocketData;

    if (!roomCode) {
      return { success: false, message: "Not in a room" };
    }

    try {
      const room = await roomStorage.getRoom(roomCode);
      if (!room || !room.sessionId) {
        return { success: false, message: "No active game" };
      }

      // Delegate all game logic to GameSessionService
      const session = await gameSessionService.handleAction(
        room.sessionId,
        userId,
        payload.action,
        payload.payload
      );

      // Broadcast updated game state
      await this.socketManager.broadcastGameState(roomCode, session);

      // If game ended, broadcast that too
      if (session.status === "FINISHED") {
        this.socketManager.broadcastGameEnded(roomCode, session);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }
}
