'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import QuickSendModal from '@/components/QuickSendModal';
import {
  CreditCard, Zap, Crown, CheckCircle2,
  MessageSquare, Mail, Send, Users, TrendingUp, Check,
  IndianRupee, Sparkles, Shield, Receipt
} from 'lucide-react';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    priceINR: 1999,
    annualPriceINR: 1666,
    color: 'from-slate-500 to-slate-600',
    highlight: false,
    icon: Zap,
    features: [
      '1,000 SMS / month (India)',
      '500 WhatsApp messages',
      '5,000 emails / month',
      '500 contacts',
      '1 team seat',
      'Basic analytics',
      'Email support',
      'Fast2SMS route (DLT-free)',
    ],
    limits: { sms: 1000, wa: 500, email: 5000, contacts: 500, seats: 1 },
  },
  {
    id: 'growth',
    name: 'Growth',
    priceINR: 6999,
    annualPriceINR: 5832,
    color: 'from-indigo-500 to-violet-600',
    highlight: true,
    icon: TrendingUp,
    features: [
      '10,000 SMS / month (India)',
      '5,000 WhatsApp messages',
      '50,000 emails / month',
      '10,000 contacts',
      '5 team seats',
      'Advanced analytics & reports',
      'Priority support',
      'API access',
      'Custom templates',
      'Telnyx / Fast2SMS routing',
    ],
    limits: { sms: 10000, wa: 5000, email: 50000, contacts: 10000, seats: 5 },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceINR: 24999,
    annualPriceINR: 20832,
    color: 'from-amber-500 to-orange-600',
    highlight: false,
    icon: Crown,
    features: [
      'Unlimited SMS (India)',
      'Unlimited WhatsApp',
      'Unlimited emails',
      'Unlimited contacts',
      'Unlimited team seats',
      'Real-time SLA (99.9%)',
      'Dedicated Account Manager',
      'Custom webhooks & ETL',
      'White-label dashboard',
      'GST Invoice on request',
    ],
    limits: { sms: 999999, wa: 999999, email: 999999, contacts: 999999, seats: 999 },
  },
];

const USAGE = {
  sms: { used: 0, limit: 10000, label: 'SMS Messages' },
  wa: { used: 0, limit: 5000, label: 'WhatsApp Messages' },
  email: { used: 0, limit: 50000, label: 'Emails' },
  contacts: { used: 0, limit: 10000, label: 'Contacts' },
};

const INVOICE_HISTORY = [
  { id: 'INV-2024-001', month: 'October 2024', amount: 6999, status: 'paid', gst: true },
  { id: 'INV-2024-002', month: 'September 2024', amount: 6999, status: 'paid', gst: true },
];

