import React, { useState } from "react";
import { createCollectionRoute } from "./../api/CollectionRouteApi";

const emptyTimeWindow = { label: "", start: "", end: "" };

export default function CollectionRouteForm({ onCreated }) {
  const [formState, setFormState] = useState({
    routeCode: "",
    name: "",
    zone: "",
    coverage: "",
    scheduleSummary: "",
    vehicleId: "",
    vehicleLabel: "",
    driverId: "",
    driverName: "",
    defaultBins: "",
    lat: "",
    lng: "",
  });
  const [timeWindows, setTimeWindows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTimeWindow = () => {
    setTimeWindows((prev) => [...prev, { ...emptyTimeWindow }]);
  };

  const handleTimeWindowChange = (index, field, value) => {
    setTimeWindows((prev) =>
      prev.map((window, idx) => (idx === index ? { ...window, [field]: value } : window))
    );
  };

  const handleRemoveTimeWindow = (index) => {
    setTimeWindows((prev) => prev.filter((_, idx) => idx !== index));
  };

  const resetForm = () => {
    setFormState({
      routeCode: "",
      name: "",
      zone: "",
      coverage: "",
      scheduleSummary: "",
      vehicleId: "",
      vehicleLabel: "",
      driverId: "",
      driverName: "",
      defaultBins: "",
      lat: "",
      lng: "",
    });
    setTimeWindows([]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const lat = Number(formState.lat);
    const lng = Number(formState.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setError("Latitude and longitude must be valid numbers.");
      return;
    }

    const defaultBins = formState.defaultBins
      .split(",")
      .map((bin) => bin.trim())
      .filter(Boolean);

    if (defaultBins.length === 0) {
      setError("Please provide at least one default bin ID.");
      return;
    }

    if (!formState.vehicleId.trim() || !formState.vehicleLabel.trim()) {
      setError("Vehicle ID and label are required.");
      return;
    }

    if (!formState.driverId.trim() || !formState.driverName.trim()) {
      setError("Driver ID and name are required.");
      return;
    }

    const payload = {
      routeCode: formState.routeCode.trim().toUpperCase(),
      name: formState.name.trim(),
      zone: formState.zone.trim() || undefined,
      coverage: formState.coverage.trim() || undefined,
      scheduleSummary: formState.scheduleSummary.trim() || undefined,
      vehicle: {
        id: formState.vehicleId.trim(),
        label: formState.vehicleLabel.trim(),
      },
      driver: {
        id: formState.driverId.trim(),
        name: formState.driverName.trim(),
      },
      defaultBins,
      coordinates: { lat, lng },
      timeWindows: timeWindows
        .filter((window) => window.start && window.end)
        .map((window) => ({
          label: window.label.trim() || undefined,
          start: window.start,
          end: window.end,
        })),
    };

    if (!payload.routeCode || !payload.name) {
      setError("Route code and name are required.");
      return;
    }

    try {
      setLoading(true);
      await createCollectionRoute(payload);
      setSuccess("Collection route created successfully.");
      resetForm();
      onCreated?.();
    } catch (err) {
      const message = err.response?.data?.error || "Failed to create collection route.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-semibold text-slate-900 mb-4">Add Collection Route</h3>
      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}
      {success && (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{success}</p>
      )}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
          Route Code
          <input
            name="routeCode"
            value={formState.routeCode}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="RTE-001"
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
          Route Name
          <input
            name="name"
            value={formState.name}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Central Business District"
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
          Zone
          <input
            name="zone"
            value={formState.zone}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Colombo 03"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
          Coverage
          <input
            name="coverage"
            value={formState.coverage}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Marine Drive, Galle Road"
          />
        </label>
        <label className="lg:col-span-2 flex flex-col gap-2 text-sm font-medium text-slate-600">
          Schedule Summary
          <input
            name="scheduleSummary"
            value={formState.scheduleSummary}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Every Tuesday & Friday, 6:00 AM - 9:30 AM"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
          Vehicle ID
          <input
            name="vehicleId"
            value={formState.vehicleId}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="WM-003"
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
          Vehicle Label
          <input
            name="vehicleLabel"
            value={formState.vehicleLabel}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Medium capacity truck - 3.5 tons"
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
          Driver ID
          <input
            name="driverId"
            value={formState.driverId}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="DRV-023"
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
          Driver Name
          <input
            name="driverName"
            value={formState.driverName}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Kamal Perera"
            required
          />
        </label>
        <label className="lg:col-span-2 flex flex-col gap-2 text-sm font-medium text-slate-600">
          Default Bin IDs (comma separated)
          <input
            name="defaultBins"
            value={formState.defaultBins}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="BIN-001, BIN-002"
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
          Latitude
          <input
            name="lat"
            type="number"
            value={formState.lat}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="6.9271"
            step="0.0001"
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
          Longitude
          <input
            name="lng"
            type="number"
            value={formState.lng}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="79.8612"
            step="0.0001"
            required
          />
        </label>

        <div className="lg:col-span-2 flex flex-col gap-4 rounded-xl border border-dashed border-slate-300 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Time Windows</p>
            <button
              type="button"
              onClick={handleAddTimeWindow}
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              Add Time Window
            </button>
          </div>
          {timeWindows.length === 0 && (
            <p className="text-xs text-slate-500">No time windows defined. Add one to specify schedule blocks.</p>
          )}
          <div className="grid gap-4">
            {timeWindows.map((window, index) => (
              <div key={`time-window-${index}`} className="grid gap-3 rounded-lg border border-slate-200 p-4 md:grid-cols-4">
                <label className="md:col-span-2 flex flex-col gap-2 text-sm font-medium text-slate-600">
                  Label (optional)
                  <input
                    value={window.label}
                    onChange={(event) => handleTimeWindowChange(index, "label", event.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Tuesday & Friday | 6:00 AM - 9:30 AM"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                  Start
                  <input
                    type="datetime-local"
                    value={window.start}
                    onChange={(event) => handleTimeWindowChange(index, "start", event.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                  End
                  <input
                    type="datetime-local"
                    value={window.end}
                    onChange={(event) => handleTimeWindowChange(index, "end", event.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </label>
                <div className="md:col-span-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveTimeWindow(index)}
                    className="rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-500 hover:text-white"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={resetForm}
            className="rounded-full bg-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300"
            disabled={loading}
          >
            Reset
          </button>
          <button
            type="submit"
            className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Collection Route"}
          </button>
        </div>
      </form>
    </div>
  );
}
