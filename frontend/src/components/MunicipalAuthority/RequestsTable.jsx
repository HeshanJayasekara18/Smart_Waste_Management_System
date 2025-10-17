import React, { useState } from 'react';
import RequestReviewModal from './RequestReviewModal';
import { Eye } from 'lucide-react';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  'in-progress': 'bg-blue-100 text-blue-800',
  completed: 'bg-green-300 text-gray-800'
};

export default function RequestsTable({ requests, loading, onRefresh }) {
  const [selectedRequest, setSelectedRequest] = useState(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-flex items-center gap-3 text-gray-600">
          <span className="h-4 w-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Request ID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {requests.map((request, index) => (
              <tr key={request._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  REQ-{index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{request.wasteType}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{request.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{request.quantity} {request.unit}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ring-black/5 ${STATUS_COLORS[request.status]}`}>
                    {request.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => setSelectedRequest(request)}
                    className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 hover:underline mr-3"
                    title="Review Request"
                  >
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {selectedRequest && (
        <RequestReviewModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onSuccess={onRefresh}
        />
      )}
    </>
  );
}