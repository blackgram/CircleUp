import { RoomStatus } from "../../enums";
import { RoomSettings } from "../../models/Room";

export interface RoomPlayerResponse {
  userId: string;
  nickname: string;
  avatarUrl?: string;
  ready: boolean;
  connected: boolean;
  score: number;
}

export interface RoomResponse {
  roomCode: string;
  hostId: string;
  gameSlug?: string;
  status: RoomStatus;
  players: RoomPlayerResponse[];
  settings: RoomSettings;
}
