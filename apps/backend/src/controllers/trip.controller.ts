import { Request, Response } from 'express';
import * as tripService from '../services/trip.service';

export async function startTrip(req: Request, res: Response) {
  const trip = await tripService.startTrip({ ...req.body, driverId: req.user!.userId });
  res.status(201).json({ success: true, data: trip });
}

export async function updateTripStatus(req: Request, res: Response) {
  const trip = await tripService.updateTrip(req.params.id, req.user!.userId, req.body);
  res.json({ success: true, data: trip });
}

export async function endTrip(req: Request, res: Response) {
  const { passengerCount, notes } = req.body;
  const trip = await tripService.endTrip(req.params.id, req.user!.userId, passengerCount, notes);
  res.json({ success: true, data: trip });
}

export async function getActiveTrips(req: Request, res: Response) {
  const { routeId } = req.query;
  const trips = await tripService.getActiveTrips(routeId as string | undefined);
  res.json({ success: true, data: trips });
}
