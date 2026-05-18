import { FareType } from '../types/fare';

export const BASE_FARE_JMD = 100;

export const FARE_MULTIPLIERS: Record<FareType, number> = {
  [FareType.STANDARD]: 1.0,
  [FareType.STUDENT]: 0.5,
  [FareType.SENIOR]: 0.5,
  [FareType.CHILD]: 0.0,
  [FareType.MONTHLY_PASS]: 0.0,
};

export const QR_TICKET_EXPIRY_MINUTES = 60;
export const CHILD_FREE_UNDER_AGE = 3;
export const MINIMUM_TOP_UP_JMD = 100;
export const MAXIMUM_TOP_UP_JMD = 10000;
export const MAXIMUM_CARD_BALANCE_JMD = 25000;

export function calculateFare(fareType: FareType, baseFareJMD: number = BASE_FARE_JMD): number {
  return Math.round(baseFareJMD * FARE_MULTIPLIERS[fareType]);
}
