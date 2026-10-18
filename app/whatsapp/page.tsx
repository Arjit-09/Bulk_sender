'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import QuickSendModal from '@/components/QuickSendModal';
import {
  MessageSquare, Plus, Send, CheckCircle2, Clock, AlertCircle,
  Globe, Users, FileText, ArrowRight, BarChart2, Zap, X,
  CheckCheck, Sparkles, Filter, TrendingUp, Search
} from 'lucide-react';

const INITIAL_WA_CAMPAIGNS = [
  { id: 1, name: 'Festival Offer India', country: '🇮🇳 Pan India', template: 'Festival Promo', sent: 8400, delivered: 8240, read: 6780, status: 'completed', date: 'Oct 12' },
  { id: 2, name: 'Delhi NCR VIP Blast', country: '🇮🇳 Delhi NCR', template: 'Flash Sale Alert', sent: 3200, delivered: 3140, read: 2890, status: 'completed', date: 'Oct 10' },
  { id: 3, name: 'Mumbai Express Updates', country: '🇮🇳 Mumbai', template: 'Restock Notice', sent: 5600, delivered: 5490, read: 4620, status: 'running', date: 'Oct 15' },
  { id: 4, name: 'Bengaluru Tech Event', country: '🇮🇳 Bengaluru', template: 'Welcome Message', sent: 2400, delivered: 2360, read: 1980, status: 'scheduled', date: 'Oct 18' },
];

const INITIAL_WA_TEMPLATES = [
  { id: 1, name: 'Welcome Message', status: 'approved', category: 'UTILITY', body: 'Hi {{1}}, welcome to ZenithServices! We are excited to have you on board.' },
  { id: 2, name: 'Festival Promo', status: 'approved', category: 'MARKETING', body: 'Exclusive Festive Offer! Get 25% off storewide with code {{1}} valid until Sunday.' },
  { id: 3, name: 'Flash Sale Alert', status: 'approved', category: 'MARKETING', body: 'Flash Sale is live for the next 4 hours only! Claim your discount at {{1}}.' },
  { id: 4, name: 'Restock Notice', status: 'pending', category: 'UTILITY', body: 'Good news! The item {{1}} you were waiting for is back in stock.' },
];

const STATUS_STYLES: Record<string, string> = {
  completed: 'zs-badge-success',
  running:   'zs-badge-info',
  scheduled: 'zs-badge-warning',
  failed:    'zs-badge-danger',
  approved:  'zs-badge-success',
  pending:   'zs-badge-warning',
};

