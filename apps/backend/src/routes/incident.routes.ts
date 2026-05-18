import { Router } from 'express';
import * as incidentController from '../controllers/incident.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { createIncidentSchema, updateIncidentSchema } from '@jutc/shared';
import { UserRole } from '@jutc/shared';

const router = Router();

router.use(authenticate);

router.post('/', validateBody(createIncidentSchema), incidentController.createIncident);
router.get('/', requireRole(UserRole.ADMIN, UserRole.EXECUTIVE), incidentController.getIncidents);
router.patch('/:id', requireRole(UserRole.ADMIN, UserRole.EXECUTIVE), validateBody(updateIncidentSchema), incidentController.updateIncident);

export default router;
