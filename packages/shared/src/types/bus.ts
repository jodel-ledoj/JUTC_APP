export enum BusStatus {
  IN_SERVICE = 'IN_SERVICE',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
  MAINTENANCE = 'MAINTENANCE',
  BREAKDOWN = 'BREAKDOWN',
  DEPOT = 'DEPOT',
}

export interface Bus {
  id: string;
  plateNumber: string;
  depotId: string | null;
  status: BusStatus;
  make: string;
  model: string;
  year: number;
  capacity: number;
  hasValidator: boolean;
  hasGPS: boolean;
  odometerKm: number;
  lastServiceKm: number;
  fuelLevel: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BusPosition {
  busId: string;
  plateNumber: string;
  routeId: string | null;
  routeCode: string | null;
  tripId: string | null;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  status: BusStatus;
  passengerCount: number;
  capacity?: number;
  occupancyPct?: number;
  occupancyLevel?: string;
  timestamp: Date;
}

export interface BusHealth {
  busId: string;
  fuelLevel: number | null;
  odometerKm: number;
  lastServiceKm: number;
  kmSinceService: number;
  openDefects: number;
  status: BusStatus;
}
