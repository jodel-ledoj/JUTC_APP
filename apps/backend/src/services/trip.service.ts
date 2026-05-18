import { prisma } from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { getIO } from '../config/socket';
import { SOCKET_EVENTS } from '@jutc/shared';

export async function startTrip(data: {
  busId: string;
  routeId: string;
  driverId: string;
  scheduleId?: string;
  checklist: Record<string, boolean>;
}) {
  // Check no active trip for this driver or bus
  const existingTrip = await prisma.trip.findFirst({
    where: {
      OR: [
        { driverId: data.driverId, status: { in: ['SCHEDULED', 'EN_ROUTE'] } },
        { busId: data.busId, status: { in: ['SCHEDULED', 'EN_ROUTE'] } },
      ],
    },
  });
  if (existingTrip) {
    throw new AppError(409, 'CONFLICT', 'Active trip already exists for this driver or bus');
  }

  // Update bus status
  await prisma.bus.update({ where: { id: data.busId }, data: { status: 'IN_SERVICE' } });

  const trip = await prisma.trip.create({
    data: {
      busId: data.busId,
      routeId: data.routeId,
      driverId: data.driverId,
      scheduleId: data.scheduleId,
      status: 'EN_ROUTE',
      scheduledDeparture: new Date(),
      actualDeparture: new Date(),
      metadata: data.checklist,
    } as any,
    include: {
      route: { select: { name: true, code: true, color: true } },
      bus: { select: { plateNumber: true } },
      driver: { select: { name: true } },
    },
  });

  try {
    const io = getIO();
    io.to('admin').emit(SOCKET_EVENTS.TRIP_START, { tripId: trip.id, busId: data.busId, routeId: data.routeId });
  } catch {}

  return trip;
}

export async function updateTrip(tripId: string, driverId: string, data: {
  status?: string;
  passengerCount?: number;
  currentStopSeq?: number;
  notes?: string;
}) {
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) throw new AppError(404, 'NOT_FOUND', 'Trip not found');
  if (trip.driverId !== driverId) throw new AppError(403, 'FORBIDDEN', 'Not your trip');

  const updateData: any = {};
  if (data.status) updateData.status = data.status;
  if (data.passengerCount !== undefined) updateData.passengerCount = data.passengerCount;
  if (data.currentStopSeq !== undefined) updateData.currentStopSeq = data.currentStopSeq;
  if (data.notes) updateData.notes = data.notes;
  if (data.status === 'COMPLETED' || data.status === 'BREAKDOWN' || data.status === 'CANCELLED') {
    updateData.completedAt = new Date();
    await prisma.bus.update({
      where: { id: trip.busId },
      data: { status: data.status === 'BREAKDOWN' ? 'BREAKDOWN' : 'DEPOT' },
    });
  }

  return prisma.trip.update({ where: { id: tripId }, data: updateData });
}

export async function endTrip(tripId: string, driverId: string, passengerCount: number, notes?: string) {
  return updateTrip(tripId, driverId, { status: 'COMPLETED', passengerCount, notes });
}

export async function getActiveTrips(routeId?: string) {
  return prisma.trip.findMany({
    where: {
      status: { in: ['SCHEDULED', 'EN_ROUTE'] },
      ...(routeId ? { routeId } : {}),
    },
    include: {
      route: { select: { name: true, code: true, color: true } },
      bus: { select: { plateNumber: true } },
      driver: { select: { name: true } },
    },
    orderBy: { scheduledDeparture: 'asc' },
  });
}
