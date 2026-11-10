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
    <div className="min-h-screen text-white bg-[var(--bg-main)]">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenQuickSend={() => setIsQuickSendOpen(true)}
      />
      <Topbar
        title="US & Canada Coverage Hub"
        subtitle="Tier-1 telecom routing and carrier delivery SLA across North America"
        dbConnected
        onMenuToggle={() => setIsSidebarOpen(true)}
      />

      <main className="lg:pl-[260px] pl-0 w-full min-h-screen pt-20 sm:pt-24 pb-16 px-3.5 sm:px-6 lg:px-8 max-w-[1600px] mx-auto space-y-5 sm:space-y-6 overflow-x-hidden">

        {/* Hero Banner */}
        <div className="vision-hero-card p-5 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative z-10 space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-cyan-300 border border-blue-400/30 text-xs font-bold mb-1">
              <Globe className="w-3.5 h-3.5" />
              <span>Dual-Account Carrier Routing</span>
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              🇺🇸 United States &amp; 🇨🇦 Canada Coverage
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium leading-relaxed">
              Tier-1 telecom carrier delivery across all 50 US states and 13 Canadian provinces &amp; territories. 99.8% average verified delivery rate.
            </p>
          </div>

          <div className="relative z-10">
            <button
              onClick={handleSave}
              className="vision-btn-primary text-xs py-2.5 px-4 w-full sm:w-auto flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Verify Active Routes</span>
            </button>
          </div>
        </div>

        {savedNotice && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2 animate-fade-in-up">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Carrier routes verified active: All Toll-Free and Local 10DLC pathways healthy!</span>
          </div>
        )}

        {/* Dual Gateway Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="vision-card p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-cyan-400 flex items-center justify-center">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Route 1: Toll-Free (+18884020949)</h3>
                  <p className="text-[10px] text-slate-400">Physical Mobile Handshake</p>
                </div>
              </div>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Tier-1 Direct
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Dedicated for standard physical cellular carriers (AT&amp;T, Verizon, T-Mobile, Bell, Rogers, Telus). Guarantees high-throughput messaging without consumer carrier blocks.
            </p>
          </div>

          <div className="vision-card p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Route 2: Local 10DLC (+14795909259)</h3>
                  <p className="text-[10px] text-slate-400">VoIP &amp; Virtual Destination Routing</p>
                </div>
              </div>
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                VoIP Route
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Dedicated for US local destinations and virtual VoIP numbers (TextNow, Google Voice, Bandwidth, Onvoy) that require 10DLC local number delivery.
            </p>
          </div>
        </div>

        {/* Coverage Details for US & Canada */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {COVERAGE_REGIONS.map((region) => (
            <div key={region.code} className="vision-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{region.flag}</span>
                  <div>
                    <h3 className="text-base font-black text-white">{region.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">{region.dial} • {region.region}</p>
                  </div>
                </div>
                <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full font-mono">
                  {region.coverage} SLA
                </span>
              </div>

              <div className="space-y-2 pt-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-slate-400 font-medium">Carriers</span>
                  <span className="font-bold text-white">{region.carrier}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-slate-400 font-medium">Route</span>
                  <span className="font-bold text-cyan-400">{region.route}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-slate-400 font-medium">Cost per Message</span>
                  <span className="font-mono font-bold text-emerald-400">{region.cost}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 italic pt-1">{region.notes}</p>
            </div>
          ))}
        </div>

      </main>

      <QuickSendModal
        isOpen={isQuickSendOpen}
        onClose={() => setIsQuickSendOpen(false)}
      />
    </div>
  );
}
