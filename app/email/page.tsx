'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import QuickSendModal from '@/components/QuickSendModal';
import {
  Mail, Plus, Send, BarChart2, FileText, Eye, MousePointer,
  TrendingUp, Users, CheckCircle2, AlertCircle, X, Sparkles,
  CheckCheck, Globe, Search
} from 'lucide-react';

const INITIAL_EMAIL_CAMPAIGNS = [
  { id: 1, name: 'Diwali Festive Newsletter', subject: '🪔 Exclusive Festive Deals Inside!', country: '🇮🇳 Pan India', sent: 18200, delivered: 17640, opened: 7890, clicked: 2340, status: 'completed', date: 'Oct 13' },
  { id: 2, name: 'Product Launch Blast', subject: 'Introducing ZenithTech Suite ✨', country: '🇮🇳 Delhi NCR + Mumbai', sent: 24000, delivered: 23100, opened: 9420, clicked: 3120, status: 'running', date: 'Oct 15' },
  { id: 3, name: 'India Tech Conference', subject: 'Tickets now live for Bengaluru Tech Summit', country: '🇮🇳 Bengaluru', sent: 12000, delivered: 11850, opened: 5900, clicked: 1820, status: 'completed', date: 'Oct 20' },
];

const EMAIL_TEMPLATES = [
  { id: 1, name: 'Modern Newsletter', category: 'Marketing', description: 'Clean layout with hero image, 2-column feature blocks, and CTA button.', preview: '🎨 Rich HTML' },
  { id: 2, name: 'Product Announcement', category: 'Updates', description: 'Dark/light accent announcement card with product badges and pricing table.', preview: '⚡ High Converting' },
  { id: 3, name: 'Welcome Onboarding', category: 'Lifecycle', description: 'Step-by-step onboarding email with quick-start checklist.', preview: '👋 Onboarding' },
];

const STATUS_STYLES: Record<string, string> = {
  completed: 'zs-badge-success',
  running:   'zs-badge-info',
  scheduled: 'zs-badge-warning',
  draft:     'zs-badge-neutral',
};

