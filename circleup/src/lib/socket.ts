import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    // In browser, connect to same host/port
    socket = io(window.location.origin, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    socket.on('connect', () => {
      console.log('⚡ Socket connected to CircleUp backend');
    });

    socket.on('disconnect', (reason) => {
      console.warn('⚡ Socket disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('⚡ Socket connection error:', err.message);
    });
  }

  return socket;
}
