// 🧱 ScheduleManagerDash.jsx
// --- Follows SOLID Principles ---
// SRP: Controls layout only (Sidebar + Header + Main sections)
// Open/Closed: Easily add new sections without editing core layout.

import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Filters from "./Filters";
import AlertBanner from "./AlertBanner";
import ScheduleOverview from "./ScheduleOverview";
import SystemStatus from "./SystemStatus";
import QuickActions from "./QuickActions";
import CollectionRoutes from "./CollectionRoutes";
import ScheduleManager from "./ScheduleManager";

export default function ScheduleManagerDash() {
  const [activeRoute, setActiveRoute] = useState("Dashboard");

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeRoute={activeRoute} setActiveRoute={setActiveRoute} />
      <div className="flex-1 overflow-auto">
        <Header />
        <main className="p-8">
          {activeRoute === "Dashboard" && (
            <>
              <Filters />
              <AlertBanner />
              <div className="grid grid-cols-3 gap-6 mb-8">
                <ScheduleOverview />
                <div className="space-y-6">
                  <SystemStatus />
                  <QuickActions />
                </div>
              </div>
              <CollectionRoutes />
            </>
          )}

          {activeRoute === "Schedules" && (
            <div className="space-y-6">
              <ScheduleManager />
            </div>
          )}

          {activeRoute === "Routes" && (
            <div className="space-y-6">
              <CollectionRoutes />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
