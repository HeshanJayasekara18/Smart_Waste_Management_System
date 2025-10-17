import React, { useState } from 'react';
import RequestReviewModal from './RequestReviewModal';
import { Eye } from 'lucide-react';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  'in-progress': 'bg-blue-100 text-blue-800',
  completed: 'bg-gray-100 text-gray-800'
};

export default function RequestsTable({ requests, loading, onRefresh }) {
  const [selectedRequest, setSelectedRequest] = useState(null);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map((request, index) => (
              <tr key={request._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  REQ-{index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{request.wasteType}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{request.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{request.quantity} {request.unit}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[request.status]}`}>
                    {request.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => setSelectedRequest(request)}
                    className="text-blue-600 hover:text-blue-800 mr-3"
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