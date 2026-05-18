export enum NotificationType {
  DELAY = 'DELAY',
  ROUTE_CHANGE = 'ROUTE_CHANGE',
  SERVICE_ALERT = 'SERVICE_ALERT',
  PAYMENT = 'PAYMENT',
  EMERGENCY = 'EMERGENCY',
  SYSTEM = 'SYSTEM',
}

export enum NotificationSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

export interface Notification {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  body: string;
  routeId: string | null;
  affectedStops: string[];
  metadata: Record<string, unknown> | null;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
}
