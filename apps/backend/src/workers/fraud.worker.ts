import { Worker } from 'bullmq';
import { queueConnection } from '../config/queue';
import { checkTapEvent } from '../services/fraud.service';
import { logger } from '../utils/logger';

export const fraudWorker = new Worker(
  'fraud-checks',
  async (job) => {
    await checkTapEvent(job.data);
  },
  { connection: queueConnection, concurrency: 10 }
);

fraudWorker.on('error', (err) => logger.error('Fraud worker error', { err }));
