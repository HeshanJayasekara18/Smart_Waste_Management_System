// src/components/WasteSubmission/WasteSubmissionForm.jsx
import React, { useState } from "react";
import WasteSubmissionService from "../../services/WasteSubmissionService";
import { useNotification } from "../../contexts/NotificationContext";

const initialAddress = {
  street: "",
  city: "",
  state: "",
  postalCode: "",
  landmark: ""
};

export default function WasteSubmissionForm() {
  const notify = useNotification();
  const [form, setForm] = useState({
    submitterName: "",
    submitterEmail: "",
    wasteType: "recyclable",
    category: "",
    quantity: "",
    unit: "kg",
    pickupDate: "",
    location: "",
    collectionAddress: initialAddress,
    paymentRequired: false,
    paymentAmount: 0
  });
  const [loading, setLoading] = useState(false);

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const setAddressField = (k, v) => setForm(prev => ({ ...prev, collectionAddress: { ...prev.collectionAddress, [k]: v } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const created = await WasteSubmissionService.create(form);
      notify.push({ title: "Submission created", message: `ID: ${created.data?.submissionId || created.submissionId || created._id}` });
      // clear or keep as needed
    } catch (err) {
      notify.push({ title: "Error", message: err.message || "Failed to create submission" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-4 space-y-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold">New Waste Submission</h2>

      <div className="grid grid-cols-2 gap-3">
        <input required value={form.submitterName} onChange={e => setField("submitterName", e.target.value)} placeholder="Your name" className="input" />
        <input required type="email" value={form.submitterEmail} onChange={e => setField("submitterEmail", e.target.value)} placeholder="Email" className="input" />
        <select value={form.wasteType} onChange={e => setField("wasteType", e.target.value)} className="input">
          <option value="recyclable">Recyclable</option>
          <option value="special">Special</option>
        </select>
        <input required value={form.category} onChange={e => setField("category", e.target.value)} placeholder="Category (e.g., Plastic)" className="input" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <input required type="number" min="0" value={form.quantity} onChange={e => setField("quantity", e.target.value)} placeholder="Quantity" className="input" />
        <select value={form.unit} onChange={e => setField("unit", e.target.value)} className="input">
          <option value="kg">kg</option>
          <option value="items">items</option>
          <option value="liters">liters</option>
          <option value="cubic meters">cubic meters</option>
        </select>
        <input type="date" value={form.pickupDate} onChange={e => setField("pickupDate", e.target.value)} className="input" />
      </div>

      <div className="space-y-2">
        <div className="font-medium">Collection Address</div>
        <input value={form.collectionAddress.street} onChange={e => setAddressField("street", e.target.value)} placeholder="Street" className="input" />
        <div className="grid grid-cols-3 gap-3">
          <input value={form.collectionAddress.city} onChange={e => setAddressField("city", e.target.value)} placeholder="City" className="input" />
          <input value={form.collectionAddress.state} onChange={e => setAddressField("state", e.target.value)} placeholder="State" className="input" />
          <input value={form.collectionAddress.postalCode} onChange={e => setAddressField("postalCode", e.target.value)} placeholder="Postal code" className="input" />
        </div>
        <input value={form.collectionAddress.landmark} onChange={e => setAddressField("landmark", e.target.value)} placeholder="Landmark (optional)" className="input" />
      </div>

      <div className="flex items-center space-x-3">
        <label className="inline-flex items-center space-x-2">
          <input type="checkbox" checked={form.paymentRequired} onChange={e => setField("paymentRequired", e.target.checked)} />
          <span>Payment required</span>
        </label>
        <input type="number" min="0" value={form.paymentAmount} onChange={e => setField("paymentAmount", e.target.value)} placeholder="Payment amount" className="input w-36" />
      </div>

      <div className="flex space-x-2">
        <button type="submit" disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          {loading ? "Submitting..." : "Submit"}
        </button>
        <button type="button" onClick={() => setForm({
          submitterName: "",
          submitterEmail: "",
          wasteType: "recyclable",
          category: "",
          quantity: "",
          unit: "kg",
          pickupDate: "",
          location: "",
          collectionAddress: initialAddress,
          paymentRequired: false,
          paymentAmount: 0
        })} className="px-4 py-2 border rounded">Reset</button>
      </div>
    </form>
  );
}
