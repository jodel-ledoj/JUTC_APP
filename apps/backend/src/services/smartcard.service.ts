import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { redis, REDIS_KEYS, TTL } from '../config/redis';
import { AppError } from '../middleware/error.middleware';
import { fraudQueue } from '../config/queue';
import { calculateFare } from '@jutc/shared';
import { FareType } from '@jutc/shared';
import { env } from '../config/env';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

export async function getCardByUserId(userId: string) {
  const card = await prisma.smartCard.findUnique({
    where: { userId },
    select: {
      id: true, cardNumber: true, userId: true,
      balanceJMD: true, isActive: true, isBlocked: true,
      createdAt: true, updatedAt: true,
    },
  });
  if (!card) throw new AppError(404, 'NOT_FOUND', 'Smart card not found');
  return card;
}

export async function getCardBalance(cardId: string) {
  const cached = await redis.get(REDIS_KEYS.cardBalance(cardId));
  if (cached) return JSON.parse(cached);

  const card = await prisma.smartCard.findUnique({
    where: { id: cardId },
    select: { id: true, cardNumber: true, balanceJMD: true },
  });
  if (!card) throw new AppError(404, 'NOT_FOUND', 'Card not found');

  const result = {
    cardId: card.id,
    cardNumber: card.cardNumber,
    balanceJMD: Number(card.balanceJMD),
    lastSyncAt: new Date(),
  };
  await redis.setex(REDIS_KEYS.cardBalance(cardId), TTL.CARD_BALANCE, JSON.stringify(result));
  return result;
}

export async function getTransactions(cardId: string, type?: string, page = 1, limit = 20) {
  const where = { cardId, ...(type ? { type: type as any } : {}) };
  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);
  return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export async function tapCard(data: {
  cardId: string;
  busId: string;
  validatorId: string;
  tripId?: string;
  fareType?: FareType;
  overrideReason?: string;
}) {
  const fareType = data.fareType ?? FareType.STANDARD;
  const fareAmount = calculateFare(fareType);

  // DB transaction for atomic balance deduction
  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const card = await tx.smartCard.findUnique({
      where: { id: data.cardId },
      select: { id: true, balanceJMD: true, isActive: true, isBlocked: true },
    });

    if (!card || !card.isActive) throw new AppError(404, 'NOT_FOUND', 'Card not found');
    if (card.isBlocked) throw new AppError(403, 'CARD_BLOCKED', 'Card is blocked');

    const balance = Number(card.balanceJMD);

    if (fareAmount > 0 && balance < fareAmount) {
      // Record failed transaction
      await tx.transaction.create({
        data: {
          cardId: data.cardId, type: 'TAP_IN', status: 'FAILED',
          amountJMD: fareAmount, balanceAfter: balance,
          busId: data.busId, validatorId: data.validatorId, tripId: data.tripId,
          overrideReason: data.overrideReason,
        },
      });
      throw new AppError(402, 'INSUFFICIENT_FUNDS', 'Insufficient card balance');
    }

    const newBalance = balance - fareAmount;
    const [updatedCard, transaction] = await Promise.all([
      tx.smartCard.update({
        where: { id: data.cardId },
        data: { balanceJMD: newBalance },
      }),
      tx.transaction.create({
        data: {
          cardId: data.cardId, type: data.overrideReason ? 'OVERRIDE' : 'TAP_IN',
          status: 'COMPLETED', amountJMD: fareAmount, balanceAfter: newBalance,
          busId: data.busId, routeId: undefined, validatorId: data.validatorId,
          tripId: data.tripId, overrideReason: data.overrideReason,
        },
      }),
    ]);

    return { transaction, newBalance: Number(updatedCard.balanceJMD) };
  });

  // Invalidate balance cache
  await redis.del(REDIS_KEYS.cardBalance(data.cardId));

  // Async fraud check
  await fraudQueue.add('check-tap', {
    cardId: data.cardId, busId: data.busId,
    validatorId: data.validatorId, tripId: data.tripId,
    timestamp: new Date().toISOString(),
  });

  return result;
}

export async function topUpCard(data: {
  cardId: string;
  amountJMD: number;
  method: string;
  reference?: string;
}) {
  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const card = await tx.smartCard.findUnique({
      where: { id: data.cardId },
      select: { id: true, balanceJMD: true, isActive: true },
    });
    if (!card || !card.isActive) throw new AppError(404, 'NOT_FOUND', 'Card not found');

    const newBalance = Number(card.balanceJMD) + data.amountJMD;
    const [updatedCard, transaction] = await Promise.all([
      tx.smartCard.update({
        where: { id: data.cardId },
        data: { balanceJMD: newBalance },
      }),
      tx.transaction.create({
        data: {
          cardId: data.cardId, type: 'TOP_UP', status: 'COMPLETED',
          amountJMD: data.amountJMD, balanceAfter: newBalance,
          topUpMethod: data.method as any,
          metadata: data.reference ? { reference: data.reference } : undefined,
        },
      }),
    ]);

    return { transaction, newBalance: Number(updatedCard.balanceJMD) };
  });

  await redis.del(REDIS_KEYS.cardBalance(data.cardId));
  return result;
}

export async function generateQRTicket(cardId: string, fareType: FareType, routeId?: string) {
  const fareAmount = calculateFare(fareType);
  const ticketId = uuidv4();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 60 minutes

  const payload = { ticketId, cardId, fareType, amountJMD: fareAmount, routeId: routeId ?? null, expiresAt: expiresAt.toISOString() };
  const token = jwt.sign(payload, env.QR_SECRET, { expiresIn: '60m' });

  await prisma.qRTicket.create({
    data: { id: ticketId, token, cardId, fareType, amountJMD: fareAmount, routeId, expiresAt },
  });

  return { token, ticketId, fareType, amountJMD: fareAmount, expiresAt };
}

export async function validateQRTicket(data: {
  token: string; busId: string; validatorId: string; tripId?: string;
}) {
  let payload: any;
  try {
    payload = jwt.verify(data.token, env.QR_SECRET);
  } catch {
    throw new AppError(400, 'QR_EXPIRED', 'QR ticket is expired or invalid');
  }

  const ticket = await prisma.qRTicket.findUnique({ where: { token: data.token } });
  if (!ticket) throw new AppError(404, 'NOT_FOUND', 'QR ticket not found');
  if (ticket.isUsed) throw new AppError(409, 'QR_USED', 'QR ticket already used');
  if (ticket.expiresAt < new Date()) throw new AppError(400, 'QR_EXPIRED', 'QR ticket expired');

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.qRTicket.update({ where: { id: ticket.id }, data: { isUsed: true, usedAt: new Date() } });
    const card = await tx.smartCard.findUnique({ where: { id: ticket.cardId } });
    if (card) {
      await tx.transaction.create({
        data: {
          cardId: ticket.cardId, type: 'TAP_IN', status: 'COMPLETED',
          amountJMD: ticket.amountJMD, balanceAfter: Number(card.balanceJMD),
          busId: data.busId, validatorId: data.validatorId, tripId: data.tripId,
          metadata: { qrTicketId: ticket.id },
        },
      });
    }
  });

  return { success: true, fareType: ticket.fareType, amountJMD: Number(ticket.amountJMD) };
}
