import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaymentContext } from './PaymentContext';
import { confirmOtpPayment, fetchDevOtp, getPaymentClientConfig } from './PaymentApi';

function PaymentOtpPage() {
  const navigate = useNavigate();
  const {
    billingSnapshot,
    setBillingSnapshot,
    activePayment,
    setActivePayment,
    setRecentPayment,
  } = usePaymentContext();

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fetchingOtp, setFetchingOtp] = useState(false);

  const { apiBase, devUserId } = getPaymentClientConfig();

  useEffect(() => {
    if (!activePayment?.paymentId) {
      navigate('/payments/select', { replace: true });
      return;
    }

    async function prefillOtp() {
      if (process.env.NODE_ENV === 'production') {
        return;
      }
      setFetchingOtp(true);
      try {
        const result = await fetchDevOtp({
          apiBase,
          devUserId,
          paymentId: activePayment.paymentId,
        });
        if (result.otp) {
          setOtp(result.otp);
        }
      } catch (err) {
        console.warn('Unable to fetch dev OTP', err.message);
      } finally {
        setFetchingOtp(false);
      }
    }

    prefillOtp();
  }, [activePayment, apiBase, devUserId, navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!activePayment?.paymentId) {
      return;
    }
    if (!otp) {
      setError('Please enter the OTP.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await confirmOtpPayment({
        apiBase,
        devUserId,
        paymentId: activePayment.paymentId,
        otp,
      });

      setRecentPayment({
        paymentId: response.paymentId || activePayment.paymentId,
        method: activePayment.method,
        maskedCard: activePayment.maskedCard,
        amount: activePayment.amount || billingSnapshot?.bill?.amount,
      });

      setBillingSnapshot((prev) => {
        if (!prev?.bill) {
          return prev;
        }
        return {
          ...prev,
          bill: {
            ...prev.bill,
            status: 'paid',
          },
        };
      });

      setActivePayment((prev) => (prev ? { ...prev, status: 'authorized' } : prev));
      navigate('/payments/success');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleBack() {
    navigate('/payments/card');
  }

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-slate-900">
      <div className="mx-auto max-w-xl px-6 py-12">
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
          Back to card details
        </button>

        <div className="rounded-3xl bg-white p-8 shadow-lg">
          <header className="flex flex-col gap-2 border-b border-slate-200 pb-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
              OTP verification
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">Authenticate your payment</h1>
            <p className="text-sm text-slate-500">
              We&apos;ve sent a six-digit code to your registered email. Enter it below to confirm the
              payment.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                One-time password
              </label>
              <input
                type="text"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\s+/g, ''))}
                maxLength={6}
                placeholder="••••••"
                className="mt-2 h-14 w-full rounded-xl border border-slate-200 bg-white px-4 text-center text-2xl font-semibold tracking-[0.4em] text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-lg font-semibold text-white shadow-lg transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                {submitting ? 'Verifying...' : 'Confirm payment'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-700"
              >
                Cancel payment
              </button>
            </div>
          </form>

          <footer className="mt-6 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {fetchingOtp ? (
              <p className="text-sm font-semibold text-emerald-600">Fetching dev OTP…</p>
            ) : (
              <div className="flex flex-col gap-2">
                <p>
                  Trouble receiving the OTP? Check your spam folder or request a resend from support.
                </p>
                <p className="text-xs text-slate-500">
                  Payment reference: <span className="font-semibold">{activePayment?.paymentId}</span>
                </p>
              </div>
            )}
          </footer>
        </div>
      </div>
    </div>
  );
}

export default PaymentOtpPage;
