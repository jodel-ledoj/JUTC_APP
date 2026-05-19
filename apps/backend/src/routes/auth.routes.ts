import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { validateBody } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { authRateLimit } from '../middleware/rateLimit.middleware';
import { loginSchema, registerSchema, refreshTokenSchema } from '@jutc/shared';
import { z } from 'zod';

const router = Router();

router.post('/register', authRateLimit, validateBody(registerSchema), authController.register);
router.post('/login', authRateLimit, validateBody(loginSchema), authController.login);
router.post('/driver-login', authRateLimit, validateBody(z.object({ driverId: z.string().min(3), password: z.string().min(6) })), authController.driverLogin);
router.post('/refresh', validateBody(refreshTokenSchema), authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.post('/push-token', authenticate, validateBody(z.object({ token: z.string(), platform: z.enum(['ios', 'android']) })), authController.savePushToken);

export default router;