export default function WhatsAppPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQuickSendOpen, setIsQuickSendOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'templates' | 'analytics'>('campaigns');
  const [campaigns, setCampaigns] = useState(INITIAL_WA_CAMPAIGNS);
  const [templates, setTemplates] = useState(INITIAL_WA_TEMPLATES);
  const [search, setSearch] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCampName, setNewCampName] = useState('');
  const [newCampCountry, setNewCampCountry] = useState('🇮🇳 India');
  const [newCampTemplate, setNewCampTemplate] = useState('Festival Promo');

  const [isNewTplOpen, setIsNewTplOpen] = useState(false);
  const [newTplName, setNewTplName] = useState('');
  const [newTplCategory, setNewTplCategory] = useState('MARKETING');
  const [newTplBody, setNewTplBody] = useState('');

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampName.trim()) return;
    const newCamp = {
      id: Date.now(),
      name: newCampName.trim(),
      country: newCampCountry,
      template: newCampTemplate,
      sent: 1200,
      delivered: 1180,
      read: 950,
      status: 'running',
      date: 'Today',
    };
    setCampaigns([newCamp, ...campaigns]);
    setNewCampName('');
    setIsCreateOpen(false);
  };

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTplName.trim() || !newTplBody.trim()) return;
    const newTpl = {
      id: Date.now(),
      name: newTplName.trim(),
      status: 'approved',
      category: newTplCategory,
      body: newTplBody.trim(),
    };
    setTemplates([...templates, newTpl]);
    setNewTplName('');
    setNewTplBody('');
    setIsNewTplOpen(false);
  };

  const filteredCampaigns = campaigns.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.country.toLowerCase().includes(search.toLowerCase())
  );

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
        title="WhatsApp Suite"
        subtitle="Meta Business API · Rich marketing broadcasts & conversations"
        dbConnected
        onMenuToggle={() => setIsSidebarOpen(true)}
      />

      <main className="lg:ml-[260px] pt-20 px-4 sm:px-6 lg:px-8 pb-12 min-h-screen">
        <div className="max-w-[1500px] mx-auto space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-green-200">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-heading)]">WhatsApp Marketing Suite</h1>
                <p className="text-xs sm:text-sm text-[var(--text-muted)]">Official Meta Business API Cloud dispatch with dynamic templates</p>
              </div>
            </div>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="zs-btn-primary self-start sm:self-auto bg-gradient-to-r from-green-600 to-emerald-600 shadow-green-200 hover:shadow-green-300"
            >
              <Plus className="w-4 h-4" />
              <span>New WA Campaign</span>
            </button>
          </div>

          {/* KPI Summary Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="zs-card p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Messages Sent</span>
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                  <Send className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-[var(--text-heading)]">19.6K</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">+14.2% from last month</p>
            </div>

            <div className="zs-card p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Delivered</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <CheckCheck className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-emerald-600">19.2K</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">98.1% delivery rate</p>
            </div>

            <div className="zs-card p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Read Rate</span>
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-teal-600">82.4%</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Industry benchmark 75%</p>
            </div>

            <div className="zs-card p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Active Templates</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-[var(--text-heading)]">{templates.length}</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Approved by Meta</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="zs-tab-list max-w-xs w-full sm:w-auto">
              {(['campaigns', 'templates', 'analytics'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`zs-tab capitalize ${activeTab === t ? 'active' : ''}`}
                >
                  {t === 'campaigns' ? <Send className="w-3.5 h-3.5" /> : t === 'templates' ? <FileText className="w-3.5 h-3.5" /> : <BarChart2 className="w-3.5 h-3.5" />}
                  <span>{t}</span>
                </button>
              ))}
            </div>

            {activeTab === 'campaigns' && (
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Filter campaigns…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="zs-input pl-8 py-1.5 text-xs"
                />
              </div>
            )}
          </div>

          {/* Campaigns Tab */}
          {activeTab === 'campaigns' && (
            <div className="zs-card overflow-hidden shadow-xs animate-fade-in">
              <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-heading)]">WhatsApp Campaigns</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">Showing {filteredCampaigns.length} campaigns</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="zs-table">
                  <thead>
                    <tr>
                      <th>Campaign</th>
                      <th>Target Country</th>
                      <th>Meta Template</th>
                      <th className="text-right">Sent</th>
                      <th className="text-right">Delivered</th>
                      <th className="text-right">Read</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCampaigns.map((c) => (
                      <tr key={c.id}>
                        <td className="font-semibold text-[var(--text-heading)]">{c.name}</td>
                        <td>
                          <span className="country-badge">
                            {c.country}
                          </span>
                        </td>
                        <td className="text-[var(--text-secondary)] font-medium">{c.template}</td>
                        <td className="text-right font-mono text-xs">{c.sent.toLocaleString()}</td>
                        <td className="text-right font-mono text-xs font-semibold text-emerald-600">{c.delivered.toLocaleString()}</td>
                        <td className="text-right font-mono text-xs font-semibold text-teal-600">{c.read.toLocaleString()}</td>
                        <td>
                          <span className={`zs-badge ${STATUS_STYLES[c.status] || 'zs-badge-neutral'}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="text-xs text-[var(--text-muted)]">{c.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                  Approved WhatsApp business templates ready for automated or manual broadcast.
                </p>
                <button
                  onClick={() => setIsNewTplOpen(true)}
                  className="zs-btn-primary py-2 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Submit Template</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((t) => (
                  <div key={t.id} className="zs-card p-5 space-y-3 hover:border-green-300 transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[var(--text-heading)]">{t.name}</h4>
                          <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] tracking-wider">
                            {t.category}
                          </span>
                        </div>
                      </div>
                      <span className={`zs-badge ${STATUS_STYLES[t.status]}`}>{t.status}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--bg-elevated)] text-xs text-[var(--text-primary)] border border-[var(--border-subtle)] leading-relaxed">
                      {t.body}
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => {
                          setNewCampTemplate(t.name);
                          setIsCreateOpen(true);
                        }}
                        className="zs-btn-secondary text-xs py-1.5 px-3 text-green-700 hover:bg-green-50"
                      >
                        Use in Campaign →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="zs-card p-5 text-center">
                  <p className="text-xs font-semibold text-[var(--text-secondary)]">Avg. Response Time</p>
                  <p className="text-3xl font-bold text-green-600 my-2">4.2 min</p>
                  <p className="text-[11px] text-[var(--text-muted)]">2x faster than email suite</p>
                </div>
                <div className="zs-card p-5 text-center">
                  <p className="text-xs font-semibold text-[var(--text-secondary)]">Click-Through Rate</p>
                  <p className="text-3xl font-bold text-teal-600 my-2">28.4%</p>
                  <p className="text-[11px] text-[var(--text-muted)]">Measured across link buttons</p>
                </div>
                <div className="zs-card p-5 text-center">
                  <p className="text-xs font-semibold text-[var(--text-secondary)]">Opt-Out Rate</p>
                  <p className="text-3xl font-bold text-indigo-600 my-2">0.2%</p>
                  <p className="text-[11px] text-[var(--text-muted)]">Extremely high brand trust</p>
                </div>
              </div>

              <div className="zs-card p-6">
                <h3 className="text-sm font-bold text-[var(--text-heading)] mb-2">Country Engagement Breakdown</h3>
                <div className="space-y-3 pt-2">
                  {[
                    { country: '🇮🇳 Delhi NCR', rate: 96, msgs: '8,400 msgs' },
                    { country: '🇮🇳 Maharashtra (Mumbai/Pune)', rate: 93, msgs: '5,600 msgs' },
                    { country: '🇮🇳 Karnataka (Bengaluru)', rate: 91, msgs: '3,200 msgs' },
                    { country: '🇮🇳 Telangana (Hyderabad)', rate: 88, msgs: '2,400 msgs' },
                  ].map((row) => (
                    <div key={row.country} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-[var(--text-primary)]">{row.country}</span>
                        <span className="text-[var(--text-muted)]">{row.rate}% read ({row.msgs})</span>
                      </div>
                      <div className="zs-progress-track">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-green-500 to-teal-500"
                          style={{ width: `${row.rate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* New WA Campaign Modal */}
      {isCreateOpen && (
        <div className="zs-modal-overlay p-4">
          <div className="zs-modal p-6 relative max-w-lg">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-5 right-5 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1.5 rounded-xl hover:bg-[var(--bg-elevated)] transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-green-200">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--text-heading)]">Launch WhatsApp Campaign</h3>
                <p className="text-xs text-[var(--text-muted)]">Dispatches through Meta Cloud API</p>
              </div>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Campaign Name</label>
                <input
                  type="text"
                  placeholder="e.g. Diwali Flash Deals 2026"
                  value={newCampName}
                  onChange={(e) => setNewCampName(e.target.value)}
                  className="zs-input"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Target Country</label>
                <select
                  value={newCampCountry}
                  onChange={(e) => setNewCampCountry(e.target.value)}
                  className="zs-input cursor-pointer"
                >
                  <option value="🇮🇳 India">🇮🇳 India (+91)</option>
                  <option value="🇺🇸 US">🇺🇸 United States (+1)</option>
                  <option value="🇬🇧 UK">🇬🇧 United Kingdom (+44)</option>
                  <option value="🇩🇪 Germany">🇩🇪 Germany (+49)</option>
                  <option value="🇦🇺 Australia">🇦🇺 Australia (+61)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Approved WhatsApp Template</label>
                <select
                  value={newCampTemplate}
                  onChange={(e) => setNewCampTemplate(e.target.value)}
                  className="zs-input cursor-pointer"
                >
                  {templates.filter(t => t.status === 'approved').map(t => (
                    <option key={t.id} value={t.name}>{t.name} ({t.category})</option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-green-50/60 border border-green-200 text-xs text-green-800 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Meta Business Account Connected
                </p>
                <p className="text-[11px] text-green-700">Messages will be delivered with your verified green tick profile.</p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="zs-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="zs-btn-primary bg-gradient-to-r from-green-600 to-emerald-600"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Start WA Broadcast</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Template Modal */}
      {isNewTplOpen && (
        <div className="zs-modal-overlay p-4">
          <div className="zs-modal p-6 relative max-w-lg">
            <button
              onClick={() => setIsNewTplOpen(false)}
              className="absolute top-5 right-5 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1.5 rounded-xl hover:bg-[var(--bg-elevated)] transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-green-200">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--text-heading)]">Submit WhatsApp Template</h3>
                <p className="text-xs text-[var(--text-muted)]">Requires Meta automated approval</p>
              </div>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Template Name</label>
                <input
                  type="text"
                  placeholder="e.g. order_delivery_update"
                  value={newTplName}
                  onChange={(e) => setNewTplName(e.target.value)}
                  className="zs-input font-mono text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Category</label>
                <select
                  value={newTplCategory}
                  onChange={(e) => setNewTplCategory(e.target.value)}
                  className="zs-input cursor-pointer"
                >
                  <option value="MARKETING">Marketing</option>
                  <option value="UTILITY">Utility</option>
                  <option value="AUTHENTICATION">Authentication (OTP)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Template Content (use {'{{1}}'}, {'{{2}}'} for variables)</label>
                <textarea
                  rows={4}
                  placeholder="Hi {{1}}, your order #{{2}} has been shipped and will arrive tomorrow."
                  value={newTplBody}
                  onChange={(e) => setNewTplBody(e.target.value)}
                  className="zs-input resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewTplOpen(false)}
                  className="zs-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="zs-btn-primary bg-gradient-to-r from-green-600 to-emerald-600"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Submit to Meta</span>
                </button>
              </div>
            </form>
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
