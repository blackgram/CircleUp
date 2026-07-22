import { create } from 'zustand';
import { Room, ChatMessage, User } from '../types';
import { getSocket } from '../lib/socket';
import { api } from '../lib/api';

interface RoomState {
  currentRoom: Room | null;
  isLoading: boolean;
  error: string | null;
  isReconnecting: boolean;
  
  createRoom: (name: string, gameId: string, hostUser: User, maxPlayers?: number, isPrivate?: boolean) => Promise<string | null>;
  joinRoom: (code: string, user: User) => Promise<boolean>;
  leaveRoom: () => void;
  toggleReady: (userId: string, isReady: boolean) => void;
  updateSettings: (settings: Record<string, any>, gameId?: string) => void;
  sendChatMessage: (sender: User, content: string) => void;
  addBotPlayer: () => void;
  kickPlayer: (targetUserId: string) => void;
  transferHost: (targetUserId: string) => void;
  startGame: () => void;
  initSocketListeners: () => void;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  currentRoom: null,
  isLoading: false,
  error: null,
  isReconnecting: false,

  initSocketListeners: () => {
    const socket = getSocket();

    socket.off('room:update');
    socket.off('room:chat_message');
    socket.off('room:player_kicked');

    socket.on('room:update', (updatedRoom: Room) => {
      set({ currentRoom: updatedRoom });
    });

    socket.on('room:chat_message', (msg: ChatMessage) => {
      set((state) => {
        if (!state.currentRoom) return state;
        const exists = state.currentRoom.chatMessages.some((m) => m.id === msg.id);
        if (exists) return state;
        return {
          currentRoom: {
            ...state.currentRoom,
            chatMessages: [...state.currentRoom.chatMessages, msg],
          },
        };
      });
    });

    socket.on('room:player_kicked', ({ userId }: { userId: string }) => {
      const { currentRoom } = get();
      if (currentRoom && userId === currentRoom.hostId) {
        set({ currentRoom: null, error: 'You were kicked from the Circle' });
      }
    });

    socket.on('disconnect', () => {
      set({ isReconnecting: true });
    });

    socket.on('connect', () => {
      set({ isReconnecting: false });
      const room = get().currentRoom;
      if (room) {
        socket.emit('room:join', { code: room.code, user: { id: room.hostId } });
      }
    });
  },

  createRoom: async (name, gameId, hostUser, maxPlayers, isPrivate) => {
    set({ isLoading: true, error: null });
    try {
      const room = await api.rooms.create({ name, gameId, hostUser, maxPlayers, isPrivate });
      set({ currentRoom: room, isLoading: false });

      const socket = getSocket();
      socket.emit('room:join', { code: room.code, user: hostUser });
      get().initSocketListeners();

      return room.code;
    } catch (err: any) {
      set({ error: err.message || 'Failed to create room', isLoading: false });
      return null;
    }
  },

  joinRoom: async (code, user) => {
    set({ isLoading: true, error: null });
    try {
      const room = await api.rooms.join(code, user);
      set({ currentRoom: room, isLoading: false });

      const socket = getSocket();
      socket.emit('room:join', { code: room.code, user });
      get().initSocketListeners();

      return true;
    } catch (err: any) {
      set({ error: err.message || 'Invalid or full room code', isLoading: false });
      return false;
    }
  },

  leaveRoom: () => {
    const room = get().currentRoom;
    if (room) {
      const socket = getSocket();
      socket.emit('room:leave', { code: room.code });
    }
    set({ currentRoom: null });
  },

  toggleReady: (userId, isReady) => {
    const room = get().currentRoom;
    if (!room) return;
    const socket = getSocket();
    socket.emit('room:toggle_ready', { code: room.code, userId, isReady });
  },

  updateSettings: (settings, gameId) => {
    const room = get().currentRoom;
    if (!room) return;
    const socket = getSocket();
    socket.emit('room:update_settings', { code: room.code, settings, gameId });
  },

  sendChatMessage: (sender, content) => {
    const room = get().currentRoom;
    if (!room || !content.trim()) return;
    const socket = getSocket();
    socket.emit('room:chat', { code: room.code, sender, content: content.trim() });
  },

  addBotPlayer: () => {
    const room = get().currentRoom;
    if (!room) return;
    const socket = getSocket();
    socket.emit('room:add_bot', { code: room.code });
  },

  kickPlayer: (targetUserId) => {
    const room = get().currentRoom;
    if (!room) return;
    const socket = getSocket();
    socket.emit('room:kick', { code: room.code, targetUserId });
  },

  transferHost: (targetUserId) => {
    const room = get().currentRoom;
    if (!room) return;
    const socket = getSocket();
    socket.emit('room:transfer_host', { code: room.code, targetUserId });
  },

  startGame: () => {
    const room = get().currentRoom;
    if (!room) return;
    const socket = getSocket();
    socket.emit('game:start', { code: room.code });
  },
}));
