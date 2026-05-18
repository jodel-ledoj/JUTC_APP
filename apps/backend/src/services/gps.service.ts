import { prisma } from '../config/database';
import { redis, REDIS_KEYS, TTL } from '../config/redis';
import { gpsQueue } from '../config/queue';
import { getIO } from '../config/socket';
import { SOCKET_EVENTS } from '@jutc/shared';
import { BusPosition } from '@jutc/shared';
import { etaService } from './eta.service';
import { logger } from '../utils/logger';

export interface GPSUpdate {
  busId: string;
  tripId?: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
}

export async function ingestGPS(update: GPSUpdate): Promise<void> {
  // Validate coordinates are roughly in Jamaica
  if (update.latitude < 17.5 || update.latitude > 18.6 ||
      update.longitude < -78.4 || update.longitude > -76.1) {
    logger.warn('GPS coordinates outside Jamaica bounds', update);
    return;
  }

  // Get bus and trip info for full position payload
  const bus = await prisma.bus.findUnique({
    where: { id: update.busId },
    include: {
      trips: {
        where: { status: 'EN_ROUTE' },
        include: { route: { select: { id: true, code: true, color: true } } },
        take: 1,
      },
    },
  });

  if (!bus) return;

  const activeTrip = bus.trips[0];
  const position: BusPosition = {
    busId: bus.id,
    plateNumber: bus.plateNumber,
    routeId: activeTrip?.routeId ?? null,
    routeCode: activeTrip?.route?.code ?? null,
    tripId: update.tripId ?? null,
    latitude: update.latitude,
    longitude: update.longitude,
    speed: update.speed ?? 0,
    heading: update.heading ?? 0,
    status: bus.status as any,
    passengerCount: activeTrip?.passengerCount ?? 0,
    timestamp: new Date(),
  };

  // Cache position in Redis
  await redis.setex(
    REDIS_KEYS.busPosition(update.busId),
    TTL.BUS_POSITION,
    JSON.stringify(position)
  );

  // Update route buses set
  if (activeTrip?.routeId) {
    await redis.setex(
      `route:bus:${activeTrip.routeId}:${update.busId}`,
      TTL.BUS_POSITION,
      JSON.stringify(position)
    );
  }

  // Enqueue batch DB write
  await gpsQueue.add('gps-write', update, { removeOnComplete: 100, removeOnFail: 50 });

  // Broadcast to route room
  try {
    const io = getIO();
    if (activeTrip?.routeId) {
      // Calculate ETAs
      const etas = await etaService.calculateETA(update.busId, activeTrip.currentStopSeq, activeTrip.routeId);
      io.to(`route:${activeTrip.routeId}`).emit(SOCKET_EVENTS.GPS_UPDATE, { position, etas });
      io.to('admin').emit(SOCKET_EVENTS.GPS_UPDATE, { position });
    }
  } catch (err) {
    logger.warn('Socket emit failed (non-critical)', { err });
  }
}

export async function getActiveBusPositions(routeId?: string): Promise<BusPosition[]> {
  if (routeId) {
    const keys = await redis.keys(`route:bus:${routeId}:*`);
    if (keys.length === 0) return [];
    const values = await redis.mget(...keys);
    return values.filter(Boolean).map((v) => JSON.parse(v!));
  }

  // All active buses
  const activeBuses = await prisma.bus.findMany({
    where: { status: 'IN_SERVICE', isActive: true },
    select: { id: true },
  });

  const positions: BusPosition[] = [];
  for (const bus of activeBuses) {
    const cached = await redis.get(REDIS_KEYS.busPosition(bus.id));
    if (cached) positions.push(JSON.parse(cached));
  }
  return positions;
}
