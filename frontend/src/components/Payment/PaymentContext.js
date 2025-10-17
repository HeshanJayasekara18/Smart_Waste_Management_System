import React, { createContext, useContext, useMemo, useState } from 'react';

const PaymentContext = createContext(null);

export function PaymentProvider({ children }) {
  const [billingSnapshot, setBillingSnapshot] = useState(null);
  const [activePayment, setActivePayment] = useState(null);
  const [recentPayment, setRecentPayment] = useState(null);

  const value = useMemo(
    () => ({
      billingSnapshot,
      setBillingSnapshot,
      activePayment,
      setActivePayment,
      recentPayment,
      setRecentPayment,
    }),
    [billingSnapshot, activePayment, recentPayment]
  );

  return <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>;
}

export function usePaymentContext() {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePaymentContext must be used within a PaymentProvider');
  }
  return context;
}
