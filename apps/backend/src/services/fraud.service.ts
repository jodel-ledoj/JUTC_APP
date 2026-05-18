import { redis } from '../config/redis';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

interface TapEvent {
  cardId: string;
  busId: string;
  validatorId: string;
  tripId?: string;
  timestamp: string;
}

export async function checkTapEvent(event: TapEvent): Promise<void> {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutes
  const tapKey = `fraud:taps:${event.cardId}`;
  const overrideKey = `fraud:overrides:${event.validatorId}:${getShiftDate()}`;

  // Rule 1: Duplicate tap on different bus within 2 minutes
  const recentTaps = await redis.lrange(tapKey, 0, 10);
  for (const tap of recentTaps) {
    const prev = JSON.parse(tap);
    const timeDiff = now - new Date(prev.timestamp).getTime();
    if (timeDiff < 120_000 && prev.busId !== event.busId) {
      await flagFraud('DUPLICATE_TAP_DIFFERENT_BUS', event, {
        previousBusId: prev.busId,
        timeDiffSeconds: Math.round(timeDiff / 1000),
      });
    }
  }

  // Rule 2: Same card tapped 3+ times on same validator in 5 minutes
  const sameValidatorTaps = recentTaps
    .map((t) => JSON.parse(t))
    .filter((t) => t.validatorId === event.validatorId && now - new Date(t.timestamp).getTime() < windowMs);

  if (sameValidatorTaps.length >= 3) {
    await flagFraud('RAPID_TAPS_SAME_VALIDATOR', event, { tapCount: sameValidatorTaps.length + 1 });
  }

  // Store this tap
  await redis.lpush(tapKey, JSON.stringify(event));
  await redis.expire(tapKey, 600);

  // Rule 3: More than 15 overrides per validator per shift (checked separately in override handler)
}

export async function checkOverrideThreshold(validatorId: string): Promise<void> {
  const key = `fraud:overrides:${validatorId}:${getShiftDate()}`;
  const count = await redis.incr(key);
  await redis.expire(key, 43200); // 12 hour shift window

  if (count === 15) {
    await flagFraud('EXCESSIVE_OVERRIDES', { validatorId } as any, { overrideCount: count });
  }
}

async function flagFraud(ruleCode: string, event: Partial<TapEvent>, metadata: object): Promise<void> {
  logger.warn('Fraud flag raised', { ruleCode, event, metadata });
  await prisma.fraudAlert.create({
    data: {
      ruleCode,
      cardId: event.cardId,
      busId: event.busId,
      validatorId: event.validatorId,
      description: `Fraud rule triggered: ${ruleCode}`,
      metadata,
    },
  });
}

function getShiftDate(): string {
  return new Date().toISOString().split('T')[0];
}
