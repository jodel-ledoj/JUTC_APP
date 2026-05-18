import { z } from 'zod';

export const createNotificationSchema = z.object({
  type: z.enum(['DELAY', 'ROUTE_CHANGE', 'SERVICE_ALERT', 'PAYMENT', 'EMERGENCY', 'SYSTEM']),
  severity: z.enum(['INFO', 'WARNING', 'CRITICAL']).default('INFO'),
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  routeId: z.string().uuid().optional(),
  affectedStops: z.array(z.string().uuid()).default([]),
  expiresAt: z.string().datetime().optional(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
