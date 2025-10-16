import React from "react";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import WasteSubmissionForm from "./components/WasteSubmission/WasteSubmissionForm";
import WasteSubmissionList from "./components/WasteSubmission/WasteSubmissionList";

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/b" element={<div>Dashboard</div>} />
          <Route path="/" element={<WasteSubmissionForm />} />
          <Route path="/recyclable" element={<div>Recyclable Page</div>} />
          <Route path="/history" element={<WasteSubmissionList />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
