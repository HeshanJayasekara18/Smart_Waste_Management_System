const mongoose = require('mongoose');

const wasteSubmissionSchema = new mongoose.Schema(
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

wasteSubmissionSchema.index({ userId: 1, period: 1 });

module.exports = mongoose.model('WasteSubmission', wasteSubmissionSchema);
