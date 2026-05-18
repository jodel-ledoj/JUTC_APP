import { Request, Response } from 'express';
import * as analyticsService from '../services/analytics.service';

export async function getFleetOverview(req: Request, res: Response) {
  const summary = await analyticsService.getFleetSummary();
  res.json({ success: true, data: summary });
}

export async function getRevenue(req: Request, res: Response) {
  const { from, to } = req.query;
  const fromDate = from ? new Date(from as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const toDate = to ? new Date(to as string) : new Date();
  const summary = await analyticsService.getRevenueSummary(fromDate, toDate);
  res.json({ success: true, data: summary });
}

export async function getDemandHeatmap(req: Request, res: Response) {
  const { routeId, from, to } = req.query;
  const fromDate = from ? new Date(from as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const toDate = to ? new Date(to as string) : new Date();
  const heatmap = await analyticsService.getDemandHeatmap(routeId as string, fromDate, toDate);
  res.json({ success: true, data: heatmap });
}

export async function getMaintenanceAlerts(req: Request, res: Response) {
  const alerts = await analyticsService.getMaintenanceAlerts();
  res.json({ success: true, data: alerts });
}

export async function getRevenueDailySeries(req: Request, res: Response) {
  const { from, to } = req.query;
  const fromDate = from ? new Date(from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const toDate = to ? new Date(to as string) : new Date();
  const series = await analyticsService.getRevenueDailySeries(fromDate, toDate);
  res.json({ success: true, data: series });
}
