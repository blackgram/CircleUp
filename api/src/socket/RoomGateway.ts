import { Server, Socket } from "socket.io";
import { roomService } from "../services/RoomService";
import { roomStorage } from "../storage";
import { logger } from "../utils/logger";
import { SocketData, SocketResponse } from "./events";
import { SocketManager } from "./SocketManager";

export class RoomGateway {
  constructor(private io: Server, private socketManager: SocketManager) {}

  async handleJoin(socket: Socket, payload: { roomCode: string }): Promise<SocketResponse> {
    const { userId } = socket.data as SocketData;
    const { roomCode } = payload;

    try {
      await roomService.join(userId, roomCode);

      // Leave any previous room
      const previousRoom = (socket.data as SocketData).roomCode;
      if (previousRoom && previousRoom !== roomCode) {
        socket.leave(previousRoom);
      }

      // Join socket room and track
      socket.join(roomCode);
      (socket.data as SocketData).roomCode = roomCode;

      // Update socket ID and connected status in storage
      const room = await roomStorage.getRoom(roomCode);
      if (room) {
        const player = room.players.find((p) => p.userId === userId);
        if (player) {
          player.socketId = socket.id;
          player.connected = true;
          await roomStorage.updateRoom(roomCode, room);
        }

        // Broadcast full room state to everyone (snapshot approach)
        await this.socketManager.broadcastRoomState(roomCode);

        // If a game is in progress, send current game state to the reconnecting player
        if (room.status === "PLAYING" && room.sessionId) {
          await this.socketManager.emitGameStateToSocket(socket.id, roomCode);
        }
      }

      logger.info({ userId, roomCode }, "Player joined room");
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async handleLeave(socket: Socket): Promise<SocketResponse> {
    const { userId, roomCode } = socket.data as SocketData;

    if (!roomCode) {
      return { success: false, message: "Not in a room" };
    }

    try {
      await roomService.leave(userId, roomCode);

      socket.leave(roomCode);
      (socket.data as SocketData).roomCode = undefined;

      // Broadcast updated state to remaining players
      await this.socketManager.broadcastRoomState(roomCode);

      logger.info({ userId, roomCode }, "Player left room");
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async handleKick(socket: Socket, payload: { userId: string }): Promise<SocketResponse> {
    const { userId, roomCode } = socket.data as SocketData;
    const targetUserId = payload.userId;

    if (!roomCode) {
      return { success: false, message: "Not in a room" };
    }

    try {
      await roomService.kick(userId, targetUserId, roomCode);

      // Notify the kicked player's socket
      const room = await roomStorage.getRoom(roomCode);
      // Find the kicked player's socket and remove them from the room channel
      const sockets = await this.io.in(roomCode).fetchSockets();
      for (const s of sockets) {
        if ((s.data as SocketData).userId === targetUserId) {
          s.emit("room:kicked", { message: "You were kicked from the circle" });
          s.leave(roomCode);
          (s.data as SocketData).roomCode = undefined;
        }
      }

      // Broadcast updated room state to remaining players
      await this.socketManager.broadcastRoomState(roomCode);

      logger.info({ hostId: userId, targetUserId, roomCode }, "Player kicked");
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async handleReady(socket: Socket): Promise<SocketResponse> {
    const { userId, roomCode } = socket.data as SocketData;

    if (!roomCode) {
      return { success: false, message: "Not in a room" };
    }

    try {
      const room = await roomStorage.getRoom(roomCode);
      if (!room) return { success: false, message: "Room not found" };

      const player = room.players.find((p) => p.userId === userId);
      if (!player) return { success: false, message: "Not in room" };

      player.ready = !player.ready;
      await roomStorage.updateRoom(roomCode, room);

      // Broadcast snapshot
      await this.socketManager.broadcastRoomState(roomCode);

      return { success: true, data: { ready: player.ready } };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async handleDisconnect(socket: Socket): Promise<void> {
    const { userId, roomCode } = socket.data as SocketData;

    if (!roomCode) return;

    const room = await roomStorage.getRoom(roomCode);
    if (!room) return;

    const player = room.players.find((p) => p.userId === userId);
    if (player) {
      player.connected = false;
      player.socketId = "";

      // Transfer host if the disconnecting user is the host
      if (room.hostId === userId) {
        const connectedPlayer = room.players.find((p) => p.userId !== userId && p.connected);
        if (connectedPlayer) {
          room.hostId = connectedPlayer.userId;
          logger.info({ roomCode, oldHost: userId, newHost: connectedPlayer.userId }, "Host transferred on disconnect");
        }
      }

      await roomStorage.updateRoom(roomCode, room);

      await this.socketManager.broadcastRoomState(roomCode);
      logger.info({ userId, roomCode }, "Player disconnected");
    }
  }
}
