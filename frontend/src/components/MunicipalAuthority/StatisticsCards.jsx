import React from 'react';

export default function StatisticsCards({ statistics = {} }) {
  const items = [
    { label: 'Total Requests', value: statistics.totalRequests ?? 0 },
    { label: 'Pending', value: statistics.pending ?? 0 },
    { label: 'Approved', value: statistics.approved ?? 0 },
    { label: 'Rejected', value: statistics.rejected ?? 0 },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <div key={item.label} className="bg-white shadow rounded-lg p-4">
          <div className="text-sm text-gray-500">{item.label}</div>
          <div className="mt-2 text-2xl font-semibold">{item.value}</div>
        </div>
      ))}
    </div>
  );
}
