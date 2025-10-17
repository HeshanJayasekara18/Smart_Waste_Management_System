import { Router } from 'express';
import {
	initiatePayment,
	confirmPayment,
	getHistory,
	downloadReceipt,
	downloadOfflineSlip,
} from '../controllers/PaymentController.js';

const router = Router();

router.post('/initiate', initiatePayment);
router.post('/confirm', confirmPayment);
router.get('/history', getHistory);
router.get('/:paymentId/receipt', downloadReceipt);
router.get('/:paymentId/offline-slip', downloadOfflineSlip);

export default router;
