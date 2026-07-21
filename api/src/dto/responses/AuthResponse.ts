import { UserProfileResponse } from "./UserProfileResponse";

export interface AuthResponse {
  user: UserProfileResponse;
  accessToken: string;
  refreshToken: string;
}
