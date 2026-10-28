'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import QuickSendModal from '@/components/QuickSendModal';
import {
  Globe, CheckCircle2, Send, ShieldCheck, Signal, Zap, Users
} from 'lucide-react';

const COVERAGE_REGIONS = [
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    dial: '+1',
    region: 'North America',
    population: '335M',
    carrier: 'AT&T / T-Mobile / Verizon / US Cellular',
    route: 'Telnyx Toll-Free (+18884020949)',
    cost: '$0.0075',
    states: 50,
    coverage: '99.8%',
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    dial: '+1',
    region: 'North America',
    population: '38M',
    carrier: 'Rogers / Bell / Telus / Freedom',
    route: 'Telnyx Toll-Free (+18884020949)',
    cost: '$0.0075',
    states: 13,
    coverage: '99.5%',
    stateLabel: 'provinces',
  },
];

export default function CountriesPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQuickSendOpen, setIsQuickSendOpen] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenQuickSend={() => setIsQuickSendOpen(true)}
        orgName="ZenithServices"
        planName="Starter"
        userRole="SUPER_ADMIN"
        balance={0}
      />
      <Topbar
        title="Coverage & Carrier Routing"
        subtitle="Verified Telnyx Toll-Free delivery for United States & Canada"
        dbConnected
        onMenuToggle={() => setIsSidebarOpen(true)}
      />

      <main className="lg:ml-[260px] pt-20 px-4 sm:px-6 lg:px-8 pb-12 min-h-screen">
        <div className="max-w-[1200px] mx-auto space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-heading)]">🇺🇸 US & 🇨🇦 Canada Routing</h1>
                <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                  2 active markets · Verified Toll-Free +18884020949 · Telnyx Carrier Network
                </p>
              </div>
            </div>

            <button onClick={handleSave} className="zs-btn-primary self-start sm:self-auto">
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Routing</span>
            </button>
          </div>

          {savedNotice && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>✅ Routing saved! All messages dispatch via Telnyx Toll-Free +18884020949</span>
            </div>
          )}

          {/* Telnyx Gateway Card */}
          <div className="zs-card p-6 border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-white">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200">
                  <ShieldCheck className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-emerald-950">Telnyx Verified Toll-Free Gateway</h2>
                  <p className="text-sm text-emerald-700 font-mono font-semibold mt-0.5">+1 (888) 402-0949</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Messaging Profile: Zenith Services · Verified ✓
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="zs-badge zs-badge-success text-xs px-3 py-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% Verified
                </span>
                <span className="text-xs text-slate-500 font-medium">$0.0075 / SMS</span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Signal, label: 'Delivery Rate', value: '99%+' },
                { icon: Zap, label: 'Avg Latency', value: '< 2 sec' },
                { icon: Users, label: 'Carriers Covered', value: '8+' },
                { icon: Globe, label: 'Markets', value: 'US & CA' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-white/80 rounded-xl p-3 border border-emerald-100 text-center">
                  <Icon className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                  <p className="text-[11px] text-slate-500 font-medium">{label}</p>
                  <p className="text-sm font-bold text-emerald-800">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-xl bg-emerald-100/60 border border-emerald-200 text-xs text-emerald-800">
              <strong>Carrier Partners:</strong> AT&T · T-Mobile · Verizon · US Cellular · Rogers · Bell · Telus · Freedom Mobile
            </div>
          </div>

          {/* Country Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {COVERAGE_REGIONS.map((c) => (
              <div
                key={c.code}
                className="zs-card p-5 border-indigo-200 bg-gradient-to-br from-indigo-50/40 to-white hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <span className="text-5xl select-none">{c.flag}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-bold text-lg text-[var(--text-heading)]">{c.name}</p>
                        <p className="text-xs text-[var(--text-muted)] font-mono">{c.dial} · {c.region}</p>
                      </div>
                      <span className="zs-badge zs-badge-success text-[10px]">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="text-slate-600">Route: <span className="font-semibold text-emerald-700">{c.route}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Signal className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                        <span className="text-slate-600">Carriers: {c.carrier}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Users className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />
                        <span className="text-slate-600">Population: {c.population} · {c.states} {c.stateLabel || 'states'}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                        <Send className="w-3 h-3" /> SMS
                      </span>
                      <span className="text-[11px] font-bold text-indigo-600">{c.cost} / SMS · {c.coverage} coverage</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Info box */}
          <div className="zs-card p-5 bg-gradient-to-br from-slate-50 to-white border-slate-200">
            <h3 className="text-sm font-bold text-[var(--text-heading)] mb-2">ℹ️ About Your Routing Setup</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              All SMS messages — whether to the United States or Canada — are dispatched exclusively via your verified
              Telnyx Toll-Free number <span className="font-mono font-semibold text-indigo-600">+18884020949</span>.
              This number is registered under your <strong>Zenith Services</strong> messaging profile and carries a{' '}
              <strong>verified sender status</strong>, ensuring maximum deliverability with zero spam filtering across
              all major US and Canadian carriers.
            </p>
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
