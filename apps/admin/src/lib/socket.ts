import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/auth.store';

let socket: Socket | null = null;

export function getAdminSocket(): Socket {
  if (socket?.connected) return socket;

  const token = useAuthStore.getState().token;
  const url = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3000';
  socket = io(url, {
    auth: { token },
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    socket!.emit('join:admin');
  });

  return socket;
}
