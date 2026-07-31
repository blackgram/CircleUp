import { Socket } from "socket.io";
import { jwtService } from "../services/auth";
import { tokenBlacklistService } from "../services/auth/TokenBlacklistService";
import { guestService } from "../services/auth/GuestService";
import { logger } from "../utils/logger";
import { SocketData } from "./events";

export async function socketAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void
): Promise<void> {
  const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, "");

  if (!token) {
    next(new Error("Authentication required"));
    return;
  }

  try {
    const payload = jwtService.verifyAccessToken(token);

    // Skip blacklist check for guest users (no DB dependency)
    if (!guestService.isGuest(payload.userId)) {
      const blacklisted = await tokenBlacklistService.isBlacklisted(token);
      if (blacklisted) {
        next(new Error("Token revoked"));
        return;
      }
    }

    (socket.data as SocketData).userId = payload.userId;
    (socket.data as SocketData).role = payload.role;
    logger.debug({ userId: payload.userId }, "Socket authenticated");
    next();
  } catch {
    next(new Error("Invalid token"));
  }
}
