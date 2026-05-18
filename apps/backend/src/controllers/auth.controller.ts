import { Request, Response } from 'express';
import * as authService from '../services/auth.service';

export async function register(req: Request, res: Response) {
  const result = await authService.registerUser(req.body);
  res.status(201).json({ success: true, data: result });
}

export async function login(req: Request, res: Response) {
  const { phone, password } = req.body;
  const result = await authService.loginUser(phone, password);
  res.json({ success: true, data: result });
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body;
  const tokens = await authService.refreshAccessToken(refreshToken);
  res.json({ success: true, data: tokens });
}

export async function logout(req: Request, res: Response) {
  const { refreshToken } = req.body;
  await authService.logoutUser(req.user!.userId, refreshToken);
  res.json({ success: true, data: { message: 'Logged out successfully' } });
}

export async function savePushToken(req: Request, res: Response) {
  const { token, platform } = req.body;
  await authService.savePushToken(req.user!.userId, token, platform);
  res.json({ success: true, data: { message: 'Push token saved' } });
}
