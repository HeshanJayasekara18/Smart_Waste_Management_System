const mongoose = require('mongoose');

const municipalitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    billingModel: {
      type: String,
      enum: ['weight', 'fixed', 'user_choice'],
      default: 'weight',
    },
    fixedRate: { type: Number, default: 0 },
    weightRatePerKg: { type: Number, default: 0 },
    defaultRate: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Municipality', municipalitySchema);
