import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { AppError } from '../middleware/error.middleware';
import { TokenPayload, AuthTokens } from '@jutc/shared';

const SALT_ROUNDS = 12;

export async function registerUser(data: {
  name: string;
  phone: string;
  email?: string;
  password: string;
  role?: string;
}) {
  const existing = await prisma.user.findUnique({ where: { phone: data.phone } });
  if (existing) {
    throw new AppError(409, 'CONFLICT', 'Phone number already registered');
  }

  const password = await bcrypt.hash(data.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email,
      password,
      role: (data.role as any) ?? 'PASSENGER',
    },
    select: {
      id: true, email: true, phone: true, name: true, role: true,
      isActive: true, isVerified: true, createdAt: true, updatedAt: true,
    },
  });

  // Auto-create smart card for passengers
  if (user.role === 'PASSENGER') {
    await prisma.smartCard.create({
      data: {
        cardNumber: `JTC-${Date.now()}`,
        userId: user.id,
        balanceJMD: 0,
      },
    });
  }

  const tokens = await generateTokens(user.id, user.role as any);
  return { user, tokens };
}

export async function loginUser(phone: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { phone },
    select: {
      id: true, email: true, phone: true, name: true, role: true,
      password: true, isActive: true, isVerified: true, createdAt: true, updatedAt: true,
      smartCard: { select: { id: true } },
    },
  });

  if (!user || !user.isActive) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid credentials');
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid credentials');
  }

  const tokens = await generateTokens(user.id, user.role as any, user.smartCard?.id);
  const { password: _, ...safeUser } = user;
  return { user: safeUser, tokens };
}

export async function refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
  let payload: { userId: string; role: string };
  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as any;
  } catch {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid refresh token');
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!stored || stored.expiresAt < new Date()) {
    throw new AppError(401, 'UNAUTHORIZED', 'Refresh token expired');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { smartCard: { select: { id: true } } },
  });
  if (!user || !user.isActive) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not found');
  }

  await prisma.refreshToken.delete({ where: { token: refreshToken } });
  return generateTokens(user.id, user.role as any, user.smartCard?.id);
}

export async function logoutUser(userId: string, refreshToken: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { token: refreshToken, userId } });
}

async function generateTokens(
  userId: string,
  role: string,
  cardId?: string
): Promise<AuthTokens> {
  const payload: TokenPayload = { userId, role: role as any, cardId };
  const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRY as any });
  const refreshToken = jwt.sign({ userId, role }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY as any,
  });

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken, refreshToken, expiresIn: 900 };
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}

export async function savePushToken(userId: string, token: string, platform: string) {
  await prisma.pushToken.upsert({
    where: { token },
    create: { userId, token, platform },
    update: { userId, platform },
  });
}
