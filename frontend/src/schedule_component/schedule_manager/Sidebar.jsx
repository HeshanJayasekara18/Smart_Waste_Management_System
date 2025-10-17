// Sidebar.jsx
// SRP: Handles only sidebar logic
// Refactoring: extracted from main component to reduce clutter
// Code smell removed: repeated button structure simplified

import React from "react";
import { TrendingUp, Calendar, MapPin, Settings, Users, HelpCircle, LogOut } from "lucide-react";
import menuItems from "./menuConfig";

export default function Sidebar({ activeRoute, setActiveRoute }) {
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
            <div className="text-white text-xl">🗑️</div>
          </div>
          <div>
            <div className="font-bold text-gray-800">TrashTrack</div>
            <div className="text-xs text-gray-500">Smart Waste Management</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item, idx) => (
          <button
            key={idx}
            onClick={() => setActiveRoute(item.label)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              item.label === activeRoute
                ? "bg-green-600 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <item.icon size={20} />
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
          <LogOut size={20} />
          <span className="text-sm font-medium">Log Out</span>
        </button>
      </div>
    </div>
  );
}
