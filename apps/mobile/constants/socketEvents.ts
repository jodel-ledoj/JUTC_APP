export const SOCKET_EVENTS = {
  GPS_UPDATE: 'gps:update',
  BUS_STATUS_CHANGE: 'bus:status',
  TRIP_START: 'trip:start',
  TRIP_END: 'trip:end',
  TRIP_UPDATE: 'trip:update',
  FARE_VALIDATED: 'fare:validated',
  FARE_OVERRIDE: 'fare:override',
  ETA_UPDATE: 'eta:update',
  SERVICE_ALERT: 'alert:service',
  ROUTE_DELAY: 'alert:delay',
  EMERGENCY: 'alert:emergency',
  DISPATCH_MESSAGE: 'dispatch:message',
  JOIN_ROUTE: 'join:route',
  LEAVE_ROUTE: 'leave:route',
  JOIN_BUS: 'join:bus',
  JOIN_ADMIN: 'join:admin',
} as const;

export type SocketEvent = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];
