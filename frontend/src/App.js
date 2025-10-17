import './App.css';
import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import PaymentDashboard from './components/Payment/PaymentDashboard';
import PaymentMethodSelection from './components/Payment/PaymentMethodSelection';
import PaymentCardForm from './components/Payment/PaymentCardForm';
import PaymentOtpPage from './components/Payment/PaymentOtpPage';
import PaymentSuccessPage from './components/Payment/PaymentSuccessPage';
import PaymentOfflinePage from './components/Payment/PaymentOfflinePage';
import PaymentOfflinePendingPage from './components/Payment/PaymentOfflinePendingPage';
import PaymentHistoryPage from './components/Payment/PaymentHistoryPage';
import { PaymentProvider } from './components/Payment/PaymentContext';

function App() {
  return (
    <PaymentProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PaymentDashboard />} />
          <Route path="/payments/select" element={<PaymentMethodSelection />} />
          <Route path="/payments/card" element={<PaymentCardForm />} />
          <Route path="/payments/otp" element={<PaymentOtpPage />} />
          <Route path="/payments/success" element={<PaymentSuccessPage />} />
          <Route path="/payments/offline" element={<PaymentOfflinePage />} />
          <Route path="/payments/offline/pending" element={<PaymentOfflinePendingPage />} />
          <Route path="/payments/history" element={<PaymentHistoryPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </PaymentProvider>
  );
}

export default App;
