import { Request, Response } from 'express';
import * as smartcardService from '../services/smartcard.service';
import { FareType } from '@jutc/shared';

export async function getMyCard(req: Request, res: Response) {
  const card = await smartcardService.getCardByUserId(req.user!.userId);
  res.json({ success: true, data: card });
}

export async function getBalance(req: Request, res: Response) {
  const card = await smartcardService.getCardByUserId(req.user!.userId);
  const balance = await smartcardService.getCardBalance(card.id);
  res.json({ success: true, data: balance });
}

export async function getTransactions(req: Request, res: Response) {
  const card = await smartcardService.getCardByUserId(req.user!.userId);
  const { type, page = '1', limit = '20' } = req.query;
  const result = await smartcardService.getTransactions(
    card.id,
    type as string | undefined,
    parseInt(page as string),
    parseInt(limit as string)
  );
  res.json({ success: true, data: result.items, meta: result.meta });
}

export async function tapCard(req: Request, res: Response) {
  const result = await smartcardService.tapCard(req.body);
  res.json({ success: true, data: result });
}

export async function topUp(req: Request, res: Response) {
  const result = await smartcardService.topUpCard(req.body);
  res.json({ success: true, data: result });
}

export async function generateQR(req: Request, res: Response) {
  const card = await smartcardService.getCardByUserId(req.user!.userId);
  const { fareType = FareType.STANDARD, routeId } = req.body;
  const ticket = await smartcardService.generateQRTicket(card.id, fareType, routeId);
  res.json({ success: true, data: ticket });
}

export async function validateQR(req: Request, res: Response) {
  const result = await smartcardService.validateQRTicket(req.body);
  res.json({ success: true, data: result });
}
