import { Room } from "../models/Room";
import { GameSession } from "../types";
import { IRoomStorage } from "./IRoomStorage";

export class MemoryStorage implements IRoomStorage {
  private rooms = new Map<string, Room>();
  private sessions = new Map<string, GameSession>();

  async createRoom(room: Room): Promise<void> {
    this.rooms.set(room.roomCode, room);
  }

  async getRoom(roomCode: string): Promise<Room | null> {
    return this.rooms.get(roomCode) || null;
  }

  async updateRoom(roomCode: string, room: Room): Promise<void> {
    this.rooms.set(roomCode, room);
  }

  async deleteRoom(roomCode: string): Promise<void> {
    this.rooms.delete(roomCode);
  }

  async getAllRooms(): Promise<Room[]> {
    return Array.from(this.rooms.values());
  }

  async createSession(session: GameSession): Promise<void> {
    this.sessions.set(session.id, session);
  }

  async getSession(sessionId: string): Promise<GameSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  async updateSession(sessionId: string, session: GameSession): Promise<void> {
    this.sessions.set(sessionId, session);
  }

  async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }
}
