export enum TransactionType {
  TAP_IN = 'TAP_IN',
  TOP_UP = 'TOP_UP',
  REFUND = 'REFUND',
  REVERSAL = 'REVERSAL',
  ADJUSTMENT = 'ADJUSTMENT',
  OVERRIDE = 'OVERRIDE',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REVERSED = 'REVERSED',
}

export enum TopUpMethod {
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  VOUCHER = 'VOUCHER',
  CASH_AGENT = 'CASH_AGENT',
}

export interface SmartCard {
  id: string;
  cardNumber: string;
  userId: string;
  balanceJMD: number;
  isActive: boolean;
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  cardId: string;
  type: TransactionType;
  status: TransactionStatus;
  amountJMD: number;
  balanceAfter: number;
  busId: string | null;
  routeId: string | null;
  validatorId: string | null;
  tripId: string | null;
  topUpMethod: TopUpMethod | null;
  overrideReason: string | null;
  createdAt: Date;
}

export interface CardBalance {
  cardId: string;
  cardNumber: string;
  balanceJMD: number;
  lastSyncAt: Date;
  pendingTransactions: number;
}
