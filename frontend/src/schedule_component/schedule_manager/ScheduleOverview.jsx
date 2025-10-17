import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Calendar } from "lucide-react";
import { getSchedules } from "./../api/ScheduleApi";

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const statusStyles = {
  PLANNED: "bg-sky-100 text-sky-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-rose-100 text-rose-700",
  DEFAULT: "bg-slate-100 text-slate-600",
};

const formatIsoDay = (date) => date.toISOString().slice(0, 10);

export default function ScheduleOverview() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [viewDate, setViewDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await getSchedules();
        setSchedules(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        const message = err.response?.data?.error || "Unable to load schedules";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, []);

  const monthMeta = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
    const daysInMonth = end.getDate();
    const leadingEmpty = start.getDay();
    const totalCells = Math.ceil((leadingEmpty + daysInMonth) / 7) * 7;

    const cells = Array.from({ length: totalCells }, (_, index) => {
      const offset = index - leadingEmpty + 1;
      const cellDate = new Date(year, month, offset);
      return {
        date: cellDate,
        inCurrentMonth: offset >= 1 && offset <= daysInMonth,
      };
    });

    const weeks = Array.from({ length: totalCells / 7 }, (_, weekIndex) =>
      cells.slice(weekIndex * 7, weekIndex * 7 + 7)
    );

    return {
      year,
      month,
      label: start.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
      start,
      end,
      weeks,
    };
  }, [viewDate]);

  const monthlySchedules = useMemo(() => {
    return schedules.filter((schedule) => {
      if (!schedule?.scheduledStart) {
        return false;
      }
      const start = new Date(schedule.scheduledStart);
      return start >= monthMeta.start && start <= monthMeta.end;
    });
  }, [schedules, monthMeta.start, monthMeta.end]);

  const schedulesByDay = useMemo(() => {
    return monthlySchedules.reduce((acc, schedule) => {
      const key = formatIsoDay(new Date(schedule.scheduledStart));
      if (!acc.has(key)) {
        acc.set(key, []);
      }
      acc.get(key).push(schedule);
      return acc;
    }, new Map());
  }, [monthlySchedules]);

  const statusBreakdown = useMemo(() => {
    return monthlySchedules.reduce(
      (acc, schedule) => {
        const status = schedule.status || "UNKNOWN";
        acc[status] = (acc[status] || 0) + 1;
        acc.total += 1;
        return acc;
      },
      { total: 0 }
    );
  }, [monthlySchedules]);

  const todayKey = formatIsoDay(new Date());

  const navigateMonth = (direction) => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
  };

  return (
    <div className="col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Collection Schedule Overview</h2>
          <p className="text-sm text-gray-500">Visualize assigned routes and crews across the month.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigateMonth(-1)}
            className="rounded-full border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-100"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="px-3 py-1 text-sm font-semibold text-gray-700 bg-gray-100 rounded-full">
            {monthMeta.label}
          </div>
          <button
            type="button"
            onClick={() => navigateMonth(1)}
            className="rounded-full border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-100"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-7 gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {weekdayLabels.map((day) => (
              <div key={day} className="text-center">
                {day}
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-2 text-xs">
            {monthMeta.weeks.flat().map((cell, index) => {
              const key = formatIsoDay(cell.date);
              const daySchedules = schedulesByDay.get(key) || [];
              const isToday = key === todayKey;
              const isCurrentMonth = cell.inCurrentMonth;
              const badgeClass = isCurrentMonth
                ? isToday
                  ? "border-emerald-500"
                  : "border-transparent"
                : "border-dashed border-gray-200 bg-white/60";

              return (
                <div
                  key={`${key}-${index}`}
                  className={`min-h-[92px] rounded-lg border bg-white p-2 transition ${
                    isCurrentMonth ? "text-gray-700" : "text-gray-400"
                  } ${badgeClass}`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold">{cell.date.getDate()}</span>
                    {daySchedules.length > 0 && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        {daySchedules.length}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 space-y-1">
                    {daySchedules.slice(0, 2).map((schedule) => {
                      const status = schedule.status || "DEFAULT";
                      const badge = statusStyles[status] || statusStyles.DEFAULT;
                      const routeLabel = schedule.routeId || schedule.routeCode || "Route";
                      const startTime = schedule.scheduledStart
                        ? new Date(schedule.scheduledStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : "--";
                      const driver = schedule.assignedCrew?.driverId || schedule.driverId || "";

                      return (
                        <div key={schedule._id} className="rounded-lg bg-white px-2 py-1 shadow-sm ring-1 ring-gray-100">
                          <div className="flex items-center justify-between text-[10px] font-semibold">
                            <span>{routeLabel}</span>
                            <span className={`rounded-full px-2 py-0.5 ${badge}`}>{status}</span>
                          </div>
                          <div className="mt-1 text-[11px] text-gray-500">
                            <span>{startTime}</span>
                            {driver && <span className="ml-2">• {driver}</span>}
                          </div>
                        </div>
                      );
                    })}
                    {daySchedules.length > 2 && (
                      <div className="text-[10px] font-medium text-gray-500">+{daySchedules.length - 2} more…</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {loading && (
            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-gray-500">
              <Calendar size={16} className="animate-spin" />
              Loading schedules…
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700">Monthly Snapshot</h3>
            <div className="mt-3 space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Total schedules</span>
                <span className="font-semibold text-gray-800">{statusBreakdown.total || 0}</span>
              </div>
              {Object.entries(statusBreakdown)
                .filter(([status]) => status !== "total")
                .map(([status, count]) => {
                  const badge = statusStyles[status] || statusStyles.DEFAULT;
                  return (
                    <div key={status} className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge}`}>{status}</span>
                      </span>
                      <span className="font-semibold text-gray-800">{count}</span>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <h3 className="text-sm font-semibold text-emerald-900">Usage tips</h3>
            <ul className="mt-2 space-y-1 text-xs">
              <li>• Navigate months to forecast crew demand.</li>
              <li>• Hover over schedule cards for route status and timing.</li>
              <li>• Use schedule manager modal to adjust overlapping entries.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
