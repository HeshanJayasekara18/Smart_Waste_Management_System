import React from 'react';

export default function FilterBar({ filters, setFilters }) {
  const handleChange = (e) => {
    setFilters(prev => ({ ...prev, status: e.target.value }));
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 flex items-center gap-3">
      <label className="text-sm text-gray-600">Status</label>
      <select
        className="border rounded px-2 py-1"
        value={filters.status}
        onChange={handleChange}
      >
        <option value="all">All</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>
    </div>
  );
}
