import type { QRTicketPayload } from '../types/fare';

export function encodeQRPayload(payload: QRTicketPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export function decodeQRPayload(token: string): QRTicketPayload {
  const json = Buffer.from(token, 'base64').toString('utf-8');
  return JSON.parse(json) as QRTicketPayload;
}

export function isQRExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}
