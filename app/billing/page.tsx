'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import QuickSendModal from '@/components/QuickSendModal';
import {
  CreditCard, Zap, Crown, CheckCircle2, ArrowRight, Globe,
  MessageSquare, Mail, Send, Users, Shield, Star, TrendingUp, Check
} from 'lucide-react';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    annualPrice: 24,
    color: 'from-slate-500 to-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    highlight: false,
    icon: Zap,
    features: [
      '1,000 SMS / month',
      '500 WhatsApp messages',
      '5,000 emails / month',
      '500 contacts',
      '3 countries',
      '1 team seat',
      'Basic analytics',
      'Email support',
    ],
    limits: { sms: 1000, wa: 500, email: 5000, contacts: 500, countries: 3, seats: 1 },
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 99,
    annualPrice: 83,
    color: 'from-indigo-500 to-violet-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    highlight: true,
    icon: TrendingUp,
    features: [
      '10,000 SMS / month',
      '5,000 WhatsApp messages',
      '50,000 emails / month',
      '10,000 contacts',
      '20 countries',
      '5 team seats',
      'Advanced analytics',
      'Priority support',
      'API access',
      'Custom templates',
    ],
    limits: { sms: 10000, wa: 5000, email: 50000, contacts: 10000, countries: 20, seats: 5 },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 349,
    annualPrice: 291,
    color: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    highlight: false,
    icon: Crown,
    features: [
      'Unlimited SMS',
      'Unlimited WhatsApp',
      'Unlimited emails',
      'Unlimited contacts',
      'Global (180+ countries)',
      'Unlimited team seats',
      'Real-time SLA (99.99%)',
      'Dedicated Account Manager',
      'Custom webhooks & ETL',
      'SOC2 / HIPAA compliance',
    ],
    limits: { sms: 999999, wa: 999999, email: 999999, contacts: 999999, countries: 180, seats: 999 },
  },
];

const USAGE = {
  sms: { used: 3240, limit: 10000, label: 'SMS Messages' },
  wa: { used: 1840, limit: 5000, label: 'WhatsApp Messages' },
  email: { used: 22400, limit: 50000, label: 'Emails' },
  contacts: { used: 4200, limit: 10000, label: 'Contacts' },
};

