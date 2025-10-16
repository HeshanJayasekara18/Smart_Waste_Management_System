import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, Clock, Trash2, Recycle, LayoutDashboard } from "lucide-react";

export default function Sidebar() {
  const navigate = useNavigate();

  const navItems = [
    { label: "Dashboard", icon: <LayoutDashboard size={18} />, path: "/h" },
    { label: "Special Waste Request", icon: <Trash2 size={18} />, path: "/" },
    { label: "Recyclable Submission", icon: <Recycle size={18} />, path: "/recyclable" },
    { label: "History", icon: <Clock size={18} />, path: "/history" },
  ];

  return (
    <aside className="w-64 bg-white shadow-lg flex flex-col justify-between h-screen">
      <div>
        <div className="flex items-center gap-2 p-4 border-b">
          <img src="/src/assets/logo.png" alt="Logo" className="w-10 h-10" />
          <h2 className="text-lg font-semibold text-green-700">TrashTrack</h2>
        </div>

        <nav className="mt-6 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2 px-5 py-3 text-sm rounded-full mx-3 ${
                  isActive
                    ? "bg-green-700 text-white font-medium"
                    : "text-gray-700 hover:bg-green-100"
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t">
        <button
          onClick={() => navigate("/login")}
          className="flex items-center justify-center w-full gap-2 text-gray-700 border rounded-full py-2 hover:bg-red-100 hover:text-red-600"
        >
          <LogOut size={18} />
          Log Out
        </button>
      </div>
    </aside>
  );
}
