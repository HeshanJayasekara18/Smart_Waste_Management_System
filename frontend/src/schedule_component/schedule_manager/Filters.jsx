// Filters.jsx
// SRP: Controls filtering UI only
// Refactoring: removed inline filter logic, kept purely presentational

import React from "react";

export default function Filters() {
  return (
    <div className="flex items-center space-x-4 mb-6">
      <span className="font-semibold text-gray-700">Filters</span>
      <label className="flex items-center space-x-2">
        <input type="checkbox" className="rounded" defaultChecked />
        <span className="text-sm text-gray-600">Active Routes</span>
      </label>
      <label className="flex items-center space-x-2">
        <input type="checkbox" className="rounded" />
        <span className="text-sm text-gray-600">Completed</span>
      </label>
      <div className="flex-1"></div>
      <input
        type="text"
        placeholder="Search routes, schedules..."
        className="px-4 py-2 border border-gray-300 rounded-lg w-64 text-sm"
      />
    </div>
  );
}