export default function BillingPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQuickSendOpen, setIsQuickSendOpen] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const [currentPlan, setCurrentPlan] = useState('growth');
  const [upgradedNotice, setUpgradedNotice] = useState<string | null>(null);

  const handleSelectPlan = (planId: string, planName: string) => {
    if (planId === currentPlan) return;
    setCurrentPlan(planId);
    setUpgradedNotice(`Plan changed to ${planName}! Your usage limits have been updated.`);
    setTimeout(() => setUpgradedNotice(null), 3500);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenQuickSend={() => setIsQuickSendOpen(true)}
        orgName="Acme Corp"
        planName={currentPlan === 'growth' ? 'Growth' : currentPlan === 'enterprise' ? 'Enterprise' : 'Starter'}
        userRole="SUPER_ADMIN"
        balance={87.50}
      />
      <Topbar
        title="Billing & Subscription"
        subtitle="Manage your SaaS tier, payment methods, and monthly consumption"
        dbConnected
        onMenuToggle={() => setIsSidebarOpen(true)}
      />

      <main className="lg:ml-[260px] pt-20 px-4 sm:px-6 lg:px-8 pb-12 min-h-screen">
        <div className="max-w-[1500px] mx-auto space-y-8">

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
                <p className="text-indigo-100 text-xs sm:text-sm mt-1">
                  ${currentPlan === 'growth' ? (isAnnual ? 83 : 99) : currentPlan === 'enterprise' ? (isAnnual ? 291 : 349) : (isAnnual ? 24 : 29)}/month · Renews Nov 15, 2026 via Credit Card (•••• 4242)
                </p>
              </div>
              <div className="flex gap-2.5 flex-wrap">
                <button
                  onClick={() => alert('Card ending in 4242 is verified.')}
                  className="px-4 py-2 bg-white text-indigo-700 rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  Manage Payment
                </button>
                <button
                  onClick={() => alert('Downloading invoice for October 2026.')}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-medium text-xs transition-all backdrop-blur-sm cursor-pointer"
                >
                  Invoices
                </button>
              </div>
            </div>
            <div className="absolute right-0 top-0 w-56 h-56 bg-white/5 rounded-full -translate-y-1/4 translate-x-1/4 pointer-events-none" />
          </div>

          {/* Usage Meters */}
          <div>
            <h3 className="text-base font-bold text-[var(--text-heading)] mb-4">Monthly Quota & Usage</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(USAGE).map(([key, u], i) => {
                const pct = Math.round((u.used / u.limit) * 100);
                const icons: Record<string, any> = { sms: Send, wa: MessageSquare, email: Mail, contacts: Users };
                const Icon = icons[key];
                const colors = ['text-indigo-600', 'text-green-600', 'text-cyan-600', 'text-amber-600'];
                return (
                  <div key={key} className="zs-card p-4.5 animate-fade-in-up">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center">
                        <Icon className={`w-3.5 h-3.5 ${colors[i]}`} />
                      </div>
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">{u.label}</span>
                    </div>
                    <p className="text-2xl font-bold text-[var(--text-heading)]">{u.used.toLocaleString()}</p>
                    <p className="text-[11px] text-[var(--text-muted)] mb-3">of {u.limit.toLocaleString()} included</p>
                    <div className="zs-progress-track">
                      <div
                        className="zs-progress-bar"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-2 text-[11px]">
                      <span className="text-[var(--text-muted)]">Consumption</span>
                      <span className={`font-semibold ${colors[i]}`}>{pct}% used</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pricing Plans */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-heading)]">Available Plans</h3>
                <p className="text-xs text-[var(--text-muted)]">Upgrade or downgrade anytime. Unused quota rolls over.</p>
              </div>

              {/* Billing Cycle Toggle */}
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
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded-full">Save 17%</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {PLANS.map((plan, i) => {
                const Icon = plan.icon;
                const isCurrent = plan.id === currentPlan;
                return (
                  <div
                    key={plan.id}
                    className={`zs-card p-6 relative transition-all flex flex-col justify-between ${
                      plan.highlight
                        ? 'border-indigo-400 ring-2 ring-indigo-300 shadow-xl shadow-indigo-100'
                        : 'hover:border-indigo-200 hover:shadow-md'
                    }`}
                  >
                    {plan.highlight && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md whitespace-nowrap">
                          ⭐ Recommended
                        </span>
                      </div>
                    )}

                    <div>
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4 shadow-sm text-white`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <h4 className="text-lg font-bold text-[var(--text-heading)]">{plan.name}</h4>
                      <div className="flex items-baseline gap-1 mt-1 mb-4">
                        <span className="text-3xl font-black text-[var(--text-heading)]">
                          ${isAnnual ? plan.annualPrice : plan.price}
                        </span>
                        <span className="text-xs text-[var(--text-muted)] font-medium">/month</span>
                        {isAnnual && (
                          <span className="text-[10px] text-emerald-600 font-semibold ml-1">billed annually</span>
                        )}
                      </div>

                      <ul className="space-y-2.5 mb-6 border-t border-[var(--border-subtle)] pt-4">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                            <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => handleSelectPlan(plan.id, plan.name)}
                      className={`w-full py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)] cursor-default'
                          : plan.highlight
                          ? 'zs-btn-primary justify-center'
                          : 'zs-btn-secondary justify-center hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200'
                      }`}
                      disabled={isCurrent}
                    >
                      {isCurrent ? '✓ Current Plan' : `Switch to ${plan.name}`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </main>

      <QuickSendModal
        isOpen={isQuickSendOpen}
        onClose={() => setIsQuickSendOpen(false)}
      />
    </div>
  );
}
