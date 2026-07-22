import { api } from "./client";
import type {
  ApiResponse,
  AuthResponse,
  UserProfile,
  FriendResponse,
  FriendRequestResponse,
  GameResponse,
  GameDetailResponse,
  NotificationResponse,
  UnreadNotificationsResponse,
  RoomResponse,
} from "@/types";

// ── Auth ──

export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<AuthResponse>>("/api/auth/login", { email, password }),

  register: (data: { email: string; password: string; nickname: string; displayName: string }) =>
    api.post<ApiResponse<AuthResponse>>("/api/auth/register", data),

  google: (idToken: string) =>
    api.post<ApiResponse<AuthResponse>>("/api/auth/google", { idToken }),

  me: () => api.get<ApiResponse<UserProfile>>("/api/auth/me"),

  logout: (refreshToken?: string) =>
    api.post<ApiResponse>("/api/auth/logout", { refreshToken }),

  refresh: (refreshToken: string) =>
    api.post<ApiResponse<AuthResponse>>("/api/auth/refresh", { refreshToken }),
};

// ── Users ──

export const usersApi = {
  getMe: () => api.get<ApiResponse<UserProfile>>("/api/users/me"),

  updateMe: (data: { displayName?: string; nickname?: string; avatarUrl?: string }) =>
    api.patch<ApiResponse<UserProfile>>("/api/users/me", data),

  updateNickname: (nickname: string) =>
    api.patch<ApiResponse<UserProfile>>("/api/users/nickname", { nickname }),

  getById: (id: string) => api.get<ApiResponse<UserProfile>>(`/api/users/${id}`),

  search: (q: string) => api.get<ApiResponse<UserProfile[]>>("/api/users/search", { params: { q } }),
};

// ── Friends ──

export const friendsApi = {
  list: () => api.get<ApiResponse<FriendResponse[]>>("/api/friends"),

  getRequests: () => api.get<ApiResponse<FriendRequestResponse[]>>("/api/friends/requests"),

  sendRequest: (userId: string) =>
    api.post<ApiResponse>("/api/friends/request", { userId }),

  accept: (friendshipId: string) =>
    api.post<ApiResponse>("/api/friends/accept", { friendshipId }),

  reject: (friendshipId: string) =>
    api.post<ApiResponse>("/api/friends/reject", { friendshipId }),

  remove: (id: string) => api.delete<ApiResponse>(`/api/friends/${id}`),
};

// ── Games ──

export const gamesApi = {
  list: () => api.get<ApiResponse<GameResponse[]>>("/api/games"),

  getEnabled: () => api.get<ApiResponse<GameResponse[]>>("/api/games/enabled"),

  getPopular: () => api.get<ApiResponse<GameResponse[]>>("/api/games/popular"),

  getBySlug: (slug: string) => api.get<ApiResponse<GameDetailResponse>>(`/api/games/${slug}`),
};

// ── Rooms ──

export const roomsApi = {
  create: (data?: { maxPlayers?: number; privateRoom?: boolean }) =>
    api.post<ApiResponse<RoomResponse>>("/api/rooms", data || {}),

  join: (roomCode: string) =>
    api.post<ApiResponse<RoomResponse>>("/api/rooms/join", { roomCode }),

  leave: (roomCode: string) =>
    api.post<ApiResponse>("/api/rooms/leave", { roomCode }),

  getByCode: (roomCode: string) =>
    api.get<ApiResponse<RoomResponse>>(`/api/rooms/${roomCode}`),

  updateSettings: (roomCode: string, data: Record<string, unknown>) =>
    api.patch<ApiResponse<RoomResponse>>(`/api/rooms/${roomCode}/settings`, data),

  start: (roomCode: string) =>
    api.post<ApiResponse>(`/api/rooms/${roomCode}/start`),

  end: (roomCode: string) =>
    api.post<ApiResponse>(`/api/rooms/${roomCode}/end`),

  delete: (roomCode: string) =>
    api.delete<ApiResponse>(`/api/rooms/${roomCode}`),
};

// ── Notifications ──

export const notificationsApi = {
  list: (page = 1, limit = 20) =>
    api.get<ApiResponse<NotificationResponse[]>>("/api/notifications", { params: { page, limit } }),

  getUnread: () =>
    api.get<ApiResponse<UnreadNotificationsResponse>>("/api/notifications/unread"),

  markAsRead: (id: string) =>
    api.patch<ApiResponse>(`/api/notifications/${id}/read`),

  markAllRead: () =>
    api.patch<ApiResponse>("/api/notifications/read-all"),

  delete: (id: string) =>
    api.delete<ApiResponse>(`/api/notifications/${id}`),

  clearAll: () =>
    api.delete<ApiResponse>("/api/notifications"),
};

// ── Admin ──

export const adminApi = {
  createGame: (data: Record<string, unknown>) =>
    api.post<ApiResponse<GameDetailResponse>>("/api/admin/games", data),

  updateGame: (id: string, data: Record<string, unknown>) =>
    api.patch<ApiResponse<GameDetailResponse>>(`/api/admin/games/${id}`, data),

  deleteGame: (id: string) =>
    api.delete<ApiResponse>(`/api/admin/games/${id}`),

  enableGame: (id: string) =>
    api.patch<ApiResponse<GameDetailResponse>>(`/api/admin/games/${id}/enable`),

  disableGame: (id: string) =>
    api.patch<ApiResponse<GameDetailResponse>>(`/api/admin/games/${id}/disable`),

  getRooms: () => api.get<ApiResponse<unknown[]>>("/api/admin/rooms"),

  getUsers: (page = 1, limit = 20) =>
    api.get<ApiResponse<UserProfile[]>>("/api/admin/users", { params: { page, limit } }),

  getAnalytics: () => api.get<ApiResponse<{ totalUsers: number; activeRooms: number }>>("/api/admin/analytics"),
};
