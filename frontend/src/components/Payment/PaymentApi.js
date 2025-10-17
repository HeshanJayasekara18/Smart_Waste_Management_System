async function handleResponse(response) {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Request failed');
  }
  return response.json();
}

export function getPaymentClientConfig() {
  return {
    apiBase: process.env.REACT_APP_API_BASE || '',
    devUserId: process.env.REACT_APP_DEV_USER_ID || '65f9b1e7b2f44b9a9b0a1234',
    activePeriod: '2025-09',
  };
}

export async function fetchBillingSnapshot({ apiBase, devUserId, period }) {
  const response = await fetch(`${apiBase}/api/bills/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': devUserId,
    },
    body: JSON.stringify({ period }),
  });
  return handleResponse(response);
}

export async function initiateCardPayment({ apiBase, devUserId, billId, cardInfo }) {
  const response = await fetch(`${apiBase}/api/payments/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': devUserId,
    },
    body: JSON.stringify({ billId, method: 'card', cardInfo }),
  });
  return handleResponse(response);
}

export async function confirmOtpPayment({ apiBase, devUserId, paymentId, otp }) {
  const response = await fetch(`${apiBase}/api/payments/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': devUserId,
    },
    body: JSON.stringify({ paymentId, otp }),
  });
  return handleResponse(response);
}

export async function fetchDevOtp({ apiBase, devUserId, paymentId }) {
  const response = await fetch(`${apiBase}/api/admin/payments/${paymentId}/otp`, {
    headers: {
      'x-user-id': devUserId,
    },
  });
  return handleResponse(response);
}

export async function initiateOfflinePayment({
  apiBase,
  devUserId,
  billId,
  referenceCode,
  notes,
}) {
  const response = await fetch(`${apiBase}/api/payments/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': devUserId,
    },
    body: JSON.stringify({ billId, method: 'offline', referenceCode, notes }),
  });
  return handleResponse(response);
}

export async function downloadOfflineSlip({ apiBase, devUserId, paymentId }) {
  const response = await fetch(`${apiBase}/api/payments/${paymentId}/offline-slip`, {
    headers: {
      'x-user-id': devUserId,
    },
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Unable to download offline slip');
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `offline-slip-${paymentId}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
