'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import QuickSendModal from '@/components/QuickSendModal';
import {
  CreditCard, Zap, Crown, CheckCircle2,
  MessageSquare, Mail, Send, Users, TrendingUp, Check,
  DollarSign, Sparkles, Shield, Receipt, ArrowRight, X
} from 'lucide-react';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter Cloud',
    priceUSD: 29,
    annualPriceUSD: 24,
    color: 'from-slate-500 to-slate-600',
    highlight: false,
    icon: Zap,
    features: [
      '2,500 Outbound SMS / month (US & Canada)',
      '1,000 WhatsApp Suite messages',
      '10,000 Marketing Emails',
      '1,000 Verified Contacts',
      'Dual Telnyx Toll-Free & Local routes',
      'WhatsApp-like Real-time Inbox',
      'Standard Support',
    ],
    limits: { sms: 2500, wa: 1000, email: 10000, contacts: 1000, seats: 2 },
  },
  {
    id: 'growth',
    name: 'Growth Omnichannel',
    priceUSD: 99,
    annualPriceUSD: 79,
    color: 'from-blue-600 to-indigo-600',
    highlight: true,
    icon: TrendingUp,
    features: [
      '15,000 Outbound SMS / month (US & Canada)',
      '5,000 WhatsApp Suite messages',
      '50,000 Marketing Emails',
      '10,000 Verified Contacts',
      'Dedicated Messaging Profiles',
      'WhatsApp Interactive Templates & CTA',
      'Role-Based Access Control (Admin & Super Admin)',
      'Priority Carrier Escalation',
    ],
    limits: { sms: 15000, wa: 5000, email: 50000, contacts: 10000, seats: 10 },
  },
  {
    id: 'enterprise',
    name: 'Enterprise PaaS',
    priceUSD: 349,
    annualPriceUSD: 299,
    color: 'from-slate-700 to-slate-800',
    highlight: false,
    icon: Crown,
    features: [
      '75,000 Outbound SMS / month (US & Canada)',
      '25,000 WhatsApp Suite messages',
      '250,000 Marketing Emails',
      'Unlimited Audience Contacts',
      'Unlimited Team Seats & RBAC Roles',
      'Dedicated Telnyx 10DLC Brand Registration',
      'Custom DKIM/SPF Email Whitelisting',
      '24/7 Dedicated Account Manager',
    ],
    limits: { sms: 75000, wa: 25000, email: 250000, contacts: 999999, seats: 999 },
  },
];

const INVOICE_HISTORY = [
  { id: 'INV-2026-081', month: 'October 2026', amount: 99.0, status: 'paid', plan: 'Growth Omnichannel' },
  { id: 'INV-2026-042', month: 'September 2026', amount: 99.0, status: 'paid', plan: 'Growth Omnichannel' },
];

