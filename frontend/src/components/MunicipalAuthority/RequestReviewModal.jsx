import React, { useMemo, useState } from 'react';
import WasteSubmissionService from '../../services/WasteSubmissionService';
import { useNotification } from '../../contexts/NotificationContext';
import { getAllowedNextStatuses, canTransition } from '../../validators/StatusValidator';

export default function RequestReviewModal({ request, onClose, onSuccess }) {
  const notify = useNotification();
  const [status, setStatus] = useState('');
  const [paybackAmount, setPaybackAmount] = useState(0);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);

  const currentStatus = request.status;
  const allowedStatuses = useMemo(() => getAllowedNextStatuses(currentStatus), [currentStatus]);

  const statusLabel = (s) => {
    switch (s) {
      case 'approved': return 'Approve';
      case 'rejected': return 'Reject';
      case 'in-progress': return 'Mark In Progress';
      case 'completed': return 'Mark Completed';
      default: return s;
    }
  };



  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (!status) {
        throw new Error('Please select an action');
      }
      if (!canTransition(currentStatus, status)) {
        setLoading(false);
        return notify.push({ title: 'Not allowed', message: 'This status change is not permitted for the current status.' });
      }
      const payload = {
        status,
        ...(status === 'approved' && { paybackAmount }),
        ...(status === 'rejected' && { rejectionReason })
      };

      await WasteSubmissionService.updateRequestStatus(request._id, payload);

      notify.push({
        title: 'Success',
        message: `Request ${status} successfully`
      });
      onSuccess();
      onClose();
    } catch (error) {
      notify.push({
        title: 'Error',
        message: error.message || 'Failed to update request'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Review Waste Request</h2>

        {/* Request Details */}
        <div className="mb-6 p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">Request Details</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Type: {request.wasteType}</div>
            <div>Category: {request.category}</div>
            <div>Quantity: {request.quantity} {request.unit}</div>
            <div>Payment: Rs.{request.paymentAmount}</div>
          </div>
        </div>

        {/* Status Selection */}
        <div className="mb-4">
          <label className="block font-medium mb-2">Action *</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          >
            <option value="">Select action</option>
            {allowedStatuses.map(s => (
              <option key={s} value={s}>{statusLabel(s)}</option>
            ))}
          </select>
          {currentStatus === 'rejected' && (
            <div className="text-xs text-red-600 mt-1">Cannot change status once it is rejected.</div>
          )}
        </div>

        {/* Payback Amount (manual entry when approved) */}
        {status === 'approved' && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
            <label className="block font-medium mb-2">Payback Amount</label>
            <input
              type="number"
              step="0.01"
              onChange={(e) => setPaybackAmount(parseFloat(e.target.value) || 0)}
              className="w-full border rounded px-3 py-2"
              placeholder="Enter payback amount"
            />
            <div className="mt-2 text-sm">
              <div>Collection Fee: Rs.{request.paymentAmount}</div>
              <div>Payback: -Rs.{paybackAmount}</div>
              <div className="font-bold">Net Amount: Rs.{(request.paymentAmount - paybackAmount).toFixed(2)}</div>
            </div>
          </div>
        )}

        {/* Rejection Reason */}
        {status === 'rejected' && (
          <div className="mb-4">
            <label className="block font-medium mb-2">Rejection Reason *</label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full border rounded px-3 py-2"
              rows="3"
              placeholder="Please provide reason for rejection"
              required
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3 mt-6">
          <button
            onClick={handleSubmit}
            disabled={loading || !status}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? 'Processing...' : 'Submit Review'}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}