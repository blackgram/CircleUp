import { create } from 'zustand';
import { User } from '../types';
import { api } from '../lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string) => Promise<void>;
  register: (displayName: string, email: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updated: Partial<User>) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: {
    id: 'usr_me',
    email: 'alex@circleup.app',
    displayName: 'Alex Rivers',
    nickname: 'PixelMaster',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'admin',
    status: 'online',
    stats: {
      gamesPlayed: 42,
      gamesWon: 27,
      winRate: 64,
      currentStreak: 5,
      favoriteGame: 'Trivia Master',
    },
    createdAt: new Date().toISOString(),
  },
  isAuthenticated: true,
  isLoading: false,
  error: null,

  login: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.auth.login(email);
      set({ user: res.user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Login failed', isLoading: false });
    }
  },

  register: async (displayName: string, email: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.auth.register(displayName, email);
      set({ user: res.user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Registration failed', isLoading: false });
    }
  },

  logout: () => {
    set({ user: null, isAuthenticated: false });
  },

  updateProfile: (updated: Partial<User>) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...updated } : null,
    }));
  },

  checkAuth: async () => {
    try {
      const res = await api.auth.me();
      set({ user: res.user, isAuthenticated: true });
    } catch {
      // Keep default logged-in state for quick demo if needed
    }
  },
}));
