const mongoose = require('mongoose');
const Bill = require('../models/Bill');
const Payment = require('../models/Payment');

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function initiatePayment({ userId, billId, method }) {
  if (!mongoose.Types.ObjectId.isValid(billId)) {
    throw new Error('Invalid bill id');
  }

  const bill = await Bill.findOne({ _id: billId, userId });
  if (!bill) {
    throw new Error('Bill not found');
  }

  if (bill.status === 'paid') {
    throw new Error('Bill already paid');
  }

  const payment = await Payment.create({
    billId,
    userId,
    method,
    status: method === 'card' ? 'otp_pending' : 'initiated',
    gatewayRef: `GW-${Date.now()}`,
    otp: method === 'card' ? generateOtp() : '',
    otpExpiresAt:
      method === 'card'
        ? new Date(Date.now() + 5 * 60 * 1000)
        : null,
  });

  if (method === 'card' && process.env.NODE_ENV !== 'production') {
    console.log(`[dev] OTP for payment ${payment._id}: ${payment.otp}`);
  }

  return {
    payment,
    requiresOtp: method === 'card',
  };
}

async function confirmPayment({ userId, paymentId, otp }) {
  if (!mongoose.Types.ObjectId.isValid(paymentId)) {
    throw new Error('Invalid payment id');
  }

  const payment = await Payment.findOne({ _id: paymentId, userId });
  if (!payment) {
    throw new Error('Payment not found');
  }

  if (payment.status === 'authorized') {
    return { payment };
  }

  if (payment.method === 'card') {
    if (payment.status !== 'otp_pending') {
      throw new Error('Payment not awaiting OTP');
    }
    if (!otp || otp !== payment.otp) {
      throw new Error('Invalid OTP');
    }
    if (payment.otpExpiresAt && payment.otpExpiresAt < new Date()) {
      throw new Error('OTP expired');
    }
  }

  payment.status = 'authorized';
  payment.confirmedByAdmin = payment.method !== 'card';
  payment.otp = '';
  payment.otpExpiresAt = null;
  await payment.save();

  await Bill.updateOne({ _id: payment.billId, userId }, { status: 'paid' });

  return { payment };
}

async function adminConfirmOffline({ paymentId }) {
  if (!mongoose.Types.ObjectId.isValid(paymentId)) {
    throw new Error('Invalid payment id');
  }

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new Error('Payment not found');
  }

  payment.status = 'authorized';
  payment.confirmedByAdmin = true;
  await payment.save();
  await Bill.updateOne({ _id: payment.billId }, { status: 'paid' });

  return { payment };
}

async function getPaymentOtpDev({ paymentId, userId }) {
  if (!mongoose.Types.ObjectId.isValid(paymentId)) {
    throw new Error('Invalid payment id');
  }

  const payment = await Payment.findOne({ _id: paymentId, userId }).lean();
  if (!payment) {
    throw new Error('Payment not found');
  }

  return { otp: payment.otp, status: payment.status };
}

module.exports = {
  initiatePayment,
  confirmPayment,
  adminConfirmOffline,
  getPaymentOtpDev,
};
