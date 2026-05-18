import { prisma } from '../config/database';
import { redis, REDIS_KEYS, TTL } from '../config/redis';
import { getIO } from '../config/socket';
import { SOCKET_EVENTS } from '@jutc/shared';
import { getOccupancyLevel, OccupancyReading, SensorEvent } from '@jutc/shared';
import { logger } from '../utils/logger';

export interface OccupancyIngest {
  busId: string;
  tripId?: string;
  passengerCount: number;
  capacity?: number;
  latitude?: number;
  longitude?: number;
  sensorId?: string;
}

/**
 * Ingest a sensor occupancy reading.
 * Debounces rapid duplicate events (30s window per bus).
 * Caches current reading in Redis and broadcasts via Socket.io.
 * Enqueues async DB write for analytics.
 */
export async function ingestOccupancy(data: OccupancyIngest): Promise<OccupancyReading | null> {
  // Debounce: skip if an identical reading was processed in the last 30s
  const debounceKey = REDIS_KEYS.occupancyDebounce(data.busId);
  const recentCount = await redis.get(debounceKey);
  if (recentCount !== null && parseInt(recentCount) === data.passengerCount) {
    return null; // No change — suppress duplicate
  }

  // Resolve bus capacity from DB if not provided
  let capacity = data.capacity ?? 60;
  if (!data.capacity) {
    const bus = await prisma.bus.findUnique({
      where: { id: data.busId },
      select: { capacity: true },
    });
    if (bus) capacity = bus.capacity;
  }

  const occupancyPct = Math.min(100, Math.round((data.passengerCount / capacity) * 100));
  const level = getOccupancyLevel(occupancyPct);

  const reading: OccupancyReading = {
    busId: data.busId,
    tripId: data.tripId ?? null,
    passengerCount: data.passengerCount,
    capacity,
    occupancyPct,
    level,
    timestamp: new Date(),
  };

  // Cache current reading in Redis
  await redis.setex(
    REDIS_KEYS.busOccupancy(data.busId),
    TTL.OCCUPANCY,
    JSON.stringify(reading),
  );

  // Set debounce key
  await redis.setex(debounceKey, TTL.OCCUPANCY_DEBOUNCE, String(data.passengerCount));

  // Broadcast via Socket.io to route room and admin
  try {
    const io = getIO();
    io.to('admin').emit(SOCKET_EVENTS.OCCUPANCY_UPDATE, reading);

    if (data.tripId) {
      // Find routeId for this trip to broadcast to route room
      const trip = await prisma.trip.findUnique({
        where: { id: data.tripId },
        select: { routeId: true },
      });
      if (trip?.routeId) {
        io.to(`route:${trip.routeId}`).emit(SOCKET_EVENTS.OCCUPANCY_UPDATE, reading);
      }
    }
  } catch (err) {
    logger.warn('Occupancy socket emit failed (non-critical)', { err });
  }

  // Async DB write — fire and forget for performance
  prisma.occupancyEvent.create({
    data: {
      busId: data.busId,
      tripId: data.tripId ?? null,
      sensorId: data.sensorId ?? null,
      passengerCount: data.passengerCount,
      capacity,
      occupancyPct,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
    },
  }).catch((err) => logger.warn('Occupancy DB write failed (non-critical)', { err }));

  return reading;
}

/**
 * Process a BLE sensor event from BusSensors hardware.
 * BOARD event = +1 passenger, ALIGHT = -1, HEARTBEAT = no change.
 * Maintains a rolling count in Redis keyed per bus.
 */
export async function processSensorEvent(event: SensorEvent): Promise<OccupancyReading | null> {
  const countKey = `bus:occupancy:count:${event.busId}`;

  let currentCount = parseInt((await redis.get(countKey)) ?? '0');

  if (event.eventType === 'BOARD') {
    currentCount = Math.max(0, currentCount + 1);
  } else if (event.eventType === 'ALIGHT') {
    currentCount = Math.max(0, currentCount - 1);
  }
  // HEARTBEAT: no change to count — just refreshes the occupancy broadcast

  // Persist rolling count for 4 hours (covers a full shift)
  await redis.setex(countKey, 14400, String(currentCount));

  // Find active trip for this bus
  const bus = await prisma.bus.findUnique({
    where: { id: event.busId },
    select: {
      capacity: true,
      trips: {
        where: { status: 'EN_ROUTE' },
        select: { id: true },
        take: 1,
      },
    },
  });

  return ingestOccupancy({
    busId: event.busId,
    tripId: bus?.trips[0]?.id,
    passengerCount: currentCount,
    capacity: bus?.capacity,
    sensorId: event.sensorId,
  });
}

/** Get the current cached occupancy for a single bus. Returns null if no data. */
export async function getCurrentOccupancy(busId: string): Promise<OccupancyReading | null> {
  const cached = await redis.get(REDIS_KEYS.busOccupancy(busId));
  return cached ? JSON.parse(cached) : null;
}

/** Get occupancy for multiple buses in one batch Redis call. */
export async function getBatchOccupancy(busIds: string[]): Promise<Record<string, OccupancyReading>> {
  if (busIds.length === 0) return {};
  const keys = busIds.map(REDIS_KEYS.busOccupancy);
  const values = await redis.mget(...keys);
  const result: Record<string, OccupancyReading> = {};
  busIds.forEach((id, i) => {
    if (values[i]) result[id] = JSON.parse(values[i]!);
  });
  return result;
}
