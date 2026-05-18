import { z } from 'zod';

export const tripStartSchema = z.object({
  busId: z.string().uuid('Invalid bus ID'),
  routeId: z.string().uuid('Invalid route ID'),
  scheduleId: z.string().uuid().optional(),
  checklist: z.object({
    brakes: z.boolean(),
    lights: z.boolean(),
    tires: z.boolean(),
    validator: z.boolean(),
    cleanliness: z.boolean(),
  }),
});

export const tripEndSchema = z.object({
  passengerCount: z.number().int().min(0),
  notes: z.string().optional(),
});

export const tripStatusUpdateSchema = z.object({
  status: z.enum(['EN_ROUTE', 'COMPLETED', 'CANCELLED', 'BREAKDOWN']),
  notes: z.string().optional(),
  currentStopSeq: z.number().int().min(0).optional(),
  passengerCount: z.number().int().min(0).optional(),
});

export type TripStartInput = z.infer<typeof tripStartSchema>;
export type TripEndInput = z.infer<typeof tripEndSchema>;
export type TripStatusUpdateInput = z.infer<typeof tripStatusUpdateSchema>;
