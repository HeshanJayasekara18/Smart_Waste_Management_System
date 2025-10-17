// src/services/WasteSubmissionService.js
import WasteSubmissionAPI from "../api/WasteSubmissionAPI";

/**
 * WasteSubmissionService - business logic + small validations.
 * Single Responsibility: orchestrates work around waste submissions.
 */

const validateSubmission = (data) => {
  if (!data.wasteType) throw new Error("Waste type is required.");
  if (!data.category) throw new Error("Category is required.");
  if (!data.quantity || data.quantity <= 0) throw new Error("Quantity must be greater than 0.");
  if (!data.unit) throw new Error("Unit is required.");
  if (!data.pickupDate) throw new Error("Unit is required.");
  // add more domain validations as needed
};

const WasteSubmissionService = {
  async create(data) {
    validateSubmission(data);
    // map or enrich before sending to API
    const payload = {
      submissionId: data.submissionId || `SUB-${Date.now()}`,
      submitterName: data.submitterName,
      submitterEmail: data.submitterEmail,
      wasteType: data.wasteType,
      category: data.category,
      quantity: Number(data.quantity),
      unit: data.unit,
      pickupDate: data.pickupDate,
      location: data.location,
      collectionAddress: data.collectionAddress,
      paymentRequired: !!data.paymentRequired,
      paymentStatus: data.paymentStatus || "not-required",
      paymentAmount: data.paymentAmount ? Number(data.paymentAmount) : 0,
    };
    const result = await WasteSubmissionAPI.create(payload);
    return result;
  },

  async list() {
    const res = await WasteSubmissionAPI.list();
    // Optionally transform results for UI
    return res;
  },

  async get(id) {
    return WasteSubmissionAPI.get(id);
  },

  async update(id, newData) {
    // run validations if needed
    return WasteSubmissionAPI.update(id, newData);
  },

  async updateStatus(id, statusPayload) {
    return WasteSubmissionAPI.updateStatus(id, statusPayload);
  },

  async remove(id) {
    return WasteSubmissionAPI.remove(id);
  },

    async getStats() {
    try {
      const submissions = await WasteSubmissionAPI.list();

      const recyclableCount = submissions.filter(
        (s) => s.wasteType === "recyclable"
      ).length;

      const totalPayback = submissions.reduce(
        (sum, s) => sum + (s.paybackAmount || 0),
        0
      );

      return { recyclableCount, totalPayback };
    } catch (error) {
      console.error("Error calculating stats:", error);
      throw error;
    }
  },


};



export default WasteSubmissionService;
