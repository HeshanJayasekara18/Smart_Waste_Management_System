import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePaymentContext } from './PaymentContext';
import {
  downloadOfflineSlip,
  fetchBillingSnapshot,
  fetchPaymentHistory,
  getPaymentClientConfig,
} from './PaymentApi';
import { getNavItems } from './PaymentNavConfig';

const formatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function formatCurrency(amount) {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return 'LK 0';
  }
  return `LK ${formatter.format(Number(amount))}`;
}

function formatDate(value) {
  if (!value) {
    return '—';
  }
  try {
    return new Date(value).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return String(value);
  }
}

function methodLabel(method) {
  if (method === 'card') {
    return 'Card';
  }
  if (method === 'offline') {
    return 'Offline';
  }
  return method;
}

function statusMeta(status) {
  switch (status) {
    case 'authorized':
      return { label: 'Paid', className: 'bg-emerald-100 text-emerald-700' };
    case 'pending_offline':
      return { label: 'Pending (offline)', className: 'bg-amber-100 text-amber-700' };
    case 'otp_pending':
      return { label: 'Awaiting OTP', className: 'bg-sky-100 text-sky-700' };
    case 'initiated':
      return { label: 'Initiated', className: 'bg-slate-100 text-slate-600' };
    case 'failed':
      return { label: 'Failed', className: 'bg-rose-100 text-rose-700' };
    default:
      return { label: status || 'Unknown', className: 'bg-slate-100 text-slate-600' };
  }
}

function PaymentHistoryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    billingSnapshot,
    setBillingSnapshot,
    setActivePayment,
    setRecentPayment,
  } = usePaymentContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
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
      }
    }

    ensureBill();
  }, [billingSnapshot, apiBase, devUserId, activePeriod, setBillingSnapshot]);

  useEffect(() => {
    async function loadHistory() {
      setLoadingHistory(true);
      setError('');
      try {
        const response = await fetchPaymentHistory({ apiBase, devUserId, limit: 50 });
        setHistory(response?.payments || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingHistory(false);
      }
    }

    loadHistory();
  }, [apiBase, devUserId]);

  const navItems = useMemo(
    () => getNavItems(location.pathname),
    [location.pathname]
  );

  function handleNavClick(item) {
    if (item.disabled || !item.path || item.path === '#') {
      return;
    }
    navigate(item.path);
    setSidebarOpen(false);
  }

  function handleDownloadReceipt(paymentId) {
    setError('');
    const url = `${apiBase}/api/payments/${paymentId}/receipt`;
    window.open(url, '_blank', 'noopener');
  }

  async function handleDownloadOfflineSlip(paymentId) {
    setError('');
    try {
      await downloadOfflineSlip({ apiBase, devUserId, paymentId });
    } catch (err) {
      setError(err.message);
    }
  }

  const municipality = billingSnapshot?.municipality;

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-slate-900">
      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white pb-8 shadow-xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center gap-3 px-6 pt-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-lg font-semibold text-white">
              TT
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">Trash Track</p>
              <p className="text-xs text-slate-500">Smart Waste Portal</p>
            </div>
          </div>

          <nav className="mt-10 space-y-1 px-4">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium transition hover:bg-emerald-50 hover:text-emerald-600 ${
                  item.active ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-600'
                } ${item.disabled ? 'cursor-not-allowed opacity-70 hover:bg-transparent hover:text-slate-600' : ''}`}
                onClick={() => handleNavClick(item)}
                disabled={item.disabled}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${
                      item.active ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-500'
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-5 w-5"
                    >
                      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5.5v-5.25h-3V21H5a1 1 0 0 1-1-1z" />
                    </svg>
                  </span>
                  {item.label}
                </span>
                {item.badge ? (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      item.active ? 'bg-white/30 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>

          <div className="mt-auto grid gap-6 px-6 pt-12 text-sm">
            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                Municipal Area
              </p>
              <p className="mt-1 text-sm font-semibold text-emerald-700">
                {municipality?.name || 'Colombo District'}
              </p>
              <p className="mt-2 text-xs text-emerald-600">Verified - Waste Collection Active</p>
            </div>
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path d="M16 17 21 12 16 7v3H4v4h12z" />
              </svg>
              Logout
            </button>
          </div>
        </aside>

        {sidebarOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          />
        ) : null}

        <div className="flex flex-1 flex-col lg:ml-64">
          <header className="flex flex-col gap-6 px-6 pt-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm transition hover:text-emerald-600 lg:hidden"
                onClick={() => setSidebarOpen((prev) => !prev)}
                aria-label="Toggle navigation"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.8"
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Receipt & History</h1>
                <p className="mt-1 text-sm text-slate-500">
                  Track completed payments, download receipts, and follow up offline submissions.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-72">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21 16.65 16.65M6.75 11.25a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0Z" />
                  </svg>
                </span>
                <input
                  type="search"
                  placeholder="Search receipts"
                  className="h-11 w-full rounded-xl border border-transparent bg-white pl-11 pr-4 text-sm text-slate-600 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  disabled
                />
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  className="hidden h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm transition hover:text-emerald-600 sm:inline-flex"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.121 14.121a3 3 0 1 0-4.243 0M15 12a6 6 0 1 0-9 5.196V18a3 3 0 0 0 3 3h3a3 3 0 0 0 3-3v-.804A5.993 5.993 0 0 0 15 12Z"
                    />
                  </svg>
                </button>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <span className="text-sm font-semibold text-slate-600">JD</span>
                </div>
              </div>
            </div>
          </header>

          <main className="mt-6 flex-1 pb-12">
            <section className="px-6">
              <article className="rounded-3xl bg-white p-6 shadow-lg">
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Payment history</h2>
                    <p className="text-sm text-slate-500">
                      Most recent payments appear first. Receipts are available once a payment is confirmed.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Synced automatically
                  </div>
                </div>

                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead>
                      <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Reference</th>
                        <th className="px-4 py-3">Bill period</th>
                        <th className="px-4 py-3">Method</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {history.length ? (
                        history.map((payment) => {
                          const status = statusMeta(payment.status);
                          return (
                            <tr key={payment.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3 align-top">{formatDate(payment.createdAt)}</td>
                              <td className="px-4 py-3 align-top font-semibold text-slate-800">
                                {payment.reference || '—'}
                              </td>
                              <td className="px-4 py-3 align-top text-slate-600">{payment.billPeriod || '—'}</td>
                              <td className="px-4 py-3 align-top text-slate-600">{methodLabel(payment.method)}</td>
                              <td className="px-4 py-3 align-top font-semibold text-slate-800">
                                {formatCurrency(payment.amount)}
                              </td>
                              <td className="px-4 py-3 align-top">
                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
                                  {status.label}
                                </span>
                              </td>
                              <td className="px-4 py-3 align-top text-right">
                                <div className="inline-flex flex-wrap justify-end gap-2">
                                  {payment.hasReceipt ? (
                                    <button
                                      type="button"
                                      onClick={() => handleDownloadReceipt(payment.id)}
                                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-600"
                                    >
                                      Receipt
                                    </button>
                                  ) : null}
                                  {payment.hasOfflineSlip && payment.status !== 'authorized' ? (
                                    <button
                                      type="button"
                                      onClick={() => handleDownloadOfflineSlip(payment.id)}
                                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-emerald-200 hover:text-emerald-600"
                                    >
                                      Offline slip
                                    </button>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td className="px-4 py-6 text-center text-sm text-slate-500" colSpan={7}>
                            {loadingHistory ? 'Loading payment history...' : 'No payments recorded yet.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {error ? (
                  <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                ) : null}
              </article>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

export default PaymentHistoryPage;
