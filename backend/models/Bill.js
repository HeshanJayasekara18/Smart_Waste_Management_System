const mongoose = require('mongoose');

const breakdownSchema = new mongoose.Schema(
  {
    base: { type: Number, default: 0 },
    weightKg: { type: Number, default: 0 },
    extraFee: { type: Number, default: 0 },
    recyclingCredit: { type: Number, default: 0 },
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    municipalityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Municipality',
      required: true,
    },
    period: { type: String, required: true },
    billingModelUsed: {
      type: String,
      enum: ['weight', 'fixed', 'user_choice'],
      required: true,
    },
    breakdown: { type: breakdownSchema, default: () => ({}) },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    warning: { type: String, default: '' },
  },
  { timestamps: true }
);

billSchema.index({ userId: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('Bill', billSchema);
