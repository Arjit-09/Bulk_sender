'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import QuickSendModal from '@/components/QuickSendModal';
import {
  Globe, Search, CheckCircle2, Plus, Send, MessageSquare, Mail,
  ChevronRight, TrendingUp, CheckCheck, SlidersHorizontal, DollarSign
} from 'lucide-react';

const COUNTRIES_DATA = [
  { code: 'IN', name: 'India', flag: '🇮🇳', dial: '+91', region: 'Asia', population: '1.4B', sms: true, wa: true, email: true, msgs: 12400, cost: '$0.006' },
  { code: 'US', name: 'United States', flag: '🇺🇸', dial: '+1', region: 'Americas', population: '335M', sms: true, wa: true, email: true, msgs: 9800, cost: '$0.0075' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dial: '+44', region: 'Europe', population: '68M', sms: true, wa: true, email: true, msgs: 6200, cost: '$0.040' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', dial: '+61', region: 'Oceania', population: '26M', sms: true, wa: true, email: true, msgs: 3100, cost: '$0.042' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dial: '+1', region: 'Americas', population: '38M', sms: true, wa: true, email: true, msgs: 2900, cost: '$0.0075' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', dial: '+49', region: 'Europe', population: '84M', sms: true, wa: true, email: true, msgs: 2400, cost: '$0.058' },
  { code: 'FR', name: 'France', flag: '🇫🇷', dial: '+33', region: 'Europe', population: '68M', sms: true, wa: true, email: true, msgs: 1900, cost: '$0.062' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', dial: '+55', region: 'Americas', population: '215M', sms: true, wa: true, email: true, msgs: 4100, cost: '$0.008' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', dial: '+65', region: 'Asia', population: '6M', sms: true, wa: true, email: true, msgs: 1600, cost: '$0.038' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪', dial: '+971', region: 'Middle East', population: '10M', sms: true, wa: true, email: true, msgs: 2100, cost: '$0.030' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', dial: '+27', region: 'Africa', population: '60M', sms: true, wa: true, email: true, msgs: 1200, cost: '$0.020' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', dial: '+81', region: 'Asia', population: '125M', sms: true, wa: false, email: true, msgs: 800, cost: '$0.070' },
];

const REGIONS = ['All', 'Asia', 'Americas', 'Europe', 'Oceania', 'Middle East', 'Africa'];

export default function CountriesPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQuickSendOpen, setIsQuickSendOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('All');
  const [selected, setSelected] = useState<Set<string>>(
    new Set(['IN', 'US', 'GB', 'AU', 'CA', 'DE'])
  );
  const [savedNotice, setSavedNotice] = useState(false);

  const toggle = (code: string) => {
    const next = new Set(selected);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    setSelected(next);
  };

  const selectAll = () => {
    setSelected(new Set(COUNTRIES_DATA.map(c => c.code)));
  };

  const clearAll = () => {
    setSelected(new Set());
  };

  const handleSave = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const filtered = COUNTRIES_DATA.filter((c) => {
    const matchRegion = region === 'All' || c.region === region;
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase());
    return matchRegion && matchSearch;
  });

  const totalMonthlyReach = COUNTRIES_DATA.filter(c => selected.has(c.code)).reduce((s, c) => s + c.msgs, 0);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenQuickSend={() => setIsQuickSendOpen(true)}
        orgName="Acme Corp"
        planName="Growth"
        userRole="SUPER_ADMIN"
        balance={87.50}
      />
      <Topbar
        title="Country Targeting"
        subtitle="Configure target geographic regions & multi-channel routing"
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
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-heading)]">Country Targeting & Routing</h1>
                <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                  {selected.size} countries enabled · {totalMonthlyReach.toLocaleString()} total messages/month reach
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
              <span>Targeting settings saved! Campaigns will route directly through local tier-1 carriers.</span>
            </div>
          )}

          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="zs-card p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-heading)]">{selected.size}</p>
                <p className="text-xs text-[var(--text-muted)] font-medium">Active Target Countries</p>
              </div>
            </div>

            <div className="zs-card p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-heading)]">{totalMonthlyReach.toLocaleString()}</p>
                <p className="text-xs text-[var(--text-muted)] font-medium">Monthly Recipient Reach</p>
              </div>
            </div>

            <div className="zs-card p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-heading)]">$0.006 - $0.070</p>
                <p className="text-xs text-[var(--text-muted)] font-medium">Tier-1 Direct Carrier Rates</p>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="zs-card p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                className="zs-input pl-9.5 text-xs sm:text-sm py-2"
                placeholder="Search countries by name or dial code…"
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

          {/* Countries Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((c, i) => {
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
                        <span className="text-[11px] font-bold text-indigo-600">{c.cost}/msg</span>
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
