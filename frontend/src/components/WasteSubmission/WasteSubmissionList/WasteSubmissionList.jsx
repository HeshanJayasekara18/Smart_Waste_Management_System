// src/components/WasteSubmission/WasteSubmissionList.jsx
import React, { useEffect, useState, useMemo } from "react";
import WasteSubmissionService from "../../../services/WasteSubmissionService";
import { useNotification } from "../../../contexts/NotificationContext";
import { Search, Filter } from "lucide-react";

export default function WasteSubmissionList() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const notify = useNotification();

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    WasteSubmissionService.list()
      .then((res) => {
        const data = res?.data ?? res;
        if (mounted) setItems(Array.isArray(data) ? data : data.data ?? []);
      })
      .catch((err) =>
        notify.push({ title: "Error", message: err.message || "Failed to load data" })
      )
      .finally(() => setLoading(false));
    return () => (mounted = false);
  }, [notify]);

  const filtered = useMemo(() => {
    return items.filter((s) => {
      const matchesSearch =
        s.category?.toLowerCase().includes(search.toLowerCase()) ||
        s.wasteType?.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === "all" || s.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [items, search, filter]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">Waste Submissions List</h2>
      {/* Header Controls */}
      <div className="sticky top-0 bg-green-400 z-10 border-b py-5 pl-10 my-4 rounded-full">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search bar */}
          <div className="flex items-center w-full sm:w-2/3 bg-gray-100 px-3 py-2 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-green-500 transition">
            <Search className="text-gray-500 mr-2" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by category or waste type..."
              className="w-full bg-transparent outline-none text-sm"
            />
          </div>

          {/* Filter dropdown */}
          <div className="flex items-center bg-gray-100 px-3 py-2 rounded-lg shadow-sm">
            <Filter className="text-gray-500 mr-2" size={18} />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-transparent outline-none text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center h-40 text-gray-500 animate-pulse">
          Loading submissions...
        </div>
      )}

      {/* List or Empty state */}
      {!loading && (
        <>
          {filtered.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-4 lg:grid-cols-1">
              {filtered.map((s) => (
                <div
                  key={s._id || s.submissionId}
                  className="p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-100"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {s.category} <span className="text-gray-500">({s.wasteType})</span>
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Qty: {s.quantity} {s.unit}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          s.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : s.status === "completed"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {s.status || "N/A"}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(s.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-2">
                    {s.collectionAddress?.street}, {s.collectionAddress?.city}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <Filter className="w-10 h-10 mb-2 opacity-60" />
              <p>No submissions found for your search or filter.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
