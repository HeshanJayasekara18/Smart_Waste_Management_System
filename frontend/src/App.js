// App.js
// Clean, maintainable entry point following SOLID principles.
// SRP: App only controls high-level routing/layout imports.

import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import ScheduleManagerDash from "./schedule_component/schedule_manager/ScheduleManagerDash";
import CollectionRoutesform from "./schedule_component/schedule_manager/CollectionRouteForm";
import React from "react";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import { NotificationProvider } from "./contexts/NotificationContext";
import AppLayout from "./components/layout/AppLayout";
import WasteSubmissionForm from "./components/WasteSubmission/WasteSubmissionForm/WasteSubmissionForm";
import WasteSubmissionList from "./components/WasteSubmission/WasteSubmissionList/WasteSubmissionList";
import MunicipalDashboard from './components/MunicipalAuthority/MunicipalDashboard';


// Payment pages
import PaymentDashboard from './components/Payment/PaymentDashboard';
import PaymentMethodSelection from './components/Payment/PaymentMethodSelection';
import PaymentCardForm from './components/Payment/PaymentCardForm';
import PaymentOtpPage from './components/Payment/PaymentOtpPage';
import PaymentSuccessPage from './components/Payment/PaymentSuccessPage';
import PaymentOfflinePage from './components/Payment/PaymentOfflinePage';
import PaymentOfflinePendingPage from './components/Payment/PaymentOfflinePendingPage';
import PaymentHistoryPage from './components/Payment/PaymentHistoryPage';
import { PaymentProvider } from './components/Payment/PaymentContext';

// Waste submission / notifications
import { NotificationProvider } from './contexts/NotificationContext';
import AppLayout from './components/layout/AppLayout';
import WasteSubmissionForm from './components/WasteSubmission/WasteSubmissionForm/WasteSubmissionForm';
import WasteSubmissionList from './components/WasteSubmission/WasteSubmissionList/WasteSubmissionList';

const ServiceUserLayout = () => (
  <div className="App">
    <NotificationProvider>
      <AppLayout>
        <React.Fragment>
          <Routes>
            <Route path="/b" element={<div>Dashboard</div>} />
            <Route path="/" element={<WasteSubmissionForm />} />
            <Route path="/recyclable" element={<div>Recyclable Page</div>} />
            <Route path="/history" element={<WasteSubmissionList />} />
          </Routes>
        </React.Fragment>
      </AppLayout>
    </NotificationProvider>
  </div>
);

// Payment layout to group payment-related routes under /payments
const PaymentLayout = () => (
  <div className="App">
    <PaymentProvider>
      <React.Fragment>
        <Routes>
          <Route path="/" element={<PaymentDashboard />} />
          <Route path="select" element={<PaymentMethodSelection />} />
          <Route path="card" element={<PaymentCardForm />} />
          <Route path="otp" element={<PaymentOtpPage />} />
          <Route path="success" element={<PaymentSuccessPage />} />
          <Route path="offline" element={<PaymentOfflinePage />} />
          <Route path="offline/pending" element={<PaymentOfflinePendingPage />} />
          <Route path="history" element={<PaymentHistoryPage />} />
        </Routes>
      </React.Fragment>
    </PaymentProvider>
  </div>
);

const MunicipalAuthorityLayout = () => (
  <div className="App">
  <NotificationProvider>
    <AppLayout >
      <React.Fragment>
        <Routes>
          <Route path="/" element={<MunicipalDashboard />} />
        </Routes>
      </React.Fragment>
    </AppLayout >
    </NotificationProvider>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/schedule-manager-Dash" element={<ScheduleManagerDash />} />
        <Route path="/collectionRoutespage" element={<CollectionRoutesform />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
       <Route path="/k*" element={<ServiceUserLayout />} />
       <Route path="/*" element={<MunicipalAuthorityLayout />} />
       </Routes>
       </BrowserRouter>
    </div>
  );
}
