import { Router } from 'express';
import { getDevOtp, adminConfirmPayment } from '../controllers/PaymentController.js';
import devOnly from '../middlewares/devOnly.js';

const router = Router();

router.use(devOnly);

router.get('/payments/:paymentId/otp', getDevOtp);
router.post('/payments/confirm', adminConfirmPayment);

export default router;
