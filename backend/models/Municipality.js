import mongoose from 'mongoose';

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

export default mongoose.model('Municipality', municipalitySchema);
