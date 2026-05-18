import { Router } from 'express';
import * as smartcardController from '../controllers/smartcard.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { tapSchema, topupSchema, qrGenerateSchema, qrValidateSchema } from '@jutc/shared';

const router = Router();

router.use(authenticate);

router.get('/me', smartcardController.getMyCard);
router.get('/balance', smartcardController.getBalance);
router.get('/transactions', smartcardController.getTransactions);
router.post('/tap', validateBody(tapSchema), smartcardController.tapCard);
router.post('/topup', validateBody(topupSchema), smartcardController.topUp);
router.post('/qr/generate', validateBody(qrGenerateSchema), smartcardController.generateQR);
router.post('/qr/validate', validateBody(qrValidateSchema), smartcardController.validateQR);

export default router;
