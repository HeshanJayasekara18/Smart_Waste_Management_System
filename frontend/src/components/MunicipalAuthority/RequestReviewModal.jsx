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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
      <div className="relative bg-white rounded-2xl p-6 sm:p-7 w-[92vw] max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl ring-1 ring-black/5">
        <h2 className="text-xl sm:text-2xl font-bold mb-5 text-gray-800">Review Waste Request</h2>

        {/* Request Details */}
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100">
          <h3 className="font-semibold mb-3 text-gray-700">Request Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
            <div>Type: {request.wasteType}</div>
            <div>Category: {request.category}</div>
            <div>Quantity: {request.quantity} {request.unit}</div>
            <div>Payment: Rs.{request.paymentAmount}</div>
          </div>
        </div>

        {/* Status Selection */}
        <div className="mb-5">
          <label className="block font-medium mb-2 text-gray-700">Action *</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
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
          <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <label className="block font-medium mb-2 text-emerald-900">Payback Amount</label>
            <input
              type="number"
              step="0.01"
              onChange={(e) => setPaybackAmount(parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-emerald-900 placeholder-emerald-700/50 focus:border-emerald-500 focus:ring-emerald-500"
              placeholder="Enter payback amount"
            />
            <div className="mt-3 text-sm text-emerald-900">
              <div>Collection Fee: Rs.{request.paymentAmount}</div>
              <div>Payback: -Rs.{paybackAmount}</div>
              <div className="font-bold">Net Amount: Rs.{(request.paymentAmount - paybackAmount).toFixed(2)}</div>
            </div>
          </div>
        )}

        {/* Rejection Reason */}
        {status === 'rejected' && (
          <div className="mb-5">
            <label className="block font-medium mb-2 text-gray-700">Rejection Reason *</label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              rows="3"
              placeholder="Please provide reason for rejection"
              required
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            onClick={handleSubmit}
            disabled={loading || !status}
            className="flex-1 inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-white font-medium shadow-sm hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Submit Review'}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-lg border border-gray-300 bg-white font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}