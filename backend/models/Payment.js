import mongoose from 'mongoose';

const cardDetailsSchema = new mongoose.Schema(
  {
    brand: { type: String, default: '' },
    last4: { type: String, default: '' },
    expMonth: { type: String, default: '' },
    expYear: { type: String, default: '' },
    holderName: { type: String, default: '' },
  },
  { _id: false }
);

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
      enum: ['initiated', 'otp_pending', 'authorized', 'failed', 'pending_offline'],
      default: 'initiated',
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'LKR' },
    gatewayRef: { type: String, default: '' },
    otpHash: { type: String, default: '' },
    otpExpiresAt: { type: Date },
    otpDebug: { type: String, default: '', select: false },
    receiptPath: { type: String, default: '' },
    receiptSentAt: { type: Date },
    bankSlipPath: { type: String, default: '' },
    card: { type: cardDetailsSchema, default: () => ({}) },
    confirmedByAdmin: { type: Boolean, default: false },
    paidAt: { type: Date },
    offlineReference: { type: String, default: '' },
    offlineInstructions: { type: String, default: '' },
    offlineReceiptPath: { type: String, default: '' },
    offlineSlipGeneratedAt: { type: Date },
  },
  { timestamps: true }
);

paymentSchema.index({ billId: 1, userId: 1 });

export default mongoose.model('Payment', paymentSchema);
