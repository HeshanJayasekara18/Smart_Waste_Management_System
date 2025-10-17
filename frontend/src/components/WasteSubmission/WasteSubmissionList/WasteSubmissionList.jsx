// src/components/WasteSubmission/WasteSubmissionList.jsx
import React, { useEffect, useState } from "react";
import WasteSubmissionService from "../../../services/WasteSubmissionService";
import { useNotification } from "../../../contexts/NotificationContext";

export default function WasteSubmissionList() {
  const [items, setItems] = useState([]);
  const notify = useNotification();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    WasteSubmissionService.list()
      .then(res => {
        // API might return {data: ...} or array; handle both
        const data = res?.data ?? res;
        if (mounted) setItems(Array.isArray(data) ? data : data.data ?? []);
      })
      .catch(err => notify.push({ title: "Error", message: err.message }))
      .finally(() => setLoading(false));
    return () => (mounted = false);
  }, [notify]);

  if (loading) return <div className="p-4">Loading...</div>;
  if (!items.length) return <div className="p-4">No submissions yet.</div>;

  return (
    <div className="p-4 grid gap-3">
      {items.map(s => (
        <div key={s._id || s.submissionId} className="p-3 border rounded bg-white">
          <div className="flex justify-between">
            <div>
              <div className="font-semibold">{s.category} ({s.wasteType})</div>
              <div className="text-sm text-gray-600">Qty: {s.quantity} {s.unit}</div>
            </div>
            <div className="text-right">
              <div className="text-sm">{new Date(s.createdAt).toLocaleString()}</div>
              <div className="text-sm">Status: <span className="font-medium">{s.status}</span></div>
            </div>
          </div>
          <div className="mt-2 text-sm">{s.collectionAddress?.street}, {s.collectionAddress?.city}</div>
        </div>
      ))}
    </div>
  );
}
