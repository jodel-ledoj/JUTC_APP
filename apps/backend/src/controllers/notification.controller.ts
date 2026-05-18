import { Request, Response } from 'express';
import * as notificationService from '../services/notification.service';

export async function getNotifications(req: Request, res: Response) {
  const { routeId } = req.query;
  const notifications = await notificationService.getActiveNotifications(routeId as string | undefined);
  res.json({ success: true, data: notifications });
}

export async function publishNotification(req: Request, res: Response) {
  const notification = await notificationService.publishNotification(req.body);
  res.status(201).json({ success: true, data: notification });
}
