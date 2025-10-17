import React from "react";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import { NotificationProvider } from "./contexts/NotificationContext";
import AppLayout from "./components/layout/AppLayout";
import WasteSubmissionForm from "./components/WasteSubmission/WasteSubmissionForm/WasteSubmissionForm";
import WasteSubmissionList from "./components/WasteSubmission/WasteSubmissionList/WasteSubmissionList";


const ServiceUserLayout = () => (
  <div className="App">
  <NotificationProvider>
    <AppLayout >
      <React.Fragment>
        <Routes>
          <Route path="/b" element={<div>Dashboard</div>} />
          <Route path="/" element={<WasteSubmissionForm />} />
          <Route path="/recyclable" element={<div>Recyclable Page</div>} />
          <Route path="/history" element={<WasteSubmissionList />} />
        </Routes>
      </React.Fragment>
    </AppLayout >
    </NotificationProvider>
  </div>
);

export default function App() {
  return (
    <div>
      <BrowserRouter>
      <Routes>
       <Route path="/*" element={<ServiceUserLayout />} />
       </Routes>
       </BrowserRouter>
    </div>
  );
}
