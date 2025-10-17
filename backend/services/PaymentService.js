const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const crypto = require('crypto');
const Bill = require('../models/Bill');
const Payment = require('../models/Payment');
const User = require('../models/User');
const ReceiptService = require('./ReceiptService');
const Mailer = require('../utils/mailer');

const OTP_EXPIRY_MINUTES = 5;

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

async function loadBillWithUser({ billId, userId }) {
  const bill = await Bill.findOne({ _id: billId, userId });
  if (!bill) {
    throw new Error('Bill not found');
  }
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  return { bill, user };
}

async function sendOtpEmail({ user, payment, otp }) {
  const subject = 'Your Smart Waste payment OTP';
  const text = `Hi ${user.name},\n\nUse the following one-time password to confirm your payment: ${otp}.\n\nPayment reference: ${payment.gatewayRef}\nThis code expires in ${OTP_EXPIRY_MINUTES} minutes.\n\nIf you did not initiate this payment, please contact support immediately.`;
  try {
    await Mailer.sendMail({
      to: user.email,
      subject,
      text,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[dev] Failed to send OTP email. Make sure SMTP settings are configured.', error.message);
    } else {
      throw new Error('Unable to send OTP email');
    }
  }
}

async function deliverReceipt({ payment, bill, user }) {
  const { filePath, fileName } = await ReceiptService.generateReceipt({ payment, bill, user });
  payment.receiptPath = filePath;
  payment.receiptSentAt = new Date();
  payment.paidAt = payment.paidAt || new Date();
  await payment.save();

  try {
    await Mailer.sendMail({
      to: user.email,
      subject: 'Smart Waste payment receipt',
      text: `Hi ${user.name},\n\nYour payment for the ${bill.period} bill has been marked as paid. We've attached the receipt for your records.`,
      attachments: [
        {
          filename: fileName,
          path: filePath,
        },
      ],
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[dev] Failed to send receipt email.', error.message);
    } else {
      throw new Error('Unable to send receipt email');
    }
  }
}

async function initiatePayment({
  userId,
  billId,
  method,
  cardInfo = {},
  bankSlipPath = '',
  offlineReference = '',
  offlineInstructions = '',
}) {
  if (!mongoose.Types.ObjectId.isValid(billId)) {
    throw new Error('Invalid bill id');
  }

  const { bill, user } = await loadBillWithUser({ billId, userId });

  if (!['card', 'offline'].includes(method)) {
    throw new Error('Unsupported payment method');
  }

  if (bill.status === 'paid') {
    throw new Error('Bill already paid');
  }

  const basePayload = {
    billId,
    userId,
    method,
    amount: bill.amount,
    currency: 'LKR',
    gatewayRef:
      method === 'offline' && offlineReference ? offlineReference.trim() : `GW-${Date.now()}`,
    bankSlipPath,
  };

  let otp;
  if (method === 'card') {
    if (!cardInfo || !cardInfo.number || !cardInfo.expMonth || !cardInfo.expYear) {
      throw new Error('Complete card information required');
    }
    otp = generateOtp();
    const last4 = String(cardInfo.number).slice(-4);
    const payment = await Payment.create({
      ...basePayload,
      status: 'otp_pending',
      otpHash: hashOtp(otp),
      otpExpiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
      otpDebug: process.env.NODE_ENV !== 'production' ? otp : '',
      card: {
        brand: cardInfo.brand || 'card',
        last4,
        expMonth: cardInfo.expMonth,
        expYear: cardInfo.expYear,
        holderName: cardInfo.holderName || user.name,
      },
    });

    await sendOtpEmail({ user, payment, otp });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[dev] OTP for payment ${payment._id}: ${otp}`);
    }

    return {
      payment,
      requiresOtp: true,
      maskedCard: `•••• ${last4}`,
    };
  }

  if (!offlineReference) {
    throw new Error('Reference code required for offline payments');
  }

  const payment = await Payment.create({
    ...basePayload,
    status: 'pending_offline',
    offlineReference: offlineReference.trim(),
    offlineInstructions: offlineInstructions.trim(),
  });

  const slip = await ReceiptService.generateOfflineSlip({
    payment,
    bill,
    user,
  });

  payment.offlineReceiptPath = slip.filePath;
  payment.offlineSlipGeneratedAt = new Date();
  await payment.save();

  try {
    await Mailer.sendMail({
      to: user.email,
      subject: 'Offline payment recorded',
      text: `Hi ${user.name},\n\nWe recorded your offline payment reference ${offlineReference}. Please visit your municipal office with the attached slip to complete the payment. Your bill will remain pending until a municipal officer confirms the receipt.`,
      attachments: [
        {
          filename: slip.fileName,
          path: slip.filePath,
        },
      ],
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[dev] Failed to send offline acknowledgement email.', error.message);
    }
  }

  return {
    payment,
    requiresOtp: false,
    offline: {
      slipFileName: slip.fileName,
    },
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

  if (payment.method !== 'card') {
    throw new Error('Offline payments require municipal confirmation');
  }

  if (payment.status !== 'otp_pending') {
    throw new Error('Payment not awaiting OTP');
  }
  if (!otp) {
    throw new Error('OTP required');
  }
  if (payment.otpExpiresAt && payment.otpExpiresAt < new Date()) {
    throw new Error('OTP expired');
  }
  if (hashOtp(otp) !== payment.otpHash) {
    throw new Error('Invalid OTP');
  }

  const bill = await Bill.findById(payment.billId);
  if (!bill) {
    throw new Error('Bill not found for payment');
  }
  const user = await User.findById(payment.userId);
  if (!user) {
    throw new Error('User not found for payment');
  }

  payment.status = 'authorized';
  payment.confirmedByAdmin = payment.method !== 'card';
  payment.otpHash = '';
  payment.otpExpiresAt = null;
  payment.otpDebug = '';
  payment.paidAt = new Date();
  await payment.save();

  bill.status = 'paid';
  await bill.save();

  await deliverReceipt({ payment, bill, user });

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

  const bill = await Bill.findById(payment.billId);
  if (!bill) {
    throw new Error('Bill not found for payment');
  }
  const user = await User.findById(payment.userId);
  if (!user) {
    throw new Error('User not found for payment');
  }

  if (payment.method !== 'offline') {
    throw new Error('Only offline payments can be confirmed by admin');
  }

  if (payment.status !== 'pending_offline') {
    throw new Error('Offline payment already processed');
  }

  payment.status = 'authorized';
  payment.confirmedByAdmin = true;
  payment.paidAt = new Date();
  await payment.save();

  bill.status = 'paid';
  await bill.save();

  await deliverReceipt({ payment, bill, user });

  return { payment };
}

async function getPaymentOtpDev({ paymentId, userId }) {
  if (!mongoose.Types.ObjectId.isValid(paymentId)) {
    throw new Error('Invalid payment id');
  }

  const payment = await Payment.findOne({ _id: paymentId, userId })
    .select('+otpDebug')
    .lean();
  if (!payment) {
    throw new Error('Payment not found');
  }

  return { otp: payment.otpDebug, status: payment.status };
}

async function getReceiptFile({ paymentId, userId }) {
  if (!mongoose.Types.ObjectId.isValid(paymentId)) {
    throw new Error('Invalid payment id');
  }

  const payment = await Payment.findById(paymentId).lean();
  if (!payment) {
    throw new Error('Payment not found');
  }
  if (userId && payment.userId.toString() !== userId.toString()) {
    throw new Error('Access denied for receipt');
  }
  if (!payment.receiptPath) {
    throw new Error('Receipt not available yet');
  }

  const filePath = path.resolve(payment.receiptPath);
  await fs.promises.access(filePath, fs.constants.R_OK);

  const fileName = path.basename(filePath);
  return { filePath, fileName };
}

async function getOfflineSlipFile({ paymentId, userId }) {
  if (!mongoose.Types.ObjectId.isValid(paymentId)) {
    throw new Error('Invalid payment id');
  }

  const payment = await Payment.findById(paymentId).lean();
  if (!payment) {
    throw new Error('Payment not found');
  }
  if (userId && payment.userId.toString() !== userId.toString()) {
    throw new Error('Access denied for offline slip');
  }
  if (!payment.offlineReceiptPath) {
    throw new Error('Offline payment slip not available');
  }

  const filePath = path.resolve(payment.offlineReceiptPath);
  await fs.promises.access(filePath, fs.constants.R_OK);

  const fileName = path.basename(filePath);
  return { filePath, fileName };
}

module.exports = {
  initiatePayment,
  confirmPayment,
  adminConfirmOffline,
  getPaymentOtpDev,
  getReceiptFile,
  getOfflineSlipFile,
};