export default function EmailPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQuickSendOpen, setIsQuickSendOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'templates'>('campaigns');
  const [showCompose, setShowCompose] = useState(false);
  const [campaigns, setCampaigns] = useState(INITIAL_EMAIL_CAMPAIGNS);
  const [search, setSearch] = useState('');

  // Compose form state
  const [form, setForm] = useState({
    name: '', subject: '', fromName: 'ZenithServices Marketing', fromEmail: 'hello@zenithservices.com', toCountries: ['🌍 Global'], body: '',
  });

  const handleComposeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.subject.trim()) return;

    const newCamp = {
      id: Date.now(),
      name: form.name.trim(),
      subject: form.subject.trim(),
      country: form.toCountries.join(', ') || 'Global',
      sent: 8500,
      delivered: 8320,
      opened: 3410,
      clicked: 1040,
      status: 'running',
      date: 'Today',
    };

    setCampaigns([newCamp, ...campaigns]);
    setShowCompose(false);
    setForm({ name: '', subject: '', fromName: 'ZenithServices Marketing', fromEmail: 'hello@zenithservices.com', toCountries: ['🌍 Global'], body: '' });
  };

  const filteredCampaigns = campaigns.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.subject.toLowerCase().includes(search.toLowerCase())
  );

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
        title="Email Suite"
        subtitle="SendGrid · AWS SES · Mailgun integration for high-deliverability email marketing"
        dbConnected
        onMenuToggle={() => setIsSidebarOpen(true)}
      />

      <main className="lg:ml-[260px] pt-20 px-4 sm:px-6 lg:px-8 pb-12 min-h-screen">
        <div className="max-w-[1500px] mx-auto space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-200">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-heading)]">Email Marketing Suite</h1>
                <p className="text-xs sm:text-sm text-[var(--text-muted)]">Enterprise email dispatch with verified domain authentication (DKIM, SPF, DMARC)</p>
              </div>
            </div>

            <button
              onClick={() => setShowCompose(true)}
              className="zs-btn-primary self-start sm:self-auto bg-gradient-to-r from-cyan-500 to-blue-600 shadow-cyan-200 hover:shadow-cyan-300"
            >
              <Plus className="w-4 h-4" />
              <span>Compose Campaign</span>
            </button>
          </div>

          {/* KPI Summary Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="zs-card p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Emails Sent</span>
                <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center text-cyan-600">
                  <Mail className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-[var(--text-heading)]">54.2K</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">+18.5% this month</p>
            </div>

            <div className="zs-card p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Delivered</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <CheckCheck className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-blue-600">52.5K</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">97.8% delivery rate</p>
            </div>

            <div className="zs-card p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Avg. Open Rate</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Eye className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-indigo-600">44.8%</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Industry avg: 28%</p>
            </div>

            <div className="zs-card p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Click-Through</span>
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                  <MousePointer className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-teal-600">13.2%</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Tracked link clicks</p>
            </div>
          </div>

          {/* Tabs & Search */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="zs-tab-list max-w-xs">
              {(['campaigns', 'templates'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`zs-tab capitalize ${activeTab === t ? 'active' : ''}`}
                >
                  {t === 'campaigns' ? <Send className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                  <span>{t}</span>
                </button>
              ))}
            </div>

            {activeTab === 'campaigns' && (
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Filter email campaigns…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="zs-input pl-8 py-1.5 text-xs"
                />
              </div>
            )}
          </div>

          {/* Campaigns Table */}
          {activeTab === 'campaigns' && (
            <div className="zs-card overflow-hidden shadow-xs animate-fade-in">
              <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-heading)]">Email Broadcasts</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">Showing {filteredCampaigns.length} campaigns</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="zs-table">
                  <thead>
                    <tr>
                      <th>Campaign</th>
                      <th>Subject Line</th>
                      <th>Target Region</th>
                      <th className="text-right">Sent</th>
                      <th className="text-right">
                        <span className="flex items-center gap-1 justify-end"><Eye className="w-3.5 h-3.5 text-cyan-600" /> Opens</span>
                      </th>
                      <th className="text-right">
                        <span className="flex items-center gap-1 justify-end"><MousePointer className="w-3.5 h-3.5 text-indigo-600" /> Clicks</span>
                      </th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCampaigns.map((c) => (
                      <tr key={c.id}>
                        <td className="font-semibold text-[var(--text-heading)]">{c.name}</td>
                        <td className="text-[var(--text-secondary)] font-medium max-w-[220px] truncate">{c.subject}</td>
                        <td>
                          <span className="country-badge">
                            {c.country}
                          </span>
                        </td>
                        <td className="text-right font-mono text-xs">{c.sent.toLocaleString()}</td>
                        <td className="text-right font-mono text-xs font-semibold text-cyan-600">{c.opened.toLocaleString()}</td>
                        <td className="text-right font-mono text-xs font-semibold text-indigo-600">{c.clicked.toLocaleString()}</td>
                        <td><span className={`zs-badge ${STATUS_STYLES[c.status] || 'zs-badge-neutral'}`}>{c.status}</span></td>
                        <td className="text-xs text-[var(--text-muted)]">{c.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Templates tab */}
          {activeTab === 'templates' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                  Responsive HTML email layouts optimized for mobile, desktop, and dark mode inboxes.
                </p>
                <button
                  onClick={() => setShowCompose(true)}
                  className="zs-btn-primary py-2 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Template</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {EMAIL_TEMPLATES.map((t) => (
                  <div key={t.id} className="zs-card p-5 space-y-3 hover:border-cyan-300 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold">
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className="zs-badge zs-badge-info">{t.preview}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text-heading)]">{t.name}</h4>
                      <p className="text-xs text-[var(--text-muted)] mt-1">{t.description}</p>
                    </div>
                    <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
                      <span className="text-[11px] text-cyan-600 font-semibold">{t.category}</span>
                      <button
                        onClick={() => {
                          setForm(f => ({ ...f, body: `Template: ${t.name}\n\nHi {{name}},\n\nHere is your custom email content...` }));
                          setShowCompose(true);
                        }}
                        className="zs-btn-secondary text-xs py-1 px-2.5"
                      >
                        Use Template
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Compose Modal */}
      {showCompose && (
        <div className="zs-modal-overlay p-4">
          <div className="zs-modal p-6 relative max-w-xl">
            <button
              onClick={() => setShowCompose(false)}
              className="absolute top-5 right-5 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1.5 rounded-xl hover:bg-[var(--bg-elevated)] transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-200">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--text-heading)]">Compose Email Campaign</h3>
                <p className="text-xs text-[var(--text-muted)]">SendGrid & AWS SES high-volume delivery</p>
              </div>
            </div>

            <form onSubmit={handleComposeSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1.5 block">Campaign Name</label>
                <input
                  className="zs-input"
                  placeholder="e.g. October Product Launch"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1.5 block">From Name</label>
                  <input
                    className="zs-input"
                    value={form.fromName}
                    onChange={e => setForm(f => ({ ...f, fromName: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1.5 block">From Email</label>
                  <input
                    className="zs-input"
                    type="email"
                    value={form.fromEmail}
                    onChange={e => setForm(f => ({ ...f, fromEmail: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1.5 block">Subject Line</label>
                <input
                  className="zs-input"
                  placeholder="Your engaging subject line here..."
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1.5 block">Target Countries</label>
                <div className="flex flex-wrap gap-2">
                  {['🇮🇳 India', '🇺🇸 US', '🇬🇧 UK', '🇦🇺 AU', '🇩🇪 DE', '🌍 Global'].map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setForm(f => ({
                        ...f,
                        toCountries: f.toCountries.includes(c) ? f.toCountries.filter(x => x !== c) : [...f.toCountries, c]
                      }))}
                      className={`country-badge text-xs ${form.toCountries.includes(c) ? 'selected' : ''}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)] mb-1.5 block">Email Content (HTML or Markdown)</label>
                <textarea
                  className="zs-input resize-none"
                  rows={5}
                  placeholder="Hi {{name}},\n\nWrite your email body here..."
                  value={form.body}
                  onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompose(false)}
                  className="zs-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="zs-btn-primary bg-gradient-to-r from-cyan-600 to-blue-600"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Schedule & Send Broadcast</span>
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
