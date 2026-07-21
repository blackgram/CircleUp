import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../../config/env";

export interface TokenPayload {
  userId: string;
  role: string;
}

export class JwtService {
  generateAccessToken(payload: TokenPayload): string {
    const options: SignOptions = { expiresIn: env.JWT_ACCESS_EXPIRY };
    return jwt.sign({ ...payload }, env.JWT_SECRET, options);
  }

  generateRefreshToken(payload: TokenPayload): string {
    const options: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRY };
    return jwt.sign({ ...payload }, env.JWT_REFRESH_SECRET, options);
  }

  verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  }

  verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
  }
}

export const jwtService = new JwtService();
