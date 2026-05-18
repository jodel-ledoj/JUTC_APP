import { Worker } from 'bullmq';
import { prisma } from '../config/database';
import { queueConnection } from '../config/queue';
import { logger } from '../utils/logger';

const BATCH_SIZE = 50;
const batch: any[] = [];

export const gpsWorker = new Worker(
  'gps-events',
  async (job) => {
    batch.push({
      busId: job.data.busId,
      tripId: job.data.tripId ?? null,
      latitude: job.data.latitude,
      longitude: job.data.longitude,
      speed: job.data.speed ?? null,
      heading: job.data.heading ?? null,
      accuracy: job.data.accuracy ?? null,
      timestamp: new Date(),
    });

    if (batch.length >= BATCH_SIZE) {
      const toWrite = batch.splice(0, BATCH_SIZE);
      await prisma.gpsEvent.createMany({ data: toWrite });
      logger.debug(`GPS batch written: ${toWrite.length} events`);
    }
  },
  { connection: queueConnection, concurrency: 5 }
);

// Flush remaining on interval
setInterval(async () => {
  if (batch.length > 0) {
    const toWrite = batch.splice(0, batch.length);
    await prisma.gpsEvent.createMany({ data: toWrite }).catch((err: unknown) =>
      logger.error('GPS batch flush error', { err })
    );
  }
}, 5000);

gpsWorker.on('error', (err) => logger.error('GPS worker error', { err }));
