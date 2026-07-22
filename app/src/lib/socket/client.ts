import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/stores/auth";
import type { RoomStatePayload, GameStatePayload, GameEndedPayload } from "@/types";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface ServerToClientEvents {
  "room:update": (payload: RoomStatePayload) => void;
  "game:update": (payload: GameStatePayload) => void;
  "game:ended": (payload: GameEndedPayload) => void;
  "notification:new": (payload: unknown) => void;
  "error": (payload: { message: string }) => void;
}

interface ClientToServerEvents {
  "room:join": (payload: { roomCode: string }, ack: (res: SocketResponse) => void) => void;
  "room:leave": (ack: (res: SocketResponse) => void) => void;
  "player:ready": (ack: (res: SocketResponse) => void) => void;
  "game:start": (ack: (res: SocketResponse) => void) => void;
  "game:action": (payload: { action: string; payload: Record<string, unknown> }, ack: (res: SocketResponse) => void) => void;
}

interface SocketResponse {
  success: boolean;
  message?: string;
  data?: unknown;
}

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;

export function getSocket(): AppSocket {
  if (!socket) {
    const token = useAuthStore.getState().accessToken;

    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }

  return socket;
}

export function connectSocket(): void {
  const s = getSocket();
  if (!s.connected) {
    // Update token before connecting
    const token = useAuthStore.getState().accessToken;
    s.auth = { token };
    s.connect();
  }
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
