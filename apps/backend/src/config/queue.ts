import { Queue, Worker } from 'bullmq';
import { env } from './env';

const connection = {
  host: new URL(env.REDIS_URL).hostname,
  port: parseInt(new URL(env.REDIS_URL).port || '6379'),
};

export const gpsQueue = new Queue('gps-events', { connection });
export const notificationQueue = new Queue('notifications', { connection });
export const fraudQueue = new Queue('fraud-checks', { connection });

export { connection as queueConnection };
