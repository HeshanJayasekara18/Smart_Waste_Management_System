const mongoose = require('mongoose');

const timeWindowSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
  },
  { _id: false }
);

const alertSchema = new mongoose.Schema(
  {
    alertCode: { type: String, trim: true },
    type: {
      type: String,
      enum: ['IOT_WARNING', 'UPDATE_REQUIRED', 'DELETE_REQUEST'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      required: true,
    },
    message: { type: String, required: true, trim: true },
    reportedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const collectionRouteSchema = new mongoose.Schema(
  {
    routeCode: { type: String, required: true, trim: true, unique: true },
    name: { type: String, required: true, trim: true },
    zone: { type: String, trim: true },
    coverage: { type: String, trim: true },
    scheduleSummary: { type: String, trim: true },
    vehicle: {
      id: { type: String, required: true, trim: true },
      label: { type: String, required: true, trim: true },
    },
    driver: {
      id: { type: String, required: true, trim: true },
      name: { type: String, required: true, trim: true },
    },
    defaultBins: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.every((item) => typeof item === 'string' && item.trim().length > 0),
        message: 'Bin identifiers must be non-empty strings',
      },
    },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    timeWindows: { type: [timeWindowSchema], default: [] },
    alerts: { type: [alertSchema], default: [] },
  },
  { timestamps: true }
);

collectionRouteSchema.index({ routeCode: 1 });

module.exports = mongoose.model('CollectionRoute', collectionRouteSchema);
