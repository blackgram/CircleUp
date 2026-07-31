import crypto from "crypto";
import { jwtService } from "./JwtService";
import { AuthResponse } from "../../dto/responses";
import { UserProfileResponse } from "../../dto/responses/UserProfileResponse";
import { UserRole } from "../../enums";

// In-memory guest user store for LAN mode
const guestUsers = new Map<string, UserProfileResponse>();

// Nicknames already in use
const activeNicknames = new Set<string>();

export class GuestService {
  login(nickname: string): AuthResponse {
    if (!nickname || nickname.trim().length < 2 || nickname.trim().length > 20) {
      throw new Error("Nickname must be 2–20 characters");
    }

    const cleanNickname = nickname.trim();

    if (activeNicknames.has(cleanNickname.toLowerCase())) {
      throw new Error("Nickname already taken");
    }

    const guestId = `guest_${crypto.randomBytes(8).toString("hex")}`;

    const guestUser: UserProfileResponse = {
      id: guestId,
      email: `${guestId}@lan.local`,
      displayName: cleanNickname,
      nickname: cleanNickname,
      role: UserRole.USER,
      gamesPlayed: 0,
      gamesWon: 0,
      createdAt: new Date(),
    };

    guestUsers.set(guestId, guestUser);
    activeNicknames.add(cleanNickname.toLowerCase());

    const accessToken = jwtService.generateAccessToken({ userId: guestId, role: "USER" });
    const refreshToken = jwtService.generateRefreshToken({ userId: guestId, role: "USER" });

    return { user: guestUser, accessToken, refreshToken };
  }

  findById(id: string): UserProfileResponse | null {
    return guestUsers.get(id) || null;
  }

  remove(id: string): void {
    const user = guestUsers.get(id);
    if (user) {
      activeNicknames.delete(user.nickname.toLowerCase());
      guestUsers.delete(id);
    }
  }

  isGuest(id: string): boolean {
    return id.startsWith("guest_");
  }

  getAll(): UserProfileResponse[] {
    return Array.from(guestUsers.values());
  }
}

export const guestService = new GuestService();
