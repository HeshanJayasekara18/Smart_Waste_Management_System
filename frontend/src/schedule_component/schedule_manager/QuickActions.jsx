// QuickActions.jsx
// SRP: Only handles action buttons
import React from "react";

export default function QuickActions() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
      <div className="space-y-2">
        {["Create New Schedule", "Generate Reports", "Quick Settings", "View Requests"].map(
          (action) => (
            <button
              key={action}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              {action}
            </button>
          )
        )}
      </div>
    </div>
  );
}
