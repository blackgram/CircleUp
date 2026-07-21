import { Session, ISession } from "../models/Session";

export class SessionRepository {
  async create(data: Partial<ISession>): Promise<ISession> {
    return Session.create(data);
  }

  async findByUserIdAndTokenHash(userId: string, refreshTokenHash: string): Promise<ISession | null> {
    return Session.findOne({ userId, refreshTokenHash });
  }

  async deleteByUserIdAndTokenHash(userId: string, refreshTokenHash: string): Promise<void> {
    await Session.deleteOne({ userId, refreshTokenHash });
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    await Session.deleteMany({ userId });
  }
}

export const sessionRepository = new SessionRepository();