export default function BillingPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQuickSendOpen, setIsQuickSendOpen] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const [currentPlan, setCurrentPlan] = useState('growth');
  const [upgradedNotice, setUpgradedNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'usage' | 'plans' | 'invoices'>('usage');

  const handleSelectPlan = (planId: string, planName: string) => {
    if (planId === currentPlan) return;
    setCurrentPlan(planId);
    setUpgradedNotice(`Plan changed to ${planName}! Your usage limits have been updated.`);
    setTimeout(() => setUpgradedNotice(null), 3500);
  };

  const plan = PLANS.find(p => p.id === currentPlan)!;
  const displayPrice = isAnnual ? plan.annualPriceINR : plan.priceINR;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenQuickSend={() => setIsQuickSendOpen(true)}
        orgName="ZenithServices"
        planName={currentPlan === 'growth' ? 'Growth' : currentPlan === 'enterprise' ? 'Enterprise' : 'Starter'}
        userRole="SUPER_ADMIN"
        balance={0}
      />
      <Topbar
        title="Billing & Subscription"
        subtitle="Manage your plan, usage quota, and invoices — India pricing in ₹ INR"
        dbConnected
        onMenuToggle={() => setIsSidebarOpen(true)}
      />

      <main className="lg:ml-[260px] pt-20 px-4 sm:px-6 lg:px-8 pb-12 min-h-screen">
        <div className="max-w-[1500px] mx-auto space-y-6">

          {upgradedNotice && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex items-center gap-2.5 animate-fade-in shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{upgradedNotice}</span>
            </div>
          )}

          {/* Current Plan Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 p-6 sm:p-8 text-white shadow-xl shadow-indigo-200 animate-fade-in">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <span className="text-xs uppercase tracking-widest font-bold text-indigo-200 bg-white/10 px-2.5 py-1 rounded-full">
                  Active Subscription
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold mt-2 capitalize">{currentPlan} Plan</h2>
                <p className="text-indigo-100 text-xs sm:text-sm mt-1 flex items-center gap-1">
                  <IndianRupee className="w-3.5 h-3.5" />
                  {displayPrice.toLocaleString('en-IN')}/month
                  {isAnnual ? ' (billed annually)' : ''} · Renews 15 Nov 2024
                </p>
                <p className="text-indigo-200 text-xs mt-0.5">Prices inclusive of 18% GST</p>
              </div>
              <div className="flex gap-2.5 flex-wrap">
                <button
                  onClick={() => alert('Contact support@zenithservices.in to update payment.')}
                  className="px-4 py-2 bg-white text-indigo-700 rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  Manage Payment
                </button>
                <button
                  onClick={() => setActiveTab('invoices')}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-medium text-xs transition-all backdrop-blur-sm cursor-pointer"
                >
                  <Receipt className="w-3.5 h-3.5 inline mr-1" />
                  Invoices
                </button>
              </div>
            </div>
            <div className="absolute right-0 top-0 w-56 h-56 bg-white/5 rounded-full -translate-y-1/4 translate-x-1/4 pointer-events-none" />
          </div>

          {/* Tabs */}
          <div className="zs-tab-list max-w-md">
            {(['usage', 'plans', 'invoices'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`zs-tab capitalize text-xs ${activeTab === t ? 'active' : ''}`}
              >
                {t === 'usage' ? '📊 Usage' : t === 'plans' ? '🚀 Plans' : '🧾 Invoices'}
              </button>
            ))}
          </div>

          {/* ── Usage Tab ──────────────────────────────────────────────────── */}
          {activeTab === 'usage' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-base font-bold text-[var(--text-heading)]">Monthly Quota & Usage</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(USAGE).map(([key, u]) => {
                  const pct = u.limit > 0 ? Math.round((u.used / u.limit) * 100) : 0;
                  const icons: Record<string, any> = { sms: Send, wa: MessageSquare, email: Mail, contacts: Users };
                  const Icon = icons[key];
                  const colors = ['text-indigo-600', 'text-green-600', 'text-cyan-600', 'text-amber-600'];
                  const idx = Object.keys(USAGE).indexOf(key);
                  return (
                    <div key={key} className="zs-card p-4 animate-fade-in-up">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center">
                          <Icon className={`w-3.5 h-3.5 ${colors[idx]}`} />
                        </div>
                        <span className="text-xs font-semibold text-[var(--text-secondary)]">{u.label}</span>
                      </div>
                      <p className="text-2xl font-bold text-[var(--text-heading)]">{u.used.toLocaleString()}</p>
                      <p className="text-[11px] text-[var(--text-muted)] mb-3">of {u.limit.toLocaleString()} included</p>
                      <div className="zs-progress-track">
                        <div className="zs-progress-bar" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex justify-between items-center mt-2 text-[11px]">
                        <span className="text-[var(--text-muted)]">Consumption</span>
                        <span className={`font-semibold ${colors[idx]}`}>{pct}% used</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pricing info */}
              <div className="zs-card p-5 space-y-3">
                <h4 className="text-sm font-bold text-[var(--text-heading)]">Per-Message Pricing (Pay-as-you-go overage)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'SMS (India, Fast2SMS)', price: '₹0.15–0.30 / SMS', note: 'Quick route, non-DLT', color: 'bg-indigo-50 border-indigo-200 text-indigo-800' },
                    { label: 'WhatsApp (Meta API)', price: '₹0.40–0.70 / conversation', note: 'Per 24-hr window', color: 'bg-green-50 border-green-200 text-green-800' },
                    { label: 'Email', price: '₹0.01 / email', note: 'Via SMTP relay', color: 'bg-cyan-50 border-cyan-200 text-cyan-800' },
                  ].map((item) => (
                    <div key={item.label} className={`p-4 rounded-xl border ${item.color}`}>
                      <p className="text-xs font-bold">{item.label}</p>
                      <p className="text-base font-black mt-1">{item.price}</p>
                      <p className="text-[11px] opacity-70 mt-0.5">{item.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Plans Tab ──────────────────────────────────────────────────── */}
          {activeTab === 'plans' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-heading)]">Available Plans</h3>
                  <p className="text-xs text-[var(--text-muted)]">All prices in ₹ INR. GST applicable at 18%.</p>
                </div>

                <div className="flex items-center gap-1 bg-[var(--bg-elevated)] rounded-xl p-1 border border-[var(--border-subtle)] self-start sm:self-auto">
                  <button
                    onClick={() => setIsAnnual(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      !isAnnual ? 'bg-[var(--bg-card)] shadow-xs text-indigo-600' : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setIsAnnual(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isAnnual ? 'bg-[var(--bg-card)] shadow-xs text-indigo-600' : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    <span>Annual</span>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">Save 17%</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {PLANS.map((p) => {
                  const Icon = p.icon;
                  const isCurrent = p.id === currentPlan;
                  const priceDisplay = isAnnual ? p.annualPriceINR : p.priceINR;
                  return (
                    <div
                      key={p.id}
                      className={`zs-card p-6 relative transition-all flex flex-col justify-between ${
                        p.highlight
                          ? 'border-indigo-400 ring-2 ring-indigo-300 shadow-xl shadow-indigo-100'
                          : 'hover:border-indigo-200 hover:shadow-md'
                      }`}
                    >
                      {p.highlight && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md whitespace-nowrap">
                            ⭐ Most Popular
                          </span>
                        </div>
                      )}

                      <div>
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center mb-4 shadow-sm text-white`}>
                          <Icon className="w-5 h-5" />
                        </div>

                        <h4 className="text-lg font-bold text-[var(--text-heading)]">{p.name}</h4>
                        <div className="flex items-baseline gap-1 mt-1 mb-4">
                          <IndianRupee className="w-4 h-4 text-[var(--text-heading)]" />
                          <span className="text-3xl font-black text-[var(--text-heading)]">
                            {priceDisplay.toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs text-[var(--text-muted)] font-medium">/month</span>
                          {isAnnual && (
                            <span className="text-[10px] text-emerald-600 font-semibold ml-1">billed annually</span>
                          )}
                        </div>

                        <ul className="space-y-2.5 mb-6 border-t border-[var(--border-subtle)] pt-4">
                          {p.features.map((f) => (
                            <li key={f} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                              <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        onClick={() => handleSelectPlan(p.id, p.name)}
                        className={`w-full py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)] cursor-default'
                            : p.highlight
                            ? 'zs-btn-primary justify-center'
                            : 'zs-btn-secondary justify-center hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200'
                        }`}
                        disabled={isCurrent}
                      >
                        {isCurrent ? '✓ Current Plan' : `Switch to ${p.name}`}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 flex items-start gap-3 text-xs text-indigo-900">
                <Shield className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-600" />
                <div>
                  <span className="font-semibold">GST & Invoicing: </span>
                  All plans include GST at 18%. GST invoices are provided for Business accounts on request.
                  Contact us at <strong>billing@zenithservices.in</strong> for enterprise agreements or custom pricing.
                </div>
              </div>
            </div>
          )}

          {/* ── Invoices Tab ────────────────────────────────────────────── */}
          {activeTab === 'invoices' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-base font-bold text-[var(--text-heading)]">Invoice History</h3>
              {INVOICE_HISTORY.length === 0 ? (
                <div className="zs-card p-12 text-center">
                  <Receipt className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3 opacity-25" />
                  <p className="text-sm font-semibold text-[var(--text-heading)]">No invoices yet</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Invoices will appear here after your first billing cycle.</p>
                </div>
              ) : (
                <div className="zs-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="zs-table">
                      <thead>
                        <tr>
                          <th>Invoice ID</th>
                          <th>Period</th>
                          <th className="text-right">Amount</th>
                          <th>GST</th>
                          <th>Status</th>
                          <th className="text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {INVOICE_HISTORY.map((inv) => (
                          <tr key={inv.id}>
                            <td className="font-mono text-xs text-[var(--text-heading)]">{inv.id}</td>
                            <td className="text-xs text-[var(--text-secondary)]">{inv.month}</td>
                            <td className="text-right font-semibold text-xs">
                              ₹{inv.amount.toLocaleString('en-IN')}
                            </td>
                            <td>
                              {inv.gst
                                ? <span className="zs-badge zs-badge-success">Included</span>
                                : <span className="zs-badge zs-badge-neutral">N/A</span>
                              }
                            </td>
                            <td>
                              <span className="zs-badge zs-badge-success">Paid</span>
                            </td>
                            <td className="text-right">
                              <button
                                onClick={() => alert(`Downloading ${inv.id}...`)}
                                className="text-xs font-semibold text-indigo-600 hover:underline"
                              >
                                Download PDF
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      <QuickSendModal isOpen={isQuickSendOpen} onClose={() => setIsQuickSendOpen(false)} />
    </div>
  );
}
