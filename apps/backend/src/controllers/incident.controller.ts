import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/error.middleware';

export async function createIncident(req: Request, res: Response) {
  const incident = await prisma.incident.create({
    data: { ...req.body, reportedBy: req.user!.userId },
  });
  res.status(201).json({ success: true, data: incident });
}

export async function getIncidents(req: Request, res: Response) {
  const { status, severity, page = '1', limit = '20' } = req.query;
  const where: any = {};
  if (status) where.status = status;
  if (severity) where.severity = severity;

  const [items, total] = await Promise.all([
    prisma.incident.findMany({
      where,
      include: { reporter: { select: { name: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string),
    }),
    prisma.incident.count({ where }),
  ]);

  res.json({
    success: true,
    data: items,
    meta: { total, page: parseInt(page as string), limit: parseInt(limit as string), totalPages: Math.ceil(total / parseInt(limit as string)) },
  });
}

export async function updateIncident(req: Request, res: Response) {
  const incident = await prisma.incident.findUnique({ where: { id: req.params.id } });
  if (!incident) throw new AppError(404, 'NOT_FOUND', 'Incident not found');

  const updated = await prisma.incident.update({
    where: { id: req.params.id },
    data: {
      ...req.body,
      resolvedAt: req.body.status === 'RESOLVED' ? new Date() : incident.resolvedAt,
    },
  });
  res.json({ success: true, data: updated });
}
