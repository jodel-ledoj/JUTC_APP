export enum RouteStatus {
  ACTIVE = 'ACTIVE',
  DELAYED = 'DELAYED',
  SUSPENDED = 'SUSPENDED',
  DIVERTED = 'DIVERTED',
}

export interface Stop {
  id: string;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
}

export interface RouteStop extends Stop {
  sequence: number;
}

export interface Route {
  id: string;
  name: string;
  code: string;
  description: string | null;
  color: string | null;
  isActive: boolean;
  stops: RouteStop[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RouteWithStatus extends Route {
  status: RouteStatus;
  activeBusCount: number;
  nextDeparture: Date | null;
  avgDelayMinutes: number;
}

export interface Schedule {
  id: string;
  routeId: string;
  departureTime: string;
  days: number[];
  isActive: boolean;
}

export interface StopETA {
  stopId: string;
  stopName: string;
  sequence: number;
  estimatedArrival: Date;
  minutesAway: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}
