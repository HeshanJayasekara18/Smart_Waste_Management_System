// backend/services/WasteSubmissionService.js
import WasteSubmission from "../models/SpecialWasteModel.js";
import NotificationFactory from "../services/NotificationFactory.js";

/**
 * WasteSubmissionService
 * ----------------------
 * Handles business logic related to waste submissions.
 * 
 * ✅ SRP – Handles logic and DB operations only.
 * ✅ OCP – Extendable for new logic (e.g., scheduling, new channels).
 */
export default class WasteSubmissionService {
  constructor() {
    // Default notification type
    this.notificationType = "email";
  }

  /**
   * 🧾 Create a new waste submission
   */
  async createSubmission(data) {
    try {
      const wasteSubmission = new WasteSubmission(data);
      await wasteSubmission.save();

      // ✅ Use factory pattern for notifications
       const notification = NotificationFactory.create("email");

      await notification.sendNotification({
        title: "New Waste Submission Received",
        message: `Waste submission from ${data.submitterName || "Anonymous"} has been recorded successfully.`,
        recipient: data.submitterEmail || "noreply@system.com",
        meta: { footer: "Smart Waste Management System" },
      });

      console.log("✅ Waste submission created successfully.");
      return wasteSubmission;
    } catch (error) {
      console.error("❌ Error creating waste submission:", error);
      throw error;
    }
  }

  /**
   * 📄 Retrieve all submissions
   */
  async getAllSubmissions() {
    try {
      return await WasteSubmission.find().sort({ createdAt: -1 });
    } catch (error) {
      console.error("❌ Error fetching waste submissions:", error);
      throw error;
    }
  }

  /**
   * 🔍 Get a submission by ID
   */
  async getSubmissionById(id) {
    try {
      const submission = await WasteSubmission.findById(id);
      if (!submission) throw new Error("Submission not found");
      return submission;
    } catch (error) {
      console.error("❌ Error fetching submission by ID:", error);
      throw error;
    }
  }

  /**
   * 🔄 Update waste submission status
   */
  async updateSubmissionStatus(id, { status, paymentStatus, paymentAmount }) {
    try {
      const validStatuses = ["pending", "approved", "rejected", "rescheduled"];
      if (status && !validStatuses.includes(status)) {
        throw new Error("Invalid status update");
      }

      const submission = await WasteSubmission.findByIdAndUpdate(
        id,
        { status, paymentStatus, paymentAmount },
        { new: true }
      );

      if (!submission) throw new Error("Submission not found");

      // ✅ Notify user about the status change
      const notification = NotificationFactory.create(this.notificationType);
      await notification.send({
        recipient: submission.submitterEmail || "noreply@system.com",
        title: "Waste Submission Status Update",
        message: `Your waste submission (${submission._id}) status has been updated to "${status}".`,
      });

      console.log("✅ Waste submission status updated.");
      return submission;
    } catch (error) {
      console.error("❌ Error updating submission status:", error);
      throw error;
    }
  }

  /**
   * 🧩 Update entire waste submission details
   */
  async updateWasteSubmission(id, newData) {
    try {
      const updated = await WasteSubmission.findByIdAndUpdate(id, newData, {
        new: true,
        runValidators: true,
      });
      if (!updated) throw new Error("Submission not found");
      console.log("✅ Waste submission updated successfully.");
      return updated;
    } catch (error) {
      console.error("❌ Error updating waste submission:", error);
      throw error;
    }
  }

  /**
   * ❌ Delete a waste submission
   */
  async deleteSubmission(id) {
    try {
      const deleted = await WasteSubmission.findByIdAndDelete(id);
      if (!deleted) throw new Error("Submission not found");
      console.log("🗑️ Waste submission deleted.");
      return deleted;
    } catch (error) {
      console.error("❌ Error deleting waste submission:", error);
      throw error;
    }
  }
}
