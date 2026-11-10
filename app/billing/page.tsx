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
    color: 'from-slate-700 to-slate-800',
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
    color: 'from-cyan-600 to-blue-700',
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
    <div className="min-h-screen text-white bg-[var(--bg-main)]">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenQuickSend={() => setIsQuickSendOpen(true)}
      />
      <Topbar
        title="Billing & Wallets"
        subtitle="Manage cloud PaaS subscriptions, carrier wallet balance & billing history"
        dbConnected
        onMenuToggle={() => setIsSidebarOpen(true)}
        actions={
          <button
            onClick={() => setIsRefillOpen(true)}
            className="vision-btn-primary text-xs py-2 px-3.5 shadow-md flex items-center gap-1.5"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Refill Balance</span>
          </button>
        }
      />

      <main className="lg:pl-[260px] pl-0 w-full min-h-screen pt-20 sm:pt-24 pb-16 px-3.5 sm:px-6 lg:px-8 max-w-[1600px] mx-auto space-y-5 sm:space-y-6 overflow-x-hidden">

        {/* Hero Card with Wallet Info */}
        <div className="vision-hero-card p-5 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative z-10 space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-cyan-300 border border-blue-400/30 text-xs font-bold mb-1">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Enterprise PaaS Wallet</span>
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Carrier Credits &amp; Subscriptions
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium leading-relaxed">
              Maintain an active credit balance for Toll-Free &amp; Local 10DLC messaging routes with automatic refill protection.
            </p>
          </div>

          <div className="flex items-center gap-3 relative z-10 self-stretch sm:self-auto">
            <div className="p-3.5 rounded-2xl bg-white/[0.08] border border-white/10 text-right flex-1 sm:flex-initial">
              <p className="text-[10px] font-bold text-slate-300 uppercase">Available Credits</p>
              <p className="text-2xl font-black font-mono text-cyan-300 mt-0.5">$64.84</p>
            </div>
            <button
              onClick={() => setIsRefillOpen(true)}
              className="vision-btn-primary text-xs py-3 px-4 flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <DollarSign className="w-4 h-4" />
              <span>Add Credits</span>
            </button>
          </div>
        </div>

        {upgradedNotice && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2 animate-fade-in-up">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{upgradedNotice}</span>
          </div>
        )}

        {/* Plan Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            const Icon = plan.icon;
            const price = isAnnual ? plan.annualPriceUSD : plan.priceUSD;

            return (
              <div
                key={plan.id}
                className={`vision-card p-6 flex flex-col justify-between relative ${
                  plan.highlight ? 'border-blue-500/50 shadow-[0_0_25px_rgba(0,117,255,0.25)]' : ''
                }`}
              >
                {plan.highlight && (
                  <span className="absolute top-4 right-4 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 text-white shadow-md">
                    Most Popular
                  </span>
                )}

                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-cyan-400 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white">{plan.name}</h3>
                      <p className="text-xs text-slate-400">Enterprise SLA Tier</p>
                    </div>
                  </div>

                  <div className="mt-5 mb-6">
                    <span className="text-3xl font-black font-mono text-white">${price}</span>
                    <span className="text-xs text-slate-400"> / month</span>
                  </div>

                  <div className="space-y-2.5 pt-4 border-t border-white/5">
                    {plan.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    onClick={() => handleSelectPlan(plan.id, plan.name)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : plan.highlight
                        ? 'vision-btn-primary shadow-lg'
                        : 'vision-btn-glass'
                    }`}
                  >
                    {isCurrent ? 'Current Active Tier' : 'Upgrade Plan'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </main>

      {/* Refill Balance Modal */}
      {isRefillOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="vision-card w-full max-w-sm p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-cyan-400" />
                <span>Refill PaaS Credits</span>
              </h3>
              <button onClick={() => setIsRefillOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                Choose credit top-up amount for instant Telnyx carrier replenishment:
              </p>
              <div className="grid grid-cols-3 gap-2">
                {['25', '50', '100'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setRefillAmount(amt)}
                    className={`py-2 rounded-xl text-xs font-black font-mono transition-all cursor-pointer ${
                      refillAmount === amt
                        ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(0,117,255,0.6)]'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    +${amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsRefillOpen(false)}
                className="vision-btn-glass text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(`Refilled $${refillAmount} in carrier credits!`);
                  setIsRefillOpen(false);
                }}
                className="vision-btn-primary text-xs py-2 px-4"
              >
                Confirm Payment
              </button>
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
