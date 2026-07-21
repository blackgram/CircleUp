import { FriendshipStatus } from "../../enums";

export interface FriendResponse {
  id: string;
  displayName: string;
  nickname: string;
  avatarUrl?: string;
  status: FriendshipStatus;
}

export interface FriendRequestResponse {
  id: string;
  type: "incoming" | "outgoing";
  displayName: string;
  nickname: string;
  avatarUrl?: string;
  createdAt: Date;
}
