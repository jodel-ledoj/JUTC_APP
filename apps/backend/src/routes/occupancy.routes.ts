import { Router } from 'express';
import * as occupancyController from '../controllers/occupancy.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { UserRole } from '@jutc/shared';

const router = Router();

// Sensor ingest endpoints — authenticated as DRIVER/CONDUCTOR or via sensor API key
// In production these would use a dedicated sensor auth header instead of JWT
router.post('/ingest', authenticate, requireRole(UserRole.DRIVER, UserRole.CONDUCTOR, UserRole.ADMIN), occupancyController.ingestOccupancy);

// BLE sensor bridge endpoint — no auth (sensors use a shared secret in production)
// The Python BusSensors scripts POST here after decoding BLE advertisements
router.post('/sensor/event', occupancyController.sensorEvent);

// Read endpoints for passenger app and admin dashboard
router.get('/', authenticate, occupancyController.getBatchOccupancy);
router.get('/:busId', authenticate, occupancyController.getBusOccupancy);

export default router;
