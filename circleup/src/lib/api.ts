import { User, GameInfo, Room, Friend, Notification, PlatformAnalytics } from '../types';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(endpoint, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || `HTTP error ${res.status}`);
  }

  return res.json();
}

export const api = {
  auth: {
    login: (email: string) => request<{ success: boolean; user: User; token: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email }) }),
    register: (displayName: string, email: string) => request<{ success: boolean; user: User; token: string }>('/api/auth/register', { method: 'POST', body: JSON.stringify({ displayName, email }) }),
    me: () => request<{ user: User }>('/api/auth/me'),
  },

  games: {
    list: () => request<GameInfo[]>('/api/games'),
    listAll: () => request<GameInfo[]>('/api/games/all'),
    get: (id: string) => request<GameInfo>(`/api/games/${id}`),
    create: (data: Partial<GameInfo>) => request<GameInfo>('/api/admin/games', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<GameInfo>) => request<GameInfo>(`/api/admin/games/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },

  rooms: {
    create: (data: { name: string; gameId: string; maxPlayers?: number; isPrivate?: boolean; settings?: Record<string, any>; hostUser: User }) =>
      request<Room>('/api/rooms', { method: 'POST', body: JSON.stringify(data) }),
    get: (code: string) => request<Room>(`/api/rooms/${code}`),
    join: (code: string, user: User) => request<Room>('/api/rooms/join', { method: 'POST', body: JSON.stringify({ code, user }) }),
    listActive: () => request<Room[]>('/api/rooms'),
  },

  friends: {
    list: () => request<Friend[]>('/api/friends'),
    sendRequest: (targetEmailOrUsername: string) => request<{ success: boolean; message: string }>('/api/friends/request', { method: 'POST', body: JSON.stringify({ targetEmailOrUsername }) }),
    accept: (friendId: string) => request<{ success: boolean; friends: Friend[] }>('/api/friends/accept', { method: 'POST', body: JSON.stringify({ friendId }) }),
  },

  notifications: {
    list: () => request<Notification[]>('/api/notifications'),
    markRead: (id: string) => request<{ success: boolean }>(`/api/notifications/${id}/read`, { method: 'PATCH' }),
    readAll: () => request<{ success: boolean }>('/api/notifications/read-all', { method: 'POST' }),
    clear: () => request<{ success: boolean }>('/api/notifications/clear', { method: 'DELETE' }),
  },

  admin: {
    analytics: () => request<PlatformAnalytics>('/api/admin/analytics'),
    users: () => request<User[]>('/api/admin/users'),
  },
};
