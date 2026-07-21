import { User, IUser } from "../models/User";

export class UserRepository {
  async findById(id: string): Promise<IUser | null> {
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
