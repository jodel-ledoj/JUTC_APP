import { Router } from 'express';
import * as tripController from '../controllers/trip.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { tripStartSchema, tripStatusUpdateSchema, tripEndSchema } from '@jutc/shared';
import { UserRole } from '@jutc/shared';

const router = Router();

router.use(authenticate);

router.get('/active', tripController.getActiveTrips);
router.post('/start', requireRole(UserRole.DRIVER, UserRole.CONDUCTOR), validateBody(tripStartSchema), tripController.startTrip);
router.patch('/:id/status', requireRole(UserRole.DRIVER, UserRole.CONDUCTOR), validateBody(tripStatusUpdateSchema), tripController.updateTripStatus);
router.post('/:id/end', requireRole(UserRole.DRIVER, UserRole.CONDUCTOR), validateBody(tripEndSchema), tripController.endTrip);

export default router;
