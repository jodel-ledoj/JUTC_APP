import { Router } from 'express';
import { prisma } from '../config/database';
import { redis } from '../config/redis';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();
    res.json({ success: true, data: { status: 'healthy', db: 'ok', redis: 'ok', timestamp: new Date() } });
  } catch (err) {
    res.status(503).json({ success: false, error: { code: 'UNHEALTHY', message: 'Service unhealthy' } });
  }
});

export default router;
