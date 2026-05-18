import { createServer } from 'http';
import app from './app';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import { redis } from './config/redis';
import { initSocketServer } from './config/socket';
import { gpsWorker } from './workers/gps.worker';
import { fraudWorker } from './workers/fraud.worker';
import { notificationWorker } from './workers/notification.worker';
import { logger } from './utils/logger';

async function bootstrap() {
  await connectDatabase();
  logger.info('Database connected');

  await redis.ping();
  logger.info('Redis connected');

  const httpServer = createServer(app);
  initSocketServer(httpServer);
  logger.info('Socket.io initialized');

  httpServer.listen(env.PORT, () => {
    logger.info(`JUTC API running on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await gpsWorker.close();
    await fraudWorker.close();
    await notificationWorker.close();
    await redis.quit();
    process.exit(0);
  });
}

bootstrap().catch((err) => {
  logger.error('Failed to start server', { err });
  process.exit(1);
});
