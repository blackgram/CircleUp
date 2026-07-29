import Redis from "ioredis";
import { Room } from "../models/Room";
import { GameSession } from "../types";
import { IRoomStorage } from "./IRoomStorage";
import { logger } from "../utils/logger";

const ROOM_PREFIX = "room:";
const SESSION_PREFIX = "session:";
const ROOM_INDEX = "rooms:index";
const ROOM_TTL = 60 * 60 * 6; // 6 hours

export class RedisStorage implements IRoomStorage {
  constructor(private redis: Redis) {}

  async createRoom(room: Room): Promise<void> {
    const key = ROOM_PREFIX + room.roomCode;
    await this.redis
      .pipeline()
      .set(key, JSON.stringify(room), "EX", ROOM_TTL)
      .sadd(ROOM_INDEX, room.roomCode)
      .exec();
  }

  async getRoom(roomCode: string): Promise<Room | null> {
    const data = await this.redis.get(ROOM_PREFIX + roomCode);
    if (!data) return null;
    return this.deserializeRoom(data);
  }

  async updateRoom(roomCode: string, room: Room): Promise<void> {
    const key = ROOM_PREFIX + roomCode;
    // Refresh TTL on every update to keep active rooms alive
    await this.redis.set(key, JSON.stringify(room), "EX", ROOM_TTL);
  }

  async deleteRoom(roomCode: string): Promise<void> {
    await this.redis
      .pipeline()
      .del(ROOM_PREFIX + roomCode)
      .srem(ROOM_INDEX, roomCode)
      .exec();
  }

  async getAllRooms(): Promise<Room[]> {
    const codes = await this.redis.smembers(ROOM_INDEX);
    if (codes.length === 0) return [];

    const keys = codes.map((c) => ROOM_PREFIX + c);
    const values = await this.redis.mget(...keys);

    const rooms: Room[] = [];
    const stale: string[] = [];

    for (let i = 0; i < codes.length; i++) {
      if (values[i]) {
        rooms.push(this.deserializeRoom(values[i]!));
      } else {
        stale.push(codes[i]);
      }
    }

    // Clean up index entries for expired rooms
    if (stale.length > 0) {
      await this.redis.srem(ROOM_INDEX, ...stale);
    }

    return rooms;
  }

  async createSession(session: GameSession): Promise<void> {
    await this.redis.set(
      SESSION_PREFIX + session.id,
      JSON.stringify(session),
      "EX",
      ROOM_TTL
    );
  }

  async getSession(sessionId: string): Promise<GameSession | null> {
    const data = await this.redis.get(SESSION_PREFIX + sessionId);
    if (!data) return null;
    return this.deserializeSession(data);
  }

  async updateSession(sessionId: string, session: GameSession): Promise<void> {
    await this.redis.set(
      SESSION_PREFIX + sessionId,
      JSON.stringify(session),
      "EX",
      ROOM_TTL
    );
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.redis.del(SESSION_PREFIX + sessionId);
  }

  private deserializeRoom(data: string): Room {
    const room = JSON.parse(data);
    // Restore Date objects from JSON strings
    room.createdAt = new Date(room.createdAt);
    for (const p of room.players) {
      p.joinedAt = new Date(p.joinedAt);
    }
    return room;
  }

  private deserializeSession(data: string): GameSession {
    const session = JSON.parse(data);
    session.startedAt = new Date(session.startedAt);
    if (session.endedAt) session.endedAt = new Date(session.endedAt);
    for (const round of session.rounds) {
      if (round.startedAt) round.startedAt = new Date(round.startedAt);
      if (round.endedAt) round.endedAt = new Date(round.endedAt);
      for (const sub of round.submissions) {
        sub.submittedAt = new Date(sub.submittedAt);
      }
    }
    return session;
  }
}
