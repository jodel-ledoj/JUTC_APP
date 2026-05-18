import { prisma } from '../config/database';
import { notificationQueue } from '../config/queue';
import { getIO } from '../config/socket';
import { SOCKET_EVENTS } from '@jutc/shared';
import { logger } from '../utils/logger';

export async function publishNotification(data: {
  type: string;
  severity: string;
  title: string;
  body: string;
  routeId?: string;
  affectedStops?: string[];
  expiresAt?: string;
  metadata?: object;
}) {
  const notification = await prisma.notification.create({
    data: {
      type: data.type as any,
      severity: data.severity as any,
      title: data.title,
      body: data.body,
      routeId: data.routeId,
      affectedStops: data.affectedStops ?? [],
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      metadata: data.metadata as any,
    },
  });

  // Broadcast via Socket.io
  try {
    const io = getIO();
    const payload = { notification };
    if (data.routeId) {
      io.to(`route:${data.routeId}`).emit(SOCKET_EVENTS.SERVICE_ALERT, payload);
    } else {
      io.emit(SOCKET_EVENTS.SERVICE_ALERT, payload);
    }
    io.to('admin').emit(SOCKET_EVENTS.SERVICE_ALERT, payload);
  } catch (err) {
    logger.warn('Socket broadcast failed', { err });
  }

  // Queue push notifications
  if (data.routeId) {
    await notificationQueue.add('push-to-route-passengers', {
      routeId: data.routeId,
      title: data.title,
      body: data.body,
      severity: data.severity,
    });
  }

  return notification;
}

export async function getActiveNotifications(routeId?: string) {
  const now = new Date();
  return prisma.notification.findMany({
    where: {
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      ...(routeId ? { routeId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}
