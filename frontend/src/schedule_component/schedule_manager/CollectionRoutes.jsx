// CollectionRoutes.jsx
// SRP: Displays map & routes only
// Refactoring: extracted repeated markup into reusable structure

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { AlertTriangle, Bell, ChevronLeft, ChevronRight } from "lucide-react";
import L from "leaflet";
import { getCollectionRoutes } from "./../api/CollectionRouteApi";
import CollectionRouteForm from "./CollectionRouteForm";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function CollectionRoutes() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const mapCenter = useMemo(() => {
    if (routes.length > 0 && routes[0].coordinates) {
      return routes[0].coordinates;
    }
    return { lat: 6.9271, lng: 79.8612 };
  }, [routes]);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routesListRef = useRef(null);

  const formatTimeWindows = (timeWindows) => {
    if (!Array.isArray(timeWindows) || timeWindows.length === 0) {
      return "";
    }
    return timeWindows
      .map((window) => {
        if (window.label) {
          return window.label;
        }
        const start = window.start ? new Date(window.start).toLocaleString("en-LK") : "";
        const end = window.end ? new Date(window.end).toLocaleString("en-LK") : "";
        return [start, end].filter(Boolean).join(" - ");
      })
      .join(" | ");
  };

  const loadRoutes = useCallback(async () => {
    try {
      setError("");
      const response = await getCollectionRoutes();
      const mappedRoutes = (response.data || []).map((route, index) => {
        const scheduleText = route.scheduleSummary || formatTimeWindows(route.timeWindows) || "Schedule not set";
        const coverageText = route.coverage || route.zone || "Coverage not set";
        const driverName = route.driver?.name || route.driver?.id || "Unassigned";
        const vehicleLabel = route.vehicle?.label || route.vehicle?.id || "Vehicle not set";
        const coordinates = route.coordinates && typeof route.coordinates.lat === "number" && typeof route.coordinates.lng === "number"
          ? route.coordinates
          : { lat: 6.9271, lng: 79.8612 };
        const alerts = Array.isArray(route.alerts)
          ? route.alerts.map((alert, alertIndex) => ({
              id: alert.alertCode || `${route._id || route.routeCode || "route"}-alert-${alertIndex}`,
              type: alert.type || "ALERT",
              severity: alert.severity || "LOW",
              message: alert.message || "",
              reportedAt: alert.reportedAt || new Date().toISOString(),
            }))
          : [];

        return {
          id: route._id || route.routeCode || index,
          name: route.name || route.routeCode || "Unnamed route",
          vehicle: vehicleLabel,
          schedule: scheduleText,
          coverage: coverageText,
          driver: driverName,
          coordinates,
          alerts,
        };
      });
      setRoutes(mappedRoutes);
    } catch (err) {
      const message = err.response?.data?.error || "Failed to load collection routes";
      setError(message);
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const scrollRoutes = useCallback((direction) => {
    if (!routesListRef.current) return;
    routesListRef.current.scrollBy({
      left: direction === "left" ? -320 : 320,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    const fetchRoutes = async () => {
      setLoading(true);
      await loadRoutes();
    };

    fetchRoutes();
  }, [loadRoutes]);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([mapCenter.lat, mapCenter.lng], 7);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapInstanceRef.current);
    } else {
      mapInstanceRef.current.setView([mapCenter.lat, mapCenter.lng], 7);
    }

    const markerLayer = L.layerGroup().addTo(mapInstanceRef.current);
    routes.forEach((route) => {
      if (!route.coordinates) {
        return;
      }
      const marker = L.marker([route.coordinates.lat, route.coordinates.lng], { icon: markerIcon });
      marker.bindPopup(
        `<strong>${route.name}</strong><br/>${route.schedule}<br/>${route.coverage}`
      );
      marker.addTo(markerLayer);
    });

    return () => {
      markerLayer.clearLayers();
      mapInstanceRef.current?.removeLayer(markerLayer);
    };
  }, [mapCenter.lat, mapCenter.lng, routes]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Collection Routes</h2>

      <div className="rounded-lg overflow-hidden h-64 mb-6 border border-gray-200" ref={mapRef} />

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading collection routes...</p>
      ) : routes.length === 0 ? (
        <p className="text-sm text-gray-500">No collection routes found.</p>
      ) : (
        <div ref={routesListRef} className="flex gap-4 overflow-x-auto pb-2">
          {routes.map((r) => (
            <div key={r.id} className="border border-gray-200 rounded-lg p-5 min-w-[320px]">
              <h3 className="font-semibold text-gray-800 mb-4">{r.name}</h3>
              <div className="space-y-3 text-sm">
                <div className="flex">
                  <span className="text-gray-600 w-28">Vehicle:</span>
                  <span className="text-gray-800 font-medium">{r.vehicle}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-28">Schedule:</span>
                  <span className="text-gray-800 font-medium">{r.schedule}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-28">Coverage:</span>
                  <span className="text-gray-800 font-medium">{r.coverage}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-600 w-28">Driver:</span>
                  <span className="text-gray-800 font-medium">{r.driver}</span>
                </div>
              </div>
              <div className="mt-4 bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
                  <Bell size={16} className="text-emerald-600" /> IoT Alerts
                </div>
                {r.alerts.length === 0 ? (
                  <p className="text-xs text-gray-500">No active alerts.</p>
                ) : (
                  <ul className="space-y-2">
                    {r.alerts.map((alert) => (
                      <li key={alert.id} className="bg-white border border-gray-200 rounded-md p-3 text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-gray-700">{alert.type}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              alert.severity === "HIGH"
                                ? "bg-red-100 text-red-700"
                                : alert.severity === "MEDIUM"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {alert.severity}
                          </span>
                        </div>
                        <div className="flex items-start gap-2 text-gray-600">
                          <AlertTriangle size={14} className="mt-0.5" />
                          <div>
                            <p className="font-medium">{alert.message}</p>
                            <p className="text-gray-400 mt-1">
                              Reported: {new Date(alert.reportedAt).toLocaleString("en-LK")}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <button
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          type="button"
          onClick={() => scrollRoutes("left")}
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <button
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          type="button"
          onClick={() => scrollRoutes("right")}
        >
          <ChevronRight size={20} className="text-gray-600" />
        </button>
      </div>

      <div className="mt-10">
        <CollectionRouteForm onCreated={loadRoutes} />
      </div>
    </div>
  );
}
