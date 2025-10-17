import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    line1: { type: String, required: true },
    city: { type: String, default: '' },
    postal: { type: String, default: '' },
    municipalityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Municipality',
      required: true,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    address: { type: addressSchema, required: true },
    paymentMethods: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
