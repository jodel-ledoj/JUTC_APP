import { Request, Response } from 'express';
import * as occupancyService from '../services/occupancy.service';

/** POST /occupancy/ingest — direct count push from onboard hardware or bridge script */
export async function ingestOccupancy(req: Request, res: Response) {
  const reading = await occupancyService.ingestOccupancy(req.body);
  res.json({ success: true, data: reading ?? { skipped: true } });
}

/**
 * POST /occupancy/sensor/event — BLE sensor event from BusSensors hardware.
 * Payload: { sensorId, busId, eventType: 'BOARD'|'ALIGHT'|'HEARTBEAT', rssi?, timestamp }
 */
export async function sensorEvent(req: Request, res: Response) {
  const reading = await occupancyService.processSensorEvent(req.body);
  res.json({ success: true, data: reading ?? { skipped: true } });
}

/** GET /occupancy/:busId — current occupancy for one bus */
export async function getBusOccupancy(req: Request, res: Response) {
  const reading = await occupancyService.getCurrentOccupancy(req.params.busId);
  res.json({ success: true, data: reading });
}

/** GET /occupancy — occupancy for all supplied busIds (?busIds=id1,id2,...) */
export async function getBatchOccupancy(req: Request, res: Response) {
  const busIds = ((req.query.busIds as string) ?? '').split(',').filter(Boolean);
  const data = await occupancyService.getBatchOccupancy(busIds);
  res.json({ success: true, data });
}
