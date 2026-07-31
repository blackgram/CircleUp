import crypto from "crypto";
import { roomStorage } from "../storage";
import { userRepository } from "../repositories/UserRepository";
import { Room, RoomPlayer } from "../models/Room";
import { RoomStatus } from "../enums";
import { RoomResponse, RoomPlayerResponse } from "../dto/responses";
import { GameSession } from "../types";
import { gameEngine } from "../game-engine";

function generateRoomCode(): string {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

function generateId(): string {
  return crypto.randomBytes(12).toString("hex");
}

export class RoomService {
  async create(userId: string, maxPlayers: number = 8, privateRoom: boolean = true): Promise<RoomResponse> {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error("User not found");

    const room: Room = {
      id: generateId(),
      roomCode: generateRoomCode(),
      hostId: userId,
      status: RoomStatus.WAITING,
      players: [
        {
          userId,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
          socketId: "",
          ready: false,
          connected: true,
          role: "player",
          joinedAt: new Date(),
        },
      ],
      settings: {
        maxPlayers,
        privateRoom,
        allowReconnect: true,
        gameOptions: {},
      },
      createdAt: new Date(),
    };

    await roomStorage.createRoom(room);
    return this.toResponse(room);
  }

  async join(userId: string, roomCode: string): Promise<RoomResponse> {
    const room = await roomStorage.getRoom(roomCode);
    if (!room) throw new Error("Room not found");

    // Allow existing players to reconnect regardless of room status
    const existing = room.players.find((p) => p.userId === userId);
    if (existing) {
      existing.connected = true;
      await roomStorage.updateRoom(roomCode, room);
      return this.toResponse(room);
    }

    // New players can only join during WAITING
    if (room.status !== RoomStatus.WAITING) {
      throw new Error("Room is not accepting players");
    }

    if (room.players.length >= room.settings.maxPlayers) {
      throw new Error("Room is full");
    }

    const user = await userRepository.findById(userId);
    if (!user) throw new Error("User not found");

    const player: RoomPlayer = {
      userId,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      socketId: "",
      ready: false,
      connected: true,
      role: "player",
      joinedAt: new Date(),
    };

    // Remove any potential duplicates before adding (defensive)
    room.players = room.players.filter((p) => p.userId !== userId);
    room.players.push(player);
    await roomStorage.updateRoom(roomCode, room);
    return this.toResponse(room);
  }

  async leave(userId: string, roomCode: string): Promise<void> {
    const room = await roomStorage.getRoom(roomCode);
    if (!room) throw new Error("Room not found");

    room.players = room.players.filter((p) => p.userId !== userId);

    if (room.players.length === 0) {
      await roomStorage.deleteRoom(roomCode);
      return;
    }

    // Transfer host if the host left
    if (room.hostId === userId) {
      room.hostId = room.players[0].userId;
    }

    await roomStorage.updateRoom(roomCode, room);
  }

  async kick(hostId: string, targetUserId: string, roomCode: string): Promise<void> {
    const room = await roomStorage.getRoom(roomCode);
    if (!room) throw new Error("Room not found");
    if (room.hostId !== hostId) throw new Error("Only the host can kick players");
    if (targetUserId === hostId) throw new Error("Cannot kick yourself");

    const target = room.players.find((p) => p.userId === targetUserId);
    if (!target) throw new Error("Player not in room");

    room.players = room.players.filter((p) => p.userId !== targetUserId);
    await roomStorage.updateRoom(roomCode, room);
  }

  async getByCode(roomCode: string): Promise<RoomResponse> {
    const room = await roomStorage.getRoom(roomCode);
    if (!room) throw new Error("Room not found");
    return this.toResponse(room);
  }

  async deleteRoom(userId: string, roomCode: string): Promise<void> {
    const room = await roomStorage.getRoom(roomCode);
    if (!room) throw new Error("Room not found");
    if (room.hostId !== userId) throw new Error("Only the host can delete the room");
    await roomStorage.deleteRoom(roomCode);
  }

  async updateSettings(userId: string, roomCode: string, settings: Partial<Room["settings"]> & { gameSlug?: string }): Promise<RoomResponse> {
    const room = await roomStorage.getRoom(roomCode);
    if (!room) throw new Error("Room not found");
    if (room.hostId !== userId) throw new Error("Only the host can change settings");
    if (room.status !== RoomStatus.WAITING) throw new Error("Cannot change settings during a game");

    if (settings.gameSlug !== undefined) {
      room.gameSlug = settings.gameSlug;
      // Reset game options when game changes
      room.settings.gameOptions = {};
    }

    const { gameSlug: _, ...roomSettings } = settings;
    room.settings = { ...room.settings, ...roomSettings };
    await roomStorage.updateRoom(roomCode, room);
    return this.toResponse(room);
  }

  async startGame(userId: string, roomCode: string): Promise<GameSession> {
    const room = await roomStorage.getRoom(roomCode);
    if (!room) throw new Error("Room not found");
    if (room.hostId !== userId) throw new Error("Only the host can start the game");
    if (room.status !== RoomStatus.WAITING) throw new Error("Game already started");
    if (!room.gameSlug) throw new Error("No game selected");
    const activePlayers = room.players.filter((p) => p.role !== "spectator");
    if (activePlayers.length < 2) throw new Error("Need at least 2 players");

    const session: GameSession = {
      id: generateId(),
      roomId: room.id,
      gameSlug: room.gameSlug!,
      status: "STARTING",
      config: { ...room.settings.gameOptions },
      currentRound: 0,
      totalRounds: (room.settings.gameOptions.rounds as number) || 10,
      phase: "STARTING",
      scores: activePlayers.map((p) => ({ userId: p.userId, points: 0 })),
      rounds: [],
      metadata: {},
      startedAt: new Date(),
    };

    room.status = RoomStatus.PLAYING;
    room.sessionId = session.id;

    await roomStorage.createSession(session);
    await roomStorage.updateRoom(roomCode, room);

    return session;
  }

  async endGame(userId: string, roomCode: string): Promise<void> {
    const room = await roomStorage.getRoom(roomCode);
    if (!room) throw new Error("Room not found");
    if (room.hostId !== userId) throw new Error("Only the host can end the game");
    if (!room.sessionId) throw new Error("No active game");

    const session = await roomStorage.getSession(room.sessionId);
    if (session) {
      session.status = "FINISHED";
      session.endedAt = new Date();
      await roomStorage.updateSession(session.id, session);
    }

    room.status = RoomStatus.FINISHED;
    room.sessionId = undefined;
    await roomStorage.updateRoom(roomCode, room);
  }

  async returnToLobby(userId: string, roomCode: string): Promise<RoomResponse> {
    const room = await roomStorage.getRoom(roomCode);
    if (!room) throw new Error("Room not found");
    if (room.hostId !== userId) throw new Error("Only the host can return to lobby");

    room.status = RoomStatus.WAITING;
    room.sessionId = undefined;
    for (const player of room.players) {
      player.ready = false;
    }
    await roomStorage.updateRoom(roomCode, room);
    return this.toResponse(room);
  }

  async getPublicRooms(): Promise<RoomResponse[]> {
    const all = await roomStorage.getAllRooms();
    return all
      .filter((r) => !r.settings.privateRoom && r.status === RoomStatus.WAITING && r.players.length < r.settings.maxPlayers)
      .map((r) => this.toResponse(r));
  }

  private toResponse(room: Room): RoomResponse {
    return {
      roomCode: room.roomCode,
      hostId: room.hostId,
      gameSlug: room.gameSlug,
      status: room.status,
      players: room.players.map((p) => this.toPlayerResponse(p)),
      settings: room.settings,
    };
  }

  private toPlayerResponse(p: RoomPlayer): RoomPlayerResponse {
    return {
      userId: p.userId,
      nickname: p.nickname,
      avatarUrl: p.avatarUrl,
      ready: p.ready,
      connected: p.connected,
      role: p.role || "player",
      score: 0,
    };
  }

  async toggleSpectator(userId: string, roomCode: string): Promise<{ role: "player" | "spectator" }> {
    const room = await roomStorage.getRoom(roomCode);
    if (!room) throw new Error("Room not found");

    const player = room.players.find((p) => p.userId === userId);
    if (!player) throw new Error("Not in room");

    // Host cannot spectate
    if (room.hostId === userId) throw new Error("Host cannot spectate");

    // Can only toggle while waiting
    if (room.status !== RoomStatus.WAITING) throw new Error("Cannot change role during a game");

    player.role = player.role === "spectator" ? "player" : "spectator";
    // Spectators are automatically ready
    if (player.role === "spectator") {
      player.ready = true;
    }
    await roomStorage.updateRoom(roomCode, room);
    return { role: player.role };
  }
}

export const roomService = new RoomService();
