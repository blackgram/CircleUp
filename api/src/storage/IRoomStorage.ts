import { Room } from "../models/Room";
import { GameSession } from "../types";

export interface IRoomStorage {
  // Room operations
  createRoom(room: Room): Promise<void>;
  getRoom(roomCode: string): Promise<Room | null>;
  updateRoom(roomCode: string, room: Room): Promise<void>;
  deleteRoom(roomCode: string): Promise<void>;
  getAllRooms(): Promise<Room[]>;

  // Session operations
  createSession(session: GameSession): Promise<void>;
  getSession(sessionId: string): Promise<GameSession | null>;
  updateSession(sessionId: string, session: GameSession): Promise<void>;
  deleteSession(sessionId: string): Promise<void>;
}
