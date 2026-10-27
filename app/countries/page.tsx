'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import QuickSendModal from '@/components/QuickSendModal';
import {
  Globe, Search, CheckCircle2, Send, MessageSquare, Mail,
  TrendingUp, Radio
} from 'lucide-react';

const INDIA_CIRCLES = [
  { code: 'DL', name: 'Delhi NCR', flag: '🇮🇳', dial: '+91 (11/120)', region: 'North', population: '32M', sms: true, wa: true, email: true, carrier: 'Jio / Airtel / Vi', cost: '₹0.20' },
  { code: 'MH-MUM', name: 'Mumbai (Metro)', flag: '🇮🇳', dial: '+91 (22)', region: 'West', population: '21M', sms: true, wa: true, email: true, carrier: 'Jio / Airtel / Vi', cost: '₹0.20' },
  { code: 'KA', name: 'Karnataka (Bengaluru)', flag: '🇮🇳', dial: '+91 (80)', region: 'South', population: '68M', sms: true, wa: true, email: true, carrier: 'Airtel / Jio / Vi', cost: '₹0.20' },
  { code: 'MH', name: 'Maharashtra & Goa', flag: '🇮🇳', dial: '+91 (20)', region: 'West', population: '112M', sms: true, wa: true, email: true, carrier: 'Jio / Vi / Airtel', cost: '₹0.20' },
  { code: 'TN', name: 'Tamil Nadu & Chennai', flag: '🇮🇳', dial: '+91 (44)', region: 'South', population: '76M', sms: true, wa: true, email: true, carrier: 'Airtel / Jio / Vi', cost: '₹0.20' },
  { code: 'TS-AP', name: 'Telangana & AP (Hyderabad)', flag: '🇮🇳', dial: '+91 (40)', region: 'South', population: '88M', sms: true, wa: true, email: true, carrier: 'Airtel / Jio / Vi', cost: '₹0.20' },
  { code: 'GJ', name: 'Gujarat', flag: '🇮🇳', dial: '+91 (79)', region: 'West', population: '70M', sms: true, wa: true, email: true, carrier: 'Jio / Vi / Airtel', cost: '₹0.20' },
  { code: 'WB-KOL', name: 'West Bengal & Kolkata', flag: '🇮🇳', dial: '+91 (33)', region: 'East', population: '98M', sms: true, wa: true, email: true, carrier: 'Jio / Airtel / Vi', cost: '₹0.20' },
  { code: 'UP', name: 'Uttar Pradesh (East & West)', flag: '🇮🇳', dial: '+91 (522)', region: 'North', population: '235M', sms: true, wa: true, email: true, carrier: 'Jio / Airtel / Vi / BSNL', cost: '₹0.20' },
  { code: 'PB-HR', name: 'Punjab & Haryana', flag: '🇮🇳', dial: '+91 (172)', region: 'North', population: '58M', sms: true, wa: true, email: true, carrier: 'Airtel / Jio / Vi', cost: '₹0.20' },
  { code: 'RJ', name: 'Rajasthan', flag: '🇮🇳', dial: '+91 (141)', region: 'North', population: '81M', sms: true, wa: true, email: true, carrier: 'Jio / Airtel / Vi', cost: '₹0.20' },
  { code: 'KL', name: 'Kerala', flag: '🇮🇳', dial: '+91 (484)', region: 'South', population: '35M', sms: true, wa: true, email: true, carrier: 'Airtel / Jio / Vi / BSNL', cost: '₹0.20' },
];

const REGIONS = ['All Circles', 'North', 'South', 'West', 'East'];

