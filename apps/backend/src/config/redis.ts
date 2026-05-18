import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy(times) {
    if (times > 5) {
      logger.error('Redis connection failed after 5 retries');
      return null;
    }
    return Math.min(times * 500, 2000);
  },
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error('Redis error', { err }));

export const REDIS_KEYS = {
  busPosition: (busId: string) => `bus:position:${busId}`,
  routeBuses: (routeId: string) => `route:buses:${routeId}`,
  busETA: (busId: string, stopId: string) => `eta:${busId}:${stopId}`,
  cardBalance: (cardId: string) => `card:balance:${cardId}`,
  fraudTaps: (cardId: string) => `fraud:taps:${cardId}`,
  validatorOverrides: (validatorId: string, shiftDate: string) =>
    `fraud:overrides:${validatorId}:${shiftDate}`,
  busOccupancy: (busId: string) => `bus:occupancy:${busId}`,
  occupancyDebounce: (busId: string) => `occupancy:debounce:${busId}`,
};

export const TTL = {
  BUS_POSITION: 30,
  ROUTE_BUSES: 15,
  ETA: 30,
  CARD_BALANCE: 60,
  FRAUD_WINDOW: 300,
  OCCUPANCY: 120,         // 2 min — occupancy persists briefly after last reading
  OCCUPANCY_DEBOUNCE: 30, // 30 sec — deduplicate rapid sensor events
};
