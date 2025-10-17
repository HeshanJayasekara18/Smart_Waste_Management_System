import express from "express";
import WasteSubmissionController from "../controllers/WasteSubmissionController.js";

const router = express.Router();
const controller = new WasteSubmissionController();

// Create a new waste submission
router.post("/", controller.createWasteSubmission.bind(controller));

// Get all submissions
router.get("/", controller.getAllWasteSubmissions.bind(controller));

// Get a single submission by ID
router.get("/:id", controller.getWasteSubmissionById.bind(controller));

// Update status only (approve, reject, reschedule)
router.put("/:id/status", controller.updateWasteSubmissionStatus.bind(controller));

// ✅ Update all submission details
router.put("/:id", controller.updateWasteSubmission.bind(controller));

// Delete a submission
router.delete("/:id", controller.deleteWasteSubmission.bind(controller));

export default router;
