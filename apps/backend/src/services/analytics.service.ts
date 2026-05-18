import { prisma } from '../config/database';

export async function getFleetSummary() {
  const [activeBuses, delayedTrips, outOfService, breakdown] = await Promise.all([
    prisma.bus.count({ where: { status: 'IN_SERVICE' } }),
    prisma.trip.count({
      where: {
        status: 'EN_ROUTE',
        scheduledDeparture: { lt: new Date(Date.now() - 10 * 60 * 1000) },
      },
    }),
    prisma.bus.count({ where: { status: 'OUT_OF_SERVICE' } }),
    prisma.bus.count({ where: { status: 'BREAKDOWN' } }),
  ]);

  const activeTrips = await prisma.trip.findMany({
    where: { status: { in: ['SCHEDULED', 'EN_ROUTE'] } },
    include: {
      route: { select: { name: true, code: true, color: true } },
      bus: { select: { plateNumber: true } },
      driver: { select: { name: true } },
    },
    orderBy: { scheduledDeparture: 'asc' },
    take: 50,
  });

  return { activeBuses, delayedTrips, outOfService, breakdown, activeTrips };
}

export async function getRevenueSummary(from: Date, to: Date) {
  const transactions = await prisma.transaction.groupBy({
    by: ['type', 'status'],
    where: { createdAt: { gte: from, lte: to }, status: 'COMPLETED' },
    _sum: { amountJMD: true },
    _count: { id: true },
  });

  const overrideCount = await prisma.transaction.count({
    where: { createdAt: { gte: from, lte: to }, type: 'OVERRIDE' },
  });

  const fraudAlerts = await prisma.fraudAlert.count({
    where: { createdAt: { gte: from, lte: to }, isReviewed: false },
  });

  const byRoute = await prisma.transaction.groupBy({
    by: ['routeId'],
    where: { createdAt: { gte: from, lte: to }, status: 'COMPLETED', type: 'TAP_IN' },
    _sum: { amountJMD: true },
    _count: { id: true },
  });

  return { transactions, overrideCount, fraudAlerts, byRoute };
}

export async function getDemandHeatmap(routeId: string, from: Date, to: Date) {
  const boardings = await prisma.transaction.findMany({
    where: {
      routeId,
      type: 'TAP_IN',
      status: 'COMPLETED',
      createdAt: { gte: from, lte: to },
    },
    select: { createdAt: true, validatorId: true },
  });

  // Aggregate by hour
  const byHour: Record<string, number> = {};
  for (const boarding of boardings) {
    const hour = boarding.createdAt.getHours();
    const key = `${hour}`;
    byHour[key] = (byHour[key] ?? 0) + 1;
  }

  // Aggregate by validator (stop proxy) — validatorId maps to a physical stop validator
  const byStop: Record<string, number> = {};
  for (const boarding of boardings) {
    if (boarding.validatorId) {
      byStop[boarding.validatorId] = (byStop[boarding.validatorId] ?? 0) + 1;
    }
  }

  return { byHour, byStop, total: boardings.length };
}

/** Returns daily revenue totals within the given window for time-series chart rendering. */
export async function getRevenueDailySeries(from: Date, to: Date) {
  const raw = await prisma.transaction.findMany({
    where: {
      status: 'COMPLETED',
      type: 'TAP_IN',
      createdAt: { gte: from, lte: to },
    },
    select: { createdAt: true, amountJMD: true },
    orderBy: { createdAt: 'asc' },
  });

  // Bucket by calendar day (YYYY-MM-DD)
  const buckets: Record<string, number> = {};
  for (const tx of raw) {
    const day = tx.createdAt.toISOString().slice(0, 10);
    buckets[day] = (buckets[day] ?? 0) + Number(tx.amountJMD);
  }

  // Return sorted array for recharts
  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, totalJMD]) => ({ date, totalJMD: Math.round(totalJMD) }));
}

export async function getMaintenanceAlerts() {
  const [openDefects, breakdownWatchlist, dueForService] = await Promise.all([
    prisma.busDefect.findMany({
      where: { isResolved: false },
      include: { bus: { select: { plateNumber: true, status: true } } },
      orderBy: { severity: 'desc' },
    }),
    prisma.bus.findMany({
      where: { status: { in: ['BREAKDOWN', 'MAINTENANCE'] } },
      select: {
        id: true, plateNumber: true, status: true, odometerKm: true, lastServiceKm: true,
        defects: { where: { isResolved: false }, select: { severity: true, description: true } },
      },
    }),
    prisma.bus.findMany({
      where: {
        isActive: true,
      },
      select: { id: true, plateNumber: true, odometerKm: true, lastServiceKm: true },
    }),
  ]);

  const overdueBuses = dueForService.filter((b: { odometerKm: number; lastServiceKm: number }) => b.odometerKm - b.lastServiceKm > 10000);

  return { openDefects, breakdownWatchlist, overdueBuses };
}
