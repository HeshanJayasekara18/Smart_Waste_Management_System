// Header.jsx
// SRP: Responsible for top navigation bar only
// Code smell fix: no logic duplication between pages

import React, { useEffect, useRef, useState } from "react";
import { Bell, Loader2, Mail } from "lucide-react";
import { getAlerts } from "../api/NotificationApi";

const severityColors = {
  HIGH: "border-red-500 text-red-700",
  MEDIUM: "border-yellow-400 text-yellow-700",
  LOW: "border-blue-400 text-blue-700",
};

export default function Header() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getAlerts();
        setAlerts(response.data ?? []);
      } catch (err) {
        console.error("Failed to load alerts", err);
        setError("Unable to fetch IoT alerts");
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const activeCount = alerts.filter((alert) => !alert.acknowledged).length;
  const hasAlerts = alerts.length > 0;

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
            JD
          </div>
          <span className="font-semibold text-gray-800">John Doe</span>
        </div>
        <div className="flex items-center space-x-4">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Inbox">
            <Mail size={20} className="text-gray-600" />
          </button>
          <div className="relative" ref={popoverRef}>
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
              aria-label="IoT notifications"
              onClick={() => setIsOpen((prev) => !prev)}
            >
              <Bell size={20} className="text-gray-600" />
              {hasAlerts && (
                <span className="absolute top-1 right-1 min-w-[1rem] h-4 rounded-full bg-red-500 text-white text-[10px] leading-4 px-1 text-center">
                  {activeCount > 9 ? "9+" : activeCount}
                </span>
              )}
            </button>

            {isOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-20">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">IoT Sensor Alerts</p>
                    <p className="text-xs text-gray-500">
                      {loading && "Checking sensors..."}
                      {!loading && !error && `${activeCount} active • ${alerts.length} total`}
                      {error && error}
                    </p>
                  </div>
                  {loading && <Loader2 size={16} className="animate-spin text-gray-400" />}
                </div>

                <div className="max-h-64 overflow-y-auto">
                  {!loading && !error && alerts.length === 0 && (
                    <p className="text-sm text-gray-500 px-4 py-6 text-center">
                      All sensors are operating normally.
                    </p>
                  )}

                  {!loading && !error && alerts.length > 0 && (
                    <ul className="divide-y divide-gray-100">
                      {alerts.map((alert) => {
                        const severity = severityColors[alert.severity] ?? severityColors.MEDIUM;
                        return (
                          <li key={alert.id} className="px-4 py-3">
                            <div className={`border-l-4 pl-3 ${severity}`}>
                              <p className="text-sm font-semibold">
                                {alert.type.replace(/_/g, " ")} • Route {alert.routeCode}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
                              <p className="text-[11px] text-gray-400 mt-1">
                                Triggered {new Date(alert.triggeredAt).toLocaleString()}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {!loading && error && (
                    <p className="text-sm text-red-500 px-4 py-6 text-center">{error}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
