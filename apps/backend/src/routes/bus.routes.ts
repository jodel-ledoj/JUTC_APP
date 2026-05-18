import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { UserRole } from '@jutc/shared';
import { AppError } from '../middleware/error.middleware';

const router = Router();

router.get('/', authenticate, async (_req, res) => {
  const buses = await prisma.bus.findMany({
    where: { isActive: true },
    include: { depot: { select: { name: true } } },
    orderBy: { plateNumber: 'asc' },
  });
  res.json({ success: true, data: buses });
});

router.get('/live', authenticate, async (_req, res) => {
  const buses = await prisma.bus.findMany({
    where: { status: 'IN_SERVICE', isActive: true },
    include: {
      trips: {
        where: { status: 'EN_ROUTE' },
        include: { route: { select: { name: true, code: true, color: true } } },
        take: 1,
      },
    },
  });
  res.json({ success: true, data: buses });
});

router.patch('/:id/status', authenticate, requireRole(UserRole.ADMIN, UserRole.EXECUTIVE), async (req, res) => {
  const { status } = req.body;
  const bus = await prisma.bus.findUnique({ where: { id: req.params.id } });
  if (!bus) throw new AppError(404, 'NOT_FOUND', 'Bus not found');
  const updated = await prisma.bus.update({ where: { id: req.params.id }, data: { status } });
  res.json({ success: true, data: updated });
});

export default router;
