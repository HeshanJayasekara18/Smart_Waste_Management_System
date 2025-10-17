const express = require('express');
const PaymentController = require('../controllers/PaymentController');
const devOnly = require('../middlewares/devOnly');

const router = express.Router();

router.use(devOnly);

router.get('/payments/:paymentId/otp', PaymentController.getDevOtp);
router.post('/payments/confirm', PaymentController.adminConfirmPayment);

module.exports = router;
