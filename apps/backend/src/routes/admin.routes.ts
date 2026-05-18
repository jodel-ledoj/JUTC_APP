import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { UserRole } from '@jutc/shared';

const router = Router();

router.use(authenticate, requireRole(UserRole.ADMIN, UserRole.EXECUTIVE));

router.get('/fleet', adminController.getFleetOverview);
router.get('/revenue', adminController.getRevenue);
router.get('/revenue/daily', adminController.getRevenueDailySeries);
router.get('/demand', adminController.getDemandHeatmap);
router.get('/maintenance', adminController.getMaintenanceAlerts);

export default router;
