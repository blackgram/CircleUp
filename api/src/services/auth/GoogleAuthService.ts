import { env } from "../../config/env";

interface GoogleTokenPayload {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

export class GoogleAuthService {
  async verifyToken(idToken: string): Promise<GoogleTokenPayload> {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    );

    if (!response.ok) {
      throw new Error("Invalid Google token");
    }

    const payload = await response.json() as Record<string, string>;

    if (payload.aud !== env.GOOGLE_CLIENT_ID) {
      throw new Error("Google token audience mismatch");
    }

    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };
  }
}

export const googleAuthService = new GoogleAuthService();
