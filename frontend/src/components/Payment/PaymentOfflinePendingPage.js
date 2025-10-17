import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaymentContext } from './PaymentContext';
import { downloadOfflineSlip, getPaymentClientConfig } from './PaymentApi';

function PaymentOfflinePendingPage() {
  const navigate = useNavigate();
  const { billingSnapshot, recentPayment, setRecentPayment, setActivePayment } =
    usePaymentContext();
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const { apiBase, devUserId } = getPaymentClientConfig();

  useEffect(() => {
    if (!recentPayment?.paymentId || recentPayment.method !== 'offline') {
      navigate('/', { replace: true });
      return undefined;
    }

    setActivePayment(recentPayment);
    return () => setActivePayment(null);
  }, [recentPayment, navigate, setActivePayment]);

  if (!recentPayment?.paymentId || recentPayment.method !== 'offline') {
    return null;
  }

  async function handleDownloadSlip() {
    setDownloading(true);
    setError('');
    try {
      await downloadOfflineSlip({
        apiBase,
        devUserId,
        paymentId: recentPayment.paymentId,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  }

  function handleBackHome() {
    setActivePayment(null);
    setRecentPayment(null);
    navigate('/');
  }

  const bill = billingSnapshot?.bill;

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <div className="rounded-3xl bg-white p-10 shadow-lg">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-600">
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
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </div>
            <h1 className="text-3xl font-semibold text-slate-900">Payment awaiting confirmation</h1>
            <p className="text-sm text-slate-600">
              We recorded your offline payment. Present the slip below at the municipal office to finish the
              process. The bill status will remain pending until an officer validates the payment.
            </p>
          </div>

          <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
              <p className="text-xs uppercase tracking-wide text-slate-400">Bill period</p>
              <p className="mt-2 text-base font-semibold text-slate-800">{bill?.period || '—'}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
              <p className="text-xs uppercase tracking-wide text-slate-400">Amount due</p>
              <p className="mt-2 text-base font-semibold text-slate-800">
                LK {recentPayment.amount || bill?.amount || '0'}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
              <p className="text-xs uppercase tracking-wide text-slate-400">Reference code</p>
              <p className="mt-2 text-base font-semibold text-slate-800">
                {recentPayment.referenceCode}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
              <p className="text-xs uppercase tracking-wide text-slate-400">Status</p>
              <p className="mt-2 text-base font-semibold text-amber-600">Pending municipal review</p>
            </div>
          </div>

          <div className="mt-10 space-y-4 text-sm text-slate-600">
            <p className="rounded-2xl bg-slate-50 px-5 py-4">
              Bring a printed copy of the offline slip and the reference code to the municipal cashier. Once the
              officer confirms the payment, you will receive an email with the final receipt.
            </p>
            <p className="rounded-2xl bg-slate-50 px-5 py-4">
              Need help? Share this reference number with support so they can track the payment quickly.
            </p>
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={handleDownloadSlip}
              disabled={downloading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-lg font-semibold text-white shadow-lg transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              {downloading ? 'Preparing slip...' : 'Download offline slip'}
            </button>
            <button
              type="button"
              onClick={handleBackHome}
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

export default PaymentOfflinePendingPage;
