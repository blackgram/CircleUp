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
let currentRoomCode: string | null = null;
let listenersAttached = false;

export function setCurrentRoomCode(roomCode: string | null): void {
  currentRoomCode = roomCode;
}

export function getCurrentRoomCode(): string | null {
  return currentRoomCode;
}

export function getSocket(): AppSocket {
  if (!socket) {
    const token = useAuthStore.getState().accessToken;

    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });
  }

  return socket;
}

export function connectSocket(): void {
  const s = getSocket();

  // Always update token
  const token = useAuthStore.getState().accessToken;
  s.auth = { token };

  // Only attach core listeners once
  if (!listenersAttached) {
    listenersAttached = true;

    s.on("connect", () => {
      console.log("[Socket] Connected, id:", s.id);

      // Auto-rejoin room on reconnection (e.g. after page reload or network drop)
      if (currentRoomCode) {
        console.log("[Socket] Auto-rejoining room:", currentRoomCode);
        s.emit("room:join", { roomCode: currentRoomCode }, (res) => {
          if (res.success) {
            console.log("[Socket] Rejoined room:", currentRoomCode);
          } else {
            console.error("[Socket] Failed to rejoin room:", res.message);
          }
        });
      }
    });

    s.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected, reason:", reason);
    });

    s.on("connect_error", (err) => {
      console.error("[Socket] Connection error:", err.message);
      // Refresh token on auth errors and retry
      if (err.message === "Invalid token" || err.message === "Token revoked") {
        const freshToken = useAuthStore.getState().accessToken;
        if (freshToken) {
          s.auth = { token: freshToken };
        }
      }
    });

    s.on("error", (payload) => {
      console.error("[Socket] Server error:", payload.message);
    });
  }

  if (!s.connected) {
    s.connect();
  }
}

export function disconnectSocket(): void {
  if (socket) {
    currentRoomCode = null;
    listenersAttached = false;
    socket.disconnect();
    socket = null;
  }
}
