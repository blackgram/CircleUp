import { userRepository } from "../../repositories/UserRepository";
import { sessionRepository } from "../../repositories/SessionRepository";
import { passwordService } from "./PasswordService";
import { jwtService } from "./JwtService";
import { googleAuthService } from "./GoogleAuthService";
import { tokenBlacklistService } from "./TokenBlacklistService";
import { AuthProvider } from "../../enums";
import { RegisterRequest, LoginRequest } from "../../dto/requests";
import { AuthResponse, UserProfileResponse } from "../../dto/responses";
import { IUser } from "../../models";
import { env } from "../../config/env";



export class AuthService {
  async register(input: RegisterRequest): Promise<AuthResponse> {
    const existingEmail = await userRepository.findByEmail(input.email);
    if (existingEmail) {
      throw new Error("Email already in use");
    }

    const existingNickname = await userRepository.findByNickname(input.nickname);
    if (existingNickname) {
      throw new Error("Nickname already taken");
    }

    const passwordHash = await passwordService.hash(input.password);

    const user = await userRepository.create({
      nickname: input.nickname,
      displayName: input.displayName,
      email: input.email,
      passwordHash,
      provider: AuthProvider.LOCAL,
    });

    return this.buildAuthResponse(user);
  }

  async login(input: LoginRequest): Promise<AuthResponse> {
    const user = await userRepository.findByEmail(input.email);
    if (!user || !user.passwordHash) {
      throw new Error("Invalid credentials");
    }

    const valid = await passwordService.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new Error("Invalid credentials");
    }

    await userRepository.updateLastSeen(user.id);

    return this.buildAuthResponse(user);
  }

  async googleAuth(idToken: string): Promise<AuthResponse> {
    const googleUser = await googleAuthService.verifyToken(idToken);

    let user = await userRepository.findByGoogleId(googleUser.sub);

    if (!user) {
      const existingEmail = await userRepository.findByEmail(googleUser.email);
      if (existingEmail) {
        throw new Error("Email already registered with a different provider");
      }

      user = await userRepository.create({
        nickname: googleUser.email.split("@")[0],
        displayName: googleUser.name,
        email: googleUser.email,
        avatarUrl: googleUser.picture,
        provider: AuthProvider.GOOGLE,
        googleId: googleUser.sub,
      });
    }

    await userRepository.updateLastSeen(user.id);

    return this.buildAuthResponse(user);
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const payload = jwtService.verifyRefreshToken(refreshToken);

    const tokenHash = await passwordService.hash(refreshToken);
    const session = await sessionRepository.findByUserIdAndTokenHash(payload.userId, refreshToken);
    if (!session) {
      throw new Error("Session not found or token revoked");
    }

    const user = await userRepository.findById(payload.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Delete old session and issue new tokens
    await sessionRepository.deleteByUserIdAndTokenHash(payload.userId, refreshToken);

    return this.buildAuthResponse(user);
  }

  async logout(userId: string, refreshToken: string | undefined, accessToken: string): Promise<void> {
    if (refreshToken) {
      await sessionRepository.deleteByUserIdAndTokenHash(userId, refreshToken);
    }
    await tokenBlacklistService.blacklist(accessToken);
  }

  async logoutAll(userId: string, accessToken: string): Promise<void> {
    await sessionRepository.deleteAllByUserId(userId);
    await tokenBlacklistService.blacklist(accessToken);
  }

  async getMe(userId: string): Promise<UserProfileResponse> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return this.toUserProfile(user);
  }

  private async buildAuthResponse(user: IUser): Promise<AuthResponse> {
    const accessToken = jwtService.generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = jwtService.generateRefreshToken({ userId: user.id, role: user.role });

    // Persist refresh token in sessions collection
    await sessionRepository.create({
      userId: user.id,
      refreshTokenHash: refreshToken,
      expiresAt: new Date(Date.now() + env.JWT_REFRESH_EXPIRY * 1000),
    });

    return {
      user: this.toUserProfile(user),
      accessToken,
      refreshToken,
    };
  }

  private toUserProfile(user: IUser): UserProfileResponse {
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

export const authService = new AuthService();
