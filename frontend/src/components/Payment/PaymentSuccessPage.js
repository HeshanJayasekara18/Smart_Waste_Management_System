import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaymentContext } from './PaymentContext';
import { getPaymentClientConfig } from './PaymentApi';

function PaymentSuccessPage() {
  const navigate = useNavigate();
  const { billingSnapshot, recentPayment, setRecentPayment, setActivePayment } = usePaymentContext();
  const bill = billingSnapshot?.bill;

  const { apiBase } = getPaymentClientConfig();

  useEffect(() => {
    if (!recentPayment?.paymentId) {
      navigate('/', { replace: true });
    } else {
      setActivePayment(null);
    }
  }, [recentPayment, navigate, setActivePayment]);

  if (!recentPayment?.paymentId) {
    return null;
  }

  function handleDownloadReceipt() {
    const url = `${apiBase}/api/payments/${recentPayment.paymentId}/receipt`;
    window.open(url, '_blank', 'noopener');
  }

  function handleFinish() {
    setRecentPayment(null);
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <div className="rounded-3xl bg-white p-10 text-center shadow-lg">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-10 w-10"
            >
              <path d="M9 12.75 11.25 15 15 9.75" />
              <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>

          <h1 className="mt-6 text-3xl font-semibold text-slate-900">Payment successful</h1>
          <p className="mt-3 text-sm text-slate-600">
            We&apos;ve sent a receipt to your email. You can download an extra copy below.
          </p>

          <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
              <p className="text-xs uppercase tracking-wide text-slate-400">Bill period</p>
              <p className="mt-2 text-base font-semibold text-slate-800">{bill?.period}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
              <p className="text-xs uppercase tracking-wide text-slate-400">Amount paid</p>
              <p className="mt-2 text-base font-semibold text-slate-800">
                LK {recentPayment.amount || bill?.amount || '0'}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
              <p className="text-xs uppercase tracking-wide text-slate-400">Payment method</p>
              <p className="mt-2 text-base font-semibold text-slate-800">
                {recentPayment.method === 'card'
                  ? `Card ${recentPayment.maskedCard || ''}`
                  : 'Cash'}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
              <p className="text-xs uppercase tracking-wide text-slate-400">Reference</p>
              <p className="mt-2 text-base font-semibold text-slate-800">
                #{recentPayment.paymentId}
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={handleDownloadReceipt}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-lg font-semibold text-white shadow-lg transition hover:bg-emerald-600"
            >
              Download receipt
            </button>
            <button
              type="button"
              onClick={handleFinish}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-700"
            >
              Back to dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccessPage;
