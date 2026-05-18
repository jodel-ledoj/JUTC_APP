import { TripStatus } from '../types/trip';

export const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
  [TripStatus.SCHEDULED]: 'Scheduled',
  [TripStatus.EN_ROUTE]: 'En Route',
  [TripStatus.COMPLETED]: 'Completed',
  [TripStatus.CANCELLED]: 'Cancelled',
  [TripStatus.BREAKDOWN]: 'Breakdown',
};

export const TERMINAL_TRIP_STATUSES: TripStatus[] = [
  TripStatus.COMPLETED,
  TripStatus.CANCELLED,
  TripStatus.BREAKDOWN,
];

export const ACTIVE_TRIP_STATUSES: TripStatus[] = [
  TripStatus.SCHEDULED,
  TripStatus.EN_ROUTE,
];
