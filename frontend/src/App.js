import React from "react";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import { NotificationProvider } from "./contexts/NotificationContext";



import MunicipalAppLayout from './components/layout/MunicipalAppLayout'


// Waste submission / notifications
import ServiceUserAppLayout from './components/layout/ServiceUserAppLayout';
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



const ServiceUserLayout = () => (
  <div className="App">
    <NotificationProvider>
      <ServiceUserAppLayout>
        <React.Fragment>
          <Routes>
            <Route path="/" element={<WasteSubmissionForm />} />
            <Route path="/recyclable" element={<div>Recyclable Page</div>} />
            <Route path="/history" element={<WasteSubmissionList />} />
          </Routes>
        </React.Fragment>
      </ServiceUserAppLayout>
    </NotificationProvider>
  </div>
);

// Municipal routes are declared as nested routes so that
// MunicipalAppLayout's <Outlet /> renders the matched child route.

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



export default function App() {
  return (
    <div>
    <BrowserRouter>
      <Routes>
        {/* Service user area */}
        <Route path="/*" element={<ServiceUserLayout />} />

        {/* Payments area */}
        <Route path="/g/*" element={<PaymentLayout />} />

        {/* Municipal area using nested routes so Outlet renders children */}
        <Route
          path="/h*"
          element={
            <NotificationProvider>
              <MunicipalAppLayout />
            </NotificationProvider>
          }
        >
          <Route index element={<MunicipalDashboard />} />
          <Route path="municipal/dashboard" element={<MunicipalDashboard />} />
        </Route>
      </Routes>
       </BrowserRouter>
    </div>
  );
}
