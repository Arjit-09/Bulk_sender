'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import QuickSendModal from '@/components/QuickSendModal';
import {
  Globe, CheckCircle2, Send, ShieldCheck, Signal, Zap, Users,
  Radio, PhoneCall, ArrowRight, Sparkles
} from 'lucide-react';
import Link from 'next/link';

const COVERAGE_REGIONS = [
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    dial: '+1',
    region: 'North America',
    population: '335M',
    carrier: 'AT&T / T-Mobile / Verizon / US Cellular',
    route: 'Toll-Free (+18884020949) & Local 10DLC (+14795909259)',
    cost: '$0.0075',
    states: 50,
    coverage: '99.9%',
    notes: 'Direct carrier handshake across all 50 states',
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    dial: '+1',
    region: 'North America',
    population: '38M',
    carrier: 'Rogers / Bell / Telus / Freedom',
    route: 'Telnyx Verified Toll-Free (+18884020949)',
    cost: '$0.0075',
    states: 13,
    coverage: '99.6%',
    notes: 'Full coverage across 10 provinces & 3 territories',
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
      />
      <Topbar
        title="US & Canada Carrier Coverage"
        subtitle="Tier-1 telecom routing and carrier delivery SLA across North America"
        dbConnected
        onMenuToggle={() => setIsSidebarOpen(true)}
      />

      <main className="lg:ml-[240px] pt-20 px-4 sm:px-6 lg:px-8 pb-12 min-h-screen">
        <div className="max-w-[1400px] mx-auto space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/10">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-heading)]">
                  🇺🇸 United States & 🇨🇦 Canada Coverage
                </h1>
                <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                  Dual-Account Carrier Routing • 99.8% Average Deliverability
                </p>
              </div>
            </div>

            <button onClick={handleSave} className="zs-btn-primary self-start sm:self-auto cursor-pointer">
              <CheckCircle2 className="w-4 h-4" />
              <span>Verify Active Routes</span>
            </button>
          </div>

          {savedNotice && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-500 flex items-center gap-2 animate-fade-in-up">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Carrier routes verified active: All Toll-Free and Local 10DLC pathways healthy!</span>
            </div>
          )}

          {/* Dual Gateway Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="zs-card p-6 border border-[var(--border-color)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-5 h-5 text-blue-500" />
                  <h3 className="text-sm font-bold text-[var(--text-heading)]">Route 1: Toll-Free (+18884020949)</h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  Tier-1 Direct
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Dedicated for standard physical cellular carriers (AT&T, Verizon, T-Mobile, Bell, Rogers, Telus). Guarantees high-throughput messaging without consumer carrier blocks.
              </p>
            </div>

            <div className="zs-card p-6 border border-[var(--border-color)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-5 h-5 text-slate-400" />
                  <h3 className="text-sm font-bold text-[var(--text-heading)]">Route 2: Local 10DLC (+14795909259)</h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  VoIP Route
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Dedicated for US local destinations and virtual VoIP numbers (TextNow, Google Voice, Bandwidth, Onvoy) that require 10DLC local number delivery.
              </p>
            </div>
          </div>

          {/* Coverage Regions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {COVERAGE_REGIONS.map((region) => (
              <div key={region.code} className="zs-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{region.flag}</span>
                    <div>
                      <h3 className="text-base font-bold text-[var(--text-heading)]">{region.name}</h3>
                      <p className="text-xs text-[var(--text-muted)] font-mono">{region.dial} • {region.region}</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                    {region.coverage}
                  </span>
                </div>

                <div className="space-y-2 pt-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-elevated)]">
                    <span className="text-[var(--text-muted)]">Carriers</span>
                    <span className="font-semibold text-[var(--text-heading)]">{region.carrier}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-elevated)]">
                    <span className="text-[var(--text-muted)]">Route</span>
                    <span className="font-bold text-blue-500">{region.route}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-elevated)]">
                    <span className="text-[var(--text-muted)]">Cost per Message</span>
                    <span className="font-mono font-bold">{region.cost}</span>
                  </div>
                </div>

                <p className="text-[11px] text-[var(--text-muted)] italic pt-1">{region.notes}</p>
              </div>
            ))}
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
