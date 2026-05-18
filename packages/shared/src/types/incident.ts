export enum IncidentType {
  MISSED_STOP = 'MISSED_STOP',
  RECKLESS_DRIVING = 'RECKLESS_DRIVING',
  HARASSMENT = 'HARASSMENT',
  OVERCHARGING = 'OVERCHARGING',
  BROKEN_EQUIPMENT = 'BROKEN_EQUIPMENT',
  BREAKDOWN = 'BREAKDOWN',
  EMERGENCY = 'EMERGENCY',
  OTHER = 'OTHER',
}

export enum IncidentStatus {
  OPEN = 'OPEN',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

export enum IncidentSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface Incident {
  id: string;
  type: IncidentType;
  description: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  reportedBy: string;
  busId: string | null;
  routeId: string | null;
  tripId: string | null;
  mediaUrls: string[];
  adminNotes: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
