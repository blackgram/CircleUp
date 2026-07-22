import { create } from 'zustand';
import { Friend } from '../types';
import { api } from '../lib/api';

interface FriendState {
  friends: Friend[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  fetchFriends: () => Promise<void>;
  sendFriendRequest: (target: string) => Promise<boolean>;
  acceptFriendRequest: (friendId: string) => Promise<void>;
}

export const useFriendStore = create<FriendState>((set) => ({
  friends: [],
  isLoading: false,
  error: null,
  searchQuery: '',

  setSearchQuery: (query) => set({ searchQuery: query }),

  fetchFriends: async () => {
    set({ isLoading: true });
    try {
      const friends = await api.friends.list();
      set({ friends, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  sendFriendRequest: async (target) => {
    try {
      await api.friends.sendRequest(target);
      return true;
    } catch {
      return false;
    }
  },

  acceptFriendRequest: async (friendId) => {
    try {
      const res = await api.friends.accept(friendId);
      set({ friends: res.friends });
    } catch (err: any) {
      set({ error: err.message });
    }
  },
}));
