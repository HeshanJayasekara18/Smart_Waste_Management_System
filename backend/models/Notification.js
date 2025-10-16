import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  recipientType: {
    type: String,
    enum: ["user", "municipal"],
    required: true,
  },
  recipientEmail: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: [
      "submission",
      "approval",
      "rejection",
      "reschedule",
      "system-error",
    ],
    default: "submission",
  },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Notification", NotificationSchema);
