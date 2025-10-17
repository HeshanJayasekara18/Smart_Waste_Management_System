import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaymentContext } from './PaymentContext';
import { fetchBillingSnapshot, getPaymentClientConfig } from './PaymentApi';

const navItems = [
  { label: 'Dashboard', badge: null, active: true },
  { label: 'My Bills', badge: '3', active: false },
  { label: 'Payment Methods', badge: null, active: false },
  { label: 'Receipt & History', badge: null, active: false },
  { label: 'Setting', badge: null, active: false },
];

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

function formatPeriod(period) {
  if (!period) {
    return '';
  }
  const [year, month] = period.split('-').map(Number);
  if (!year || !month) {
    return period;
  }
  const date = new Date(year, month - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function deriveDueInfo(period) {
  if (!period) {
    return { label: '3 Days', subtext: 'September 6, 2025' };
  }
  const [year, month] = period.split('-').map(Number);
  if (!year || !month) {
    return { label: '3 Days', subtext: period };
  }
  const dueDate = new Date(year, month - 1, 6);
  const diffMs = dueDate.getTime() - Date.now();
  const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  return {
    label: `${diffDays} ${diffDays === 1 ? 'Day' : 'Days'}`,
    subtext: dueDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }),
  };
}

function PaymentDashboard() {
  const navigate = useNavigate();
  const { billingSnapshot, setBillingSnapshot, setActivePayment, setRecentPayment } =
    usePaymentContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { apiBase, devUserId, activePeriod } = getPaymentClientConfig();

  useEffect(() => {
    async function loadBill() {
      // Fetch billing snapshot for the DEV user and period.
      // Endpoint: POST /api/bills/generate
      // Request body: { period: "YYYY-MM" }
      // Dev auth: add header 'x-user-id' with TEST user id (or set REACT_APP_DEV_USER_ID)
      // Response shape (billingSnapshot):
      // {
      //   bill: { _id, userId, municipalityId, period, billingModelUsed, breakdown: { base, weightKg, extraFee, recyclingCredit }, amount, status },
      //   user: { _id, name, email, address: { line1, city, postal, municipalityId }, paymentMethods: [...] },
      //   municipality: { _id, name, billingModel, weightRatePerKg, fixedRate, defaultRate },
      //   collection: { userId, period, weightKg, status },
      //   submissions: [ { type: 'special'|'recyclable', period, weightKg, feeOrCredit }, ... ]
      // }
      // We rely on this single snapshot to populate all dashboard widgets in dev.
      setLoading(true);
      setError('');
      try {
        const data = await fetchBillingSnapshot({
          apiBase,
          devUserId,
          period: activePeriod,
        });
        // 'data' here refers to the billingSnapshot explained above.
        setBillingSnapshot(data);
      } catch (err) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadBill();
    setActivePayment(null);
    setRecentPayment(null);
  }, [apiBase, devUserId, activePeriod, setActivePayment, setRecentPayment, setBillingSnapshot]);

  const bill = billingSnapshot?.bill;
  const user = billingSnapshot?.user;
  const municipality = billingSnapshot?.municipality;
  const submissions = billingSnapshot?.submissions || [];

  const totalWasteKg = bill?.breakdown?.weightKg || 0;
  const recyclingCredit = bill?.breakdown?.recyclingCredit || 0;
  const recycledWeight = submissions
    .filter((item) => item.type === 'recyclable')
    .reduce((sum, item) => sum + (item.weightKg || 0), 0);

  // Explanation:
  // - totalWasteKg: pulled from bill.breakdown.weightKg which is computed by the backend
  //   (BillingService reads CollectionData weight and uses Municipality rates to compute base amounts).
  // - recyclingCredit: pulled from bill.breakdown.recyclingCredit which sums all 'recyclable' submissions' feeOrCredit.
  // - recycledWeight: computed locally from submissions[] array. The backend provides submissions for the same
  //   period, but the UI aggregates the weight for presentation.

  const dueInfo = useMemo(() => deriveDueInfo(bill?.period), [bill?.period]);

  const summaryCards = useMemo(
    () => [
      {
        title: 'Current Bill',
        amount: bill ? formatCurrency(bill.amount) : 'LK 0',
        subtext: bill && bill.status === 'paid' ? 'Paid' : 'Pending Payment',
        gradient: 'from-[#5C8DFF] to-[#3454FF]',
      },
      {
        title: 'This Month',
        amount: totalWasteKg ? `${totalWasteKg}kg` : '0kg',
        subtext: 'Total Waste',
        gradient: 'from-[#58C27D] to-[#3FA56B]',
      },
      {
        title: 'Recycled',
        amount: recycledWeight ? `${recycledWeight}kg` : '0kg',
        subtext: recyclingCredit ? `-${formatCurrency(recyclingCredit)}` : '+LK 0 credit',
        gradient: 'from-[#9C6DFF] to-[#6A38FF]',
      },
      {
        title: 'Due Date',
        amount: dueInfo.label,
        subtext: dueInfo.subtext,
        gradient: 'from-[#FF8B5E] to-[#FF5A3C]',
      },
    ],
    [bill, dueInfo, recycledWeight, recyclingCredit, totalWasteKg]
  );

  const wasteCharges = useMemo(
    () => [
      {
        label: `Weight Charges (${totalWasteKg}kg)`,
        amount: formatCurrency(bill?.breakdown?.base || 0),
      },
    ],
    [bill?.breakdown?.base, totalWasteKg]
  );

  const adjustments = useMemo(
    () => [
      {
        label: 'Special Waste Fees',
        value: bill?.breakdown?.extraFee || 0,
        positive: false,
      },
      {
        label: 'Recyclable Credits',
        value: recyclingCredit || 0,
        positive: true,
      },
    ],
    [bill?.breakdown?.extraFee, recyclingCredit]
  );

  function handlePayNow() {
    if (!bill) {
      alert('No bill loaded');
      return;
    }

    setError('');
    // Transition into the guided payment journey.
    navigate('/payments/select');
  }

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
                }`}
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

        {/* Getting a weird left margin for this class please check */}
        <div className="flex flex-1 flex-col lg:ml-54">
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
                <h1 className="text-3xl font-bold text-slate-900">Trash Data</h1>
                <p className="mt-1 text-sm text-slate-500">
                  Manage your waste collection bills and payments
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
                  placeholder="Search for something"
                  className="h-11 w-full rounded-xl border border-transparent bg-white pl-11 pr-4 text-sm text-slate-600 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
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
            <div className="flex items-center justify-between px-6">
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-emerald-500">Collection Zone</p>
                <p className="text-sm text-slate-500">Municipal Area Verified</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Current Period
                </p>
                <p className="text-sm font-semibold text-slate-700">
                  {formatPeriod(bill?.period) || 'August 2025'}
                </p>
              </div>
            </div>

            <section className="mt-6 grid gap-5 px-6 sm:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((card) => (
                <article
                  key={card.title}
                  className={`rounded-3xl bg-gradient-to-br ${card.gradient} p-6 text-white shadow-md`}
                >
                  <p className="text-sm font-semibold uppercase tracking-wide text-white/80">
                    {card.title}
                  </p>
                  <p className="mt-6 text-3xl font-bold">{card.amount}</p>
                  <p className="mt-3 text-sm text-white/80">{card.subtext}</p>
                </article>
              ))}
            </section>

            <section className="mt-6 grid gap-6 px-6 lg:grid-cols-[1.35fr_minmax(0,1fr)]">
              <article className="rounded-3xl bg-white p-6 shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Quick Payment</h2>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      {dueInfo.label ? `Due in ${dueInfo.label}` : 'Due soon'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Auto reminder ON
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-emerald-50 p-6">
                  <p className="text-sm text-emerald-600">Amount Due</p>
                  <p className="mt-3 text-4xl font-bold text-emerald-700">
                    {bill ? formatCurrency(bill.amount) : 'LK 0'}
                  </p>
                  <p className="mt-1 text-sm text-emerald-600">
                    {bill?.period
                      ? `Billed on ${formatPeriod(bill.period)}`
                      : 'Billed on September 3, 2025'}
                  </p>
                </div>

                <button
                  type="button"
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-lg font-semibold text-white shadow-lg transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-300"
                  onClick={handlePayNow}
                  disabled={!bill || bill.status === 'paid'}
                >
                  {bill?.status === 'paid' ? 'Paid' : 'Pay Now'}
                </button>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-emerald-200 hover:text-emerald-600"
                  >
                    Saved Cards
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-emerald-200 hover:text-emerald-600"
                  >
                    E-Receipt
                  </button>
                </div>
              </article>

              <article className="rounded-3xl bg-white p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Collection Information</h2>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                    {bill?.billingModelUsed ? `${bill.billingModelUsed.replace('-', ' ')}` : 'Weight-Based'}
                  </span>
                </div>
                <div className="mt-6 space-y-5 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Address</p>
                    <p className="mt-1 font-semibold text-slate-700">
                      {user?.address?.line1 || '120 A, Galle Road, Colombo'}
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-emerald-600">
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-3 w-3"
                        >
                          <path d="m5.5 12.5 3.5 3.5 9-9" />
                        </svg>
                      </span>
                      Municipal Area Verified
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Billing Information</p>
                    <p className="mt-1 font-semibold text-slate-700">
                      Current Model: {bill?.billingModelUsed ? bill.billingModelUsed.replace('-', ' ') : 'Weight-Based'}
                    </p>
                    <p className="mt-1 text-slate-500">Collection Day: Monday & Thursday</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">Payment Method</p>
                    <p className="mt-1 font-semibold text-slate-700">
                      {user?.paymentMethods?.[0]
                        ? `Visa **** ${user.paymentMethods[0].split('-').pop()}`
                        : 'Visa **** 1234'}
                    </p>
                    <p className="mt-1 text-slate-500">Next Auto-Pay: September 5, 2025</p>
                  </div>
                </div>
              </article>
            </section>

            <section className="mt-6 px-6">
              <article className="rounded-3xl bg-white p-6 shadow-lg">
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Billing Breakdown</h2>
                    <p className="text-sm text-slate-500">Effective in your district</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                      Weight Based Billing
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                      {municipality?.name || 'Colombo District'} Model
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                      Rate: {formatCurrency(municipality?.weightRatePerKg || 10)}/kg
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-500">Waste Charges</h3>
                    <div className="space-y-3">
                      {wasteCharges.map((item) => (
                        <div key={item.label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                          <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                          <span className="text-sm font-semibold text-slate-900">{item.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-500">Adjustments</h3>
                    <div className="space-y-3">
                      {adjustments.map((item) => (
                        <div
                          key={item.label}
                          className={`flex items-center justify-between rounded-2xl px-4 py-3 ${
                            item.positive ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'
                          }`}
                        >
                          <span className="text-sm font-semibold">{item.label}</span>
                          <span className="text-sm font-semibold">
                            {`${item.positive ? '-' : ''}${formatCurrency(
                              Math.abs(item.value || 0)
                            )}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 rounded-2xl bg-emerald-500 px-6 py-4 text-white">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm font-semibold uppercase tracking-wide text-white/80">
                      Total Amount
                    </span>
                    <span className="text-3xl font-bold">{bill ? formatCurrency(bill.amount) : 'LK 0'}</span>
                  </div>
                  <p className="mt-2 text-xs text-white/80">
                    Includes waste handling, municipal service fees, and recycling credits.
                  </p>
                </div>

              </article>
            </section>

            {error ? (
              <div className="mx-6 mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}
          </main>
          {loading ? (
            <div className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center bg-slate-900/10 backdrop-blur-sm lg:ml-72">
              <div className="rounded-xl bg-white px-6 py-4 text-sm font-medium text-slate-600 shadow-lg">
                Loading billing data...
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default PaymentDashboard;
