export type OccupancyLevel = 'LOW' | 'MODERATE' | 'BUSY' | 'FULL';

export interface OccupancyReading {
  busId: string;
  tripId: string | null;
  passengerCount: number;
  capacity: number;
  occupancyPct: number;
  level: OccupancyLevel;
  timestamp: string;
}

export function getOccupancyLevel(pct: number): OccupancyLevel {
  if (pct <= 25) return 'LOW';
  if (pct <= 60) return 'MODERATE';
  if (pct <= 85) return 'BUSY';
  return 'FULL';
}

export const OCCUPANCY_LABELS: Record<OccupancyLevel, string> = {
  LOW:      'Few seats',
  MODERATE: 'Filling up',
  BUSY:     'Crowded',
  FULL:     'At capacity',
};

// Subtle, non-alarming colors — muted tones only
export const OCCUPANCY_COLORS: Record<OccupancyLevel, string> = {
  LOW:      '#2D9A6A', // muted green
  MODERATE: '#D97706', // amber
  BUSY:     '#C2410C', // softer orange-red
  FULL:     '#9B1C1C', // deep red, subtle
};

// Dot size for occupancy bar fill percentage
export function occupancyBarWidth(pct: number): string {
  return `${Math.min(100, pct)}%`;
}
