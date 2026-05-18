import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { SOCKET_EVENTS } from '@jutc/shared';
import { logger } from '../utils/logger';
import { verifyAccessToken } from '../services/auth.service';

let io: SocketServer;

export function initSocketServer(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGINS?.split(',') ?? ['http://localhost:5173'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token as string;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.userId;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info('Socket connected', { userId: socket.data.userId });

    socket.on(SOCKET_EVENTS.JOIN_ROUTE, (routeId: string) => {
      socket.join(`route:${routeId}`);
    });

    socket.on(SOCKET_EVENTS.LEAVE_ROUTE, (routeId: string) => {
      socket.leave(`route:${routeId}`);
    });

    socket.on(SOCKET_EVENTS.JOIN_BUS, (busId: string) => {
      socket.join(`bus:${busId}`);
    });

    socket.on(SOCKET_EVENTS.JOIN_ADMIN, () => {
      if (['ADMIN', 'EXECUTIVE'].includes(socket.data.role)) {
        socket.join('admin');
      }
    });

    socket.on('disconnect', () => {
      logger.info('Socket disconnected', { userId: socket.data.userId });
    });
  });

  return io;
}

export function getIO(): SocketServer {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}
