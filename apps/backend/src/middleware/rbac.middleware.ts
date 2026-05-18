import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@jutc/shared';
import { ROLE_HIERARCHY } from '@jutc/shared';
import { AppError } from './error.middleware';

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }
    const userLevel = ROLE_HIERARCHY[req.user.role as UserRole];
    const hasPermission = roles.some((role) => userLevel >= ROLE_HIERARCHY[role]);
    if (!hasPermission) {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
    }
    next();
  };
}
