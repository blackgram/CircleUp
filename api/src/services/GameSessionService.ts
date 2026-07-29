import { roomStorage } from "../storage";
import { GameSession, Submission } from "../types";
import { gameEngine } from "../game-engine";
import { logger } from "../utils/logger";

export class GameSessionService {
  async getSession(sessionId: string): Promise<GameSession | null> {
    return roomStorage.getSession(sessionId);
  }

  async handleAction(
    sessionId: string,
    userId: string,
    action: string,
    payload: Record<string, unknown>
  ): Promise<GameSession> {
    const session = await roomStorage.getSession(sessionId);
    if (!session) throw new Error("Session not found");
    if (session.status === "FINISHED") throw new Error("Game is finished");

    const currentRound = session.rounds[session.currentRound - 1];
    if (!currentRound || currentRound.status !== "ACTIVE") {
      throw new Error("No active round");
    }

    // Idempotency: one submission per player per round
    const existing = currentRound.submissions.find((s) => s.userId === userId);
    if (existing) {
      throw new Error("Already submitted for this round");
    }

    // If a game adapter is registered, validate the submission
    const adapter = gameEngine.get(session.gameSlug);
    if (adapter) {
      const validation = adapter.validateSubmission(payload);
      if (!validation.valid) {
        throw new Error(validation.errors?.join(", ") || "Invalid submission");
      }
    }

    // Store submission
    const submission: Submission = {
      userId,
      payload,
      submittedAt: new Date(),
    };
    currentRound.submissions.push(submission);

    // Increment version
    session.metadata.version = ((session.metadata.version as number) || 0) + 1;

    // Check if all players have submitted
    const playerCount = session.scores.length;
    if (currentRound.submissions.length >= playerCount) {
      await this.completeRound(session);
    }

    await roomStorage.updateSession(session.id, session);
    return session;
  }

  async advancePhase(sessionId: string, phase: string): Promise<GameSession> {
    const session = await roomStorage.getSession(sessionId);
    if (!session) throw new Error("Session not found");

    session.phase = phase;
    session.metadata.version = ((session.metadata.version as number) || 0) + 1;

    await roomStorage.updateSession(session.id, session);
    return session;
  }

  async startRound(sessionId: string, content: Record<string, unknown>): Promise<GameSession> {
    const session = await roomStorage.getSession(sessionId);
    if (!session) throw new Error("Session not found");

    session.currentRound++;
    session.phase = "ANSWERING";
    session.rounds.push({
      roundNumber: session.currentRound,
      status: "ACTIVE",
      content,
      submissions: [],
      startedAt: new Date(),
    });
    session.metadata.version = ((session.metadata.version as number) || 0) + 1;

    await roomStorage.updateSession(session.id, session);
    return session;
  }

  async completeRound(session: GameSession): Promise<void> {
    const currentRound = session.rounds[session.currentRound - 1];
    if (!currentRound) return;

    currentRound.status = "FINISHED";
    currentRound.endedAt = new Date();

    // Compute results via game adapter
    const adapter = gameEngine.get(session.gameSlug);
    if (adapter) {
      const result = adapter.computeResults(currentRound.content, currentRound.submissions, session.config);
      currentRound.result = result.data;

      // Apply scores
      for (const scoreUpdate of result.scores) {
        const playerScore = session.scores.find((s) => s.userId === scoreUpdate.userId);
        if (playerScore) {
          playerScore.points += scoreUpdate.points;
        }
      }
    }

    session.phase = "RESULTS";

    // Check if game is over — mark status but keep phase as RESULTS
    // so the last round's results are shown before the final screen
    if (session.currentRound >= session.totalRounds) {
      session.status = "FINISHED";
      session.endedAt = new Date();
    }

    session.metadata.version = ((session.metadata.version as number) || 0) + 1;

    logger.info({ sessionId: session.id, round: session.currentRound, phase: session.phase }, "Round completed");
  }

  async endSession(sessionId: string): Promise<GameSession> {
    const session = await roomStorage.getSession(sessionId);
    if (!session) throw new Error("Session not found");

    session.status = "FINISHED";
    session.phase = "FINISHED";
    session.endedAt = new Date();
    session.metadata.version = ((session.metadata.version as number) || 0) + 1;

    await roomStorage.updateSession(session.id, session);
    return session;
  }
}

export const gameSessionService = new GameSessionService();
