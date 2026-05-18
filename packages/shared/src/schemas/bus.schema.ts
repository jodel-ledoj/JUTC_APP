import { z } from 'zod';

export const gpsUpdateSchema = z.object({
  busId: z.string().uuid('Invalid bus ID'),
  tripId: z.string().uuid().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speed: z.number().min(0).max(200).optional(),
  heading: z.number().min(0).max(360).optional(),
  accuracy: z.number().optional(),
});

export const busStatusUpdateSchema = z.object({
  status: z.enum(['IN_SERVICE', 'OUT_OF_SERVICE', 'MAINTENANCE', 'BREAKDOWN', 'DEPOT']),
  notes: z.string().optional(),
});

export const breakdownReportSchema = z.object({
  busId: z.string().uuid('Invalid bus ID'),
  description: z.string().min(5, 'Description required'),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('HIGH'),
  canContinue: z.boolean().default(false),
  mediaUrls: z.array(z.string().url()).max(3).default([]),
});

export type GPSUpdateInput = z.infer<typeof gpsUpdateSchema>;
export type BusStatusUpdateInput = z.infer<typeof busStatusUpdateSchema>;
export type BreakdownReportInput = z.infer<typeof breakdownReportSchema>;
