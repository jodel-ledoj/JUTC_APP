export const SOCKET_EVENTS = {
  // GPS & Location
  GPS_UPDATE: 'gps:update',
  BUS_STATUS_CHANGE: 'bus:status',

  // Trips
  TRIP_START: 'trip:start',
  TRIP_END: 'trip:end',
  TRIP_UPDATE: 'trip:update',

  // Fares
  FARE_VALIDATED: 'fare:validated',
  FARE_OVERRIDE: 'fare:override',

  // ETA
  ETA_UPDATE: 'eta:update',

  // Alerts
  SERVICE_ALERT: 'alert:service',
  ROUTE_DELAY: 'alert:delay',
  EMERGENCY: 'alert:emergency',

  // Driver
  DISPATCH_MESSAGE: 'dispatch:message',

  // Incidents
  INCIDENT_NEW: 'incident:new',

  // Rooms
  JOIN_ROUTE: 'join:route',
  LEAVE_ROUTE: 'leave:route',
  JOIN_BUS: 'join:bus',
  JOIN_ADMIN: 'join:admin',

  // Occupancy
  OCCUPANCY_UPDATE: 'occupancy:update',
} as const;

export type SocketEvent = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];
