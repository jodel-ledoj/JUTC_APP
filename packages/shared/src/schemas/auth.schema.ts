import { z } from 'zod';

export const loginSchema = z.object({
  phone: z.string().min(7, 'Phone number required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().min(7, 'Valid phone number required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['PASSENGER', 'DRIVER', 'CONDUCTOR']).default('PASSENGER'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token required'),
});

export const pushTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(['ios', 'android']),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
