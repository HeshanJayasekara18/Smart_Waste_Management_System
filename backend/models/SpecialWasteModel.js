import mongoose from "mongoose";
import CollectionAddressSchema from "./CollectionAddress.js";

const WasteSubmissionSchema = new mongoose.Schema({
  submissionId: { 
    type: String, 
    unique: true ,
    default: () => `SWR-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`
  },

  submitterName: {
    type: String,
    required: [true, 'Submitter name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },

  submitterEmail: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'Please provide a valid email address'
    ]
  },

  wasteType: { 
    type: String, 
    enum: ["special", "recyclable"], 
    required: [true, 'Waste type is required']
  },

  category: { 
    type: String, 
    required: [true, 'Category is required'],
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
    enum: ["pending", "approved", "rejected", "rescheduled", "in-progress","completed"],
    default: "pending",
  },

  paymentRequired: {
    type: Boolean,
    default: false,
  },

  paymentStatus: {
    type: String,
    enum: [ "pending", "paid", "failed"],
    default: "pending",
  },

  paymentAmount: {
    type: Number,
    min: 0,
    default: 0,
  },

  paybackAmount: { type: Number, default: 0 },

  rejectionReason: {
    type: String,
    default: ''
  },

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("WasteSubmission", WasteSubmissionSchema);
