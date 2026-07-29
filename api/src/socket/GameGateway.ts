import { Server, Socket } from "socket.io";
import { roomService } from "../services/RoomService";
import { gameSessionService } from "../services/GameSessionService";
import { roomStorage } from "../storage";
import { logger } from "../utils/logger";
import { SocketData, SocketResponse, GameActionPayload } from "./events";
import { SocketManager } from "./SocketManager";

export class GameGateway {
  private roundTimers = new Map<string, NodeJS.Timeout>();

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
      if (!room) {
        return { success: false, message: "No active game" };
      }

      // Host-only action: return to lobby
      if (payload.action === "return_to_lobby") {
        if (userId !== room.hostId) {
          return { success: false, message: "Only the host can return to lobby" };
        }
        await roomService.returnToLobby(userId, roomCode);
        await this.socketManager.broadcastRoomState(roomCode);
        logger.info({ userId, roomCode }, "Returned to lobby");
        return { success: true };
      }

      if (!room.sessionId) {
        return { success: false, message: "No active game" };
      }

      // Host-only action: start a new round
      if (payload.action === "start_round") {
        if (userId !== room.hostId) {
          return { success: false, message: "Only the host can start a round" };
        }
        return this.handleStartRound(room.sessionId, roomCode, payload.payload);
      }

      // Host-only action: expose anonymous results
      if (payload.action === "expose_results") {
        if (userId !== room.hostId) {
          return { success: false, message: "Only the host can expose results" };
        }
        return this.handleExposeResults(room.sessionId, roomCode);
      }

      // Player action: submit answer
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
        this.clearTimer(room.sessionId);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  private async handleStartRound(
    sessionId: string,
    roomCode: string,
    payload: Record<string, unknown>
  ): Promise<SocketResponse> {
    const question = payload.question as string;
    if (!question || !question.trim()) {
      return { success: false, message: "Question is required" };
    }

    const currentSession = await roomStorage.getSession(sessionId);
    if (!currentSession) return { success: false, message: "Session not found" };

    const playerIds = currentSession.scores.map((s) => s.userId);
    const session = await gameSessionService.startRound(sessionId, { question: question.trim(), playerIds });

    // Start round timer
    const timeLimit = (session.config.timeLimit as number) || 30;
    const endsAt = new Date(Date.now() + timeLimit * 1000).toISOString();
    session.metadata.roundEndsAt = endsAt;
    await roomStorage.updateSession(session.id, session);

    // Broadcast game state with timer
    await this.socketManager.broadcastGameState(roomCode, session);

    // Set timer to auto-complete round
    this.clearTimer(sessionId);
    const timer = setTimeout(async () => {
      this.roundTimers.delete(sessionId);
      await this.forceCompleteRound(sessionId, roomCode);
    }, timeLimit * 1000);
    this.roundTimers.set(sessionId, timer);

    logger.info({ sessionId, roomCode, round: session.currentRound, timeLimit }, "Round started with timer");
    return { success: true };
  }

  private async forceCompleteRound(sessionId: string, roomCode: string): Promise<void> {
    try {
      const session = await roomStorage.getSession(sessionId);
      if (!session) return;

      const currentRound = session.rounds[session.currentRound - 1];
      if (!currentRound || currentRound.status !== "ACTIVE") return;

      // Complete the round even if not everyone submitted
      await gameSessionService.completeRound(session);
      await roomStorage.updateSession(session.id, session);

      // Broadcast updated state
      await this.socketManager.broadcastGameState(roomCode, session);

      if (session.status === "FINISHED") {
        this.socketManager.broadcastGameEnded(roomCode, session);
      }

      logger.info({ sessionId, roomCode, round: session.currentRound }, "Round force-completed by timer");
    } catch (err) {
      logger.error(err, "Error force-completing round");
    }
  }

  private clearTimer(sessionId: string): void {
    const existing = this.roundTimers.get(sessionId);
    if (existing) {
      clearTimeout(existing);
      this.roundTimers.delete(sessionId);
    }
  }

  private async handleExposeResults(sessionId: string, roomCode: string): Promise<SocketResponse> {
    const session = await roomStorage.getSession(sessionId);
    if (!session) return { success: false, message: "Session not found" };

    // Build a full recap of all rounds with voter info exposed
    const roundsRecap = session.rounds.map((round) => {
      const voterMap = new Map<string, string[]>();
      for (const sub of round.submissions) {
        const votedFor = sub.payload.votedFor as string;
        const voters = voterMap.get(votedFor) || [];
        voters.push(sub.userId);
        voterMap.set(votedFor, voters);
      }

      const results = ((round.result as any)?.results as any[] || []).map((entry: any) => ({
        userId: entry.userId,
        votes: entry.votes,
        voters: voterMap.get(entry.userId) || [],
      }));

      return {
        roundNumber: round.roundNumber,
        question: (round.content as any).question,
        results,
      };
    });

    // Store the recap in session metadata and broadcast
    session.metadata.exposedRecap = roundsRecap;
    session.metadata.version = ((session.metadata.version as number) || 0) + 1;
    await roomStorage.updateSession(session.id, session);

    await this.socketManager.broadcastGameState(roomCode, session);

    logger.info({ sessionId, roomCode }, "All results exposed by host");
    return { success: true };
  }
}
