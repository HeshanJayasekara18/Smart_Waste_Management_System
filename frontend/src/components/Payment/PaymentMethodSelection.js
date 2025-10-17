import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaymentContext } from './PaymentContext';
import { fetchBillingSnapshot, getPaymentClientConfig } from './PaymentApi';

function PaymentMethodSelection() {
  const navigate = useNavigate();
  const { billingSnapshot, setBillingSnapshot } = usePaymentContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { apiBase, devUserId, activePeriod } = getPaymentClientConfig();

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

  const savedCards = useMemo(
    () => billingSnapshot?.user?.paymentMethods || [],
    [billingSnapshot?.user?.paymentMethods]
  );

  function handleBack() {
    navigate('/');
  }

  function handleAddCard() {
    navigate('/payments/card');
  }

  function handleSavedCardSelect(cardToken) {
    navigate('/payments/card', { state: { savedCardToken: cardToken } });
  }

  function handleCash() {
    alert('Cash payments can be recorded by field officers soon. Please choose a card for now.');
  }

  const bill = billingSnapshot?.bill;

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-12">
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
          Back to dashboard
        </button>

        <div className="rounded-3xl bg-white p-8 shadow-lg">
          <header className="flex flex-col gap-3 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
                Payment Method
              </p>
              <h1 className="text-2xl font-semibold text-slate-900">Choose how you want to pay</h1>
              {bill ? (
                <p className="mt-2 text-sm text-slate-500">
                  You&apos;re paying {bill.period} charges totaling
                  <span className="font-semibold text-slate-700"> LK {bill.amount}</span>
                </p>
              ) : null}
            </div>
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-600">
              Secure checkout powered by OTP
            </div>
          </header>

          <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_minmax(0,1fr)]">
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Pay with card</h2>
                    <p className="text-sm text-slate-500">
                      Use a saved card or add a new one. We&apos;ll secure the payment with OTP.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCard}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-4 w-4"
                    >
                      <path d="M12 5v14m7-7H5" />
                    </svg>
                    Add new card
                  </button>
                </div>

                {savedCards.length ? (
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {savedCards.map((cardToken) => {
                      const parts = cardToken.split('-');
                      const brand = parts[1] || 'card';
                      const last4 = parts[2] || '0000';
                      return (
                        <button
                          type="button"
                          key={cardToken}
                          onClick={() => handleSavedCardSelect(cardToken)}
                          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600"
                        >
                          <span className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-bold uppercase text-slate-600 shadow">
                              {brand.slice(0, 2)}
                            </span>
                            {brand.toUpperCase()} •••• {last4}
                          </span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.8"
                            stroke="currentColor"
                            className="h-4 w-4"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5 15.75 12l-7.5 7.5" />
                          </svg>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                    You haven&apos;t saved any cards yet. Add one now for faster checkout next time.
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900">Pay with cash</h2>
                <p className="text-sm text-slate-500">
                  Download a payment slip and complete the transaction at your municipal office.
                </p>
                <button
                  type="button"
                  onClick={handleCash}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-600"
                >
                  Coming soon
                </button>
              </div>
            </div>

            <aside className="space-y-4 rounded-2xl bg-slate-50 p-6 text-sm text-slate-600">
              <h3 className="text-sm font-semibold text-slate-700">Need to know</h3>
              <ul className="list-disc space-y-2 pl-5">
                <li>Each card payment is verified with OTP sent to your registered email.</li>
                <li>You can save cards for future payments; details are stored securely.</li>
                <li>Receipts are automatically emailed once the bill is paid.</li>
              </ul>
              {error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </p>
              ) : null}
              {loading ? (
                <p className="text-sm font-semibold text-emerald-600">Loading payment options...</p>
              ) : null}
            </aside>
          </section>
        </div>
      </div>
    </div>
  );
}

export default PaymentMethodSelection;