export default function CountriesPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQuickSendOpen, setIsQuickSendOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('All Circles');
  const [selected, setSelected] = useState<Set<string>>(
    new Set(INDIA_CIRCLES.map((c) => c.code))
  );
  const [savedNotice, setSavedNotice] = useState(false);

  const toggle = (code: string) => {
    const next = new Set(selected);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    setSelected(next);
  };

  const selectAll = () => {
    setSelected(new Set(INDIA_CIRCLES.map((c) => c.code)));
  };

  const clearAll = () => {
    setSelected(new Set());
  };

  const handleSave = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const filtered = INDIA_CIRCLES.filter((c) => {
    const matchRegion = region === 'All Circles' || c.region === region;
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.carrier.toLowerCase().includes(search.toLowerCase());
    return matchRegion && matchSearch;
  });

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
        title="India Telecom Circles & Routing"
        subtitle="Manage national carrier delivery across all Indian Telecom Service Areas (TSAs)"
        dbConnected
        onMenuToggle={() => setIsSidebarOpen(true)}
      />

      <main className="lg:ml-[260px] pt-20 px-4 sm:px-6 lg:px-8 pb-12 min-h-screen">
        <div className="max-w-[1500px] mx-auto space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-heading)]">India Coverage & Carrier Circles</h1>
                <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                  {selected.size} circles active · National Indian Routing (+91) via Fast2SMS & Meta Cloud
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={selectAll}
                className="zs-btn-secondary text-xs py-2 px-3"
              >
                Select All
              </button>
              <button
                onClick={clearAll}
                className="zs-btn-secondary text-xs py-2 px-3"
              >
                Clear
              </button>
              <button
                onClick={handleSave}
                className="zs-btn-primary"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Routing</span>
              </button>
            </div>
          </div>

          {savedNotice && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Routing configuration saved! Messages will dispatch via Fast2SMS Quick Route & Meta Cloud.</span>
            </div>
          )}

          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="zs-card p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-heading)]">{selected.size} / 12</p>
                <p className="text-xs text-[var(--text-muted)] font-medium">Active Telecom Circles</p>
              </div>
            </div>

            <div className="zs-card p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-heading)]">1.4 Billion+</p>
                <p className="text-xs text-[var(--text-muted)] font-medium">India-wide Mobile Subscribers</p>
              </div>
            </div>

            <div className="zs-card p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <span className="text-lg font-bold">₹</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-heading)]">₹0.20 / SMS</p>
                <p className="text-xs text-[var(--text-muted)] font-medium">Fast2SMS Quick Route (DLT-Free)</p>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="zs-card p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
              <input
                className="zs-input !pl-10 text-xs sm:text-sm py-2"
                placeholder="Search circles by state or carrier…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="zs-tab-list overflow-x-auto self-start sm:self-auto">
              {REGIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRegion(r)}
                  className={`zs-tab text-xs ${region === r ? 'active' : ''}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Circles Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((c) => {
              const isSelected = selected.has(c.code);
              return (
                <div
                  key={c.code}
                  onClick={() => toggle(c.code)}
                  className={`zs-card p-4.5 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-400 bg-indigo-50/40 shadow-sm ring-1 ring-indigo-300'
                      : 'hover:border-[var(--border-strong)] hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl select-none">{c.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-bold text-sm text-[var(--text-heading)] truncate">{c.name}</p>
                          <p className="text-[11px] text-[var(--text-muted)] font-mono">{c.dial} · {c.region}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                          isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'
                        }`}>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                        </div>
                      </div>

                      {/* Carriers */}
                      <p className="text-[10px] text-slate-500 font-medium mt-1">Carriers: {c.carrier}</p>

                      {/* Channel availability */}
                      <div className="flex items-center gap-1.5 mt-2.5">
                        <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          c.sms ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-400'
                        }`}>
                          <Send className="w-2.5 h-2.5" /> SMS
                        </span>
                        <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          c.wa ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-400'
                        }`}>
                          <MessageSquare className="w-2.5 h-2.5" /> WA
                        </span>
                        <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          c.email ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' : 'bg-slate-100 text-slate-400'
                        }`}>
                          <Mail className="w-2.5 h-2.5" /> Email
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--border-subtle)]">
                        <span className="text-[11px] text-[var(--text-muted)] font-medium">Pop: {c.population}</span>
                        <span className="text-[11px] font-bold text-indigo-600">{c.cost} / SMS</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
