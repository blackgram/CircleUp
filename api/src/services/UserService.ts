import { userRepository } from "../repositories/UserRepository";
import { UpdateProfileRequest } from "../dto/requests";
import { UserProfileResponse } from "../dto/responses";
import { IUser } from "../models";

export class UserService {
  async getProfile(userId: string): Promise<UserProfileResponse> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return this.toProfile(user);
  }

  async updateProfile(userId: string, input: UpdateProfileRequest): Promise<UserProfileResponse> {
    if (input.nickname) {
      const existing = await userRepository.findByNickname(input.nickname);
      if (existing && existing.id !== userId) {
        throw new Error("Nickname already taken");
      }
    }

    const user = await userRepository.updateById(userId, input);
    if (!user) {
      throw new Error("User not found");
    }
    return this.toProfile(user);
  }

  async updateNickname(userId: string, nickname: string): Promise<UserProfileResponse> {
    const existing = await userRepository.findByNickname(nickname);
    if (existing && existing.id !== userId) {
      throw new Error("Nickname already taken");
    }

    const user = await userRepository.updateById(userId, { nickname });
    if (!user) {
      throw new Error("User not found");
    }
    return this.toProfile(user);
  }

  async getById(id: string): Promise<UserProfileResponse> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error("User not found");
    }
    return this.toProfile(user);
  }

  async search(query: string): Promise<UserProfileResponse[]> {
    if (!query || query.trim().length < 2) {
      throw new Error("Search query must be at least 2 characters");
    }
    const users = await userRepository.search(query.trim());
    return users.map((u) => this.toProfile(u));
  }

  private toProfile(user: IUser): UserProfileResponse {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      role: user.role,
      gamesPlayed: user.gamesPlayed,
      gamesWon: user.gamesWon,
      createdAt: user.createdAt,
    };
  }
}

export const userService = new UserService();
