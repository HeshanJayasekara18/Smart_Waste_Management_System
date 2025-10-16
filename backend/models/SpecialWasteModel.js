import mongoose from "mongoose";
import CollectionAddressSchema from "./CollectionAddress.js";

const WasteSubmissionSchema = new mongoose.Schema({
  submissionId: { 
    type: String, 
    unique: true ,
    default: () => `SWR-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`
  },

  wasteType: { 
    type: String, 
    enum: ["special", "recyclable"], 
    required: true 
  },

  category: { type: String, 
    required: true,
    required: true ,
    enum: ['bulky', 'e-waste', 'plastic', 'paper', 'glass', 'metal', 'other']
  },

  quantity: { 
    type: Number, 
    required: true,
     min: 1
   },

  unit: {
    type: String,
    enum: ["kg", "items", "liters", "cubic meters"],
    required: true,
  },

  pickupDate: { type: Date, required: true },

  collectionAddress: { type: CollectionAddressSchema, required: true },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "rescheduled"],
    default: "pending",
  },

  paymentRequired: {
    type: Boolean,
    default: false,
  },

  paymentStatus: {
    type: String,
    enum: ["not-required", "pending", "paid", "failed"],
    default: "not-required",
  },

  paymentAmount: {
    type: Number,
    min: 0,
    default: 0,
  },

  paybackAmount: { type: Number,default: 0},

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("WasteSubmission", WasteSubmissionSchema);
