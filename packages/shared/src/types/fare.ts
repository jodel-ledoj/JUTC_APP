export enum FareType {
  STANDARD = 'STANDARD',
  STUDENT = 'STUDENT',
  SENIOR = 'SENIOR',
  CHILD = 'CHILD',
  MONTHLY_PASS = 'MONTHLY_PASS',
}

export interface FareRule {
  id: string;
  fareType: FareType;
  baseAmountJMD: number;
  routeId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface QRTicket {
  id: string;
  token: string;
  cardId: string;
  fareType: FareType;
  amountJMD: number;
  routeId: string | null;
  expiresAt: Date;
  isUsed: boolean;
  usedAt: Date | null;
  createdAt: Date;
}

export interface QRTicketPayload {
  ticketId: string;
  cardId: string;
  fareType: FareType;
  amountJMD: number;
  routeId: string | null;
  expiresAt: string;
  iat: number;
}
