import { prisma } from '../config/database';
import { redis, REDIS_KEYS, TTL } from '../config/redis';
import { haversineDistance } from '@jutc/shared';
import { StopETA } from '@jutc/shared';

const AVG_SPEED_KMH = 25;
const DWELL_TIME_MINUTES = 0.5;

export const etaService = {
  async calculateETA(busId: string, currentStopSeq: number, routeId: string): Promise<StopETA[]> {
    const cacheKey = `eta:${busId}:${currentStopSeq}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const busPosition = await redis.get(REDIS_KEYS.busPosition(busId));
    if (!busPosition) return [];

    const pos = JSON.parse(busPosition);

    const remainingStops = await prisma.routeStop.findMany({
      where: { routeId, sequence: { gt: currentStopSeq } },
      include: { stop: true },
      orderBy: { sequence: 'asc' },
    });

    const etas: StopETA[] = [];
    let accumulatedMinutes = 0;
    let prevLat = pos.latitude;
    let prevLon = pos.longitude;

    for (const routeStop of remainingStops) {
      const distKm = haversineDistance(prevLat, prevLon, routeStop.stop.latitude, routeStop.stop.longitude);
      const travelMinutes = (distKm / AVG_SPEED_KMH) * 60;
      accumulatedMinutes += travelMinutes + DWELL_TIME_MINUTES;

      const estimatedArrival = new Date(Date.now() + accumulatedMinutes * 60_000);
      const confidence: StopETA['confidence'] =
        routeStop.sequence - currentStopSeq <= 2 ? 'HIGH' :
        routeStop.sequence - currentStopSeq <= 5 ? 'MEDIUM' : 'LOW';

      etas.push({
        stopId: routeStop.stopId,
        stopName: routeStop.stop.name,
        sequence: routeStop.sequence,
        estimatedArrival,
        minutesAway: Math.round(accumulatedMinutes),
        confidence,
      });

      prevLat = routeStop.stop.latitude;
      prevLon = routeStop.stop.longitude;
    }

    await redis.setex(cacheKey, TTL.ETA, JSON.stringify(etas));
    return etas;
  },
};
