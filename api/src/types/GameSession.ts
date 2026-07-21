export interface GameSession {
  id: string;
  roomId: string;
  gameSlug: string;
  status: "STARTING" | "PLAYING" | "FINISHED";
  config: Record<string, unknown>;
  currentRound: number;
  totalRounds: number;
  phase: string;
  scores: PlayerScore[];
  rounds: Round[];
  metadata: Record<string, unknown>;
  startedAt: Date;
  endedAt?: Date;
}

export interface PlayerScore {
  userId: string;
  points: number;
}

export interface Round {
  roundNumber: number;
  status: "PENDING" | "ACTIVE" | "FINISHED";
  content: Record<string, unknown>;
  submissions: Submission[];
  result?: Record<string, unknown>;
  startedAt?: Date;
  endedAt?: Date;
}

export interface Submission {
  userId: string;
  payload: Record<string, unknown>;
  submittedAt: Date;
}
