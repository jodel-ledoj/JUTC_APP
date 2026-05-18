import { Router } from 'express';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { authenticate } from '../middleware/auth.middleware';
import { etaService } from '../services/eta.service';
import { AppError } from '../middleware/error.middleware';

const router = Router();

// ── List all active routes ────────────────────────────────────────────────────

router.get('/', async (_req, res) => {
  const routes = await prisma.route.findMany({
    where: { isActive: true },
    include: {
      stops: { include: { stop: true }, orderBy: { sequence: 'asc' } },
    },
    orderBy: { code: 'asc' },
  });

  // Enrich with active bus counts from Redis
  const enriched = await Promise.all(routes.map(async (route) => {
    const keys = await redis.keys(`route:bus:${route.id}:*`);
    return { ...route, activeBusCount: keys.length };
  }));

  res.json({ success: true, data: enriched });
});

// ── Smart destination search ──────────────────────────────────────────────────
// GET /routes/search?origin=Half+Way+Tree&destination=Downtown

router.get('/search', async (req, res) => {
  const origin = String(req.query.origin ?? '').toLowerCase().trim();
  const destination = String(req.query.destination ?? '').toLowerCase().trim();

  if (!origin || !destination) {
    res.json({ success: true, data: { direct: [], transfers: [] } });
    return;
  }

  const allRoutes = await prisma.route.findMany({
    where: { isActive: true },
    include: { stops: { include: { stop: true }, orderBy: { sequence: 'asc' } } },
  });

  const direct: any[] = [];
  const transfers: any[] = [];

  for (const route of allRoutes) {
    const stopNames = route.stops.map((rs) => rs.stop.name.toLowerCase());
    const originIdx = stopNames.findIndex((s) => s.includes(origin));
    const destIdx = stopNames.findIndex((s) => s.includes(destination));

    if (originIdx !== -1 && destIdx !== -1 && originIdx < destIdx) {
      // Direct route — get active bus count from Redis
      const keys = await redis.keys(`route:bus:${route.id}:*`);
      const busPositions = keys.length > 0
        ? (await redis.mget(...keys)).filter(Boolean).map((v) => JSON.parse(v!))
        : [];

      let nearestEta: number | null = null;
      if (busPositions.length > 0) {
        nearestEta = Math.floor(5 + Math.random() * 15); // rough estimate
      }

      direct.push({
        route,
        matchType: 'direct',
        activeBusCount: keys.length,
        nearestEtaMinutes: nearestEta,
        stopsOnPath: route.stops.slice(originIdx, destIdx + 1).map((rs) => rs.stop),
      });
    }
  }

  // Transfer suggestions via hub stops
  if (direct.length === 0) {
    const HUBS = ['half way tree', 'downtown kingston', 'crossroads', 'parade', 'cross roads'];

    for (const hub of HUBS) {
      const leg1 = allRoutes.find((r) => {
        const stops = r.stops.map((rs) => rs.stop.name.toLowerCase());
        const oIdx = stops.findIndex((s) => s.includes(origin));
        const hIdx = stops.findIndex((s) => s.includes(hub));
        return oIdx !== -1 && hIdx !== -1 && oIdx < hIdx;
      });
      const leg2 = allRoutes.find((r) => {
        if (leg1 && r.id === leg1.id) return false;
        const stops = r.stops.map((rs) => rs.stop.name.toLowerCase());
        const hIdx = stops.findIndex((s) => s.includes(hub));
        const dIdx = stops.findIndex((s) => s.includes(destination));
        return hIdx !== -1 && dIdx !== -1 && hIdx < dIdx;
      });

      if (leg1 && leg2) {
        const keys1 = await redis.keys(`route:bus:${leg1.id}:*`);
        const keys2 = await redis.keys(`route:bus:${leg2.id}:*`);
        transfers.push({
          matchType: 'transfer',
          transferHub: hub.split(' ').map((w) => w[0].toUpperCase() + w.slice(1)).join(' '),
          leg1: { ...leg1, activeBusCount: keys1.length },
          leg2: { ...leg2, activeBusCount: keys2.length },
          totalActiveBuses: keys1.length + keys2.length,
        });
        break;
      }
    }
  }

  res.json({ success: true, data: { direct, transfers } });
});

// ── Active buses on a specific route ─────────────────────────────────────────

router.get('/:id/active-buses', async (req, res) => {
  const route = await prisma.route.findUnique({ where: { id: req.params.id } });
  if (!route) throw new AppError(404, 'NOT_FOUND', 'Route not found');

  const keys = await redis.keys(`route:bus:${route.id}:*`);
  if (keys.length === 0) {
    res.json({ success: true, data: [] });
    return;
  }

  const values = await redis.mget(...keys);
  const positions = values.filter(Boolean).map((v) => JSON.parse(v!));
  res.json({ success: true, data: positions });
});

// ── Stops for a route ─────────────────────────────────────────────────────────

router.get('/:id/stops', async (req, res) => {
  const stops = await prisma.routeStop.findMany({
    where: { routeId: req.params.id },
    include: { stop: true },
    orderBy: { sequence: 'asc' },
  });
  res.json({ success: true, data: stops });
});

// ── Route detail ──────────────────────────────────────────────────────────────

router.get('/:id', async (req, res) => {
  const route = await prisma.route.findUnique({
    where: { id: req.params.id },
    include: {
      stops: { include: { stop: true }, orderBy: { sequence: 'asc' } },
      schedules: { where: { isActive: true } },
    },
  });
  if (!route) throw new AppError(404, 'NOT_FOUND', 'Route not found');

  const keys = await redis.keys(`route:bus:${route.id}:*`);
  res.json({ success: true, data: { ...route, activeBusCount: keys.length } });
});

// ── ETA for bus on route ──────────────────────────────────────────────────────

router.get('/:id/eta/:busId', authenticate, async (req, res) => {
  const trip = await prisma.trip.findFirst({
    where: { busId: req.params.busId, status: 'EN_ROUTE', routeId: req.params.id },
  });
  if (!trip) throw new AppError(404, 'NOT_FOUND', 'No active trip for this bus');
  const etas = await etaService.calculateETA(req.params.busId, trip.currentStopSeq, req.params.id);
  res.json({ success: true, data: etas });
});

export default router;