export default function BillingPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQuickSendOpen, setIsQuickSendOpen] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const [currentPlan, setCurrentPlan] = useState('growth');
  const [upgradedNotice, setUpgradedNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'plans' | 'invoices'>('plans');
  const [isRefillOpen, setIsRefillOpen] = useState(false);
  const [refillAmount, setRefillAmount] = useState('50');

  const handleSelectPlan = (planId: string, planName: string) => {
    setCurrentPlan(planId);
    setUpgradedNotice(`Successfully transitioned to ${planName} plan!`);
    setTimeout(() => setUpgradedNotice(null), 4000);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenQuickSend={() => setIsQuickSendOpen(true)}
      />
      <Topbar
        title="Billing & Subscription Plans"
        subtitle="Manage Product-as-a-Service tiers, message refill balances, and billing invoices"
        dbConnected
        onMenuToggle={() => setIsSidebarOpen(true)}
      />

      <main className="lg:ml-[240px] pt-20 px-4 sm:px-6 lg:px-8 pb-12 min-h-screen">
        <div className="max-w-[1500px] mx-auto space-y-6">

          {/* Banner */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold mb-2">
                <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                <span>PaaS Subscription Management</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">Flexible SaaS Pricing Plans</h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
                Transparent USD pricing with high-throughput US & Canada SMS dispatch, WhatsApp Suite, and Email delivery.
              </p>
            </div>

            <button
              onClick={() => setIsRefillOpen(true)}
              className="zs-btn-primary shadow-md text-xs py-2.5 px-5 self-start sm:self-auto cursor-pointer flex items-center gap-2"
            >
              <DollarSign className="w-4 h-4" />
              <span>Add Account Credits</span>
            </button>
          </div>

          {upgradedNotice && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-fade-in-up">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{upgradedNotice}</span>
            </div>
          )}

          {/* Billing Interval Switcher */}
          <div className="flex justify-center items-center gap-3">
            <span className={`text-xs font-bold ${!isAnnual ? 'text-blue-500' : 'text-[var(--text-muted)]'}`}>
              Monthly Billing
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="w-12 h-6 rounded-full bg-blue-600 p-0.5 transition-colors cursor-pointer relative"
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${isAnnual ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
            <span className={`text-xs font-bold ${isAnnual ? 'text-blue-500' : 'text-[var(--text-muted)]'}`}>
              Annual Billing <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1.5 py-0.5 rounded-full ml-1">Save 20%</span>
            </span>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              const isSelected = currentPlan === plan.id;
              const price = isAnnual ? plan.annualPriceUSD : plan.priceUSD;

              return (
                <div
                  key={plan.id}
                  className={`zs-card p-6 flex flex-col justify-between relative transition-all ${
                    plan.highlight
                      ? 'border-2 border-blue-500 shadow-xl'
                      : 'border-[var(--border-color)]'
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-extrabold uppercase px-3 py-0.5 rounded-full shadow-xs">
                      Most Popular
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold shadow-xs">
                        <Icon className="w-5 h-5" />
                      </div>
                      {isSelected && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          Current Plan
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-[var(--text-heading)]">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mt-2 mb-4">
                      <span className="text-3xl font-black text-blue-500">${price}</span>
                      <span className="text-xs text-[var(--text-muted)] font-semibold">/ month</span>
                    </div>

                    <div className="space-y-2.5 pt-2 border-t border-[var(--border-subtle)] text-xs">
                      {plan.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <span className="text-[var(--text-secondary)]">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6">
                    <button
                      onClick={() => handleSelectPlan(plan.id, plan.name)}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : plan.highlight
                          ? 'zs-btn-primary justify-center shadow-md'
                          : 'zs-btn-secondary justify-center'
                      }`}
                    >
                      {isSelected ? 'Active Plan' : `Upgrade to ${plan.name}`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Invoices History */}
          <div className="zs-card overflow-hidden">
            <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--text-heading)]">Past Invoices & Receipts</h3>
              <Receipt className="w-4 h-4 text-[var(--text-muted)]" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)] font-bold uppercase tracking-wider border-b border-[var(--border-color)]">
                  <tr>
                    <th className="py-3 px-4">Invoice ID</th>
                    <th className="py-3 px-4">Billing Period</th>
                    <th className="py-3 px-4">Plan Name</th>
                    <th className="py-3 px-4 text-right">Amount (USD)</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {INVOICE_HISTORY.map((inv) => (
                    <tr key={inv.id} className="hover:bg-[var(--bg-elevated)] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-blue-500">{inv.id}</td>
                      <td className="py-3.5 px-4 font-semibold text-[var(--text-secondary)]">{inv.month}</td>
                      <td className="py-3.5 px-4">{inv.plan}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold">${inv.amount.toFixed(2)}</td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

      {/* Credit Refill Modal */}
      {isRefillOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in-up">
          <div className="w-full max-w-md bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-2xl p-6">
            <h2 className="text-sm font-bold text-[var(--text-heading)] mb-1">Add Account Message Balance</h2>
            <p className="text-xs text-[var(--text-muted)] mb-4">Recharges Telnyx Toll-Free and Local balance instantly</p>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {['25', '50', '100'].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setRefillAmount(amt)}
                    className={`py-3 rounded-xl text-xs font-bold border transition-all ${
                      refillAmount === amt
                        ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                        : 'border-[var(--border-color)] hover:bg-[var(--bg-elevated)]'
                    }`}
                  >
                    ${amt} USD
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Custom Amount ($)</label>
                <input
                  type="number"
                  value={refillAmount}
                  onChange={(e) => setRefillAmount(e.target.value)}
                  className="zs-input text-xs font-mono"
                  placeholder="50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-color)]">
                <button
                  onClick={() => setIsRefillOpen(false)}
                  className="zs-btn-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setIsRefillOpen(false);
                    setUpgradedNotice(`Added $${refillAmount} USD to balance!`);
                    setTimeout(() => setUpgradedNotice(null), 4000);
                  }}
                  className="zs-btn-primary text-xs py-2 px-5"
                >
                  Confirm Recharge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <QuickSendModal
        isOpen={isQuickSendOpen}
        onClose={() => setIsQuickSendOpen(false)}
      />
    </div>
  );
}
