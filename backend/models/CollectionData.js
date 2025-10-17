const mongoose = require('mongoose');

const collectionDataSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    period: { type: String, required: true },
    weightKg: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['collected', 'missed', 'pending'],
      default: 'collected',
    },
  },
  { timestamps: true }
);

collectionDataSchema.index({ userId: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('CollectionData', collectionDataSchema);
