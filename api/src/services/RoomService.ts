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

    if (room.status !== RoomStatus.WAITING) {
      throw new Error("Room is not accepting players");
    }

    if (room.players.length >= room.settings.maxPlayers) {
      throw new Error("Room is full");
    }

    const existing = room.players.find((p) => p.userId === userId);
    if (existing) {
      existing.connected = true;
      await roomStorage.updateRoom(roomCode, room);
      return this.toResponse(room);
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
      joinedAt: new Date(),
    };

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
    if (room.players.length < 2) throw new Error("Need at least 2 players");

    const session: GameSession = {
      id: generateId(),
      roomId: room.id,
      gameSlug: room.gameSlug!,
      status: "STARTING",
      config: { ...room.settings.gameOptions },
      currentRound: 0,
      totalRounds: (room.settings.gameOptions.rounds as number) || 10,
      phase: "STARTING",
      scores: room.players.map((p) => ({ userId: p.userId, points: 0 })),
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
      score: 0,
    };
  }
}

export const roomService = new RoomService();
