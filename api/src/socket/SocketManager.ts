import crypto from "crypto";
import { Server } from "socket.io";
import { roomStorage } from "../storage";
import { roomService } from "../services/RoomService";
import { GameSession } from "../types";
import { logger } from "../utils/logger";
import { RoomStatePayload, GameStatePayload, PlayerPayload } from "./events";

function eventId(): string {
  return crypto.randomBytes(8).toString("hex");
}

export class SocketManager {
  constructor(private io: Server) {}

  async broadcastRoomState(roomCode: string): Promise<void> {
    const room = await roomStorage.getRoom(roomCode);
    if (!room) return;

    const payload: RoomStatePayload = {
      eventId: eventId(),
      roomCode: room.roomCode,
      hostId: room.hostId,
      gameSlug: room.gameSlug,
      status: room.status,
      players: room.players.map((p): PlayerPayload => ({
        userId: p.userId,
        nickname: p.nickname,
        avatarUrl: p.avatarUrl,
        ready: p.ready,
        connected: p.connected,
      })),
      settings: room.settings as any,
    };

    this.io.to(roomCode).emit("room:update", payload);
    logger.debug({ roomCode, eventId: payload.eventId }, "Broadcast room:update");
  }

  async broadcastGameState(roomCode: string, session: GameSession): Promise<void> {
    const roundData = this.getPublicRoundData(session);
    const data: Record<string, unknown> | undefined = roundData
      ? { ...roundData, ...(session.metadata.exposedRecap ? { exposedRecap: session.metadata.exposedRecap } : {}) }
      : session.metadata.exposedRecap ? { exposedRecap: session.metadata.exposedRecap } : undefined;

    const payload: GameStatePayload = {
      eventId: eventId(),
      sessionId: session.id,
      phase: session.phase,
      currentRound: session.currentRound,
      totalRounds: session.totalRounds,
      scores: session.scores,
      endsAt: session.metadata.roundEndsAt as string | undefined,
      version: session.metadata.version as number || 0,
      data,
    };

    this.io.to(roomCode).emit("game:update", payload);
    logger.debug({ roomCode, version: payload.version, phase: session.phase }, "Broadcast game:update");
  }

  async emitGameStateToSocket(socketId: string, roomCode: string): Promise<void> {
    const room = await roomStorage.getRoom(roomCode);
    if (!room?.sessionId) return;

    const session = await roomStorage.getSession(room.sessionId);
    if (!session || session.status === "FINISHED") return;

    const payload: GameStatePayload = {
      eventId: eventId(),
      sessionId: session.id,
      phase: session.phase,
      currentRound: session.currentRound,
      totalRounds: session.totalRounds,
      scores: session.scores,
      version: session.metadata.version as number || 0,
      data: this.getPublicRoundData(session),
    };

    this.io.to(socketId).emit("game:update", payload);
    logger.debug({ socketId, roomCode, phase: session.phase }, "Sent game:update to reconnected player");
  }

  broadcastGameEnded(roomCode: string, session: GameSession): void {
    this.io.to(roomCode).emit("game:ended", {
      finalScores: session.scores,
      winner: session.scores.length > 0
        ? session.scores.reduce((a, b) => a.points > b.points ? a : b).userId
        : undefined,
    });
  }

  emitError(socketId: string, message: string): void {
    this.io.to(socketId).emit("error", { message });
  }

  private getPublicRoundData(session: GameSession): Record<string, unknown> | undefined {
    if (session.currentRound === 0 || session.rounds.length === 0) return undefined;
    const round = session.rounds[session.currentRound - 1];
    if (!round) return undefined;

    return {
      roundNumber: round.roundNumber,
      status: round.status,
      content: round.content,
      submissionCount: round.submissions.length,
      result: round.status === "FINISHED" ? round.result : undefined,
    };
  }
}
