import { BusStatus } from '../types/bus';

export const BUS_STATUS_LABELS: Record<BusStatus, string> = {
  [BusStatus.IN_SERVICE]: 'In Service',
  [BusStatus.OUT_OF_SERVICE]: 'Out of Service',
  [BusStatus.MAINTENANCE]: 'Maintenance',
  [BusStatus.BREAKDOWN]: 'Breakdown',
  [BusStatus.DEPOT]: 'At Depot',
};

export const BUS_STATUS_COLORS: Record<BusStatus, string> = {
  [BusStatus.IN_SERVICE]: '#27AE60',
  [BusStatus.OUT_OF_SERVICE]: '#B6BDC9',
  [BusStatus.MAINTENANCE]: '#F2C94C',
  [BusStatus.BREAKDOWN]: '#EB5757',
  [BusStatus.DEPOT]: '#2F80ED',
};

export const ACTIVE_STATUSES: BusStatus[] = [BusStatus.IN_SERVICE];
export const TERMINAL_STATUSES: BusStatus[] = [BusStatus.OUT_OF_SERVICE, BusStatus.DEPOT];
