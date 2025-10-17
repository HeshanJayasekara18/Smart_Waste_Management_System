const mongoose = require('mongoose');

const collectionRecordSchema = new mongoose.Schema(
  {
    binId: { type: String, required: true },
    routeId: { type: String },
    driverId: { type: String },
    vehicleId: { type: String },
    timestamp: { type: Date, default: Date.now },
    weight: { type: Number },
    confirmed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

//use SRP: Model defines data only — logic stays in service layer
module.exports = mongoose.model('CollectionRecord', collectionRecordSchema);
