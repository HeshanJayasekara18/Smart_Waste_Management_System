const express = require('express');
const PaymentController = require('../controllers/PaymentController');

const router = express.Router();

router.post('/initiate', PaymentController.initiatePayment);
router.post('/confirm', PaymentController.confirmPayment);
router.get('/:paymentId/receipt', PaymentController.downloadReceipt);

module.exports = router;
