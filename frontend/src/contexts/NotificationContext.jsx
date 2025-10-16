// src/contexts/NotificationContext.jsx
import React, { createContext, useContext, useState, useCallback } from "react";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [messages, setMessages] = useState([]);

  const push = useCallback((msg) => {
    const id = Date.now().toString();
    setMessages((m) => [...m, { id, ...msg }]);
    // auto remove in 4s
    setTimeout(() => setMessages((m) => m.filter(x => x.id !== id)), 4000);
  }, []);

  const value = { push };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 space-y-2 z-50">
        {messages.map(m => (
          <div key={m.id} className="bg-white shadow-md p-3 rounded-lg border">
            <div className="font-semibold">{m.title || "Notification"}</div>
            <div className="text-sm">{m.message}</div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export const useNotification = () => useContext(NotificationContext);
