const express = require('express');
const PaymentController = require('../controllers/PaymentController');

const router = express.Router();

router.post('/initiate', PaymentController.initiatePayment);
router.post('/confirm', PaymentController.confirmPayment);
router.get('/history', PaymentController.getHistory);
router.get('/:paymentId/receipt', PaymentController.downloadReceipt);
router.get('/:paymentId/offline-slip', PaymentController.downloadOfflineSlip);

module.exports = router;
