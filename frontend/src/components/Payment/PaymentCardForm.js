import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePaymentContext } from './PaymentContext';
import { getPaymentClientConfig, initiateCardPayment } from './PaymentApi';

const FALLBACK_NUMBER = '4242424242424242';

function detectBrandFromNumber(number) {
  if (!number) return 'card';
  const trimmed = number.replace(/\s+/g, '');
  if (trimmed.startsWith('4')) return 'visa';
  if (/^(5[1-5])/.test(trimmed)) return 'mastercard';
  if (trimmed.startsWith('34') || trimmed.startsWith('37')) return 'amex';
  return 'card';
}

function resolveSavedCardToken(cardToken, fallbackName) {
  const parts = (cardToken || '').split('-');
  const brand = parts[1] || 'card';
  const last4 = parts[2] || '0000';
  return {
    brand,
    last4,
    number: FALLBACK_NUMBER,
    expMonth: '08',
    expYear: '28',
    holderName: fallbackName,
  };
}

function PaymentCardForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const savedCardToken = location.state?.savedCardToken || null;

  const { billingSnapshot, setBillingSnapshot, setActivePayment } = usePaymentContext();
  const bill = billingSnapshot?.bill;
  const userName = billingSnapshot?.user?.name || 'Smart Waste Resident';

  const [formData, setFormData] = useState({
    number: '',
    holderName: userName,
    expMonth: '08',
    expYear: '28',
    cvv: '',
  });
  const [saveCard, setSaveCard] = useState(!savedCardToken);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { apiBase, devUserId } = getPaymentClientConfig();

  useEffect(() => {
    if (!bill) {
      navigate('/payments/select', { replace: true });
    }
  }, [bill, navigate]);

  useEffect(() => {
    if (savedCardToken) {
      const resolved = resolveSavedCardToken(savedCardToken, userName);
      setFormData((prev) => ({
        ...prev,
        number: `•••• •••• •••• ${resolved.last4}`,
        holderName: resolved.holderName,
        expMonth: resolved.expMonth,
        expYear: resolved.expYear,
      }));
      setSaveCard(true);
    } else {
      setFormData((prev) => ({ ...prev, holderName: userName }));
    }
  }, [savedCardToken, userName]);

  const isUsingSavedCard = Boolean(savedCardToken);
  const displayBrand = useMemo(() => {
    if (isUsingSavedCard) {
      return resolveSavedCardToken(savedCardToken, userName).brand;
    }
    return detectBrandFromNumber(formData.number);
  }, [savedCardToken, isUsingSavedCard, formData.number, userName]);

  function updateField(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!bill) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      let cardPayload;
      if (isUsingSavedCard) {
        const resolved = resolveSavedCardToken(savedCardToken, userName);
        cardPayload = {
          number: resolved.number,
          expMonth: resolved.expMonth,
          expYear: resolved.expYear,
          brand: resolved.brand,
          holderName: resolved.holderName,
        };
      } else {
        const sanitizedNumber = formData.number.replace(/\s+/g, '');
        if (sanitizedNumber.length < 12) {
          throw new Error('Please enter a valid card number.');
        }
        cardPayload = {
          number: sanitizedNumber,
          expMonth: formData.expMonth,
          expYear: formData.expYear,
          brand: detectBrandFromNumber(sanitizedNumber),
          holderName: formData.holderName || userName,
        };
      }

      const response = await initiateCardPayment({
        apiBase,
        devUserId,
        billId: bill._id,
        cardInfo: cardPayload,
      });

      if (!response.paymentId) {
        throw new Error('Payment could not be initiated.');
      }

      setActivePayment({
        paymentId: response.paymentId,
        billId: bill._id,
        method: 'card',
        maskedCard: response.maskedCard || `•••• ${cardPayload.number.slice(-4)}`,
        amount: bill.amount,
      });

      if (!isUsingSavedCard && saveCard) {
        const token = `card-${cardPayload.brand}-${cardPayload.number.slice(-4)}`;
        setBillingSnapshot((prev) => {
          if (!prev?.user) {
            return prev;
          }
          const existing = prev.user.paymentMethods || [];
          if (existing.includes(token)) {
            return prev;
          }
          return {
            ...prev,
            user: {
              ...prev.user,
              paymentMethods: [...existing, token],
            },
          };
        });
      }

      navigate('/payments/otp');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    navigate('/payments/select');
  }

  const last4 = useMemo(() => {
    if (isUsingSavedCard) {
      return resolveSavedCardToken(savedCardToken, userName).last4;
    }
    const sanitizedNumber = formData.number.replace(/\s+/g, '');
    return sanitizedNumber.slice(-4) || '0000';
  }, [savedCardToken, isUsingSavedCard, formData.number, userName]);

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-slate-900">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <button
          type="button"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
          onClick={handleCancel}
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
          Back to methods
        </button>

        <div className="rounded-3xl bg-white p-8 shadow-lg">
          <header className="flex flex-col gap-2 border-b border-slate-200 pb-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
              Card Payment
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">
              {isUsingSavedCard ? 'Confirm your saved card' : 'Add a new card'}
            </h1>
            <p className="text-sm text-slate-500">
              A one-time password will be emailed to authorize this payment securely.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Card number
                </label>
                <input
                  type="text"
                  value={formData.number}
                  onChange={(event) => updateField('number', event.target.value)}
                  placeholder="1234 5678 9012 3456"
                  readOnly={isUsingSavedCard}
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Name on card
                </label>
                <input
                  type="text"
                  value={formData.holderName}
                  onChange={(event) => updateField('holderName', event.target.value)}
                  placeholder="John Doe"
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Expiry month
                </label>
                <input
                  type="text"
                  value={formData.expMonth}
                  onChange={(event) => updateField('expMonth', event.target.value)}
                  placeholder="MM"
                  maxLength={2}
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Expiry year
                </label>
                <input
                  type="text"
                  value={formData.expYear}
                  onChange={(event) => updateField('expYear', event.target.value)}
                  placeholder="YY"
                  maxLength={2}
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {!isUsingSavedCard ? (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    CVV
                  </label>
                  <input
                    type="password"
                    value={formData.cvv}
                    onChange={(event) => updateField('cvv', event.target.value)}
                    placeholder="123"
                    maxLength={4}
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              ) : null}
            </div>

            {!isUsingSavedCard ? (
              <label className="inline-flex items-center gap-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={saveCard}
                  onChange={(event) => setSaveCard(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-400"
                />
                Save this card for faster checkout next time
              </label>
            ) : (
              <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Using saved card ending in <span className="font-semibold">{last4}</span>.
              </div>
            )}

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
                {submitting ? 'Processing...' : 'Continue to OTP'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>
          </form>

          <footer className="mt-6 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold uppercase tracking-wide text-slate-400">Summary</span>
              {bill ? (
                <span className="font-semibold text-slate-600">
                  {bill.period} • Total LK {bill.amount} • {displayBrand.toUpperCase()} •••• {last4}
                </span>
              ) : null}
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default PaymentCardForm;
