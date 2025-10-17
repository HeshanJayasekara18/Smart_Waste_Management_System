import * as PaymentService from '../services/PaymentService.js';

async function initiatePayment(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not resolved' });
    }
    const { billId, method, cardInfo, referenceCode, notes } = req.body || {};
    if (!billId || !method) {
      return res.status(400).json({ message: 'billId and method required' });
    }
    const result = await PaymentService.initiatePayment({
      userId: req.user.id,
      billId,
      method,
      cardInfo,
      offlineReference: referenceCode,
      offlineInstructions: notes,
    });
    return res.json({
      paymentId: result.payment._id,
      requiresOtp: result.requiresOtp,
      maskedCard: result.maskedCard,
      message: result.requiresOtp
        ? 'OTP sent to your registered email'
        : 'Payment recorded and awaiting admin confirmation',
      status: result.payment.status,
      offlineSlip: result.offline || null,
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

async function downloadReceipt(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not resolved' });
    }
    const { paymentId } = req.params;
    const { filePath, fileName } = await PaymentService.getReceiptFile({
      paymentId,
      userId: req.user.id,
    });
    return res.download(filePath, fileName);
  } catch (error) {
    const status = error.message === 'Access denied for receipt' ? 403 : 404;
    return res.status(status).json({ message: error.message });
  }
}

async function downloadOfflineSlip(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not resolved' });
    }
    const { paymentId } = req.params;
    const { filePath, fileName } = await PaymentService.getOfflineSlipFile({
      paymentId,
      userId: req.user.id,
    });
    return res.download(filePath, fileName);
  } catch (error) {
    const status = error.message.includes('Access denied') ? 403 : 404;
    return res.status(status).json({ message: error.message });
  }
}

async function getHistory(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not resolved' });
    }
    const rawLimit = Number(req.query.limit);
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 && rawLimit <= 100 ? rawLimit : 20;
    const payments = await PaymentService.getPaymentHistory({
      userId: req.user.id,
      limit,
    });
    return res.json({ payments });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

export {
  initiatePayment,
  confirmPayment,
  adminConfirmPayment,
  getDevOtp,
  downloadReceipt,
  downloadOfflineSlip,
  getHistory,
};
