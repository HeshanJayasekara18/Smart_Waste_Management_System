import mongoose from "mongoose";

const CollectionAddressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  landmark: { type: String },
});

export default CollectionAddressSchema;
