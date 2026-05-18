import { Request, Response } from 'express';
import * as gpsService from '../services/gps.service';

export async function updateGPS(req: Request, res: Response) {
  await gpsService.ingestGPS(req.body);
  res.json({ success: true, data: { received: true } });
}

export async function getPositions(req: Request, res: Response) {
  const { routeId } = req.query;
  const positions = await gpsService.getActiveBusPositions(routeId as string | undefined);
  res.json({ success: true, data: positions });
}
