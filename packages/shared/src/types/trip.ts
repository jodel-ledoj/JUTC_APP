export enum TripStatus {
  SCHEDULED = 'SCHEDULED',
  EN_ROUTE = 'EN_ROUTE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  BREAKDOWN = 'BREAKDOWN',
}

export interface Trip {
  id: string;
  routeId: string;
  busId: string;
  driverId: string;
  scheduleId: string | null;
  status: TripStatus;
  passengerCount: number;
  scheduledDeparture: Date;
  actualDeparture: Date | null;
  completedAt: Date | null;
  currentStopSeq: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TripWithDetails extends Trip {
  route: { name: string; code: string; color: string | null };
  bus: { plateNumber: string };
  driver: { name: string };
  delayMinutes: number;
}

export interface ShiftSummary {
  tripsCompleted: number;
  totalFaresJMD: number;
  totalPassengers: number;
  onTimeRate: number;
  shiftStartTime: Date;
}
