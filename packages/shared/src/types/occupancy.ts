export type OccupancyLevel = 'LOW' | 'MODERATE' | 'BUSY' | 'FULL';

export interface OccupancyReading {
  busId: string;
  tripId: string | null;
  passengerCount: number;
  capacity: number;
  occupancyPct: number;
  level: OccupancyLevel;
  timestamp: Date;
}

export interface SensorEvent {
  sensorId: string;   // MAC address or device name from BLE hardware
  busId: string;
  eventType: 'BOARD' | 'ALIGHT' | 'HEARTBEAT';
  rssi?: number;      // BLE signal strength — used for proximity validation
  timestamp: string;
}

/** Map occupancy percentage to a passenger-facing level label */
export function getOccupancyLevel(pct: number): OccupancyLevel {
  if (pct <= 25) return 'LOW';
  if (pct <= 60) return 'MODERATE';
  if (pct <= 85) return 'BUSY';
  return 'FULL';
}

/** Human-readable label for display in passenger UI */
export const OCCUPANCY_LABELS: Record<OccupancyLevel, string> = {
  LOW:      'Low Crowd',
  MODERATE: 'Moderate Crowd',
  BUSY:     'Busy',
  FULL:     'Full',
};
