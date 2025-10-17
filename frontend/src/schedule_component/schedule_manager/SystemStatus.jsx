// SystemStatus.jsx
import React from "react";

export default function SystemStatus() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">System Status</h2>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">IoT Sensors: Online</span>
          <span className="text-sm font-semibold text-gray-800">(47/50)</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            <span className="text-sm text-gray-600">Sensor Tracking:</span>
          </div>
          <span className="text-sm font-semibold text-gray-800">3 Issues</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            <span className="text-sm text-gray-600">Route Conflicts:</span>
          </div>
          <span className="text-sm font-semibold text-gray-800">2 Active</span>
        </div>
      </div>
    </div>
  );
}
