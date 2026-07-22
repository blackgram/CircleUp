// ── API Response Envelope ──

export interface ApiResponse<T = undefined> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

// ── Auth ──

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  nickname: string;
  avatarUrl?: string;
  role: "USER" | "ADMIN";
  gamesPlayed: number;
  gamesWon: number;
  createdAt: string;
}

export interface AuthResponse {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
}

// ── Friends ──

export interface FriendResponse {
  id: string;
  displayName: string;
  nickname: string;
  avatarUrl?: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "BLOCKED";
}

export interface FriendRequestResponse {
  id: string;
  type: "incoming" | "outgoing";
  displayName: string;
  nickname: string;
  avatarUrl?: string;
  createdAt: string;
}

// ── Games ──

export interface GameResponse {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  minPlayers: number;
  maxPlayers: number;
  enabled: boolean;
}

export interface GameDetailResponse extends GameResponse {
  settingsSchema: SettingDefinition[];
  version: number;
}

export interface SettingDefinition {
  key: string;
  type: "boolean" | "number" | "string" | "select";
  label: string;
  default: unknown;
  options?: { label: string; value: unknown }[];
  min?: number;
  max?: number;
}

// ── Rooms ──

export interface RoomResponse {
  roomCode: string;
  hostId: string;
  gameSlug?: string;
  status: "WAITING" | "STARTING" | "PLAYING" | "FINISHED";
  players: RoomPlayerResponse[];
  settings: RoomSettings;
}

export interface RoomPlayerResponse {
  userId: string;
  nickname: string;
  avatarUrl?: string;
  ready: boolean;
  connected: boolean;
  score: number;
}

export interface RoomSettings {
  maxPlayers: number;
  privateRoom: boolean;
  allowReconnect: boolean;
  gameOptions: Record<string, unknown>;
}

// ── Notifications ──

export interface NotificationResponse {
  id: string;
  type: string;
  category: "social" | "game" | "system";
  title: string;
  message: string;
  actionUrl?: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export interface UnreadNotificationsResponse {
  count: number;
  notifications: NotificationResponse[];
}

// ── Socket Events ──

export interface RoomStatePayload {
  eventId: string;
  roomCode: string;
  hostId: string;
  gameSlug?: string;
  status: string;
  players: PlayerPayload[];
  settings: Record<string, unknown>;
}

export interface PlayerPayload {
  userId: string;
  nickname: string;
  avatarUrl?: string;
  ready: boolean;
  connected: boolean;
}

export interface GameStatePayload {
  eventId: string;
  sessionId: string;
  phase: string;
  currentRound: number;
  totalRounds: number;
  scores: { userId: string; points: number }[];
  endsAt?: string;
  version: number;
  data?: Record<string, unknown>;
}

export interface GameEndedPayload {
  finalScores: { userId: string; points: number }[];
  winner?: string;
}
