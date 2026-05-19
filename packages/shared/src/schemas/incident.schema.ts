import { z } from 'zod';

export const createIncidentSchema = z.object({
  type: z.enum([
    'MISSED_STOP',
    'RECKLESS_DRIVING',
    'HARASSMENT',
    'OVERCHARGING',
    'BROKEN_EQUIPMENT',
    'BREAKDOWN',
    'ACCIDENT',
    'PASSENGER_INCIDENT',
    'ROAD_HAZARD',
    'MECHANICAL_ISSUE',
    'EMERGENCY',
    'OTHER',
  ]),
  description: z.string().min(10, 'Please provide more detail').max(1000),
  busId: z.string().uuid().optional(),
  routeId: z.string().uuid().optional(),
  tripId: z.string().uuid().optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  mediaUrls: z.array(z.string().url()).max(5).default([]),
});

export const updateIncidentSchema = z.object({
  status: z.enum(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED']).optional(),
  adminNotes: z.string().optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
});

export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;
export type UpdateIncidentInput = z.infer<typeof updateIncidentSchema>;
