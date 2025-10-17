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
        <div
          key={item.label}
          className="relative overflow-hidden rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md"
        >
          <div className="absolute inset-x-0 -top-6 h-20 bg-gradient-to-r from-emerald-50 to-teal-50 opacity-70" />
          <div className="relative">
            <div className="text-xs uppercase tracking-wide text-gray-500">{item.label}</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{item.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
