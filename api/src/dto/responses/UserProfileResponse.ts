import { UserRole } from "../../enums";

export interface UserProfileResponse {
  id: string;
  email: string;
  displayName: string;
  nickname: string;
  avatarUrl?: string;
  role: UserRole;
  gamesPlayed: number;
  gamesWon: number;
  createdAt: Date;
}
