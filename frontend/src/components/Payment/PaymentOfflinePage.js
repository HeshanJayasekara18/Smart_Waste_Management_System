import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaymentContext } from './PaymentContext';
import {
  fetchBillingSnapshot,
  getPaymentClientConfig,
  initiateOfflinePayment,
} from './PaymentApi';

function PaymentOfflinePage() {
  const navigate = useNavigate();
  const {
    billingSnapshot,
    setBillingSnapshot,
    setRecentPayment,
    setActivePayment,
  } = usePaymentContext();

  const [referenceCode, setReferenceCode] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { apiBase, devUserId, activePeriod } = getPaymentClientConfig();

  useEffect(() => {
    setActivePayment(null);
    setRecentPayment(null);
  }, [setActivePayment, setRecentPayment]);

  useEffect(() => {
    async function ensureBill() {
      if (billingSnapshot?.bill) {
        return;
      }
      setLoading(true);
      setError('');
      try {
        const snapshot = await fetchBillingSnapshot({
          apiBase,
          devUserId,
          period: activePeriod,
        });
        setBillingSnapshot(snapshot);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    ensureBill();
  }, [billingSnapshot, apiBase, devUserId, activePeriod, setBillingSnapshot]);

  const bill = billingSnapshot?.bill;

  function handleBack() {
    navigate('/payments/select');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!bill) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await initiateOfflinePayment({
        apiBase,
        devUserId,
        billId: bill._id,
        referenceCode: referenceCode.trim(),
        notes: notes.trim(),
      });

      setActivePayment({
        paymentId: result.paymentId,
        method: 'offline',
        status: result.status,
      });

      setRecentPayment({
        paymentId: result.paymentId,
        method: 'offline',
        amount: bill.amount,
        status: result.status,
        referenceCode: referenceCode.trim(),
        offlineSlipFileName: result.offlineSlip?.slipFileName || '',
      });

      navigate('/payments/offline/pending');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-slate-900">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <button
          type="button"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
          onClick={handleBack}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.8"
            stroke="currentColor"
            className="h-4 w-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Back to payment methods
        </button>

        <div className="rounded-3xl bg-white p-8 shadow-lg">
          <header className="flex flex-col gap-3 border-b border-slate-200 pb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
                Offline payment
              </p>
              <h1 className="text-2xl font-semibold text-slate-900">
                Generate your municipal payment slip
              </h1>
              {bill ? (
                <p className="mt-2 text-sm text-slate-500">
                  Provide the reference code assigned to you. We will generate a slip you can present at
                  your municipal office. The bill remains pending until an officer confirms the payment.
                </p>
              ) : null}
            </div>
          </header>

          <form className="mt-8 grid gap-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
                <p className="text-xs uppercase tracking-wide text-slate-400">Bill period</p>
                <p className="mt-2 text-base font-semibold text-slate-800">{bill?.period || '—'}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
                <p className="text-xs uppercase tracking-wide text-slate-400">Amount due</p>
                <p className="mt-2 text-base font-semibold text-slate-800">LK {bill?.amount || '0'}</p>
              </div>
            </div>

            <div className="grid gap-4">
              <label className="text-sm font-semibold text-slate-700" htmlFor="referenceCode">
                Reference code
              </label>
              <input
                id="referenceCode"
                type="text"
                value={referenceCode}
                onChange={(event) => setReferenceCode(event.target.value)}
                placeholder="e.g. SL-MUNI-2025-001"
                className="h-12 rounded-2xl border border-slate-200 px-4 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                required
              />
              <p className="text-xs text-slate-500">
                This should match the reference provided by the municipal counter or bank deposit slip.
              </p>
            </div>

            <div className="grid gap-4">
              <label className="text-sm font-semibold text-slate-700" htmlFor="notes">
                Additional notes (optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Officer name, payment location, or any supporting detail"
                className="min-h-[120px] rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!bill || !referenceCode.trim() || loading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-lg font-semibold text-white shadow-lg transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                {loading ? 'Generating slip...' : 'Generate E-slip'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PaymentOfflinePage;
