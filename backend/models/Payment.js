const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    billId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bill',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    method: {
      type: String,
      enum: ['card', 'offline'],
      required: true,
    },
    status: {
      type: String,
      enum: ['initiated', 'otp_pending', 'authorized', 'failed'],
      default: 'initiated',
    },
    gatewayRef: { type: String, default: '' },
    otp: { type: String, default: '' },
    otpExpiresAt: { type: Date },
    confirmedByAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

paymentSchema.index({ billId: 1, userId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
