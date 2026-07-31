import { Request, Response, NextFunction } from "express";
import { jwtService } from "../services/auth";
import { tokenBlacklistService } from "../services/auth/TokenBlacklistService";
import { guestService } from "../services/auth/GuestService";
import { ApiResponse } from "../dto/responses";

export interface AuthenticatedRequest extends Request {
  userId: string;
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    const response: ApiResponse = { success: false, message: "Unauthorized - Please login." };
    res.status(401).json(response);
    return;
  }

  const token = authHeader.replace(/^Bearer\s+/i, "");

  try {
    const payload = jwtService.verifyAccessToken(token);

    // Skip blacklist check for guest users
    if (!guestService.isGuest(payload.userId)) {
      const blacklisted = await tokenBlacklistService.isBlacklisted(token);
      if (blacklisted) {
        const response: ApiResponse = { success: false, message: "Session expired or unauthorized. Please login" };
        res.status(401).json(response);
        return;
      }
    }

    (req as any).userId = payload.userId;
    (req as any).userRole = payload.role;
    next();
  } catch {
    const response: ApiResponse = { success: false, message: "Unauthorized Session" };
    res.status(401).json(response);
    return;
  }
}
