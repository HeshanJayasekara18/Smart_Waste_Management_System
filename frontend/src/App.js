import './App.css';
import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Mount payment routes under /payments/*/}
        <Route path="/payments/*" element={<PaymentLayout />} />

        {/* Service user / waste-submission routes at root */}
        <Route path="/*" element={<ServiceUserLayout />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
