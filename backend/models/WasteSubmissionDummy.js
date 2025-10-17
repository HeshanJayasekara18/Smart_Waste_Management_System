import mongoose from 'mongoose';

const wasteSubmissionDummySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['special', 'recyclable'],
      required: true,
    },
    period: { type: String, required: true },
    weightKg: { type: Number, default: 0 },
    feeOrCredit: { type: Number, required: true },
  },
  { timestamps: true }
);

wasteSubmissionDummySchema.index({ userId: 1, period: 1 });

export default mongoose.model('WasteSubmissionDummy', wasteSubmissionDummySchema);
