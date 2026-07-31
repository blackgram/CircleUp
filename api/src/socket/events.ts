// ── Client → Server Events ──

export interface ClientToServerEvents {
  "room:join": (payload: { roomCode: string }, ack: (res: SocketResponse) => void) => void;
  "room:leave": (ack: (res: SocketResponse) => void) => void;
  "room:kick": (payload: { userId: string }, ack: (res: SocketResponse) => void) => void;

  "player:ready": (ack: (res: SocketResponse) => void) => void;
  "player:spectate": (ack: (res: SocketResponse) => void) => void;

  "game:start": (ack: (res: SocketResponse) => void) => void;
  "game:action": (payload: GameActionPayload, ack: (res: SocketResponse) => void) => void;
}

// ── Server → Client Events ──

export interface ServerToClientEvents {
  "room:update": (payload: RoomStatePayload) => void;
  "room:kicked": (payload: { message: string }) => void;

  "game:update": (payload: GameStatePayload) => void;
  "game:ended": (payload: GameEndedPayload) => void;

  "notification:new": (payload: unknown) => void;

  "error": (payload: { message: string }) => void;
}

// ── Payload Types ──

export interface SocketResponse {
  success: boolean;
  message?: string;
  data?: unknown;
}

export interface GameActionPayload {
  action: string;
  payload: Record<string, unknown>;
}

export interface RoomStatePayload {
  eventId: string;
  roomCode: string;
  hostId: string;
  gameSlug?: string;
  status: string;
  players: PlayerPayload[];
  settings: Record<string, unknown>;
}

export interface PlayerPayload {
  userId: string;
  nickname: string;
  avatarUrl?: string;
  ready: boolean;
  connected: boolean;
  role: "player" | "spectator";
}

export interface GameStatePayload {
  eventId: string;
  sessionId: string;
  phase: string;
  currentRound: number;
  totalRounds: number;
  scores: { userId: string; points: number }[];
  endsAt?: string;
  version: number;
  data?: Record<string, unknown>;
}

export interface RoundResultPayload {
  roundNumber: number;
  result: Record<string, unknown>;
  scores: { userId: string; points: number }[];
}

export interface GameEndedPayload {
  finalScores: { userId: string; points: number }[];
  winner?: string;
}

// ── Socket Data (attached to socket instance) ──

export interface SocketData {
  userId: string;
  role: string;
  roomCode?: string;
}
