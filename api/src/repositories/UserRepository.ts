import { User, IUser } from "../models/User";
import { guestService } from "../services/auth/GuestService";
import { env } from "../config/env";

export class UserRepository {
  async findById(id: string): Promise<IUser | null> {
    // Handle guest users in LAN mode
    if (guestService.isGuest(id)) {
      const guest = guestService.findById(id);
      if (guest) {
        return {
          id: guest.id,
          _id: guest.id,
          nickname: guest.nickname,
          displayName: guest.displayName,
          email: guest.email,
          avatarUrl: guest.avatarUrl,
          role: guest.role,
          gamesPlayed: 0,
          gamesWon: 0,
          createdAt: guest.createdAt,
        } as any;
      }
      return null;
    }

    if (env.LAN_MODE) return null;
    return User.findById(id);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email });
  }

  async findByNickname(nickname: string): Promise<IUser | null> {
    return User.findOne({ nickname });
  }

  async findByGoogleId(googleId: string): Promise<IUser | null> {
    return User.findOne({ googleId });
  }

  async search(query: string, limit: number = 20): Promise<IUser[]> {
    const regex = new RegExp(query, "i");
    return User.find({
      $or: [{ nickname: regex }, { displayName: regex }],
    }).limit(limit);
  }

  async create(data: Partial<IUser>): Promise<IUser> {
    return User.create(data);
  }

  async updateById(id: string, data: Partial<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, data, { new: true });
  }

  async updateLastSeen(id: string): Promise<void> {
    await User.findByIdAndUpdate(id, { lastSeen: new Date() });
  }

  async findPaginated(page: number, limit: number): Promise<IUser[]> {
    return User.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
  }

  async count(): Promise<number> {
    return User.countDocuments();
  }
}

export const userRepository = new UserRepository();
