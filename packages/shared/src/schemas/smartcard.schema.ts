import { z } from 'zod';

export const tapSchema = z.object({
  cardId: z.string().uuid('Invalid card ID'),
  busId: z.string().uuid('Invalid bus ID'),
  validatorId: z.string().min(1, 'Validator ID required'),
  tripId: z.string().uuid('Invalid trip ID').optional(),
  fareType: z.enum(['STANDARD', 'STUDENT', 'SENIOR', 'CHILD', 'MONTHLY_PASS']).default('STANDARD'),
  overrideReason: z.string().optional(),
});

export const topupSchema = z.object({
  cardId: z.string().uuid('Invalid card ID'),
  amountJMD: z.number().min(100, 'Minimum top-up is $100').max(10000, 'Maximum top-up is $10,000'),
  method: z.enum(['CARD', 'BANK_TRANSFER', 'VOUCHER', 'CASH_AGENT']),
  reference: z.string().optional(),
});

export const qrGenerateSchema = z.object({
  fareType: z.enum(['STANDARD', 'STUDENT', 'SENIOR', 'CHILD', 'MONTHLY_PASS']).default('STANDARD'),
  routeId: z.string().uuid().optional(),
});

export const qrValidateSchema = z.object({
  token: z.string().min(1, 'QR token required'),
  busId: z.string().uuid('Invalid bus ID'),
  validatorId: z.string().min(1, 'Validator ID required'),
  tripId: z.string().uuid('Invalid trip ID').optional(),
});

export type TapInput = z.infer<typeof tapSchema>;
export type TopupInput = z.infer<typeof topupSchema>;
export type QRGenerateInput = z.infer<typeof qrGenerateSchema>;
export type QRValidateInput = z.infer<typeof qrValidateSchema>;
