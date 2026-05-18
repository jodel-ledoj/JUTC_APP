import rateLimit from 'express-rate-limit';
import { UserRole } from '@jutc/shared';
import { Request } from 'express';

function getRateLimit(windowMs: number, max: number) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' },
    },
  });
}

export const passengerRateLimit = getRateLimit(60_000, 100);
export const driverRateLimit = getRateLimit(60_000, 500);
export const adminRateLimit = getRateLimit(60_000, 1000);
export const gpsRateLimit = getRateLimit(10_000, 50);
export const authRateLimit = getRateLimit(900_000, 10);

export function dynamicRateLimit(req: Request, res: Response, next: Function): void {
  const role = req.user?.role as UserRole | undefined;
  if (role === UserRole.ADMIN || role === UserRole.EXECUTIVE) {
    return adminRateLimit(req, res as any, next as any);
  }
  if (role === UserRole.DRIVER || role === UserRole.CONDUCTOR) {
    return driverRateLimit(req, res as any, next as any);
  }
  return passengerRateLimit(req, res as any, next as any);
}
