import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../constants/config';
import { getAccessToken } from './storage';

let socket: Socket | null = null;

export async function getSocket(): Promise<Socket> {
  if (socket?.connected) return socket;

  const token = await getAccessToken();
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionAttempts: 10,
  });

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export function joinRouteRoom(routeId: string) {
  socket?.emit('join:route', routeId);
}

export function leaveRouteRoom(routeId: string) {
  socket?.emit('leave:route', routeId);
}
