import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { createNotificationSchema } from '@jutc/shared';
import { UserRole } from '@jutc/shared';

const router = Router();

router.get('/', authenticate, notificationController.getNotifications);
router.post('/', authenticate, requireRole(UserRole.ADMIN, UserRole.EXECUTIVE), validateBody(createNotificationSchema), notificationController.publishNotification);

export default router;
