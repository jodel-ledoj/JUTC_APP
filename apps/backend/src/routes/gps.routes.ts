import { Router } from 'express';
import * as gpsController from '../controllers/gps.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { gpsRateLimit } from '../middleware/rateLimit.middleware';
import { gpsUpdateSchema } from '@jutc/shared';
import { UserRole } from '@jutc/shared';

const router = Router();

router.post('/update', authenticate, requireRole(UserRole.DRIVER, UserRole.CONDUCTOR), gpsRateLimit, validateBody(gpsUpdateSchema), gpsController.updateGPS);
router.get('/positions', authenticate, gpsController.getPositions);

export default router;
