const PaymentService = require('../services/PaymentService');

async function initiatePayment(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not resolved' });
    }
    const { billId, method, cardInfo } = req.body || {};
    if (!billId || !method) {
      return res.status(400).json({ message: 'billId and method required' });
    }
    const result = await PaymentService.initiatePayment({
      userId: req.user.id,
      billId,
      method,
      cardInfo,
    });
    return res.json({
      paymentId: result.payment._id,
      requiresOtp: result.requiresOtp,
      maskedCard: result.maskedCard,
      message: result.requiresOtp
        ? 'OTP sent to your registered email'
        : 'Payment recorded and awaiting admin confirmation',
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

async function confirmPayment(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not resolved' });
    }
    const { paymentId, otp } = req.body || {};
    if (!paymentId) {
      return res.status(400).json({ message: 'paymentId required' });
    }
    const result = await PaymentService.confirmPayment({
      userId: req.user.id,
      paymentId,
      otp,
    });
    return res.json({
      message: 'Payment successful, receipt emailed',
      paymentId: result.payment._id,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

async function adminConfirmPayment(req, res) {
  try {
    const { paymentId } = req.body || {};
    if (!paymentId) {
      return res.status(400).json({ message: 'paymentId required' });
    }
    const result = await PaymentService.adminConfirmOffline({ paymentId });
    return res.json({ message: 'Payment confirmed', paymentId: result.payment._id });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

async function getDevOtp(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not resolved' });
    }
    const { paymentId } = req.params;
    const result = await PaymentService.getPaymentOtpDev({
      paymentId,
      userId: req.user.id,
    });
    return res.json(result);
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
}

module.exports = {
  initiatePayment,
  confirmPayment,
  adminConfirmPayment,
  getDevOtp,
};
