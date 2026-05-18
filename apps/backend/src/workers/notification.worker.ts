import { Worker } from 'bullmq';
import { prisma } from '../config/database';
import { queueConnection } from '../config/queue';
import { logger } from '../utils/logger';

interface PushToRouteJob {
  routeId: string;
  title: string;
  body: string;
  severity: string;
}

/**
 * Delivers push notifications to all passengers subscribed to a route.
 * Uses Expo push notification format (token starts with ExponentPushToken).
 * Batches up to 100 tokens per Expo request (Expo limit).
 */
export const notificationWorker = new Worker(
  'notifications',
  async (job) => {
    if (job.name === 'push-to-route-passengers') {
      await deliverRouteNotification(job.data as PushToRouteJob);
    }
  },
  { connection: queueConnection, concurrency: 3 }
);

async function deliverRouteNotification(data: PushToRouteJob): Promise<void> {
  // Find all push tokens for passengers who have an active smart card
  // and have ridden the route in the last 30 days
  const recentPassengerIds = await prisma.transaction.findMany({
    where: {
      routeId: data.routeId,
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      status: 'COMPLETED',
    },
    select: { card: { select: { userId: true } } },
    distinct: ['cardId'],
    take: 500,
  });

  const userIds = [...new Set(
    recentPassengerIds
      .map((r: { card: { userId: string } | null }) => r.card?.userId)
      .filter((id: string | undefined): id is string => Boolean(id))
  )];
  if (userIds.length === 0) return;

  const pushTokens = await prisma.pushToken.findMany({
    where: { userId: { in: userIds } },
    select: { token: true },
  });

  if (pushTokens.length === 0) return;

  const tokens = pushTokens.map((t: { token: string }) => t.token);
  const BATCH = 100;

  for (let i = 0; i < tokens.length; i += BATCH) {
    const chunk = tokens.slice(i, i + BATCH);
    const messages = chunk.map((token: string) => ({
      to: token,
      sound: 'default' as const,
      title: data.title,
      body: data.body,
      priority: data.severity === 'CRITICAL' ? ('high' as const) : ('default' as const),
      data: { routeId: data.routeId, severity: data.severity },
    }));

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        logger.warn('Expo push batch failed', { status: response.status, batch: i / BATCH });
      } else {
        logger.info(`Push notifications delivered`, {
          routeId: data.routeId,
          count: chunk.length,
          batch: i / BATCH,
        });
      }
    } catch (err) {
      logger.error('Push notification delivery error', { err, batch: i / BATCH });
    }
  }
}

notificationWorker.on('error', (err) => logger.error('Notification worker error', { err }));
notificationWorker.on('failed', (job, err) =>
  logger.error('Notification job failed', { jobId: job?.id, err })
);
