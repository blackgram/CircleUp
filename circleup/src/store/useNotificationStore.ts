import { create } from 'zustand';
import { Notification } from '../types';
import { api } from '../lib/api';

interface NotificationState {
  notifications: Notification[];
  isLoading: boolean;
  unreadCount: number;

  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => Promise<void>;
  addNotification: (notif: Notification) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [
    {
      id: 'notif_1',
      userId: 'usr_me',
      title: 'Circle Invite',
      message: 'Sara Connor invited you to join Circle CIR-789!',
      type: 'invite',
      data: { roomCode: 'CIR-789', senderName: 'Sara Connor' },
      read: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'notif_2',
      userId: 'usr_me',
      title: 'Friend Request',
      message: 'Kai Zen sent you a friend request.',
      type: 'friend_request',
      data: { senderId: 'usr_kai', senderName: 'Kai Zen' },
      read: false,
      createdAt: new Date().toISOString(),
    },
  ],
  isLoading: false,
  unreadCount: 2,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const list = await api.notifications.list();
      const unread = list.filter((n) => !n.read).length;
      set({ notifications: list, unreadCount: unread, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id) => {
    await api.notifications.markRead(id);
    set((state) => {
      const updated = state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.read).length,
      };
    });
  },

  markAllAsRead: async () => {
    await api.notifications.readAll();
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  clearAll: async () => {
    await api.notifications.clear();
    set({ notifications: [], unreadCount: 0 });
  },

  addNotification: (notif) => {
    set((state) => ({
      notifications: [notif, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },
}));
