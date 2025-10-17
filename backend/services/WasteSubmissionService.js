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

      // ✅ Use factory pattern for notifications (non-blocking)
      try {
        const notification = NotificationFactory.create("email");
        await notification.sendNotification({
          title: "New Waste Submission Received",
          message: `Waste submission from ${data.submitterName || "Anonymous"} has been recorded successfully.`,
          recipient: data.submitterEmail || "noreply@system.com",
          meta: { footer: "Smart Waste Management System" },
        });
      } catch (notifyErr) {
        console.error("⚠️ Notification send failed:", notifyErr.message);
      }

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
  async updateSubmissionStatus(id, { status, paybackAmount, rejectionReason }) {
    try {
      const normalizeStatus = (s) => {
        if (!s) return s;
        const t = String(s).trim().toLowerCase();
        if (t === 'complete' || t === 'complte' || t === 'completed') return 'completed';
        if (t === 'in progress' || t === 'inprogress' || t === 'in-progress') return 'in-progress';
        if (t === 'reschedule' || t === 'rescheduled') return 'rescheduled';
        return t;
      };

      const normalizedStatus = normalizeStatus(status);

      const validStatuses = ["pending", "approved", "rejected", "rescheduled", "in-progress", "completed"];
      if (normalizedStatus && !validStatuses.includes(normalizedStatus)) {
        throw new Error("Invalid status update");
      }

      const updateData = { status: normalizedStatus };
      if (normalizedStatus === 'approved') {
        updateData.paybackAmount = typeof paybackAmount === 'number' ? paybackAmount : 0;
        updateData.rejectionReason = '';
      } else if (normalizedStatus === 'rejected') {
        updateData.rejectionReason = rejectionReason || '';
        updateData.paybackAmount = 0;
      } else if (normalizedStatus === 'in-progress' || normalizedStatus === 'rescheduled' || normalizedStatus === 'pending' || normalizedStatus === 'completed') {
        // Do not touch payback or rejectionReason unless explicitly provided
        if (typeof paybackAmount === 'number') updateData.paybackAmount = paybackAmount;
        if (typeof rejectionReason === 'string') updateData.rejectionReason = rejectionReason;
      }

      const submission = await WasteSubmission.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!submission) throw new Error("Submission not found");

      // ✅ Notify user about the status change (non-blocking for response)
      try {
        const notification = NotificationFactory.create(this.notificationType);
        await notification.sendNotification({
          recipient: submission.submitterEmail || "noreply@system.com",
          title: "Waste Submission Status Update",
          message: `Your waste submission (${submission._id}) status has been updated to "${status}".`,
        });
      } catch (notifyErr) {
        console.error("⚠️ Notification send failed:", notifyErr.message);
      }

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
