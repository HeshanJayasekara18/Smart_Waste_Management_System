// backend/controllers/WasteSubmissionController.js
import WasteSubmissionService from "../services/WasteSubmissionService.js";
import NotificationService from "../services/NotificationService.js";

const wasteSubmissionService = new WasteSubmissionService();
const notificationService = new NotificationService();

/**
 * WasteSubmissionController
 * --------------------------
 * Handles HTTP routes for waste submissions.
 * 
 * ✅ SRP – Controller manages only request & response handling.
 * ✅ OCP – Easily extendable for new endpoints.
 */
export default class WasteSubmissionController {
  /**
   * ➕ Create a new waste submission
   * Route: POST /api/waste-submissions
   */
  async createWasteSubmission(req, res) {
    try {
      const submissionData = req.body;
      const newSubmission = await wasteSubmissionService.createSubmission(submissionData);

      await notificationService.send("email", {
        title: "Submission Confirmation",
        message: `Your waste submission (${newSubmission._id}) was successfully created.`,
        recipient: submissionData.submitterEmail || "noreply@system.com",
      });

      res.status(201).json({
        message: "Waste submission created successfully.",
        data: newSubmission,
      });
    } catch (error) {
      console.error("Error creating waste submission:", error);
      res.status(500).json({ message: "Error creating waste submission", error: error.message });
    }
  }

  async getWasteSubmissionById(req, res) {
    try {
      const { id } = req.params;
      const submission = await wasteSubmissionService.getSubmissionById(id);

      if (!submission) {
        return res.status(404).json({ message: "Waste submission not found" });
      }

      res.status(200).json(submission);
    } catch (error) {
      res.status(500).json({ message: "Error fetching waste submission", error: error.message });
    }
  }

  async getAllWasteSubmissions(req, res) {
    try {
      const submissions = await wasteSubmissionService.getAllSubmissions();
      res.status(200).json(submissions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching waste submissions", error: error.message });
    }
  }

  async updateWasteSubmissionStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, paymentStatus, paymentAmount } = req.body;

      const updated = await wasteSubmissionService.updateSubmissionStatus(id, {
        status,
        paymentStatus,
        paymentAmount,
      });

      if (!updated) {
        return res.status(404).json({ message: "Waste submission not found" });
      }

      await notificationService.send("email", {
        title: "Status Updated",
        message: `Your waste submission (${updated._id}) status updated to: ${status}`,
        recipient: updated.submitterEmail || "noreply@system.com",
      });

      res.status(200).json({
        message: "Waste submission status updated successfully.",
        data: updated,
      });
    } catch (error) {
      res.status(500).json({ message: "Error updating waste submission", error: error.message });
    }
  }

  async updateWasteSubmission(req, res) {
    try {
      const updated = await wasteSubmissionService.updateWasteSubmission(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Waste submission not found" });
      }
      res.json({
        message: "Waste submission updated successfully.",
        data: updated,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async deleteWasteSubmission(req, res) {
    try {
      const { id } = req.params;
      const deleted = await wasteSubmissionService.deleteSubmission(id);

      if (!deleted) {
        return res.status(404).json({ message: "Waste submission not found" });
      }

      res.status(200).json({ message: "Waste submission deleted successfully." });
    } catch (error) {
      res.status(500).json({ message: "Error deleting waste submission", error: error.message });
    }
  }
}
