import React from "react";
import { Bell, Mail } from "lucide-react";

export default function Header({ user }) {
  return (
    <header className="flex justify-between items-center bg-white shadow px-6 py-3">
      <div className="flex items-center gap-3">
        <img
          src={user?.avatar || "https://via.placeholder.com/40"}
          alt="User"
          className="w-10 h-10 rounded-full"
        />
        <h2 className="text-lg font-semibold text-blue-700">{user?.name || "User"}</h2>
      </div>

      <div className="flex items-center gap-4 text-gray-700">
        <button className="hover:text-blue-600">
          <Mail size={22} />
        </button>
        <button className="hover:text-blue-600">
          <Bell size={22} />
        </button>
      </div>
    </header>
  );
}
