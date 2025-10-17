import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getSchedules,
  createSchedule,
  updateSchedule,
  changeScheduleStatus,
  deleteSchedule,
} from "./../api/ScheduleApi";
import { getCollectionRoutes } from "./../api/CollectionRouteApi";

const initialFormValues = {
  routeId: "",
  zone: "",
  scheduledStart: "",
  scheduledEnd: "",
  binIds: "",
  createdBy: "",
  vehicleId: "",
  driverId: "",
  priority: "MEDIUM",
  notes: "",
};

const ScheduleManager = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ status: "" });
  const [collectionRoutes, setCollectionRoutes] = useState([]);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [routesError, setRoutesError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [formState, setFormState] = useState({ ...initialFormValues });
  const [showModal, setShowModal] = useState(false);
  const [conflictInfo, setConflictInfo] = useState(null);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [pendingUpdate, setPendingUpdate] = useState(null);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const navigate = useNavigate();

  const minDateTime = useMemo(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }, []);

  const currentRoute = useMemo(
    () => collectionRoutes.find((route) => route.id === formState.routeId),
    [collectionRoutes, formState.routeId]
  );

  const vehicleOptions = useMemo(() => {
    const optionMap = new Map();
    collectionRoutes.forEach((route) => {
      if (route.vehicleId) {
        optionMap.set(route.vehicleId, route.vehicleLabel || route.vehicleId);
      }
    });
    return Array.from(optionMap, ([value, label]) => ({ value, label }));
  }, [collectionRoutes]);

  const driverOptions = useMemo(() => {
    const optionMap = new Map();
    collectionRoutes.forEach((route) => {
      if (route.driverId) {
        optionMap.set(route.driverId, route.driverLabel || route.driverId);
      }
    });
    return Array.from(optionMap, ([value, label]) => ({ value, label }));
  }, [collectionRoutes]);

  useEffect(() => {
    const fetchCollectionRoutes = async () => {
      try {
        setRoutesLoading(true);
        setRoutesError("");
        const res = await getCollectionRoutes();
        const mapped = (res.data || []).map((route, index) => {
          const id = route.routeCode || route._id || `route-${index}`;
          return {
            id,
            name: route.name || route.routeCode || "Unnamed route",
            zone: route.zone || "",
            vehicleId: route.vehicle?.id || "",
            vehicleLabel: route.vehicle?.label || route.vehicle?.id || "",
            driverId: route.driver?.id || "",
            driverLabel: route.driver?.name || route.driver?.id || "",
            defaultBins: Array.isArray(route.defaultBins) ? route.defaultBins : [],
            timeWindows: Array.isArray(route.timeWindows)
              ? route.timeWindows.map((window, windowIndex) => ({
                  id: window.id || `${id}-window-${windowIndex}`,
                  label: window.label || "",
                  start: window.start,
                  end: window.end,
                }))
              : [],
          };
        });
        setCollectionRoutes(mapped);
      } catch (err) {
        const message = err.response?.data?.error || "Failed to load collection routes";
        setRoutesError(message);
        setCollectionRoutes([]);
      } finally {
        setRoutesLoading(false);
      }
    };

    fetchCollectionRoutes();
  }, []);

  const summarizeConflicts = (conflicts) => {
    return Array.from(
      conflicts.reduce((map, conflict) => {
        if (!conflict.reference?._id) {
          return map;
        }
        if (!map.has(conflict.reference._id)) {
          map.set(conflict.reference._id, {
            reference: conflict.reference,
            types: new Set(),
            messages: new Set(),
          });
        }
        const entry = map.get(conflict.reference._id);
        entry.types.add(conflict.type);
        entry.messages.add(conflict.message);
        return map;
      }, new Map()).values()
    ).map((entry) => ({
      reference: entry.reference,
      types: Array.from(entry.types),
      messages: Array.from(entry.messages),
    }));
  };

  const formatDateTimeForInput = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
  };

  const detectConflicts = (payload, options = {}) => {
    if (!Array.isArray(schedules)) return [];
    const { excludeId } = options;
    const payloadStart = new Date(payload.scheduledStart);
    const payloadEnd = new Date(payload.scheduledEnd);
    if (Number.isNaN(payloadStart.getTime()) || Number.isNaN(payloadEnd.getTime())) {
      return [];
    }

    return schedules.reduce((acc, existing) => {
      if (!existing) return acc;
      if (excludeId && existing._id === excludeId) {
        return acc;
      }

      const existingStart = new Date(existing.scheduledStart);
      const existingEnd = new Date(existing.scheduledEnd);
      if (Number.isNaN(existingStart.getTime()) || Number.isNaN(existingEnd.getTime())) {
        return acc;
      }

      const overlaps = payloadStart < existingEnd && payloadEnd > existingStart;
      if (!overlaps) {
        return acc;
      }

      const vehicleId = existing.assignedCrew?.vehicleId || existing.vehicleId;
      const driverId = existing.assignedCrew?.driverId || existing.driverId;

      if (vehicleId && payload.assignedCrew?.vehicleId && vehicleId === payload.assignedCrew.vehicleId) {
        acc.push({
          type: "Vehicle",
          message: `Vehicle ${vehicleId} is already scheduled from ${existingStart.toLocaleString()} to ${existingEnd.toLocaleString()}.`,
          reference: existing,
        });
      }

      if (driverId && payload.assignedCrew?.driverId && driverId === payload.assignedCrew.driverId) {
        acc.push({
          type: "Driver",
          message: `Driver ${driverId} is already scheduled from ${existingStart.toLocaleString()} to ${existingEnd.toLocaleString()}.`,
          reference: existing,
        });
      }

      if (
        payload.routeId &&
        existing.routeId &&
        existing.routeId === payload.routeId
      ) {
        acc.push({
          type: "Route",
          message: `Route ${existing.routeId} already has a schedule in this time window (${existingStart.toLocaleString()} - ${existingEnd.toLocaleString()}).`,
          reference: existing,
        });
      }

      if (!vehicleId && !driverId && !(payload.routeId && existing.routeId === payload.routeId)) {
        acc.push({
          type: "Time",
          message: `Another schedule overlaps with the selected time window (${existingStart.toLocaleString()} - ${existingEnd.toLocaleString()}).`,
          reference: existing,
        });
      }

      return acc;
    }, []);
  };

  const submitPayload = async (payload) => {
    try {
      setError("");
      const res = await createSchedule(payload);
      setSchedules((prev) => [res.data, ...prev]);
      resetForm();
      setShowModal(false);
      setConflictInfo(null);
      setPendingPayload(null);
      setSuccessMessage("Schedule added successfully.");
      navigate("/schedule-manager-Dash");
    } catch (err) {
      const message = err.response?.data?.error || err.message || "Failed to create schedule";
      setError(message);
    }
  };

  const statusTransitions = useMemo(
    () => ({
      PLANNED: [
        { label: "Start", next: "IN_PROGRESS" },
        { label: "Cancel", next: "CANCELLED" },
      ],
      IN_PROGRESS: [
        { label: "Complete", next: "COMPLETED" },
        { label: "Cancel", next: "CANCELLED" },
      ],
      COMPLETED: [],
      CANCELLED: [],
    }),
    []
  );

  const loadSchedules = useCallback(async () => {
    try {
      setError("");
      const activeFilters = filters.status ? { status: filters.status } : undefined;
      const res = await getSchedules(activeFilters);
      setSchedules(res.data);
    } catch (err) {
      console.error("Failed to load schedules:", err);
      setError(err.response?.data?.error || "Failed to load schedules");
    } finally {
      setLoading(false);
    }
  }, [filters.status]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timeout = setTimeout(() => {
      setSuccessMessage("");
    }, 4000);
    return () => clearTimeout(timeout);
  }, [successMessage]);

  const resetForm = () => {
    setFormState({ ...initialFormValues });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleVehicleSelect = (event) => {
    const { value } = event.target;
    setFormState((prev) => ({ ...prev, vehicleId: value }));
  };

  const handleDriverSelect = (event) => {
    const { value } = event.target;
    setFormState((prev) => ({ ...prev, driverId: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    const payload = {
      routeId: formState.routeId,
      zone: formState.zone,
      scheduledStart: formState.scheduledStart,
      scheduledEnd: formState.scheduledEnd,
      binIds: formState.binIds
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
      priority: formState.priority,
      notes: formState.notes,
      createdBy: formState.createdBy,
      assignedCrew: {
        driverId: formState.driverId || undefined,
        vehicleId: formState.vehicleId || undefined,
      },
    };

    if (editingSchedule) {
      handleUpdate(editingSchedule._id, payload);
      return;
    }

    const conflicts = detectConflicts(payload);
    if (conflicts.length > 0) {
      const conflictSummaries = conflicts.reduce((map, conflict) => {
        if (!conflict.reference?._id) return map;
        if (!map.has(conflict.reference._id)) {
          map.set(conflict.reference._id, {
            reference: conflict.reference,
            types: new Set(),
            messages: new Set(),
          });
        }
        const entry = map.get(conflict.reference._id);
        entry.types.add(conflict.type);
        entry.messages.add(conflict.message);
        return map;
      }, new Map());

      setConflictInfo({
        conflicts,
        grouped: Array.from(conflictSummaries.values()).map((entry) => ({
          reference: entry.reference,
          types: Array.from(entry.types),
          messages: Array.from(entry.messages),
        })),
      });
      setPendingPayload(payload);
      return;
    }

    submitPayload(payload);
  };

  const handleOverrideCreate = () => {
    if (!pendingPayload) return;
    submitPayload(pendingPayload);
  };

  const handleDismissConflict = () => {
    setConflictInfo(null);
    setPendingPayload(null);
    setPendingUpdate(null);
  };

  const handleNavigateToSchedule = (scheduleId) => {
    if (!scheduleId) return;
    const element = document.getElementById(`schedule-${scheduleId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("ring", "ring-amber-400", "ring-offset-2");
      setTimeout(() => {
        element.classList.remove("ring", "ring-amber-400", "ring-offset-2");
      }, 2500);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setConflictInfo(null);
    setPendingPayload(null);
    setPendingUpdate(null);
    setEditingSchedule(null);
    resetForm();
  };

  const executeUpdate = async (id, updates) => {
    try {
      setError("");
      const res = await updateSchedule(id, updates);
      setSchedules((prev) => prev.map((item) => (item._id === id ? res.data : item)));
      setConflictInfo(null);
      setPendingUpdate(null);
      setEditingSchedule(null);
      setSuccessMessage("Schedule updated successfully.");
      handleCloseModal();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update schedule");
    }
  };

  const handleUpdate = async (id, updates) => {
    const current = schedules.find((schedule) => schedule._id === id);
    if (!current) {
      setError("Schedule not found for update");
      return;
    }

    const payload = {
      routeId: updates.routeId || current.routeId,
      scheduledStart: updates.scheduledStart || current.scheduledStart,
      scheduledEnd: updates.scheduledEnd || current.scheduledEnd,
      assignedCrew: {
        driverId: updates.assignedCrew?.driverId || current.assignedCrew?.driverId || current.driverId,
        vehicleId: updates.assignedCrew?.vehicleId || current.assignedCrew?.vehicleId || current.vehicleId,
      },
    };

    const conflicts = detectConflicts(payload, { excludeId: id });
    if (conflicts.length > 0) {
      setConflictInfo({
        conflicts,
        grouped: summarizeConflicts(conflicts),
      });
      setPendingUpdate({ id, updates });
      return;
    }

    executeUpdate(id, updates);
  };

  const handleOverrideUpdate = () => {
    if (!pendingUpdate) return;
    executeUpdate(pendingUpdate.id, pendingUpdate.updates);
  };

  const handleOpenCreateModal = () => {
    setEditingSchedule(null);
    setPendingUpdate(null);
    setPendingPayload(null);
    setConflictInfo(null);
    setFormState({ ...initialFormValues });
    setShowModal(true);
  };

  const handleEditSchedule = (schedule) => {
    if (!schedule) return;
    setEditingSchedule(schedule);
    setPendingPayload(null);
    setPendingUpdate(null);
    setConflictInfo(null);
    setFormState({
      routeId: schedule.routeId || "",
      zone: schedule.zone || "",
      scheduledStart: formatDateTimeForInput(schedule.scheduledStart),
      scheduledEnd: formatDateTimeForInput(schedule.scheduledEnd),
      binIds: Array.isArray(schedule.binIds) ? schedule.binIds.join(", ") : "",
      createdBy: schedule.createdBy || "",
      vehicleId: schedule.assignedCrew?.vehicleId || schedule.vehicleId || "",
      driverId: schedule.assignedCrew?.driverId || schedule.driverId || "",
      priority: schedule.priority || "MEDIUM",
      notes: schedule.notes || "",
    });
    setShowModal(true);
  };

  const handleStatusChange = async (schedule, nextStatus) => {
    try {
      setError("");
      const res = await changeScheduleStatus(schedule._id, nextStatus);
      setSchedules((prev) => prev.map((item) => (item._id === schedule._id ? res.data : item)));
      setSuccessMessage(`Schedule status changed to ${nextStatus}`);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this schedule?")) {
      return;
    }
    try {
      setError("");
      await deleteSchedule(id);
      setSchedules((prev) => prev.filter((item) => item._id !== id));
      setSuccessMessage("Schedule deleted successfully.");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete schedule");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-3xl font-semibold text-slate-900">Waste Collection Schedule Manager</h2>
      <button
        className="inline-flex items-center gap-2 self-start rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
        onClick={handleOpenCreateModal}
      >
        Create New Schedule
      </button>
      <div className="flex w-full flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="text-base font-semibold text-slate-900">Filters</h3>
        <select
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          value={filters.status}
          onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
        >
          <option value="">All Statuses</option>
          <option value="PLANNED">Planned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <button
          type="button"
          onClick={loadSchedules}
          className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
        >
          Refresh
        </button>
      </div>
      {error && (
        <p className="max-w-2xl rounded-lg border border-red-200 bg-red-100 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {successMessage && (
        <p className="max-w-2xl rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          {successMessage}
        </p>
      )}
      {loading ? (
        <p className="text-sm text-slate-600">Loading...</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {schedules.map((s) => {
            const routeDetails = collectionRoutes.find((route) => route.id === s.routeId);
            const driverId = s.assignedCrew?.driverId || s.driverId || "-";
            const driverName = routeDetails?.driverLabel;
            const vehicleId = s.assignedCrew?.vehicleId || s.vehicleId || "-";
            const vehicleName = routeDetails?.vehicleLabel;
            const supervisorId = s.assignedCrew?.supervisorId;
            const createdBy = s.createdBy || "-";
            const lastValidated = s.lastValidatedAt ? new Date(s.lastValidatedAt).toLocaleString() : "-";
            const notes = s.notes || "-";

            return (
              <li key={s._id} id={`schedule-${s._id}`}>
                <div className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-6">
                  <div className="space-y-1 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">Route & Zone</p>
                    <p>
                      <span className="font-medium">Route:</span> {s.routeId}
                    </p>
                    <p>
                      <span className="font-medium">Zone:</span> {s.zone || routeDetails?.zone || "-"}
                    </p>
                  </div>
                  <div className="space-y-1 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">Time Window</p>
                    <p>{new Date(s.scheduledStart).toLocaleString()}</p>
                    <p>{new Date(s.scheduledEnd).toLocaleString()}</p>
                  </div>
                  <div className="space-y-1 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">Status & Priority</p>
                    <p>
                      <span className="font-medium">Status:</span> {s.status}
                    </p>
                    <p>
                      <span className="font-medium">Priority:</span> {s.priority}
                    </p>
                  </div>
                  <div className="space-y-1 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">Bins</p>
                    <p>{Array.isArray(s.binIds) ? s.binIds.join(", ") : "-"}</p>
                  </div>
                  <div className="space-y-1 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">Assigned Crew</p>
                    <p>
                      <span className="font-medium">Driver:</span> {driverName ? `${driverName} (${driverId})` : driverId}
                    </p>
                    <p>
                      <span className="font-medium">Vehicle:</span> {vehicleName ? `${vehicleName} (${vehicleId})` : vehicleId}
                    </p>
                    {supervisorId && (
                      <p>
                        <span className="font-medium">Supervisor:</span> {supervisorId}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">Additional Details</p>
                    <p>
                      <span className="font-medium">Created By:</span> {createdBy}
                    </p>
                    <p>
                      <span className="font-medium">Validated:</span> {lastValidated}
                    </p>
                    <p>
                      <span className="font-medium">Notes:</span> {notes}
                    </p>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-6 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditSchedule(s)}
                      className="rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-500 hover:text-white"
                    >
                      Edit
                    </button>
                    {statusTransitions[s.status]?.map((transition) => (
                      <button
                        key={transition.next}
                        type="button"
                        onClick={() => handleStatusChange(s, transition.next)}
                        className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-emerald-500 hover:text-white"
                      >
                        {transition.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleDelete(s._id)}
                      className="rounded-full bg-red-100 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-500 hover:text-white"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 sm:p-8">
          <div className="flex w-full max-w-3xl flex-col rounded-3xl bg-white shadow-2xl max-h-[90vh]">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-5">
              <h3 className="text-2xl font-semibold text-slate-900">{editingSchedule ? "Edit Schedule" : "Create New Schedule"}</h3>
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid flex-1 gap-5 overflow-y-auto px-6 py-6 sm:grid-cols-2">
              {routesError && (
                <div className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {routesError}
                </div>
              )}
              {conflictInfo && (
                <div className="sm:col-span-2 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-700">
                  <p className="font-semibold text-amber-900">Schedule conflict detected</p>
                  <ul className="mt-3 space-y-3">
                    {conflictInfo.grouped?.map((group, index) => (
                      <li key={group.reference?._id || index} className="rounded-lg border border-amber-200 bg-white p-3 text-amber-900">
                        <div className="font-semibold">Existing schedule: {group.reference.routeId}</div>
                        <div className="text-xs text-amber-700">
                          {new Date(group.reference.scheduledStart).toLocaleString()} - {new Date(group.reference.scheduledEnd).toLocaleString()}
                        </div>
                        <div className="mt-2 text-xs font-medium uppercase tracking-wide text-amber-600">
                          Conflicts: {group.types.join(", ")}
                        </div>
                        <ul className="mt-2 space-y-1 text-xs text-amber-800">
                          {group.messages.map((message) => (
                            <li key={message}>{message}</li>
                          ))}
                        </ul>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleNavigateToSchedule(group.reference._id)}
                            className="rounded-full border border-amber-400 px-3 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                          >
                            View schedule
                          </button>
                          {!editingSchedule && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleDelete(group.reference._id)}
                                className="rounded-full border border-red-300 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                              >
                                Delete existing
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(group.reference, "CANCELLED")}
                                className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                              >
                                Mark as cancelled
                              </button>
                            </>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleDismissConflict}
                      className="rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300"
                    >
                      Modify schedule
                    </button>
                    {editingSchedule ? (
                      <button
                        type="button"
                        onClick={handleOverrideUpdate}
                        className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
                      >
                        Update anyway
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleOverrideCreate}
                        className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
                      >
                        Create anyway
                      </button>
                    )}
                  </div>
                </div>
              )}
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Route
                <select
                  name="routeId"
                  value={formState.routeId}
                  onChange={(e) => {
                    const selected = collectionRoutes.find((r) => r.id === e.target.value);
                    setFormState((prev) => ({
                      ...prev,
                      routeId: selected?.id || "",
                      zone: selected?.zone || "",
                      vehicleId: selected?.vehicleId || "",
                      driverId: selected?.driverId || "",
                      binIds: Array.isArray(selected?.defaultBins) ? selected.defaultBins.join(",") : "",
                      scheduledStart: selected?.timeWindows?.[0]?.start || "",
                      scheduledEnd: selected?.timeWindows?.[0]?.end || "",
                    }));
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  disabled={routesLoading || collectionRoutes.length === 0}
                  required
                >
                  <option value="">{routesLoading ? "Loading routes..." : "Select route"}</option>
                  {collectionRoutes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Zone
                <input
                  name="zone"
                  type="text"
                  value={formState.zone}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                  readOnly
                  disabled={!currentRoute}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Vehicle ID
                <select
                  name="vehicleId"
                  value={formState.vehicleId}
                  onChange={handleVehicleSelect}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  disabled={vehicleOptions.length === 0}
                  required
                >
                  <option value="" disabled>
                    {vehicleOptions.length === 0 ? "No vehicles found" : "Select vehicle"}
                  </option>
                  {vehicleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Driver
                <select
                  name="driverId"
                  value={formState.driverId}
                  onChange={handleDriverSelect}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  disabled={driverOptions.length === 0}
                  required
                >
                  <option value="" disabled>
                    {driverOptions.length === 0 ? "No drivers found" : "Select driver"}
                  </option>
                  {driverOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Start Time
                <input
                  type="datetime-local"
                  name="scheduledStart"
                  value={formState.scheduledStart}
                  onChange={handleFormChange}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  min={minDateTime}
                  required
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                End Time
                <input
                  type="datetime-local"
                  name="scheduledEnd"
                  value={formState.scheduledEnd}
                  onChange={handleFormChange}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  min={formState.scheduledStart || minDateTime}
                  required
                />
              </label>
              {currentRoute?.timeWindows?.length > 0 && (
                <div className="sm:col-span-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-xs text-slate-600">
                  <p className="font-semibold text-slate-700">Suggested windows</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {currentRoute.timeWindows.map((window) => {
                      const label = window.label
                        ? `${window.label} — ${new Date(window.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                        : `${new Date(window.start).toLocaleString()} - ${new Date(window.end).toLocaleString()}`;
                      return (
                        <button
                          key={`${window.id}-suggestion`}
                          type="button"
                          onClick={() =>
                            setFormState((prev) => ({
                              ...prev,
                              scheduledStart: window.start?.slice(0, 16) || prev.scheduledStart,
                              scheduledEnd: window.end?.slice(0, 16) || prev.scheduledEnd,
                            }))
                          }
                          className="rounded-full border border-emerald-300 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Bin IDs
                <input
                  name="binIds"
                  type="text"
                  value={formState.binIds}
                  onChange={handleFormChange}
                  placeholder="Separate with commas"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Created By
                <input
                  name="createdBy"
                  type="text"
                  value={formState.createdBy}
                  onChange={handleFormChange}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                Priority
                <select
                  name="priority"
                  value={formState.priority}
                  onChange={handleFormChange}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="LOW">Low Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="HIGH">High Priority</option>
                </select>
              </label>
              <label className="sm:col-span-2 flex flex-col gap-2 text-sm font-medium text-slate-600">
                Notes
                <textarea
                  name="notes"
                  value={formState.notes}
                  onChange={handleFormChange}
                  className="min-h-[110px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </label>
              <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (editingSchedule) {
                      handleEditSchedule(editingSchedule);
                    } else {
                      resetForm();
                    }
                  }}
                  className="rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300"
                >
                  {editingSchedule ? "Reset changes" : "Reset"}
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
                >
                  {editingSchedule ? "Save Changes" : "Save Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleManager;