// src/App.jsx
import React from "react";
import { NotificationProvider } from "./contexts/NotificationContext";
import WasteSubmissionForm from "./pages/WasteSubmission/WasteSubmissionForm";
import WasteSubmissionList from "./pages/WasteSubmission/WasteSubmissionList";

export default function App() {
  return (
    <NotificationProvider>
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <WasteSubmissionForm />
          <WasteSubmissionList />
        </div>
      </div>
    </NotificationProvider>
  );
}
