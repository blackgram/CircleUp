import { RoomStatus } from "../enums";

export interface RoomPlayer {
  userId: string;
  nickname: string;
  avatarUrl?: string;
  socketId: string;
  ready: boolean;
  connected: boolean;
  role: "player" | "spectator";
  joinedAt: Date;
}

export interface RoomSettings {
  maxPlayers: number;
  privateRoom: boolean;
  allowReconnect: boolean;
  gameOptions: Record<string, unknown>;
}

export interface Room {
  id: string;
  roomCode: string;
  hostId: string;
  gameSlug?: string;
  status: RoomStatus;
  players: RoomPlayer[];
  settings: RoomSettings;
  sessionId?: string;
  createdAt: Date;
}
