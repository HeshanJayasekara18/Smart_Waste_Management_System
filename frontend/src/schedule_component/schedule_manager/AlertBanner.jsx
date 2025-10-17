// AlertBanner.jsx
// SRP: Displays alerts (IoT, system issues, etc.)
// Code smell avoided: separated from dashboard content

import React from "react";

export default function AlertBanner() {
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg">
      <div className="flex items-start">
        <div className="text-yellow-400 mr-3 text-xl">⚠️</div>
        <div>
          <h3 className="font-semibold text-yellow-800">IoT Sensor Alerts (3 Active)</h3>
          <p className="text-sm text-yellow-700">
            Multiple sensors require immediate attention - Route 8 overflow detected
          </p>
        </div>
      </div>
    </div>
  );
}
