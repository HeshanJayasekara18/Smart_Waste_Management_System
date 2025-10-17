import mongoose from 'mongoose';

const scheduleAlertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['IOT_WARNING', 'UPDATE_REQUIRED', 'DELETE_REQUEST'],
    required: true,
  },
  message: { type: String, required: true, trim: true },
  triggeredAt: { type: Date, default: Date.now },
  resolved: { type: Boolean, default: false },
  resolvedAt: { type: Date },
});

const scheduleSchema = new mongoose.Schema(
  {
    routeId: { type: String, required: true, trim: true },
    zone: { type: String, required: true, trim: true },
    binIds: {
      type: [String],
      default: [],
      validate: {
        validator: (val) => Array.isArray(val) && val.every((id) => typeof id === 'string' && id.trim().length > 0),
        message: 'Bin identifiers must be non-empty strings',
      },
    },
    scheduledStart: { type: Date, required: true },
    scheduledEnd: { type: Date, required: true },
    status: {
      type: String,
      enum: ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'PLANNED',
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM',
    },
    assignedCrew: {
      driverId: { type: String, trim: true },
      vehicleId: { type: String, trim: true },
      supervisorId: { type: String, trim: true },
    },
    notes: { type: String, trim: true },
    alerts: { type: [scheduleAlertSchema], default: [] },
    lastValidatedAt: { type: Date },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

scheduleSchema.index({ routeId: 1, scheduledStart: 1, scheduledEnd: 1 });

scheduleSchema.pre('validate', function enforceTimeWindow(next) {
  if (this.scheduledStart >= this.scheduledEnd) {
    next(new Error('Schedule start time must be before end time'));
    return;
  }
  next();
});

//  Model encapsulates persistence mapping only. Business rules live in services.
export default mongoose.model('Schedule', scheduleSchema);
